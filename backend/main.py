import os
import asyncio
import logging
import uuid
import razorpay

from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError, OperationalError
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date, timezone
from sqlalchemy import func, or_
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional

from db import engine, get_db, Base, SessionLocal
from models import User, Pet, Walker, Booking, Page, Admin, FriendFamilyBooking, PRICING_MODELS

from schemas import (
    UserCreate, UserLogin, UserResponse, BookingRequest, BookingResponse, BookingUpdate,
    PageResponse, AdminLogin, WalkerResponse, WalkerCreate, WalkerDetailResponse,
    CustomerSummary, CustomerDetailResponse, CustomerBookingSummary,
    CreateOrderRequest, CreateOrderResponse, VerifyPaymentRequest, VerifyPaymentResponse,
    ProfileResponse, ProfileUpdate, BookingHistoryItem, BookingHistoryDetail,
    ApartmentPriceResponse, MyBookingItem, WalkerBrief, FriendFamilyDetail,
    BookingCancelRequest, BookingCancelResponse,
    WalkerLogin, WalkerProfileOut, WalkerProfileUpdate,
    WalkerAvailabilityUpdate, BookingStatusUpdate, WalkerUpdateAdmin, WalkerPasswordChange,
    PetCreate, PetUpdate, PetResponse, PetBrief,
    PricingPublicResponse, PricingAdminResponse, PricingCreateUpdate,
)
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_current_admin, get_authenticated_actor,
    get_current_walker,
)

from email_service import send_booking_email, send_user_confirmation_email
from websocket_manager import manager

logger = logging.getLogger(__name__)

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
BOOKING_AMOUNT_PAISE = int(os.getenv("BOOKING_AMOUNT_PAISE", "19900"))

APARTMENT_PRICES = {
    "Sobha Dream Acres Apartment": 19900,
    "Prestige Shantiniketan": 24900,
    "Purva Fountain Square": 22900,
    "DLF Jigani": 17900,
}


def _resolve_apartment_amount(apartment: str | None) -> int:
    if apartment and apartment in APARTMENT_PRICES:
        return APARTMENT_PRICES[apartment]
    return BOOKING_AMOUNT_PAISE


def _get_razorpay_client():
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment service is not configured",
        )
    return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


def _paid_booking_filter():
    return Booking.payment_status == "paid"


app = FastAPI(title="Paws Pal Connect API")

TERMINAL_BOOKING_STATUSES = {"Completed", "Cancelled"}
ACTIVE_BOOKING_STATUSES = {"Assigned", "Started", "Reached"}


def _as_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _serialize_pet(pet: Pet) -> dict:
    return {
        "id": pet.id,
        "pet_id": pet.pet_id,
        "user_id": pet.user_id,
        "name": pet.name,
        "pet_image": pet.image_url,
        "image_url": pet.image_url,
        "created_at": _as_utc(pet.created_at),
        "updated_at": _as_utc(getattr(pet, "updated_at", None)),
    }


def _get_user_or_404(db: Session, user_id: int | str) -> User:
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def _get_primary_pet(db: Session, user_id: int) -> Pet | None:
    return (
        db.query(Pet)
        .filter(Pet.user_id == user_id)
        .order_by(Pet.id.asc())
        .first()
    )


def _ensure_user_has_legacy_pet(db: Session, user: User) -> bool:
    existing = _get_primary_pet(db, user.id)
    if existing:
        return False

    if not (user.pet_name or user.pet_image):
        return False

    pet_name = (user.pet_name or "My Pet").strip() or "My Pet"
    pet = Pet(user_id=user.id, name=pet_name, image_url=user.pet_image)
    db.add(pet)
    db.flush()
    return True


def _sync_user_primary_pet_from_pets(db: Session, user: User) -> None:
    primary = _get_primary_pet(db, user.id)
    if primary:
        user.pet_name = primary.name
        user.pet_image = primary.image_url
    else:
        user.pet_name = None
        user.pet_image = None


@app.on_event("startup")
def init_database_tables():
    import time

    last_error = None
    for attempt in range(1, 4):
        try:
            Base.metadata.create_all(bind=engine)

            from create_admin import create_admin
            from create_walkers import create_walkers
            from migrate_cancellation_fields import migrate_cancellation_fields
            from migrate_cancelled_by import migrate_cancelled_by
            from migrate_user_pets import migrate_user_pets

            create_admin()
            create_walkers()
            migrate_cancellation_fields()
            migrate_cancelled_by()
            migrate_user_pets()
            seed_default_pricings()

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
    name="policies",
)

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


@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    return {"status": "ok", "message": "Paws Pal Connect API is running"}


# ==========================================
# Dynamic Pricing Management & Public APIs
# ==========================================

DEFAULT_SERVICE_PRICES = {
    "walker": {"price": 299, "subscription_price": 249},
    "boarding": {"price": 499, "subscription_price": 399},
    "grooming": {"price": 599, "subscription_price": 499},
    "vet": {"price": 399, "subscription_price": 349},
    "vaccination": {"price": 349, "subscription_price": 299},
    "pathology": {"price": 449, "subscription_price": 399},
    "sitter": {"price": 299, "subscription_price": 249},
}


def seed_default_pricings(db: Session | None = None):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
    try:
        for service_key, model_cls in PRICING_MODELS.items():
            active_rec = db.query(model_cls).filter(model_cls.is_active == True).first()
            if not active_rec:
                defaults = DEFAULT_SERVICE_PRICES.get(service_key, {"price": 299, "subscription_price": 249})
                new_p = model_cls(
                    price=defaults["price"],
                    subscription_price=defaults["subscription_price"],
                    is_active=True,
                )
                db.add(new_p)
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to seed default pricings")
    finally:
        if close_db:
            db.close()



VALID_SERVICES = set(PRICING_MODELS.keys())


def _normalize_service_name(service: str) -> str:
    s = service.strip().lower()
    if s.endswith("_pricing"):
        s = s[:-8]
    if s not in VALID_SERVICES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service '{service}' not found. Valid services: {', '.join(sorted(VALID_SERVICES))}",
        )
    return s


def _get_active_pricing(db: Session, service: str):
    s_key = _normalize_service_name(service)
    model_cls = PRICING_MODELS[s_key]
    active = db.query(model_cls).filter(model_cls.is_active == True).first()
    if not active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active pricing found for service '{s_key}'",
        )
    return s_key, active


@app.get("/pricing/{service}", response_model=PricingPublicResponse)
def get_public_service_pricing(service: str, db: Session = Depends(get_db)):
    _, active = _get_active_pricing(db, service)
    return PricingPublicResponse(
        price=active.price,
        subscription_price=active.subscription_price,
    )


