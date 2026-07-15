import logging
import uuid

from sqlalchemy import inspect, text, func
from sqlalchemy.exc import SQLAlchemyError

from db import engine, SessionLocal
from models import User, Pet, Booking

logger = logging.getLogger(__name__)


def _backfill_uuid_column(table: str, column: str) -> None:
    with engine.begin() as conn:
        rows = conn.execute(
            text(f"SELECT id FROM {table} WHERE {column} IS NULL")
        ).fetchall()
        for (row_id,) in rows:
            conn.execute(
                text(f"UPDATE {table} SET {column} = :value WHERE id = :id"),
                {"value": str(uuid.uuid4()), "id": row_id},
            )


def _add_uuid_columns_if_missing() -> None:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    if "users" in tables:
        user_columns = {col["name"] for col in inspector.get_columns("users")}
        if "owner_id" not in user_columns:
            logger.info("Adding users.owner_id column")
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN owner_id UUID"))

        _backfill_uuid_column("users", "owner_id")

        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ALTER COLUMN owner_id SET NOT NULL"))

        try:
            with engine.begin() as conn:
                conn.execute(
                    text(
                        "ALTER TABLE users ADD CONSTRAINT uq_users_owner_id UNIQUE (owner_id)"
                    )
                )
        except Exception:
            logger.debug("users.owner_id unique constraint already exists", exc_info=True)

    if "pets" in tables:
        pet_columns = {col["name"] for col in inspector.get_columns("pets")}
        if "pet_id" not in pet_columns:
            logger.info("Adding pets.pet_id column")
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE pets ADD COLUMN pet_id UUID"))

        _backfill_uuid_column("pets", "pet_id")

        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE pets ALTER COLUMN pet_id SET NOT NULL"))

        try:
            with engine.begin() as conn:
                conn.execute(
                    text("ALTER TABLE pets ADD CONSTRAINT uq_pets_pet_id UNIQUE (pet_id)")
                )
        except Exception:
            logger.debug("pets.pet_id unique constraint already exists", exc_info=True)


def _add_booking_pet_id_column_if_missing() -> None:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    if "bookings" not in tables:
        return

    booking_columns = {col["name"] for col in inspector.get_columns("bookings")}

    if "pet_id" not in booking_columns:
        logger.info("Adding bookings.pet_id column")
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE bookings ADD COLUMN pet_id INTEGER"))

    try:
        with engine.begin() as conn:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_bookings_pet_id ON bookings (pet_id)"))
    except Exception:
        logger.warning("Could not create ix_bookings_pet_id index; continuing", exc_info=True)


def migrate_user_pets() -> None:
    """
    Idempotent migration:
    1. Adds users.owner_id and pets.pet_id if missing (with UUID backfill).
    2. Adds bookings.pet_id if missing.
    3. Copies legacy users.pet_name/users.pet_image into pets table.
    4. Backfills old bookings.pet_id where possible.
    """
    _add_uuid_columns_if_missing()
    _add_booking_pet_id_column_if_missing()

    db = SessionLocal()
    try:
        users = db.query(User).all()

        for user in users:
            legacy_name = (user.pet_name or "").strip()
            legacy_image = user.pet_image

            if not legacy_name and not legacy_image:
                continue

            pet_name = legacy_name or "My Pet"

            existing_same = (
                db.query(Pet)
                .filter(
                    Pet.user_id == user.id,
                    func.lower(Pet.name) == pet_name.lower(),
                )
                .first()
            )

            if not existing_same:
                has_any_pet = db.query(Pet).filter(Pet.user_id == user.id).first()

                if not has_any_pet:
                    db.add(
                        Pet(
                            user_id=user.id,
                            name=pet_name,
                            image_url=legacy_image,
                        )
                    )
                else:
                    # Preserve legacy pet data even if pets table was partially used.
                    db.add(
                        Pet(
                            user_id=user.id,
                            name=pet_name,
                            image_url=legacy_image,
                        )
                    )

        db.flush()

        old_bookings = db.query(Booking).filter(Booking.pet_id.is_(None)).all()
        for booking in old_bookings:
            if not booking.user_id:
                continue

            matched_pet = None

            if booking.pet_name:
                matched_pet = (
                    db.query(Pet)
                    .filter(
                        Pet.user_id == booking.user_id,
                        func.lower(Pet.name) == booking.pet_name.lower(),
                    )
                    .order_by(Pet.id.asc())
                    .first()
                )

            if not matched_pet:
                matched_pet = (
                    db.query(Pet)
                    .filter(Pet.user_id == booking.user_id)
                    .order_by(Pet.id.asc())
                    .first()
                )

            if matched_pet:
                booking.pet_id = matched_pet.id
                if not booking.pet_name:
                    booking.pet_name = matched_pet.name
                if not booking.pet_image:
                    booking.pet_image = matched_pet.image_url

        db.commit()
        logger.info("User pet migration completed successfully")

    except SQLAlchemyError:
        db.rollback()
        logger.exception("User pet migration failed")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_user_pets()