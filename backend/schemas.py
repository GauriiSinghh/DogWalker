from pydantic import BaseModel, EmailStr, Field, model_validator, field_validator
from typing import Optional
from datetime import datetime, date
from uuid import UUID


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
    owner_id: UUID
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


# =========================
# Pets
# =========================
class PetCreate(BaseModel):
    name: str = Field(..., min_length=1)
    pet_image: Optional[str] = None
    image_url: Optional[str] = None

    def resolved_image(self) -> Optional[str]:
        return self.pet_image if self.pet_image is not None else self.image_url


class PetUpdate(BaseModel):
    name: Optional[str] = None
    pet_image: Optional[str] = None
    image_url: Optional[str] = None

    def resolved_image(self) -> Optional[str]:
        return self.pet_image if self.pet_image is not None else self.image_url


class PetResponse(BaseModel):
    id: int
    pet_id: UUID
    user_id: int
    name: str
    pet_image: Optional[str] = None
    image_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PetBrief(BaseModel):
    id: Optional[int] = None
    name: str
    pet_image: Optional[str] = None
    image_url: Optional[str] = None


# =========================
# Booking
# =========================
class BookingRequest(BaseModel):
    apartment: str
    name: str
    mobile: str
    flatNo: str
    address: str

    email: Optional[str] = None

    # New multi-pet booking association.
    pet_id: Optional[int] = None

    # Legacy fields retained for backward compatibility.
    pet_name: Optional[str] = None
    pet_image: Optional[str] = None

    booking_date: Optional[date] = None
    time_slot: Optional[str] = None
    duration: Optional[int] = None
    service_type: Optional[str] = None
    booking_category: Optional[str] = None
    plan_name: Optional[str] = None
    payment_method: Optional[str] = None
    special_instructions: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


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


# =========================
# Walker
# =========================
class WalkerResponse(BaseModel):
    id: int
    name: str
    mobile: str
    is_available: bool

    email: Optional[str] = None
    profile_image: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    current_booking_id: Optional[int] = None
    current_booking_status: Optional[str] = None

    class Config:
        from_attributes = True


class WalkerCreate(BaseModel):
    name: str
    email: EmailStr
    mobile_number: str
    password: str
    address: str
    profile_image: Optional[str] = None
    is_available: bool = True


class WalkerUpdateAdmin(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile_number: Optional[str] = None
    address: Optional[str] = None
    profile_image: Optional[str] = None
    is_available: Optional[bool] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class WalkerDetailResponse(WalkerResponse):
    active_assignments: int = 0
    total_assignments: int = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WalkerLogin(BaseModel):
    email: EmailStr
    password: str


class WalkerProfileOut(BaseModel):
    id: int
    name: str
    email: str
    mobile: str
    mobile_number: Optional[str] = None
    address: Optional[str] = None
    profile_image: Optional[str] = None
    is_available: bool
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WalkerProfileUpdate(BaseModel):
    name: Optional[str] = None
    mobile_number: Optional[str] = None
    address: Optional[str] = None
    profile_image: Optional[str] = None


class WalkerPasswordChange(BaseModel):
    old_password: Optional[str] = None
    current_password: Optional[str] = None
    new_password: str

    @model_validator(mode="after")
    def _validate_old_password(self):
        if not (self.old_password or self.current_password):
            raise ValueError("old_password is required")
        return self

    def resolved_old_password(self) -> str:
        return self.old_password or self.current_password  # type: ignore


class WalkerAvailabilityUpdate(BaseModel):
    is_available: bool


class BookingStatusUpdate(BaseModel):
    status: str


# =========================
# Customers / Pages / Payment
# =========================
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


# =========================
# Profile / History / My Bookings
# =========================
class ProfileResponse(BaseModel):
    id: int
    owner_id: UUID
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

    # Legacy/default pet update support.
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
    pet_id: Optional[int] = None

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


class BookingCancelRequest(BaseModel):
    reason: Optional[str] = None
    cancelled_by: Optional[str] = None


class BookingCancelResponse(BaseModel):
    message: str
    booking_id: int
    status: str
    cancelled_by: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None


class MyBookingItem(BaseModel):
    booking_id: int
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

    pet_id: Optional[int] = None
    pet_name: Optional[str] = None
    pet_image: Optional[str] = None
    pet: Optional[PetBrief] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    cancelled_by: Optional[str] = None
    walker: Optional[WalkerBrief] = None
    friend_family: Optional[FriendFamilyDetail] = None

    class Config:
        from_attributes = True


# =========================
# Pricing Schemas
# =========================
class PricingPublicResponse(BaseModel):
    price: int
    subscription_price: int

    class Config:
        from_attributes = True


class PricingAdminResponse(BaseModel):
    id: int
    service: str
    price: int
    subscription_price: int
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PricingCreateUpdate(BaseModel):
    price: int
    subscription_price: int
    is_active: Optional[bool] = True

    @field_validator("price", "subscription_price")
    @classmethod
    def validate_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Price must be a non-negative number")
        return v
