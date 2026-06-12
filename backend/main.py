import os
import asyncio
import logging
from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from fastapi.staticfiles import StaticFiles
from db import engine, SessionLocal, get_db, Base
from models import User, Pet, Walker, Booking, Page, Admin
from schemas import (
    UserCreate, UserLogin, UserResponse, BookingRequest, BookingResponse, BookingUpdate,
    PageResponse, AdminLogin, WalkerResponse, WalkerCreate, WalkerDetailResponse,
    CustomerSummary, CustomerDetailResponse, CustomerBookingSummary,
)
from auth import hash_password, verify_password, create_access_token, get_current_user, get_current_admin
from email_service import send_booking_email, send_user_confirmation_email
from websocket_manager import manager
from sqlalchemy.exc import OperationalError

logger = logging.getLogger(__name__)

app = FastAPI(title="Paws Pal Connect API")


@app.on_event("startup")
def init_database_tables():
    """Create missing tables; retry for Neon cold starts / transient pooler drops."""
    import time

    last_error = None
    for attempt in range(1, 4):
        try:
            Base.metadata.create_all(bind=engine)
            if attempt > 1:
                logger.info("Database tables ready (attempt %s)", attempt)
            return
        except OperationalError as exc:
            last_error = exc
            logger.warning(
                "Database connection failed on startup (attempt %s/3): %s",
                attempt,
                exc,
            )
            if attempt < 3:
                time.sleep(2 * attempt)

    raise RuntimeError(
        "Could not connect to the database after 3 attempts. "
        "Check DATABASE_URL and your network, then restart the server."
    ) from last_error
app.mount(
    "/policies",
    StaticFiles(directory="policies"),
    name="policies"
)

# CORS — allow local dev, explicit FRONTEND_URL, and any Render frontend subdomain
FRONTEND_URL = (os.getenv("FRONTEND_URL") or "https://zuppy.onrender.com").rstrip("/")
CORS_ORIGINS = list({
    FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:5174",
    "https://zuppy.onrender.com",
})
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== HEALTH CHECK =====
@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    return {"status": "ok", "message": "Paws Pal Connect API is running"}

# ===== AUTH ENDPOINTS =====

