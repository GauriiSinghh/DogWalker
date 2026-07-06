from db import SessionLocal
from models import Walker

DEFAULT_WALKERS = [
    {"name": "Ravi Kumar", "mobile": "9876500001"},
    {"name": "Priya Sharma", "mobile": "9876500002"},
    {"name": "Arjun Mehta", "mobile": "9876500003"},
    {"name": "Sneha Reddy", "mobile": "9876500004"},
    {"name": "Karan Singh", "mobile": "9876500005"},
]


def create_walkers():
    db = SessionLocal()

    created = 0

    for walker_data in DEFAULT_WALKERS:
        existing = db.query(Walker).filter(
            Walker.name == walker_data["name"]
        ).first()

        if existing:
            continue

        db.add(Walker(**walker_data, is_available=True))
        created += 1

    db.commit()
    db.close()

    print(f"Created {created} walker(s)")


if __name__ == "__main__":
    create_walkers()