@app.get("/admin/pricing", response_model=dict[str, PricingAdminResponse])
def get_all_admin_pricings(
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    result = {}
    for service_key, model_cls in PRICING_MODELS.items():
        active = db.query(model_cls).filter(model_cls.is_active == True).first()
        if active:
            result[service_key] = PricingAdminResponse(
                id=active.id,
                service=service_key,
                price=active.price,
                subscription_price=active.subscription_price,
                is_active=active.is_active,
                created_at=active.created_at,
                updated_at=active.updated_at,
            )
    return result


@app.get("/admin/pricing/{service}", response_model=PricingAdminResponse)
def get_admin_service_pricing(
    service: str,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    s_key, active = _get_active_pricing(db, service)
    return PricingAdminResponse(
        id=active.id,
        service=s_key,
        price=active.price,
        subscription_price=active.subscription_price,
        is_active=active.is_active,
        created_at=active.created_at,
        updated_at=active.updated_at,
    )


def _set_active_pricing(db: Session, service: str, data: PricingCreateUpdate):
    s_key = _normalize_service_name(service)
    model_cls = PRICING_MODELS[s_key]

    try:
        db.query(model_cls).filter(model_cls.is_active == True).update(
            {"is_active": False}, synchronize_session=False
        )

        new_pricing = model_cls(
            price=data.price,
            subscription_price=data.subscription_price,
            is_active=True,
        )
        db.add(new_pricing)
        db.commit()
        db.refresh(new_pricing)

        return PricingAdminResponse(
            id=new_pricing.id,
            service=s_key,
            price=new_pricing.price,
            subscription_price=new_pricing.subscription_price,
            is_active=new_pricing.is_active,
            created_at=new_pricing.created_at,
            updated_at=new_pricing.updated_at,
        )
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Failed to update pricing for service %s", s_key)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not update pricing for service '{s_key}'",
        ) from exc


@app.put("/admin/pricing/{service}", response_model=PricingAdminResponse)
def update_admin_service_pricing(
    service: str,
    data: PricingCreateUpdate,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return _set_active_pricing(db, service, data)


@app.post("/admin/pricing/{service}", response_model=PricingAdminResponse, status_code=status.HTTP_201_CREATED)
def create_admin_service_pricing(
    service: str,
    data: PricingCreateUpdate,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return _set_active_pricing(db, service, data)




@app.post("/signup")
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
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
            owner_id=uuid.uuid4(),
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        pet = Pet(
            user_id=new_user.id,
            name=user_data.pet_name,
            image_url=user_data.pet_image,
            pet_id=uuid.uuid4(),
        )
        db.add(pet)
        db.commit()

        access_token = create_access_token(data={"sub": str(new_user.id)})
        user_response = UserResponse.model_validate(new_user)

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
    user = db.query(User).filter(User.email == user_data.email).first()

    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    user_response = UserResponse.model_validate(user)

    return {
        "user": user_response,
        "access_token": access_token,
        "token_type": "bearer",
    }


@app.post("/admin/login")
def admin_login(admin_data: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == admin_data.email).first()

    if not admin or not verify_password(admin_data.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    access_token = create_access_token(
        data={
            "sub": str(admin.id),
            "role": "admin",
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


def _busy_walker_ids(db: Session, exclude_booking_id: int | None = None) -> set[int]:
    q = db.query(Booking.walker_id).filter(
        Booking.walker_id.isnot(None),
        Booking.status.notin_(list(TERMINAL_BOOKING_STATUSES)),
    )
    if exclude_booking_id is not None:
        q = q.filter(Booking.id != exclude_booking_id)

    return {int(row[0]) for row in q.distinct().all() if row[0] is not None}


def _busy_walker_names(db: Session, exclude_booking_id: int | None = None) -> set[str]:
    q = db.query(Booking.assigned_walker).filter(
        Booking.assigned_walker.isnot(None),
        Booking.status.notin_(list(TERMINAL_BOOKING_STATUSES)),
    )
    if exclude_booking_id is not None:
        q = q.filter(Booking.id != exclude_booking_id)

    return {row[0] for row in q.distinct().all() if row[0]}


def _set_walker_availability(db: Session, walker_name: str | None, available: bool) -> None:
    if not walker_name:
        return
    walker = db.query(Walker).filter(Walker.name == walker_name).first()
    if walker:
        walker.is_available = available


def _release_booking_walker(db: Session, booking: Booking) -> None:
    if booking.walker_id:
        walker = db.query(Walker).filter(Walker.id == booking.walker_id).first()
        if walker:
            walker.is_available = True
            return
    if booking.assigned_walker:
        _set_walker_availability(db, booking.assigned_walker, True)


async def _broadcast_booking_status_updated(booking: Booking) -> None:
    await manager.broadcast({
        "type": "booking:status_updated",
        "booking_id": booking.id,
        "status": booking.status,
        "cancelled_at": booking.cancelled_at.isoformat() if booking.cancelled_at else None,
        "cancellation_reason": booking.cancellation_reason,
        "cancelled_by": booking.cancelled_by,
    })


def _booking_cancel_response(booking: Booking, message: str) -> BookingCancelResponse:
    return BookingCancelResponse(
        message=message,
        booking_id=booking.id,
        status="Cancelled",
        cancelled_at=booking.cancelled_at,
        cancellation_reason=booking.cancellation_reason,
        cancelled_by=booking.cancelled_by,
    )


def _walker_uniqueness_errors(
    db: Session,
    *,
    name: str | None = None,
    email: str | None = None,
    mobile_number: str | None = None,
    exclude_walker_id: int | None = None,
) -> dict:
    errors: dict[str, str] = {}

    if name:
        q = db.query(Walker).filter(func.lower(Walker.name) == name.lower())
        if exclude_walker_id is not None:
            q = q.filter(Walker.id != exclude_walker_id)
        if q.first():
            errors["name"] = "Walker name already exists"

    if email:
        q = db.query(Walker).filter(func.lower(Walker.email) == email.lower())
        if exclude_walker_id is not None:
            q = q.filter(Walker.id != exclude_walker_id)
        if q.first():
            errors["email"] = "Email already registered"

    if mobile_number:
        q = db.query(Walker).filter(
            or_(Walker.mobile == mobile_number, Walker.mobile_number == mobile_number)
        )
        if exclude_walker_id is not None:
            q = q.filter(Walker.id != exclude_walker_id)
        if q.first():
            errors["mobile_number"] = "Mobile number already registered"

    return errors


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

    busy_ids = _busy_walker_ids(db, exclude_booking_id=booking_id)
    current_walker_name = None
    if booking_id is not None:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if booking:
            current_walker_name = booking.assigned_walker

    return [
        w for w in walkers
        if w.is_active and (
            (w.is_available and w.id not in busy_ids)
            or (w.name == current_walker_name)
        )
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


@app.get("/walkers/validate")
def validate_walker_unique(
    name: str | None = None,
    email: str | None = None,
    mobile_number: str | None = None,
    exclude_walker_id: int | None = None,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    errors = _walker_uniqueness_errors(
        db,
        name=name.strip() if name else None,
        email=email.strip().lower() if email else None,
        mobile_number=mobile_number.strip() if mobile_number else None,
        exclude_walker_id=exclude_walker_id,
    )
    return {"ok": not bool(errors), "errors": errors}


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
    email = data.email.strip().lower()
    mobile_number = data.mobile_number.strip()
    password = data.password
    address = data.address.strip()
    profile_image = data.profile_image.strip() if data.profile_image else None

    errors = _walker_uniqueness_errors(
        db,
        name=name,
        email=email,
        mobile_number=mobile_number,
    )

    if errors:
        raise HTTPException(status_code=400, detail={"errors": errors})

    walker = Walker(
        name=name,
        email=email,
        mobile=mobile_number,
        mobile_number=mobile_number,
        hashed_password=hash_password(password),
        address=address,
        profile_image=profile_image,
        is_available=data.is_available,
        is_active=True,
    )

    try:
        db.add(walker)
        db.commit()
        db.refresh(walker)
        return walker
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Failed to create walker")
        raise HTTPException(status_code=500, detail="Could not create walker")


@app.patch("/walkers/{walker_id}", response_model=WalkerResponse)
def admin_update_walker(
    walker_id: int,
    body: WalkerUpdateAdmin,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    walker = db.query(Walker).filter(Walker.id == walker_id).first()
    if not walker:
        raise HTTPException(status_code=404, detail="Walker not found")

    data = body.model_dump(exclude_unset=True)

    errors = _walker_uniqueness_errors(
        db,
        name=data.get("name") if data.get("name") else None,
        email=str(data.get("email")).lower() if data.get("email") else None,
        mobile_number=data.get("mobile_number") if data.get("mobile_number") else None,
        exclude_walker_id=walker_id,
    )
    if errors:
        raise HTTPException(status_code=400, detail={"errors": errors})

    if data.get("name") is not None:
        walker.name = data["name"].strip()

    if data.get("email") is not None:
        walker.email = str(data["email"]).strip().lower()

    if data.get("mobile_number") is not None:
        walker.mobile_number = data["mobile_number"].strip()
        walker.mobile = data["mobile_number"].strip()

    if "address" in data and data["address"] is not None:
        walker.address = data["address"].strip()

    if "profile_image" in data:
        walker.profile_image = data["profile_image"].strip() if data["profile_image"] else None

    if "is_available" in data and data["is_available"] is not None:
        walker.is_available = bool(data["is_available"])

    if "is_active" in data and data["is_active"] is not None:
        walker.is_active = bool(data["is_active"])

    if data.get("password"):
        walker.hashed_password = hash_password(data["password"])

    try:
        db.add(walker)
        db.commit()
        db.refresh(walker)
        return walker
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Failed to update walker %s", walker_id)
        raise HTTPException(status_code=500, detail="Could not update walker")


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
        Booking.walker_id == walker.id,
        Booking.status.notin_(list(TERMINAL_BOOKING_STATUSES)),
    ).first()
    if active:
        raise HTTPException(status_code=400, detail="Walker has active bookings.")

    db.delete(walker)
    db.commit()
    return {"message": "Walker removed successfully"}


def _resolve_pet_fields(
    pet_name: str | None,
    pet_image: str | None,
    user: User | None,
    pet: Pet | None = None,
) -> tuple[str | None, str | None]:
    if pet_name:
        return pet_name, pet_image
    if pet:
        return pet.name, pet.image_url
    if user:
        return user.pet_name, user.pet_image
    return None, None


def _booking_pet(db: Session, booking: Booking) -> Pet | None:
    if not getattr(booking, "pet_id", None):
        return None
    return db.query(Pet).filter(Pet.id == booking.pet_id).first()


def _serialize_booking(booking: Booking, db: Session) -> dict:
    user = None
    if booking.user_id:
        user = db.query(User).filter(User.id == booking.user_id).first()

    pet = _booking_pet(db, booking)
    pet_name, pet_image = _resolve_pet_fields(
        booking.pet_name,
        booking.pet_image,
        user,
        pet,
    )

    amount_paise = booking.amount or _resolve_apartment_amount(booking.apartment)

    return {
        "id": booking.id,
        "booking_code": booking.booking_code or f"BK{booking.id:05d}",
        "user_id": booking.user_id,
        "pet_id": booking.pet_id,
        "name": booking.name,
        "email": booking.email,
        "mobile": booking.mobile,
        "apartment": booking.apartment,
        "flatNo": booking.flatNo,
        "address": booking.address,
        "pet_name": pet_name,
        "pet_image": pet_image,
        "service_type": getattr(booking, "service_type", None),
        "booking_category": getattr(booking, "booking_category", None),
        "plan_name": getattr(booking, "plan_name", None),
        "booking_date": booking.booking_date.isoformat() if booking.booking_date else None,
        "time_slot": booking.time_slot,
        "booking_time": booking.time_slot,
        "duration": booking.duration,
        "payment_method": booking.payment_method,
        "payment_status": booking.payment_status,
        "status": booking.status,
        "assigned_walker": booking.assigned_walker,
        "walker_id": booking.walker_id,
        "amount": amount_paise,
        "discount": getattr(booking, "discount", 0) or 0,
        "coupon": getattr(booking, "coupon", None),
        "cancelled_at": _as_utc(getattr(booking, "cancelled_at", None)),
        "cancellation_reason": getattr(booking, "cancellation_reason", None),
        "cancelled_by": getattr(booking, "cancelled_by", None),
        "created_at": _as_utc(booking.created_at),
        "updated_at": _as_utc(getattr(booking, "updated_at", None) or booking.created_at),
    }


def _serialize_walker_booking(booking: Booking, db: Session) -> dict:
    return _serialize_booking(booking, db)


def _normalize_status(status: str | None) -> str:
    mapping = {
        "New": "PENDING",
        "Assigned": "CONFIRMED",
        "Started": "STARTED",
        "Reached": "REACHED",
        "Completed": "COMPLETED",
        "Cancelled": "CANCELLED",
    }
    if status in mapping:
        return mapping[status]
    return (status or "PENDING").upper()


def _normalize_payment_status(payment_status: str | None) -> str:
    if payment_status and payment_status.lower() == "paid":
        return "PAID"
    return "PENDING"


def _serialize_my_booking(booking: Booking, db: Session) -> MyBookingItem:
    walker_brief = None
    if booking.walker_id:
        walker = db.query(Walker).filter(Walker.id == booking.walker_id).first()
        if walker:
            walker_brief = WalkerBrief(
                id=walker.id,
                name=walker.name,
                phone=walker.mobile,
                profile_image=getattr(walker, "profile_image", None),
            )
    elif booking.assigned_walker:
        walker = db.query(Walker).filter(Walker.name == booking.assigned_walker).first()
        if walker:
            walker_brief = WalkerBrief(
                id=walker.id,
                name=walker.name,
                phone=walker.mobile,
                profile_image=getattr(walker, "profile_image", None),
            )
        else:
            walker_brief = WalkerBrief(
                id=0,
                name=booking.assigned_walker,
                phone="",
                profile_image=None,
            )

    ff = (
        db.query(FriendFamilyBooking)
        .filter(FriendFamilyBooking.booking_id == booking.id)
        .first()
    )
    friend_family = None
    if ff:
        friend_family = FriendFamilyDetail(
            name=ff.name,
            mobile=ff.mobile,
            address=ff.address,
            emergency_contact=ff.emergency_contact,
            notes=ff.notes,
        )

    user = db.query(User).filter(User.id == booking.user_id).first() if booking.user_id else None
    pet = _booking_pet(db, booking)
    pet_name, pet_image = _resolve_pet_fields(booking.pet_name, booking.pet_image, user, pet)
    pet_brief = None
    if pet_name:
        pet_brief = PetBrief(
            id=booking.pet_id,
            name=pet_name,
            pet_image=pet_image,
            image_url=pet_image,
        )

    amount_rupees = (booking.amount or _resolve_apartment_amount(booking.apartment)) / 100
    discount = getattr(booking, "discount", 0) or 0

    return MyBookingItem(
        booking_id=booking.id,
        id=booking.booking_code or f"BK{booking.id:05d}",
        service_type=getattr(booking, "service_type", None) or "Dog Walking",
        booking_category=getattr(booking, "booking_category", None) or "One-Time",
        plan_name=getattr(booking, "plan_name", None) or booking.apartment,
        booking_date=getattr(booking, "booking_date", None),
        time_slot=getattr(booking, "time_slot", None) or "6 PM - 9 PM",
        duration=getattr(booking, "duration", None) or 60,
        payment_method=getattr(booking, "payment_method", None) or "Online",
        payment_status=_normalize_payment_status(booking.payment_status),
        amount=round(amount_rupees - discount, 2),
        coupon=getattr(booking, "coupon", None),
        discount=discount,
        status=_normalize_status(booking.status),
        special_instructions=getattr(booking, "special_instructions", None),
        address=booking.address,
        latitude=getattr(booking, "latitude", None),
        longitude=getattr(booking, "longitude", None),
        pet_id=booking.pet_id,
        pet_name=pet_name,
        pet_image=pet_image,
        pet=pet_brief,
        walker=walker_brief,
        friend_family=friend_family,
        cancelled_at=_as_utc(getattr(booking, "cancelled_at", None)),
        cancellation_reason=getattr(booking, "cancellation_reason", None),
        cancelled_by=getattr(booking, "cancelled_by", None),
        created_at=_as_utc(booking.created_at),
        updated_at=_as_utc(getattr(booking, "updated_at", None) or booking.created_at),
    )


def _build_customer_summaries(db: Session) -> list[CustomerSummary]:
    bookings = (
        db.query(Booking)
        .filter(_paid_booking_filter())
        .order_by(Booking.created_at.desc())
        .all()
    )
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

        customers.append(CustomerSummary(pet_name=pet_name, pet_image=pet_image, **data))

    customers.sort(
        key=lambda c: c.last_booking_at or datetime.min.replace(tzinfo=None),
        reverse=True,
    )
    return customers


@app.get("/customers", response_model=list[CustomerSummary])
def get_customers(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
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
        .filter(Booking.email.ilike(email), _paid_booking_filter())
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


async def _notify_booking_confirmed(booking: Booking, background_tasks: BackgroundTasks):
    await manager.broadcast({
        "type": "new_booking",
        "booking_id": booking.id,
        "name": booking.name,
        "apartment": booking.apartment,
        "status": "New",
    })
    background_tasks.add_task(
        send_booking_email,
        apartment=booking.apartment,
        name=booking.name,
        mobile=booking.mobile,
        flatNo=booking.flatNo,
        address=booking.address,
    )
    background_tasks.add_task(
        send_user_confirmation_email,
        user_name=booking.name,
        user_email=booking.email,
        apartment=booking.apartment,
        flatNo=booking.flatNo,
        address=booking.address,
    )


@app.post("/book")
async def create_booking(
    booking_data: BookingRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == int(user_id)).first()
    user_email = booking_data.email or (user.email if user else None)

    selected_pet = None
    if booking_data.pet_id is not None:
        selected_pet = (
            db.query(Pet)
            .filter(Pet.id == booking_data.pet_id, Pet.user_id == int(user_id))
            .first()
        )
        if not selected_pet:
            raise HTTPException(status_code=400, detail="Selected pet was not found")

        pet_name = selected_pet.name
        pet_image = selected_pet.image_url
    else:
        if user:
            _ensure_user_has_legacy_pet(db, user)

        pet_name, pet_image = _resolve_pet_fields(
            booking_data.pet_name,
            booking_data.pet_image,
            user,
        )

        if not pet_name and user:
            selected_pet = _get_primary_pet(db, user.id)
            if selected_pet:
                pet_name = selected_pet.name
                pet_image = selected_pet.image_url

        if not selected_pet and user and pet_name:
            selected_pet = (
                db.query(Pet)
                .filter(Pet.user_id == user.id, func.lower(Pet.name) == pet_name.lower())
                .order_by(Pet.id.asc())
                .first()
            )

    new_booking = Booking(
        user_id=int(user_id) if user_id else None,
        pet_id=selected_pet.id if selected_pet else None,
        name=booking_data.name,
        email=user_email,
        mobile=booking_data.mobile,
        apartment=booking_data.apartment,
        flatNo=booking_data.flatNo,
        address=booking_data.address,
        pet_name=pet_name,
        pet_image=pet_image,
        service_type=booking_data.service_type or "Dog Walking",
        booking_category=booking_data.booking_category or "One-Time",
        plan_name=booking_data.plan_name or booking_data.apartment,
        payment_method=booking_data.payment_method or "Online",
        special_instructions=booking_data.special_instructions,
        latitude=booking_data.latitude,
        longitude=booking_data.longitude,
        booking_date=booking_data.booking_date if booking_data.booking_date is not None else date.today(),
        time_slot=booking_data.time_slot if booking_data.time_slot is not None else "6 PM - 9 PM",
        duration=booking_data.duration if booking_data.duration is not None else 60,
        status="New",
        assigned_walker=None,
        payment_status="pending",
        amount=_resolve_apartment_amount(booking_data.apartment),
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    new_booking.booking_code = f"BK{new_booking.id:05d}"
    db.commit()
    db.refresh(new_booking)

    return {
        "id": new_booking.id,
        "name": new_booking.name,
        "email": new_booking.email,
        "apartment": new_booking.apartment,
        "pet_id": new_booking.pet_id,
        "created_at": new_booking.created_at.isoformat(),
    }


@app.get("/bookings")
def get_bookings(
    page: int = 1,
    limit: int = 10,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * limit
    query = db.query(Booking).filter(_paid_booking_filter())
    total = query.count()

    bookings = (
        query.order_by(Booking.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
        "bookings": [_serialize_booking(b, db) for b in bookings],
    }


@app.get("/bookings/{booking_id}")
def get_booking(
    booking_id: int,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.payment_status not in ("paid", None):
        raise HTTPException(status_code=404, detail="Booking not found")

    return _serialize_booking(booking, db)


@app.patch("/bookings/{booking_id}")
async def update_booking(
    booking_id: int,
    update: BookingUpdate,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.payment_status not in ("paid", None):
        raise HTTPException(status_code=404, detail="Booking not found")

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

        existing_active = db.query(Booking).filter(
            Booking.walker_id == walker.id,
            Booking.id != booking.id,
            Booking.status.notin_(list(TERMINAL_BOOKING_STATUSES)),
        ).first()
        if existing_active:
            raise HTTPException(status_code=400, detail="Walker already has an active booking")

        busy_ids = _busy_walker_ids(db, exclude_booking_id=booking_id)
        if walker.id in busy_ids:
            raise HTTPException(
                status_code=400,
                detail="Walker is already assigned to another active booking",
            )

        previous_walker_id = booking.walker_id
        if previous_walker_id and previous_walker_id != walker.id:
            prev = db.query(Walker).filter(Walker.id == previous_walker_id).first()
            if prev:
                prev.is_available = True

        booking.assigned_walker = walker.name
        booking.walker_id = walker.id
        walker.is_available = False

    booking.status = update.status

    if update.status in ("Completed", "Cancelled"):
        _release_booking_walker(db, booking)

    db.commit()
    db.refresh(booking)

    await manager.broadcast({
        "type": "status_updated",
        "booking_id": booking.id,
        "status": booking.status,
        "assigned_walker": booking.assigned_walker,
    })

    return _serialize_booking(booking, db)


@app.post("/bookings/{booking_id}/cancel", response_model=BookingCancelResponse)
async def cancel_booking(
    booking_id: int,
    body: BookingCancelRequest = BookingCancelRequest(),
    actor: dict = Depends(get_authenticated_actor),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    is_admin = actor.get("role") == "admin"
    if not is_admin:
        if booking.user_id is None or booking.user_id != int(actor["id"]):
            raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")

    if booking.status == "Completed":
        raise HTTPException(status_code=409, detail="Completed bookings cannot be cancelled")

    if booking.status == "Cancelled":
        await _broadcast_booking_status_updated(booking)
        return _booking_cancel_response(booking, "Booking was already cancelled")

    reason = body.reason.strip() if (body and body.reason) else None
    if not reason:
        raise HTTPException(status_code=400, detail="Please provide a cancellation reason.")

    cancelled_by = body.cancelled_by.strip() if (body and body.cancelled_by) else None
    if not cancelled_by:
        cancelled_by = "admin" if is_admin else "customer"

    try:
        booking.status = "Cancelled"
        booking.cancelled_at = datetime.utcnow()
        booking.cancellation_reason = reason
        booking.cancelled_by = cancelled_by
        _release_booking_walker(db, booking)
        db.commit()
        db.refresh(booking)
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Failed to cancel booking %s", booking_id)
        raise HTTPException(status_code=500, detail="Could not cancel booking. Please try again.")

    await _broadcast_booking_status_updated(booking)
    return _booking_cancel_response(booking, "Booking cancelled successfully")


@app.post("/create-order", response_model=CreateOrderResponse)
def create_order(
    body: CreateOrderRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == body.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != int(user_id):
        raise HTTPException(status_code=403, detail="Not authorized for this booking")
    if booking.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Booking is already paid")

    client = _get_razorpay_client()
    order_amount = getattr(booking, "amount", None) or _resolve_apartment_amount(booking.apartment)
    try:
        order = client.order.create({
            "amount": order_amount,
            "currency": "INR",
            "receipt": f"booking_{booking.id}",
            "notes": {"booking_id": str(booking.id)},
        })
    except Exception:
        logger.exception("Razorpay order creation failed for booking %s", booking.id)
        raise HTTPException(status_code=502, detail="Could not create payment order. Please try again.")

    booking.razorpay_order_id = order["id"]
    db.commit()

    return CreateOrderResponse(
        order_id=order["id"],
        amount=order["amount"],
        currency=order["currency"],
    )


@app.post("/verify-payment", response_model=VerifyPaymentResponse)
async def verify_payment(
    body: VerifyPaymentRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == body.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != int(user_id):
        raise HTTPException(status_code=403, detail="Not authorized for this booking")
    if booking.payment_status == "paid":
        return VerifyPaymentResponse(
            success=True,
            message="Payment already verified",
            booking_id=booking.id,
        )
    if booking.razorpay_order_id != body.razorpay_order_id:
        raise HTTPException(status_code=400, detail="Order ID does not match booking")

    client = _get_razorpay_client()
    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": body.razorpay_order_id,
            "razorpay_payment_id": body.razorpay_payment_id,
            "razorpay_signature": body.razorpay_signature,
        })
    except razorpay.errors.SignatureVerificationError:
        return VerifyPaymentResponse(success=False, message="Payment verification failed")
    except Exception:
        logger.exception("Payment verification error for booking %s", booking.id)
        raise HTTPException(status_code=502, detail="Could not verify payment")

    booking.payment_status = "paid"
    booking.razorpay_payment_id = body.razorpay_payment_id
    db.commit()
    db.refresh(booking)

    await _notify_booking_confirmed(booking, background_tasks)

    return VerifyPaymentResponse(
        success=True,
        message="Payment verified successfully",
        booking_id=booking.id,
    )


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
        "file_url": f"/policies/{slug}.html",
    }


@app.get("/apartment-price", response_model=ApartmentPriceResponse)
def get_apartment_price(apartment: str, user_id: str = Depends(get_current_user)):
    if apartment not in APARTMENT_PRICES:
        raise HTTPException(status_code=404, detail="Unknown apartment")
    return ApartmentPriceResponse(amount=APARTMENT_PRICES[apartment], apartment=apartment)


@app.get("/profile", response_model=ProfileResponse)
def get_profile(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user_or_404(db, user_id)

    created_pet = _ensure_user_has_legacy_pet(db, user)
    if created_pet:
        _sync_user_primary_pet_from_pets(db, user)
        db.commit()
        db.refresh(user)

    primary_pet = _get_primary_pet(db, user.id)
    pet_name = primary_pet.name if primary_pet else user.pet_name
    pet_image = primary_pet.image_url if primary_pet else user.pet_image

    return ProfileResponse(
        id=user.id,
        owner_id=user.owner_id,
        name=user.name,
        email=user.email,
        mobile=user.mobile,
        apartment=user.apartment,
        flatNo=user.flatNo,
        address=user.address,
        pet_name=pet_name,
        pet_image=pet_image,
    )


@app.patch("/profile", response_model=ProfileResponse)
def update_profile(
    update: ProfileUpdate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user_or_404(db, user_id)
    data = update.model_dump(exclude_unset=True)

    new_email = data.get("email")
    if new_email and new_email != user.email:
        clash = db.query(User).filter(User.email == new_email, User.id != user.id).first()
        if clash:
            raise HTTPException(status_code=400, detail="Email already registered")

    for field in ("name", "email", "mobile", "apartment", "flatNo", "address"):
        if field in data and data[field] is not None:
            setattr(user, field, data[field])

    pet_fields_present = "pet_name" in data or "pet_image" in data
    if pet_fields_present:
        if "pet_name" in data and data["pet_name"] is not None:
            user.pet_name = data["pet_name"]
        if "pet_image" in data:
            user.pet_image = data["pet_image"]

        pet = _get_primary_pet(db, user.id)
        if not pet:
            pet = Pet(
                user_id=user.id,
                name=(user.pet_name or "My Pet").strip() or "My Pet",
                image_url=user.pet_image,
            )
            db.add(pet)
        else:
            if "pet_name" in data and data["pet_name"] is not None:
                pet.name = data["pet_name"]
            if "pet_image" in data:
                pet.image_url = data["pet_image"]

    try:
        db.commit()
        db.refresh(user)
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Profile update failed for user %s", user_id)
        raise HTTPException(status_code=500, detail="Could not update profile")

    primary_pet = _get_primary_pet(db, user.id)
    return ProfileResponse(
        id=user.id,
        owner_id=user.owner_id,
        name=user.name,
        email=user.email,
        mobile=user.mobile,
        apartment=user.apartment,
        flatNo=user.flatNo,
        address=user.address,
        pet_name=(primary_pet.name if primary_pet else user.pet_name),
        pet_image=(primary_pet.image_url if primary_pet else user.pet_image),
    )


@app.get("/pets", response_model=list[PetResponse])
def get_my_pets(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user_or_404(db, user_id)
    created_pet = _ensure_user_has_legacy_pet(db, user)

    if created_pet:
        _sync_user_primary_pet_from_pets(db, user)
        db.commit()

    pets = (
        db.query(Pet)
        .filter(Pet.user_id == user.id)
        .order_by(Pet.id.asc())
        .all()
    )
    return [_serialize_pet(p) for p in pets]


@app.post("/pets", response_model=PetResponse, status_code=status.HTTP_201_CREATED)
def create_pet(
    data: PetCreate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user_or_404(db, user_id)
    name = data.name.strip()

    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Pet name must be at least 2 characters")

    pet = Pet(
        user_id=user.id,
        name=name,
        image_url=data.resolved_image(),
    )

    try:
        db.add(pet)
        db.flush()
        _sync_user_primary_pet_from_pets(db, user)
        db.commit()
        db.refresh(pet)
        return _serialize_pet(pet)
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Could not create pet for user %s", user_id)
        raise HTTPException(status_code=500, detail="Could not create pet")


@app.patch("/pets/{pet_id}", response_model=PetResponse)
def update_pet(
    pet_id: int,
    data: PetUpdate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user_or_404(db, user_id)
    pet = db.query(Pet).filter(Pet.id == pet_id, Pet.user_id == user.id).first()

    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    payload = data.model_dump(exclude_unset=True)

    if "name" in payload and payload["name"] is not None:
        name = payload["name"].strip()
        if len(name) < 2:
            raise HTTPException(status_code=400, detail="Pet name must be at least 2 characters")
        pet.name = name

    if "pet_image" in payload:
        pet.image_url = payload["pet_image"]
    elif "image_url" in payload:
        pet.image_url = payload["image_url"]

    try:
        db.add(pet)
        db.flush()
        _sync_user_primary_pet_from_pets(db, user)
        db.commit()
        db.refresh(pet)
        return _serialize_pet(pet)
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Could not update pet %s for user %s", pet_id, user_id)
        raise HTTPException(status_code=500, detail="Could not update pet")


@app.delete("/pets/{pet_id}")
def delete_pet(
    pet_id: int,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user_or_404(db, user_id)
    pet = db.query(Pet).filter(Pet.id == pet_id, Pet.user_id == user.id).first()

    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    try:
        db.query(Booking).filter(Booking.pet_id == pet.id).update(
            {Booking.pet_id: None},
            synchronize_session=False,
        )
        db.delete(pet)
        db.flush()
        _sync_user_primary_pet_from_pets(db, user)
        db.commit()
        return {"message": "Pet deleted successfully"}
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Could not delete pet %s for user %s", pet_id, user_id)
        raise HTTPException(status_code=500, detail="Could not delete pet")


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    apartment: Optional[str] = None
    flatNo: Optional[str] = None
    address: Optional[str] = None


@app.put("/api/users/{user_id}")
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user),
):
    if str(current_user_id) != str(user_id):
        raise HTTPException(status_code=403, detail="You can only update your own profile")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    data = payload.model_dump(exclude_unset=True)

    if "email" in data and data["email"] != user.email:
        clash = db.query(User).filter(User.email == data["email"], User.id != user.id).first()
        if clash:
            raise HTTPException(status_code=400, detail="Email already registered")

    for field, value in data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "mobile": user.mobile,
        "apartment": user.apartment,
        "flatNo": user.flatNo,
        "address": user.address,
    }


@app.get("/api/dashboard/revenue")
def dashboard_revenue(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    bookings = db.query(Booking).filter(Booking.payment_status == "paid").all()
    total = 0
    for booking in bookings:
        if getattr(booking, "amount", None):
            total += booking.amount

    return {"total_revenue": round(total / 100, 2), "currency": "INR"}


@app.get("/api/dashboard/revenue-daily")
def dashboard_revenue_daily(
    days: int = 30,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    today = date.today()
    revenue_map = {}

    for i in range(days):
        d = today - timedelta(days=i)
        revenue_map[d.isoformat()] = 0

    bookings = db.query(Booking).filter(Booking.payment_status == "paid").all()

    for booking in bookings:
        if not booking.created_at:
            continue
        day = booking.created_at.date().isoformat()
        if day in revenue_map:
            revenue_map[day] += (getattr(booking, "amount", 0) or 0) / 100

    return [{"date": day, "revenue": revenue_map[day]} for day in sorted(revenue_map.keys())]


@app.get("/api/dashboard/stats")
def dashboard_stats(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    paid_bookings = db.query(Booking).filter(Booking.payment_status == "paid").all()

    total_bookings = len(paid_bookings)
    total_revenue = sum(b.amount or _resolve_apartment_amount(b.apartment) for b in paid_bookings) / 100

    new_bookings = [b for b in paid_bookings if b.status == "New"]
    assigned_bookings = [b for b in paid_bookings if b.status == "Assigned"]
    completed_bookings = [b for b in paid_bookings if b.status == "Completed"]

    return {
        "total_bookings": total_bookings,
        "total_revenue": total_revenue,
        "new_bookings": len(new_bookings),
        "new_revenue": sum(b.amount or _resolve_apartment_amount(b.apartment) for b in new_bookings) / 100,
        "assigned_bookings": len(assigned_bookings),
        "assigned_revenue": sum(b.amount or _resolve_apartment_amount(b.apartment) for b in assigned_bookings) / 100,
        "completed_bookings": len(completed_bookings),
        "completed_revenue": sum(b.amount or _resolve_apartment_amount(b.apartment) for b in completed_bookings) / 100,
    }


def _booking_amount(booking: Booking) -> int:
    if getattr(booking, "amount", None):
        return booking.amount
    return _resolve_apartment_amount(booking.apartment)


@app.get("/booking-history", response_model=list[BookingHistoryItem])
def get_booking_history(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bookings = (
        db.query(Booking)
        .filter(Booking.user_id == int(user_id))
        .order_by(Booking.created_at.desc())
        .all()
    )
    return [
        BookingHistoryItem(
            id=b.id,
            created_at=b.created_at,
            status=b.status,
            payment_status=b.payment_status,
            assigned_walker=b.assigned_walker,
            amount=_booking_amount(b),
            apartment=b.apartment,
            pet_id=b.pet_id,
        )
        for b in bookings
    ]


@app.get("/booking-history/{booking_id}", response_model=BookingHistoryDetail)
def get_booking_history_detail(
    booking_id: int,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != int(user_id):
        raise HTTPException(status_code=403, detail="Not authorized for this booking")

    user = db.query(User).filter(User.id == booking.user_id).first() if booking.user_id else None
    pet = _booking_pet(db, booking)
    pet_name, pet_image = _resolve_pet_fields(booking.pet_name, booking.pet_image, user, pet)

    return BookingHistoryDetail(
        id=booking.id,
        created_at=booking.created_at,
        status=booking.status,
        payment_status=booking.payment_status,
        assigned_walker=booking.assigned_walker,
        amount=_booking_amount(booking),
        apartment=booking.apartment,
        pet_id=booking.pet_id,
        name=booking.name,
        email=booking.email,
        mobile=booking.mobile,
        flatNo=booking.flatNo,
        address=booking.address,
        pet_name=pet_name,
        pet_image=pet_image,
    )


@app.get("/api/bookings/my", response_model=list[MyBookingItem])
def get_my_bookings(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bookings = (
        db.query(Booking)
        .filter(Booking.user_id == int(user_id))
        .order_by(Booking.created_at.desc())
        .all()
    )
    return [_serialize_my_booking(b, db) for b in bookings]


@app.post("/logout")
def logout_endpoint(user_id: str = Depends(get_current_user)):
    return {"message": "logged out"}


@app.post("/walker/login", tags=["Walker"])
def walker_login(data: WalkerLogin, db: Session = Depends(get_db)):
    walker = db.query(Walker).filter(Walker.email == data.email.strip().lower()).first()
    if not walker or not verify_password(data.password, walker.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not walker.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="account deactivated")

    access_token = create_access_token(data={"sub": str(walker.id), "role": "walker"})
    profile = WalkerProfileOut.model_validate(walker)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "walker": profile,
    }


# ==========================================
# WALKER REGISTER ENDPOINT (NEW)
# ==========================================
@app.post("/walker/register", tags=["Walker"], status_code=status.HTTP_201_CREATED)
def walker_register(
    data: WalkerCreate,
    db: Session = Depends(get_db),
):
    """
    Register a new walker.
    
    - Checks if email or mobile number already exists
    - Hashes the password
    - Creates a new walker account
    - Returns the created walker profile
    """
    # Check if email already exists
    existing_email = db.query(Walker).filter(
        func.lower(Walker.email) == data.email.strip().lower()
    ).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if mobile number already exists
    existing_mobile = db.query(Walker).filter(
        Walker.mobile_number == data.mobile_number.strip()
    ).first()
    if existing_mobile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number already registered"
        )
    
    # ==========================================
    # REMOVED: Name uniqueness check
    # Walkers can have the same name
    # ==========================================
    
    try:
        # Create new walker
        hashed_pw = hash_password(data.password)
        new_walker = Walker(
            name=data.name.strip(),
            email=data.email.strip().lower(),
            mobile=data.mobile_number.strip(),
            mobile_number=data.mobile_number.strip(),
            hashed_password=hashed_pw,
            address=data.address.strip(),
            profile_image=data.profile_image.strip() if data.profile_image else None,
            is_available=data.is_available,
            is_active=True,
        )
        
        db.add(new_walker)
        db.commit()
        db.refresh(new_walker)
        
        # Return the walker profile
        return WalkerProfileOut.model_validate(new_walker)
        
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Database error during walker registration for %s", data.email)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create walker account. Please try again.",
        )


@app.post("/walker/logout", tags=["Walker"])
def walker_logout(current_walker=Depends(get_current_walker)):
    return {"message": "logged out"}


@app.get("/walker/profile", response_model=WalkerProfileOut, tags=["Walker"])
def get_walker_profile(current_walker=Depends(get_current_walker)):
    return current_walker


@app.put("/walker/profile", response_model=WalkerProfileOut, tags=["Walker"])
def update_walker_profile(
    body: WalkerProfileUpdate,
    current_walker=Depends(get_current_walker),
    db: Session = Depends(get_db),
):
    try:
        if body.name is not None:
            current_walker.name = body.name.strip()
        if body.mobile_number is not None:
            current_walker.mobile_number = body.mobile_number.strip()
            current_walker.mobile = body.mobile_number.strip()
        if body.address is not None:
            current_walker.address = body.address.strip()
        if body.profile_image is not None:
            current_walker.profile_image = body.profile_image.strip()

        db.add(current_walker)
        db.commit()
        db.refresh(current_walker)
        return current_walker
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Database error updating walker profile")
        raise HTTPException(status_code=500, detail="Could not update profile. Please try again.")


@app.patch("/walker/profile", response_model=WalkerProfileOut, tags=["Walker"])
def patch_walker_profile(
    body: WalkerProfileUpdate,
    current_walker=Depends(get_current_walker),
    db: Session = Depends(get_db),
):
    try:
        if body.name is not None:
            current_walker.name = body.name.strip()
        if body.mobile_number is not None:
            current_walker.mobile_number = body.mobile_number.strip()
            current_walker.mobile = body.mobile_number.strip()
        if body.address is not None:
            current_walker.address = body.address.strip()
        if body.profile_image is not None:
            current_walker.profile_image = body.profile_image.strip()

        db.add(current_walker)
        db.commit()
        db.refresh(current_walker)
        return current_walker
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Database error updating walker profile")
        raise HTTPException(status_code=500, detail="Could not update profile")


@app.put("/walker/change-password", tags=["Walker"])
def change_walker_password(
    body: WalkerPasswordChange,
    current_walker=Depends(get_current_walker),
    db: Session = Depends(get_db),
):
    if not verify_password(body.current_password, current_walker.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid current password")

    try:
        current_walker.hashed_password = hash_password(body.new_password)
        db.add(current_walker)
        db.commit()
        return {"message": "Password changed successfully"}
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Database error changing walker password")
        raise HTTPException(status_code=500, detail="Could not change password. Please try again.")


@app.patch("/walker/change-password", tags=["Walker"])
def patch_walker_password(
    body: WalkerPasswordChange,
    current_walker=Depends(get_current_walker),
    db: Session = Depends(get_db),
):
    old_pw = body.resolved_old_password()
    if not verify_password(old_pw, current_walker.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid old password")

    try:
        current_walker.hashed_password = hash_password(body.new_password)
        db.add(current_walker)
        db.commit()
        return {"message": "Password changed successfully"}
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Database error changing walker password")
        raise HTTPException(status_code=500, detail="Could not change password")


@app.put("/walker/availability", response_model=WalkerProfileOut, tags=["Walker"])
def toggle_walker_availability(
    body: WalkerAvailabilityUpdate,
    current_walker=Depends(get_current_walker),
    db: Session = Depends(get_db),
):
    try:
        current_walker.is_available = body.is_available
        db.add(current_walker)
        db.commit()
        db.refresh(current_walker)
        return current_walker
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Database error changing walker availability")
        raise HTTPException(status_code=500, detail="Could not update availability.")


@app.get("/walker/dashboard", tags=["Walker"])
def walker_dashboard(current_walker=Depends(get_current_walker), db: Session = Depends(get_db)):
    today = date.today()

    todays_bookings = db.query(Booking).filter(
        Booking.walker_id == current_walker.id,
        Booking.booking_date == today,
    )

    total_today = todays_bookings.count()

    completed_today = db.query(Booking).filter(
        Booking.walker_id == current_walker.id,
        Booking.status == "Completed",
        func.date(Booking.updated_at) == today,
    ).count()

    pending = db.query(Booking).filter(
        Booking.walker_id == current_walker.id,
        Booking.status.in_(list(ACTIVE_BOOKING_STATUSES)),
    ).count()

    return {
        "today_total": total_today,
        "completed_today": completed_today,
        "pending": pending,
        "is_available": bool(current_walker.is_available),
        "rating": 0.0,
    }


@app.get("/walker/bookings", tags=["Walker"])
def get_walker_bookings(
    page: int = 1,
    limit: int = 10,
    current_walker=Depends(get_current_walker),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * limit
    query = db.query(Booking).filter(Booking.walker_id == current_walker.id)
    total = query.count()
    bookings = (
        query.order_by(Booking.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
        "bookings": [_serialize_walker_booking(b, db) for b in bookings],
    }


@app.get("/walker/bookings/{booking_id}", tags=["Walker"])
def get_walker_booking_detail(
    booking_id: int,
    current_walker=Depends(get_current_walker),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.walker_id != current_walker.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this booking")
    return _serialize_walker_booking(booking, db)


@app.put("/walker/bookings/{booking_id}/status", tags=["Walker"])
async def update_walker_booking_status(
    booking_id: int,
    body: BookingStatusUpdate,
    current_walker=Depends(get_current_walker),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.walker_id != current_walker.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this booking")

    current_status = booking.status
    target_status = body.status

    if target_status == "Cancelled":
        raise HTTPException(status_code=400, detail="Walkers cannot cancel bookings.")

    if current_status == target_status:
        return _serialize_booking(booking, db)

    valid = False
    valid_next = ""
    if current_status == "Assigned" and target_status == "Started":
        valid = True
    elif current_status == "Started" and target_status == "Reached":
        valid = True
    elif current_status == "Reached" and target_status == "Completed":
        valid = True

    if not valid:
        if current_status == "Assigned":
            valid_next = "Started"
        elif current_status == "Started":
            valid_next = "Reached"
        elif current_status == "Reached":
            valid_next = "Completed"
        else:
            valid_next = "None (booking is already completed or cancelled)"
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition from {current_status} to {target_status}. Valid next state(s): {valid_next}",
        )

    try:
        booking.status = target_status
        if target_status == "Completed":
            _release_booking_walker(db, booking)

        db.add(booking)
        db.commit()
        db.refresh(booking)

        await manager.broadcast({
            "type": "status_updated",
            "booking_id": booking.id,
            "status": booking.status,
            "assigned_walker": booking.assigned_walker,
        })
        await manager.broadcast({
            "type": "booking:status_updated",
            "booking_id": booking.id,
            "status": booking.status,
            "cancelled_at": None,
            "cancellation_reason": None,
        })

        return _serialize_booking(booking, db)
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Database error updating booking status")
        raise HTTPException(status_code=500, detail="Could not update status. Please try again.")


@app.patch("/walker/bookings/{booking_id}", tags=["Walker"])
async def patch_walker_booking_status(
    booking_id: int,
    body: BookingStatusUpdate,
    current_walker=Depends(get_current_walker),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.walker_id != current_walker.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this booking")

    current_status = booking.status
    target_status = body.status

    if target_status == "Cancelled":
        raise HTTPException(status_code=400, detail="Walkers cannot cancel bookings.")

    if current_status == target_status:
        return _serialize_booking(booking, db)

    allowed = {
        "Assigned": "Started",
        "Started": "Reached",
        "Reached": "Completed",
    }
    if current_status not in allowed or allowed[current_status] != target_status:
        valid_next = allowed.get(current_status, "None")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition from {current_status} to {target_status}. Valid next state(s): {valid_next}",
        )

    try:
        booking.status = target_status
        if target_status == "Completed":
            _release_booking_walker(db, booking)

        db.add(booking)
        db.commit()
        db.refresh(booking)

        await manager.broadcast({
            "type": "status_updated",
            "booking_id": booking.id,
            "status": booking.status,
            "assigned_walker": booking.assigned_walker,
        })
        await manager.broadcast({
            "type": "booking:status_updated",
            "booking_id": booking.id,
            "status": booking.status,
            "cancelled_at": None,
            "cancellation_reason": None,
            "cancelled_by": None,
        })

        return _serialize_booking(booking, db)
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Database error updating booking status")
        raise HTTPException(status_code=500, detail="Could not update status. Please try again.")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)