@app.post("/signup")
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user account"""
    print(f"Signup request for email: {user_data.email}")

    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    try:
        hashed_pw = hash_password(user_data.password)
        new_user = User(
            email=user_data.email,
            hashed_password=hashed_pw,
            name=user_data.name,
            mobile=user_data.mobile,
            apartment=user_data.apartment,
            flatNo=user_data.flatNo,
            address=user_data.address,
            pet_name=user_data.pet_name,
            pet_image=user_data.pet_image,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        pet = Pet(
            user_id=new_user.id,
            name=user_data.pet_name,
            image_url=user_data.pet_image,
        )
        db.add(pet)
        db.commit()

        access_token = create_access_token(data={"sub": str(new_user.id)})
        user_response = UserResponse.model_validate(new_user)
        print(f"User {user_data.email} signed up successfully")

        return {
            "user": user_response,
            "access_token": access_token,
            "token_type": "bearer",
        }
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Database error during signup for %s", user_data.email)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create account. Please try again.",
        )

@app.post("/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return JWT"""
    print(f"Login request for email: {user_data.email}")
    
    user = db.query(User).filter(User.email == user_data.email).first()
   
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    user_response = UserResponse.model_validate(user)
    
    print(f"User {user_data.email} logged in successfully")
    
    return {
        "user": user_response,
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.post("/admin/login")
def admin_login(
    admin_data: AdminLogin,
    db: Session = Depends(get_db)
):
    admin = db.query(Admin).filter(
        Admin.email == admin_data.email
    ).first()
   
    if not admin:
        raise HTTPException(
            status_code=401,
            detail="Invalid admin credentials"
        )
    

    if not verify_password(
        admin_data.password,
        admin.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid admin credentials"
        )

    access_token = create_access_token(
        data={
            "sub": str(admin.id),
            "role": "admin"
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

# ===== BOOKING ENDPOINT =====

def _busy_walker_names(db: Session, exclude_booking_id: int | None = None) -> set[str]:
    query = db.query(Booking.assigned_walker).filter(
        Booking.status == "Assigned",
        Booking.assigned_walker.isnot(None),
    )
    if exclude_booking_id is not None:
        query = query.filter(Booking.id != exclude_booking_id)
    return {row[0] for row in query.distinct().all()}


def _set_walker_availability(db: Session, walker_name: str | None, available: bool) -> None:
    if not walker_name:
        return
    walker = db.query(Walker).filter(Walker.name == walker_name).first()
    if walker:
        walker.is_available = available


@app.get("/walkers", response_model=list[WalkerResponse])
def get_walkers(
    available: bool = False,
    booking_id: int | None = None,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    walkers = db.query(Walker).order_by(Walker.name).all()
    if not available:
        return walkers

    busy = _busy_walker_names(db, exclude_booking_id=booking_id)
    current_walker_name = None
    if booking_id is not None:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if booking:
            current_walker_name = booking.assigned_walker

    return [
        w for w in walkers
        if w.name not in busy
        and (w.is_available or w.name == current_walker_name)
    ]


def _walker_stats(db: Session, walker: Walker) -> dict:
    active = db.query(Booking).filter(
        Booking.assigned_walker == walker.name,
        Booking.status == "Assigned",
    ).count()
    total = db.query(Booking).filter(
        Booking.assigned_walker == walker.name,
    ).count()
    return {"active_assignments": active, "total_assignments": total}


@app.get("/walkers/{walker_id}", response_model=WalkerDetailResponse)
def get_walker(
    walker_id: int,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    walker = db.query(Walker).filter(Walker.id == walker_id).first()
    if not walker:
        raise HTTPException(status_code=404, detail="Walker not found")

    stats = _walker_stats(db, walker)
    return WalkerDetailResponse(
        **WalkerResponse.model_validate(walker).model_dump(),
        **stats,
        created_at=walker.created_at,
    )


@app.post("/walkers", response_model=WalkerResponse, status_code=status.HTTP_201_CREATED)
def create_walker(
    data: WalkerCreate,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    name = data.name.strip()
    mobile = data.mobile.strip()
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Walker name is required")
    if not mobile:
        raise HTTPException(status_code=400, detail="Mobile number is required")

    existing = db.query(Walker).filter(Walker.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="A walker with this name already exists")

    walker = Walker(name=name, mobile=mobile, is_available=data.is_available)
    db.add(walker)
    db.commit()
    db.refresh(walker)
    return walker


@app.delete("/walkers/{walker_id}")
def delete_walker(
    walker_id: int,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    walker = db.query(Walker).filter(Walker.id == walker_id).first()
    if not walker:
        raise HTTPException(status_code=404, detail="Walker not found")

    active = db.query(Booking).filter(
        Booking.assigned_walker == walker.name,
        Booking.status == "Assigned",
    ).first()
    if active:
        raise HTTPException(
            status_code=400,
            detail="Cannot remove a walker with an active booking assignment",
        )

    db.delete(walker)
    db.commit()
    return {"message": "Walker removed successfully"}


def _resolve_pet_fields(
    pet_name: str | None,
    pet_image: str | None,
    user: User | None,
) -> tuple[str | None, str | None]:
    if pet_name:
        return pet_name, pet_image
    if user:
        return user.pet_name, user.pet_image
    return None, None


def _serialize_booking(booking: Booking, db: Session) -> dict:
    user = None
    if booking.user_id:
        user = db.query(User).filter(User.id == booking.user_id).first()

    pet_name, pet_image = _resolve_pet_fields(
        booking.pet_name, booking.pet_image, user
    )

    return {
        "id": booking.id,
        "user_id": booking.user_id,
        "name": booking.name,
        "email": booking.email,
        "mobile": booking.mobile,
        "apartment": booking.apartment,
        "flatNo": booking.flatNo,
        "address": booking.address,
        "pet_name": pet_name,
        "pet_image": pet_image,
        "status": booking.status,
        "assigned_walker": booking.assigned_walker,
        "created_at": booking.created_at,
    }


def _build_customer_summaries(db: Session) -> list[CustomerSummary]:
    bookings = db.query(Booking).order_by(Booking.created_at.desc()).all()
    grouped: dict[str, dict] = {}

    for booking in bookings:
        email = booking.email.lower()
        if email not in grouped:
            grouped[email] = {
                "email": booking.email,
                "name": booking.name,
                "mobile": booking.mobile,
                "apartment": booking.apartment,
                "flatNo": booking.flatNo,
                "address": booking.address,
                "user_id": booking.user_id,
                "booking_count": 0,
                "last_booking_at": booking.created_at,
            }
        grouped[email]["booking_count"] += 1

    customers: list[CustomerSummary] = []
    for data in grouped.values():
        pet_name = None
        pet_image = None
        if data["user_id"]:
            user = db.query(User).filter(User.id == data["user_id"]).first()
            if user:
                data["name"] = user.name
                data["mobile"] = user.mobile
                data["apartment"] = user.apartment
                data["flatNo"] = user.flatNo
                data["address"] = user.address
                pet_name = user.pet_name
                pet_image = user.pet_image

        customers.append(
            CustomerSummary(pet_name=pet_name, pet_image=pet_image, **data)
        )

    customers.sort(
        key=lambda c: c.last_booking_at or datetime.min.replace(tzinfo=None),
        reverse=True,
    )
    return customers


@app.get("/customers", response_model=list[CustomerSummary])
def get_customers(
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return _build_customer_summaries(db)


@app.get("/customers/detail", response_model=CustomerDetailResponse)
def get_customer_detail(
    email: str,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    summaries = _build_customer_summaries(db)
    match = next((c for c in summaries if c.email.lower() == email.lower()), None)
    if not match:
        raise HTTPException(status_code=404, detail="Customer not found")

    customer_bookings = (
        db.query(Booking)
        .filter(Booking.email.ilike(email))
        .order_by(Booking.created_at.desc())
        .all()
    )

    return CustomerDetailResponse(
        **match.model_dump(),
        bookings=[
            CustomerBookingSummary(
                id=b.id,
                status=b.status,
                apartment=b.apartment,
                assigned_walker=b.assigned_walker,
                created_at=b.created_at,
            )
            for b in customer_bookings
        ],
    )


@app.post("/book")
async def create_booking(
    booking_data: BookingRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a booking and send emails to admin and user"""
    print(f"Booking request from user {user_id}")
    print(f"Booking data: {booking_data}")
    
    user = db.query(User).filter(User.id == user_id).first()
    user_email = booking_data.email or (user.email if user else None)
    pet_name, pet_image = _resolve_pet_fields(
        booking_data.pet_name, booking_data.pet_image, user
    )

    new_booking = Booking(
        user_id=int(user_id) if user_id else None,
        name=booking_data.name,
        email=user_email,
        mobile=booking_data.mobile,
        apartment=booking_data.apartment,
        flatNo=booking_data.flatNo,
        address=booking_data.address,
        pet_name=pet_name,
        pet_image=pet_image,
        status="New",
        assigned_walker=None,
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    await manager.broadcast({
        "type": "new_booking",
        "booking_id": new_booking.id,
        "name": new_booking.name,
        "apartment": new_booking.apartment,
        "status": "New"
    })

    
    # Send emails in background (non-blocking)
    background_tasks.add_task(
        send_booking_email,
        apartment=booking_data.apartment,
        name=booking_data.name,
        mobile=booking_data.mobile,
        flatNo=booking_data.flatNo,
        address=booking_data.address,
    )
    
    background_tasks.add_task(
        send_user_confirmation_email,
        user_name=booking_data.name,
        user_email=user_email,
        apartment=booking_data.apartment,
        flatNo=booking_data.flatNo,
        address=booking_data.address,
    )
    
    print(f"Booking {new_booking.id} created")
    
    return {
        "id": new_booking.id,
        "name": new_booking.name,
        "email": new_booking.email,
        "apartment": new_booking.apartment,
        "created_at": new_booking.created_at.isoformat()
    }
@app.get("/bookings")
def get_bookings(
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db)):
    bookings = db.query(Booking).order_by(
        Booking.created_at.desc()
    ).all()
    return [_serialize_booking(b, db) for b in bookings]

@app.get("/bookings/{booking_id}")
def get_booking(
    booking_id: int,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    return _serialize_booking(booking, db)

@app.patch("/bookings/{booking_id}")
async def update_booking(
    booking_id: int,
    update: BookingUpdate,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    previous_walker = booking.assigned_walker

    if update.status == "Assigned":
        walker = None
        if update.walker_id is not None:
            walker = db.query(Walker).filter(Walker.id == update.walker_id).first()
        elif update.assigned_walker:
            walker = db.query(Walker).filter(Walker.name == update.assigned_walker).first()

        if not walker:
            raise HTTPException(
                status_code=400,
                detail="Select a walker to assign this booking",
            )

        busy = _busy_walker_names(db, exclude_booking_id=booking_id)
        if walker.name in busy:
            raise HTTPException(
                status_code=400,
                detail="Walker is already assigned to another active booking",
            )
        if not walker.is_available:
            raise HTTPException(
                status_code=400,
                detail="Walker is not available",
            )

        if previous_walker and previous_walker != walker.name:
            _set_walker_availability(db, previous_walker, True)

        booking.assigned_walker = walker.name
        walker.is_available = False

    booking.status = update.status

    if update.status in ("Completed", "Cancelled"):
        _set_walker_availability(db, booking.assigned_walker, True)

    db.commit()
    db.refresh(booking)

    
    await manager.broadcast({
        "type": "status_updated",
        "booking_id": booking.id,
        "status": booking.status,
        "assigned_walker": booking.assigned_walker
    })


    return _serialize_booking(booking, db)

@app.websocket("/ws/bookings")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

    try:
        while True:
            await asyncio.sleep(30)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/pages/{slug}")
def get_page(slug: str):
    return {
        "title": slug.replace("-", " ").title(),
        "file_url": f"/policies/{slug}.html"
    }



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

