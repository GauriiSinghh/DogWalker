import os
from dotenv import load_dotenv
from db import SessionLocal
from models import Admin
from auth import hash_password

load_dotenv()

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@zuppy.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin2442")


def create_admin():
    db = SessionLocal()

    existing = db.query(Admin).filter(Admin.email == ADMIN_EMAIL).first()

    if not existing:
        admin = Admin(
            email=ADMIN_EMAIL,
            hashed_password=hash_password(ADMIN_PASSWORD),
        )
        db.add(admin)
        db.commit()
        print("✅ Admin created")
    else:
        print("✅ Admin already exists")

    db.close()


if __name__ == "__main__":
    create_admin()