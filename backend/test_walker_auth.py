import os
import sys
from datetime import datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import pytest
from models import User, Walker, Booking
from auth import create_access_token, hash_password

# Fixtures (db_session, client) are provided by conftest.py


def test_walker_login_flows(client, db_session):
    # 1. Create a walker in the DB
    walker_password = "SecurePassword123"
    hashed_pw = hash_password(walker_password)
    walker = Walker(
        name="Test Walker",
        mobile="9876543210",
        mobile_number="9876543210",
        email="test_walker@example.com",
        hashed_password=hashed_pw,
        address="123 Street",
        is_available=True,
        is_active=True
    )
    db_session.add(walker)
    db_session.commit()
    db_session.refresh(walker)

    # 2. Test successful login
    login_resp = client.post(
        "/walker/login",
        json={"email": "test_walker@example.com", "password": walker_password}
    )
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert "access_token" in login_data
    assert login_data["walker"]["email"] == "test_walker@example.com"
    assert login_data["walker"]["is_active"] is True

    # 3. Test failed login (wrong password)
    failed_resp = client.post(
        "/walker/login",
        json={"email": "test_walker@example.com", "password": "WrongPassword"}
    )
    assert failed_resp.status_code == 401
    assert failed_resp.json()["detail"] == "Invalid email or password"

    # 4. Test deactivated walker login blocked
    walker.is_active = False
    db_session.add(walker)
    db_session.commit()

    deactivated_resp = client.post(
        "/walker/login",
        json={"email": "test_walker@example.com", "password": walker_password}
    )
    assert deactivated_resp.status_code == 403
    assert deactivated_resp.json()["detail"] == "account deactivated"

