from sqlalchemy import Column, Integer, String, DateTime, Text, func
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
    created_at = Column(DateTime, server_default=func.now())

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
    created_at = Column(DateTime, server_default=func.now())
    
class Page(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    file_url = Column(Text, nullable=False)

    created_at = Column(DateTime, server_default=func.now())