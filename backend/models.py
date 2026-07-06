from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Float, Date, ForeignKey, func
from db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    mobile = Column(String, nullable=False)
    apartment = Column(String, nullable=False)
    flatNo = Column(String, nullable=False)
    address = Column(String, nullable=False)
    pet_name = Column(String, nullable=True)
    pet_image = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class Pet(Base):
    __tablename__ = "pets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    name = Column(String, nullable=False)
    image_url = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Walker(Base):
    __tablename__ = "walkers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    mobile = Column(String, nullable=False)
    profile_image = Column(String, nullable=True)
    is_available = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_code = Column(String, unique=True, nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    mobile = Column(String, nullable=False)
    apartment = Column(String, nullable=False)
    flatNo = Column(String, nullable=False)
    address = Column(String, nullable=False)
    pet_name = Column(String, nullable=True)
    pet_image = Column(Text, nullable=True)
    service_type = Column(String, default="Dog Walking")
    booking_category = Column(String, default="One-Time")
    plan_name = Column(String, nullable=True)
    booking_date = Column(Date, nullable=True)
    time_slot = Column(String, nullable=True)
    duration = Column(Integer, nullable=True)
    payment_method = Column(String, default="Online")
    payment_status = Column(String, default="pending")
    amount = Column(Integer, nullable=True)
    coupon = Column(String, nullable=True)
    discount = Column(Float, default=0)
    status = Column(String, default="New")
    special_instructions = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    assigned_walker = Column(String, nullable=True)
    walker_id = Column(Integer, ForeignKey("walkers.id"), nullable=True)
    razorpay_order_id = Column(String, nullable=True)
    razorpay_payment_id = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class FriendFamilyBooking(Base):
    __tablename__ = "friend_family_bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    mobile = Column(String, nullable=False)
    address = Column(String, nullable=False)
    emergency_contact = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
class Page(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    file_url = Column(Text, nullable=False)

    created_at = Column(DateTime, server_default=func.now())
