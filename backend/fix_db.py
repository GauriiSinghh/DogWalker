from db import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("""
        ALTER TABLE bookings
        ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'New';
    """))

    conn.execute(text("""
        ALTER TABLE bookings
        ADD COLUMN IF NOT EXISTS assigned_walker VARCHAR(255);
    """))

    conn.commit()

print("Database updated successfully")