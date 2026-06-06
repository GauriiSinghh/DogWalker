from db import SessionLocal
from models import Admin
from auth import hash_password

db = SessionLocal()

existing = db.query(Admin).filter(
    Admin.email == "admin@zuppy.com"
).first()

if existing:
    print("Admin already exists")
else:
    admin = Admin(
        email="admin@zuppy.com",
        hashed_password=hash_password("admin2442")
    )

    db.add(admin)
    db.commit()

    print("Admin created successfully")