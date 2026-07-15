import os
import sys
from datetime import datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import pytest
from models import User, Walker, Booking
from auth import create_access_token

# Fixtures (db_session, client) are provided by conftest.py


def test_cancel_flow(client, db_session):
    # 1. Create test users
    customer_a = User(
        email="customer_a@example.com",
        hashed_password="dummy_password",
        name="Customer A",
        mobile="9876543210",
        apartment="Sobha Dream Acres",
        flatNo="A101",
        address="Near Park",
    )
    customer_b = User(
        email="customer_b@example.com",
        hashed_password="dummy_password",
        name="Customer B",
        mobile="9876543211",
        apartment="Sobha Dream Acres",
        flatNo="B102",
        address="Near Gate",
    )
    db_session.add_all([customer_a, customer_b])
    db_session.commit()
    db_session.refresh(customer_a)
    db_session.refresh(customer_b)

    # Generate auth tokens
    token_a = create_access_token(data={"sub": str(customer_a.id)})
    headers_a = {"Authorization": f"Bearer {token_a}"}

    token_b = create_access_token(data={"sub": str(customer_b.id)})
    headers_b = {"Authorization": f"Bearer {token_b}"}

    token_admin = create_access_token(data={"sub": "999", "role": "admin"})
    headers_admin = {"Authorization": f"Bearer {token_admin}"}

    # 2. Create a walker
    walker_a = Walker(
        name="Walker Joe",
        mobile="9000000001",
        mobile_number="9000000001",
        email="walker_joe@example.com",
        hashed_password="dummy",
        address="Test Address",
        is_available=False,
        is_active=True,
    )
    db_session.add(walker_a)
    db_session.commit()
    db_session.refresh(walker_a)

    # 3. Create test bookings
    # Booking 1: Owned by A, status "New"
    booking_1 = Booking(
        user_id=customer_a.id,
        name="Booking 1",
        email=customer_a.email,
        mobile=customer_a.mobile,
        apartment=customer_a.apartment,
        flatNo=customer_a.flatNo,
        address=customer_a.address,
        status="New",
    )
    # Booking 2: Owned by A, status "Completed"
    booking_2 = Booking(
        user_id=customer_a.id,
        name="Booking 2",
        email=customer_a.email,
        mobile=customer_a.mobile,
        apartment=customer_a.apartment,
        flatNo=customer_a.flatNo,
        address=customer_a.address,
        status="Completed",
    )
    # Booking 3: Owned by A, status "Cancelled"
    booking_3 = Booking(
        user_id=customer_a.id,
        name="Booking 3",
        email=customer_a.email,
        mobile=customer_a.mobile,
        apartment=customer_a.apartment,
        flatNo=customer_a.flatNo,
        address=customer_a.address,
        status="Cancelled",
        cancelled_at=datetime.utcnow(),
    )
    # Booking 4: Owned by B, status "Assigned" to walker_a
    booking_4 = Booking(
        user_id=customer_b.id,
        name="Booking 4",
        email=customer_b.email,
        mobile=customer_b.mobile,
        apartment=customer_b.apartment,
        flatNo=customer_b.flatNo,
        address=customer_b.address,
        status="Assigned",
        walker_id=walker_a.id,
        assigned_walker=walker_a.name,
    )

    db_session.add_all([booking_1, booking_2, booking_3, booking_4])
    db_session.commit()
    db_session.refresh(booking_1)
    db_session.refresh(booking_2)
    db_session.refresh(booking_3)
    db_session.refresh(booking_4)

    # --- Test Case 1: Customer A cancels own booking ---
    response = client.post(
        f"/bookings/{booking_1.id}/cancel",
        json={"reason": "Changing plans"},
        headers=headers_a,
    )
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["message"] == "Booking cancelled successfully"
    assert res_data["booking_id"] == booking_1.id
    assert res_data["status"] == "Cancelled"
    assert res_data["cancellation_reason"] == "Changing plans"
    assert res_data["cancelled_at"] is not None

    # Verify status in database
    db_session.refresh(booking_1)
    assert booking_1.status == "Cancelled"
    assert booking_1.cancellation_reason == "Changing plans"

    # --- Test Case 2: Customer A tries to cancel Customer B's booking (booking 4) ---
    response = client.post(
        f"/bookings/{booking_4.id}/cancel",
        json={"reason": "Malicious attempt"},
        headers=headers_a,
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not authorized to cancel this booking"

    # Verify booking 4 status remains Assigned in database
    db_session.refresh(booking_4)
    assert booking_4.status == "Assigned"

    # --- Test Case 3: Admin cancels Customer B's booking (booking 4) ---
    # Before cancel, walker is unavailable
    db_session.refresh(walker_a)
    assert walker_a.is_available is False

    response = client.post(
        f"/bookings/{booking_4.id}/cancel",
        json={"reason": "Admin request"},
        headers=headers_admin,
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Booking cancelled successfully"

    # Verify status in database and walker is released (becomes available)
    db_session.refresh(booking_4)
    db_session.refresh(walker_a)
    assert booking_4.status == "Cancelled"
    assert walker_a.is_available is True

    # --- Test Case 4: Customer A tries to cancel completed booking (booking 2) ---
    response = client.post(
        f"/bookings/{booking_2.id}/cancel",
        json={"reason": "Oops"},
        headers=headers_a,
    )
    assert response.status_code in (400, 409)
    assert response.json()["detail"] == "Completed bookings cannot be cancelled"

    # --- Test Case 5: Customer A cancels already-cancelled booking (booking 3) ---
    response = client.post(
        f"/bookings/{booking_3.id}/cancel",
        json={"reason": "Repeated cancel"},
        headers=headers_a,
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Booking was already cancelled"
    assert response.json()["status"] == "Cancelled"

    # --- Test Case 6: Look up non-existent booking ---
    response = client.post(
        "/bookings/9999/cancel",
        json={"reason": "Does not exist"},
        headers=headers_a,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Booking not found"
