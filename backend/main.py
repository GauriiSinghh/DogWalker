import os
import asyncio
from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
from fastapi.staticfiles import StaticFiles
from db import engine, SessionLocal, get_db, Base
from models import User, Pet, Booking, Page, Admin
from schemas import UserCreate, UserLogin, UserResponse, BookingRequest, BookingResponse, BookingUpdate, PageResponse, AdminLogin
from auth import hash_password, verify_password, create_access_token, get_current_user, get_current_admin
from email_service import send_booking_email, send_user_confirmation_email
from websocket_manager import manager

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Paws Pal Connect API")
app.mount(
    "/policies",
    StaticFiles(directory="policies"),
    name="policies"
)

# CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://zuppy.onrender.com")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173",
                   "http://localhost:5174",
                   "https://zuppy.onrender.com"],
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
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password and create user
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
    
    # Create JWT token
    access_token = create_access_token(data={"sub": str(new_user.id)})
    
    user_response = UserResponse.model_validate(new_user)
    print(f"User {user_data.email} signed up successfully")
    
    return {
        "user": user_response,
        "access_token": access_token,
        "token_type": "bearer"
    }

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
    
    # Get user email if not provided in booking_data
    user = db.query(User).filter(User.id == user_id).first()
    user_email = booking_data.email or (user.email if user else None)
    
    # Create booking record
    new_booking = Booking(
        user_id=int(user_id) if user_id else None,
        name=booking_data.name,
        email=user_email,
        mobile=booking_data.mobile,
        apartment=booking_data.apartment,
        flatNo=booking_data.flatNo,
        address=booking_data.address,

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
    return db.query(Booking).order_by(
        Booking.created_at.desc()
    ).all()

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

    return booking

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

    booking.status = update.status

    if update.assigned_walker:
        booking.assigned_walker = update.assigned_walker

    db.commit()
    db.refresh(booking)

    
    await manager.broadcast({
        "type": "status_updated",
        "booking_id": booking.id,
        "status": booking.status,
        "assigned_walker": booking.assigned_walker
    })


    return booking

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

