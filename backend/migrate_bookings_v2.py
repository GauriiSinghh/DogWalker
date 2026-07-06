"""Alembic-style additive migration for extended booking schema."""
from db import engine
from sqlalchemy import text

MIGRATIONS = [
    "ALTER TABLE walkers ADD COLUMN IF NOT EXISTS profile_image VARCHAR(512);",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_code VARCHAR(32);",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_type VARCHAR(64) DEFAULT 'Dog Walking';",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_category VARCHAR(32) DEFAULT 'One-Time';",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS plan_name VARCHAR(128);",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_date DATE;",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS time_slot VARCHAR(64);",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS duration INTEGER;",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(32) DEFAULT 'Online';",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS coupon VARCHAR(64);",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount FLOAT DEFAULT 0;",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_instructions TEXT;",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS latitude FLOAT;",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS longitude FLOAT;",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS walker_id INTEGER REFERENCES walkers(id);",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();",
    """
    CREATE TABLE IF NOT EXISTS friend_family_bookings (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL REFERENCES bookings(id),
        name VARCHAR(255) NOT NULL,
        mobile VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        emergency_contact VARCHAR(50),
        notes TEXT
    );
    """,
    """
    UPDATE bookings
    SET booking_code = 'BK' || LPAD(id::text, 5, '0')
    WHERE booking_code IS NULL;
    """,
    """
    UPDATE bookings
    SET plan_name = apartment
    WHERE plan_name IS NULL AND apartment IS NOT NULL;
    """,
    """
    UPDATE bookings
    SET booking_date = created_at::date
    WHERE booking_date IS NULL AND created_at IS NOT NULL;
    """,
    """
    UPDATE bookings
    SET time_slot = '6 PM - 9 PM'
    WHERE time_slot IS NULL;
    """,
    """
    UPDATE bookings
    SET duration = 60
    WHERE duration IS NULL;
    """,
]

if __name__ == "__main__":
    with engine.connect() as conn:
        for stmt in MIGRATIONS:
            conn.execute(text(stmt))
        conn.commit()
    print("Booking schema migration completed successfully.")
