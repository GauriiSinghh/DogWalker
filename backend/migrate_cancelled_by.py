"""Additive migration for booking cancelled_by field."""
from db import engine
from sqlalchemy import text

MIGRATIONS = [
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(50);",
]


def migrate_cancelled_by() -> None:
    with engine.connect() as conn:
        for stmt in MIGRATIONS:
            conn.execute(text(stmt))
        conn.commit()


if __name__ == "__main__":
    migrate_cancelled_by()
    print("Cancelled_by field migration completed successfully.")
