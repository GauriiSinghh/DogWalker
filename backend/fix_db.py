from db import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("""
        ALTER TABLE pets
        ALTER COLUMN image_url TYPE TEXT;
    """))
    conn.execute(text("""
        ALTER TABLE bookings
        ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'New';
    """))

    conn.execute(text("""
        ALTER TABLE bookings
        ADD COLUMN IF NOT EXISTS assigned_walker VARCHAR(255);
    """))

    conn.execute(text("""
        ALTER TABLE bookings
        ADD COLUMN IF NOT EXISTS pet_name VARCHAR(255);
    """))

    conn.execute(text("""
        ALTER TABLE bookings
        ADD COLUMN IF NOT EXISTS pet_image TEXT;
    """))

    conn.execute(text("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS pet_name VARCHAR(255);
    """))

    conn.execute(text("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS pet_image TEXT;
    """))

    conn.execute(text("""
        INSERT INTO pets (user_id, name, image_url, created_at, updated_at)
        SELECT u.id, u.pet_name, u.pet_image, NOW(), NOW()
        FROM users u
        WHERE u.pet_name IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM pets p WHERE p.user_id = u.id
          );
    """))

    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS walkers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            mobile VARCHAR(50) NOT NULL,
            is_available BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    """))

    conn.commit()

print("Database updated successfully")