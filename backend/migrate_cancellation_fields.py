import sqlite3
from sqlalchemy import text, inspect
from db import engine

def migrate_cancellation_fields():
    """Add cancellation fields to bookings table if they don't exist"""
    with engine.connect() as conn:
        # Check if columns exist
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('bookings')]
        
        # Add cancelled_at if missing
        if 'cancelled_at' not in columns:
            conn.execute(text("ALTER TABLE bookings ADD COLUMN cancelled_at TIMESTAMP;"))
            print("✅ Added cancelled_at column")
        
        # Add cancellation_reason if missing
        if 'cancellation_reason' not in columns:
            conn.execute(text("ALTER TABLE bookings ADD COLUMN cancellation_reason TEXT;"))
            print("✅ Added cancellation_reason column")
        
        # Add cancelled_by if missing
        if 'cancelled_by' not in columns:
            conn.execute(text("ALTER TABLE bookings ADD COLUMN cancelled_by VARCHAR;"))
            print("✅ Added cancelled_by column")
        
        conn.commit()
        print("✅ Cancellation fields migration complete")

if __name__ == "__main__":
    migrate_cancellation_fields()