def test_walker_profile_actions(client, db_session):
    # Setup walker
    hashed_pw = hash_password("walker123")
    walker = Walker(
        name="Walker B",
        mobile="9000000002",
        mobile_number="9000000002",
        email="walker_b@example.com",
        hashed_password=hashed_pw,
        address="Old Address",
        is_available=True,
        is_active=True
    )
    db_session.add(walker)
    db_session.commit()
    db_session.refresh(walker)

    token = create_access_token(data={"sub": str(walker.id), "role": "walker"})
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch profile
    profile_resp = client.get("/walker/profile", headers=headers)
    assert profile_resp.status_code == 200
    assert profile_resp.json()["name"] == "Walker B"
    assert profile_resp.json()["address"] == "Old Address"

    # Update profile
    update_resp = client.put(
        "/walker/profile",
        json={"name": "Walker B Updated", "address": "New Address", "mobile_number": "9111111111"},
        headers=headers
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "Walker B Updated"
    assert update_resp.json()["address"] == "New Address"
    assert update_resp.json()["mobile"] == "9111111111"

    # Toggle availability
    avail_resp = client.put(
        "/walker/availability",
        json={"is_available": False},
        headers=headers
    )
    assert avail_resp.status_code == 200
    assert avail_resp.json()["is_available"] is False

    # Change password
    pwd_resp = client.put(
        "/walker/change-password",
        json={"current_password": "walker123", "new_password": "new_password_abc"},
        headers=headers
    )
    assert pwd_resp.status_code == 200
    assert pwd_resp.json()["message"] == "Password changed successfully"

    # Verify login with new password
    login_resp = client.post(
        "/walker/login",
        json={"email": "walker_b@example.com", "password": "new_password_abc"}
    )
    assert login_resp.status_code == 200

def test_walker_bookings_and_transitions(client, db_session):
    # Setup walker and another walker
    w1 = Walker(
        name="Walker 1", email="w1@example.com", mobile="9876540001",
        hashed_password=hash_password("w1pwd"), address="A1", is_available=True, is_active=True
    )
    w2 = Walker(
        name="Walker 2", email="w2@example.com", mobile="9876540002",
        hashed_password=hash_password("w2pwd"), address="A2", is_available=True, is_active=True
    )
    db_session.add_all([w1, w2])
    db_session.commit()
    db_session.refresh(w1)
    db_session.refresh(w2)

    # Setup bookings
    b1 = Booking(
        name="Booking 1", email="cust@example.com", mobile="9876543210",
        apartment="Prestige", flatNo="101", address="P1",
        status="Assigned", walker_id=w1.id, assigned_walker=w1.name
    )
    b2 = Booking(
        name="Booking 2", email="cust@example.com", mobile="9876543210",
        apartment="Prestige", flatNo="102", address="P2",
        status="Assigned", walker_id=w2.id, assigned_walker=w2.name
    )
    db_session.add_all([b1, b2])
    db_session.commit()
    db_session.refresh(b1)
    db_session.refresh(b2)

    t1 = create_access_token(data={"sub": str(w1.id), "role": "walker"})
    h1 = {"Authorization": f"Bearer {t1}"}

    t2 = create_access_token(data={"sub": str(w2.id), "role": "walker"})
    h2 = {"Authorization": f"Bearer {t2}"}

    # 1. Fetch bookings for walker 1
    bookings_resp = client.get("/walker/bookings", headers=h1)
    assert bookings_resp.status_code == 200
    assert bookings_resp.json()["total"] == 1
    assert bookings_resp.json()["bookings"][0]["id"] == b1.id

    # 2. Fetch booking details for self
    detail_resp = client.get(f"/walker/bookings/{b1.id}", headers=h1)
    assert detail_resp.status_code == 200
    assert detail_resp.json()["id"] == b1.id

    # 3. Access other walker's booking blocked
    other_resp = client.get(f"/walker/bookings/{b2.id}", headers=h1)
    assert other_resp.status_code == 403

    # 4. Valid status transition sequence: Assigned -> Started -> Reached -> Completed
    # Assigned -> Started (Valid)
    s1 = client.put(f"/walker/bookings/{b1.id}/status", json={"status": "Started"}, headers=h1)
    assert s1.status_code == 200
    assert s1.json()["status"] == "Started"

    # Started -> Reached (Valid)
    s2 = client.put(f"/walker/bookings/{b1.id}/status", json={"status": "Reached"}, headers=h1)
    assert s2.status_code == 200
    assert s2.json()["status"] == "Reached"

    # Reached -> Completed (Valid)
    s3 = client.put(f"/walker/bookings/{b1.id}/status", json={"status": "Completed"}, headers=h1)
    assert s3.status_code == 200
    assert s3.json()["status"] == "Completed"

    # 5. Invalid transition: skipping a step or moving backward
    # Reset booking status to Assigned for testing
    db_session.refresh(b1)
    b1.status = "Assigned"
    db_session.commit()

    # Assigned -> Reached (Invalid: skipped Started)
    err1 = client.put(f"/walker/bookings/{b1.id}/status", json={"status": "Reached"}, headers=h1)
    assert err1.status_code == 400
    assert "Invalid transition" in err1.json()["detail"]

    # 6. Blocked Cancellation by Walker
    cancel_err = client.put(f"/walker/bookings/{b1.id}/status", json={"status": "Cancelled"}, headers=h1)
    assert cancel_err.status_code == 400
    assert cancel_err.json()["detail"] == "Walkers cannot cancel bookings."

def test_booking_cancellation_reasons(client, db_session):
    customer = User(
        email="customer@example.com", hashed_password="dummy_password",
        name="Customer", mobile="9876543210", apartment="SDA", flatNo="101", address="Road 1"
    )
    db_session.add(customer)
    db_session.commit()
    db_session.refresh(customer)

    booking_1 = Booking(
        user_id=customer.id, name="B1", email=customer.email, mobile=customer.mobile,
        apartment=customer.apartment, flatNo=customer.flatNo, address=customer.address,
        status="New"
    )
    booking_2 = Booking(
        user_id=customer.id, name="B2", email=customer.email, mobile=customer.mobile,
        apartment=customer.apartment, flatNo=customer.flatNo, address=customer.address,
        status="New"
    )
    booking_3 = Booking(
        user_id=customer.id, name="B3", email=customer.email, mobile=customer.mobile,
        apartment=customer.apartment, flatNo=customer.flatNo, address=customer.address,
        status="New"
    )
    db_session.add_all([booking_1, booking_2, booking_3])
    db_session.commit()
    db_session.refresh(booking_1)
    db_session.refresh(booking_2)
    db_session.refresh(booking_3)

    cust_token = create_access_token(data={"sub": str(customer.id)})
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    admin_token = create_access_token(data={"sub": "999", "role": "admin"})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Customer cancels with preset reason
    r1 = client.post(
        f"/bookings/{booking_1.id}/cancel",
        json={"reason": "Change of plans", "cancelled_by": "customer"},
        headers=cust_headers
    )
    assert r1.status_code == 200
    data1 = r1.json()
    assert data1["cancellation_reason"] == "Change of plans"
    assert data1["cancelled_by"] == "customer"

    # 2. Customer cancels with "Other" and custom text
    r2 = client.post(
        f"/bookings/{booking_2.id}/cancel",
        json={"reason": "Going on vacation", "cancelled_by": "customer"},
        headers=cust_headers
    )
    assert r2.status_code == 200
    assert r2.json()["cancellation_reason"] == "Going on vacation"

    # 3. Admin cancels with preset admin-only reason
    r3 = client.post(
        f"/bookings/{booking_3.id}/cancel",
        json={"reason": "Walker unavailable", "cancelled_by": "admin"},
        headers=admin_headers
    )
    assert r3.status_code == 200
    data3 = r3.json()
    assert data3["cancellation_reason"] == "Walker unavailable"
    assert data3["cancelled_by"] == "admin"

    # 4. Missing reason returns 400 error
    booking_4 = Booking(
        user_id=customer.id, name="B4", email=customer.email, mobile=customer.mobile,
        apartment=customer.apartment, flatNo=customer.flatNo, address=customer.address,
        status="New"
    )
    db_session.add(booking_4)
    db_session.commit()
    db_session.refresh(booking_4)

    r4 = client.post(
        f"/bookings/{booking_4.id}/cancel",
        json={"reason": "  ", "cancelled_by": "customer"},
        headers=cust_headers
    )
    assert r4.status_code == 400
    assert r4.json()["detail"] == "Please provide a cancellation reason."

    # 5. Cancelling already-cancelled booking returns existing reason, no overwrite
    r5 = client.post(
        f"/bookings/{booking_1.id}/cancel",
        json={"reason": "Different reason", "cancelled_by": "customer"},
        headers=cust_headers
    )
    assert r5.status_code == 200
    assert r5.json()["cancellation_reason"] == "Change of plans"
