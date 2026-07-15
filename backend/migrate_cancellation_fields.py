"""Additive migration for booking cancellation fields."""
from db import engine
from sqlalchemy import text

MIGRATIONS = [
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;",
]


def migrate_cancellation_fields() -> None:
    with engine.connect() as conn:
        for stmt in MIGRATIONS:
            conn.execute(text(stmt))
        conn.commit()


if __name__ == "__main__":
    migrate_cancellation_fields()
    print("Cancellation fields migration completed successfully.")
