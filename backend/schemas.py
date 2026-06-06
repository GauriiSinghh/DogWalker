from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    mobile: str
    apartment: str
    flatNo: str
    address: str

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

class PageResponse(BaseModel):
    id: int
    slug: str
    title: str
    file_url: str

    class Config:
        from_attributes = True