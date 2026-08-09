import sqlite3
from sqlalchemy import text, inspect
from db import engine

def migrate_user_pets():
    """Create pets table if it doesn't exist"""
    with engine.connect() as conn:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if 'pets' not in tables:
            conn.execute(text("""
                CREATE TABLE pets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    pet_id VARCHAR(36) UNIQUE NOT NULL,
                    user_id INTEGER NOT NULL,
                    name VARCHAR NOT NULL,
                    image_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            """))
            conn.commit()
            print("✅ Created pets table")
        else:
            print("✅ pets table already exists")

if __name__ == "__main__":
    migrate_user_pets()