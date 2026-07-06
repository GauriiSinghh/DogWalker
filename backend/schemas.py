from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    mobile: str
    apartment: str
    flatNo: str
    address: str
    pet_name: str
    pet_image: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    mobile: str
    apartment: str
    flatNo: str
    address: str
    pet_name: Optional[str] = None
    pet_image: Optional[str] = None

    class Config:
        from_attributes = True

class BookingRequest(BaseModel):
    apartment: str
    name: str
    mobile: str
    flatNo: str
    address: str
    email: Optional[str] = None
    pet_name: Optional[str] = None
    pet_image: Optional[str] = None

class BookingResponse(BaseModel):
    id: int
    name: str
    email: str
    apartment: str
    created_at: str

    class Config:
        from_attributes = True

class BookingUpdate(BaseModel):
    status: str
    assigned_walker: str | None = None
    walker_id: int | None = None

class WalkerResponse(BaseModel):
    id: int
    name: str
    mobile: str
    is_available: bool

    class Config:
        from_attributes = True

class WalkerCreate(BaseModel):
    name: str
    mobile: str
    is_available: bool = True

class WalkerDetailResponse(WalkerResponse):
    active_assignments: int = 0
    total_assignments: int = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CustomerSummary(BaseModel):
    email: str
    name: str
    mobile: str
    apartment: str
    flatNo: str
    address: str
    user_id: Optional[int] = None
    pet_name: Optional[str] = None
    pet_image: Optional[str] = None
    booking_count: int
    last_booking_at: Optional[datetime] = None

class CustomerBookingSummary(BaseModel):
    id: int
    status: str
    apartment: str
    assigned_walker: Optional[str] = None
    created_at: Optional[datetime] = None

class CustomerDetailResponse(CustomerSummary):
    bookings: list[CustomerBookingSummary] = []

class PageResponse(BaseModel):
    id: int
    slug: str
    title: str
    file_url: str

    class Config:
        from_attributes = True


class CreateOrderRequest(BaseModel):
    booking_id: int


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str


class VerifyPaymentRequest(BaseModel):
    booking_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class VerifyPaymentResponse(BaseModel):
    success: bool
    message: str
    booking_id: Optional[int] = None

# ===== ADD TO schemas.py (at the end, additive only) =====

class ProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    mobile: str
    apartment: str
    flatNo: str
    address: str
    pet_name: Optional[str] = None
    pet_image: Optional[str] = None

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile: Optional[str] = None
    apartment: Optional[str] = None
    flatNo: Optional[str] = None
    address: Optional[str] = None
    pet_name: Optional[str] = None
    pet_image: Optional[str] = None


class BookingHistoryItem(BaseModel):
    id: int
    created_at: Optional[datetime] = None
    status: str
    payment_status: Optional[str] = None
    assigned_walker: Optional[str] = None
    amount: Optional[int] = None
    apartment: str

    class Config:
        from_attributes = True


class BookingHistoryDetail(BookingHistoryItem):
    name: str
    email: str
    mobile: str
    flatNo: str
    address: str
    pet_name: Optional[str] = None
    pet_image: Optional[str] = None


class ApartmentPriceResponse(BaseModel):
    amount: int
    apartment: str


class WalkerBrief(BaseModel):
    id: int
    name: str
    phone: str
    profile_image: Optional[str] = None


class FriendFamilyDetail(BaseModel):
    name: str
    mobile: str
    address: str
    emergency_contact: Optional[str] = None
    notes: Optional[str] = None


class MyBookingItem(BaseModel):
    id: str
    service_type: str
    booking_category: str
    plan_name: Optional[str] = None
    booking_date: Optional[date] = None
    time_slot: Optional[str] = None
    duration: Optional[int] = None
    payment_method: Optional[str] = None
    payment_status: str
    amount: float
    coupon: Optional[str] = None
    discount: Optional[float] = 0
    status: str
    special_instructions: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    walker: Optional[WalkerBrief] = None
    friend_family: Optional[FriendFamilyDetail] = None

    class Config:
        from_attributes = True