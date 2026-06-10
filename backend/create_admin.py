import os
from dotenv import load_dotenv
from db import SessionLocal
from models import Admin
from auth import hash_password

load_dotenv()

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@zuppy.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin2442")

db = SessionLocal()

existing = db.query(Admin).filter(Admin.email == ADMIN_EMAIL).first()

if existing:
    print(f"Admin already exists: {ADMIN_EMAIL}")
else:
    admin = Admin(
        email=ADMIN_EMAIL,
        hashed_password=hash_password(ADMIN_PASSWORD),
    )
    db.add(admin)
    db.commit()
    print(f"Admin created successfully: {ADMIN_EMAIL}")

db.close()
