import sqlite3
from sqlalchemy import text, inspect
from db import engine

def migrate_cancelled_by():
    """Add cancelled_by column if it doesn't exist"""
    with engine.connect() as conn:
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('bookings')]
        
        if 'cancelled_by' not in columns:
            conn.execute(text("ALTER TABLE bookings ADD COLUMN cancelled_by VARCHAR;"))
            conn.commit()
            print("✅ Added cancelled_by column")
        else:
            print("✅ cancelled_by column already exists")

if __name__ == "__main__":
    migrate_cancelled_by()