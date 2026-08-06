import uuid

from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Float, Date, ForeignKey, Index, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from db import Base


def PortableUUID():
    return PG_UUID(as_uuid=True).with_variant(String(36), "sqlite")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(PortableUUID(), unique=True, nullable=False, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    mobile = Column(String, nullable=False)
    apartment = Column(String, nullable=False)
    flatNo = Column(String, nullable=False)
    address = Column(String, nullable=False)

    # Legacy/default pet fields kept for backward compatibility.
    # New multi-pet source of truth is the pets table.
    pet_name = Column(String, nullable=True)
    pet_image = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.now())


class Pet(Base):
    __tablename__ = "pets"

    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(PortableUUID(), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    image_url = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Walker(Base):
    __tablename__ = "walkers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    mobile = Column(String, unique=True, nullable=False)
    mobile_number = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    address = Column(String, nullable=True)
    profile_image = Column(String, nullable=True)
    is_available = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_code = Column(String, unique=True, nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # New pet relation. Nullable so legacy bookings still work.
    # pet_name/pet_image below remain snapshots for backward compatibility.
    pet_id = Column(Integer, ForeignKey("pets.id", ondelete="SET NULL"), nullable=True, index=True)

    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    mobile = Column(String, nullable=False)
    apartment = Column(String, nullable=False)
    flatNo = Column(String, nullable=False)
    address = Column(String, nullable=False)

    # Legacy/snapshot pet fields retained intentionally.
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
    cancelled_at = Column(DateTime, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    cancelled_by = Column(String, nullable=True)
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


class BasePricingModel(Base):
    __abstract__ = True

    id = Column(Integer, primary_key=True, index=True)
    price = Column(Integer, nullable=False)
    subscription_price = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class WalkerPricing(BasePricingModel):
    __tablename__ = "walker_pricings"
    __table_args__ = (
        Index(
            "idx_walker_pricing_active",
            "is_active",
            unique=True,
            postgresql_where=(Column("is_active") == True),
            sqlite_where=(Column("is_active") == True),
        ),
    )


class BoardingPricing(BasePricingModel):
    __tablename__ = "boarding_pricings"
    __table_args__ = (
        Index(
            "idx_boarding_pricing_active",
            "is_active",
            unique=True,
            postgresql_where=(Column("is_active") == True),
            sqlite_where=(Column("is_active") == True),
        ),
    )


class GroomingPricing(BasePricingModel):
    __tablename__ = "grooming_pricings"
    __table_args__ = (
        Index(
            "idx_grooming_pricing_active",
            "is_active",
            unique=True,
            postgresql_where=(Column("is_active") == True),
            sqlite_where=(Column("is_active") == True),
        ),
    )


class VetPricing(BasePricingModel):
    __tablename__ = "vet_pricings"
    __table_args__ = (
        Index(
            "idx_vet_pricing_active",
            "is_active",
            unique=True,
            postgresql_where=(Column("is_active") == True),
            sqlite_where=(Column("is_active") == True),
        ),
    )


class VaccinationPricing(BasePricingModel):
    __tablename__ = "vaccination_pricings"
    __table_args__ = (
        Index(
            "idx_vaccination_pricing_active",
            "is_active",
            unique=True,
            postgresql_where=(Column("is_active") == True),
            sqlite_where=(Column("is_active") == True),
        ),
    )


class PathologyPricing(BasePricingModel):
    __tablename__ = "pathology_pricings"
    __table_args__ = (
        Index(
            "idx_pathology_pricing_active",
            "is_active",
            unique=True,
            postgresql_where=(Column("is_active") == True),
            sqlite_where=(Column("is_active") == True),
        ),
    )


class SitterPricing(BasePricingModel):
    __tablename__ = "sitter_pricings"
    __table_args__ = (
        Index(
            "idx_sitter_pricing_active",
            "is_active",
            unique=True,
            postgresql_where=(Column("is_active") == True),
            sqlite_where=(Column("is_active") == True),
        ),
    )


PRICING_MODELS = {
    "walker": WalkerPricing,
    "boarding": BoardingPricing,
    "grooming": GroomingPricing,
    "vet": VetPricing,
    "vaccination": VaccinationPricing,
    "pathology": PathologyPricing,
    "sitter": SitterPricing,
}
