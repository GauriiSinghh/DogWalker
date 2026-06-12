from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

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