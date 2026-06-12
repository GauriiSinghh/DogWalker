from db import SessionLocal
from models import Walker

DEFAULT_WALKERS = [
    {"name": "Ravi Kumar", "mobile": "9876500001"},
    {"name": "Priya Sharma", "mobile": "9876500002"},
    {"name": "Arjun Mehta", "mobile": "9876500003"},
    {"name": "Sneha Reddy", "mobile": "9876500004"},
    {"name": "Karan Singh", "mobile": "9876500005"},
]

db = SessionLocal()

created = 0
for walker_data in DEFAULT_WALKERS:
    existing = db.query(Walker).filter(Walker.name == walker_data["name"]).first()
    if existing:
        print(f"Walker already exists: {walker_data['name']}")
        continue

    db.add(Walker(**walker_data, is_available=True))
    created += 1
    print(f"Walker created: {walker_data['name']}")

db.commit()
db.close()

print(f"Done. {created} new walker(s) added.")
