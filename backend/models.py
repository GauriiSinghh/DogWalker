from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, func
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
    is_available = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    mobile = Column(String, nullable=False)
    apartment = Column(String, nullable=False)
    flatNo = Column(String, nullable=False)
    address = Column(String, nullable=False)
    pet_name = Column(String, nullable=True)
    pet_image = Column(Text, nullable=True)
    status = Column(String, default="New")
    assigned_walker = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

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