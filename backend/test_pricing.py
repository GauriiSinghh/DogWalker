import pytest
from auth import create_access_token
from models import WalkerPricing, PRICING_MODELS


@pytest.fixture
def admin_headers():
    token = create_access_token({"sub": "1", "role": "admin"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def user_headers():
    token = create_access_token({"sub": "1"})
    return {"Authorization": f"Bearer {token}"}


def test_public_get_pricing_walker(client, db_session):
    # Seed default pricing
    from main import seed_default_pricings
    seed_default_pricings(db_session)

    res = client.get("/pricing/walker")
    assert res.status_code == 200
    data = res.json()
    assert "price" in data
    assert "subscription_price" in data
    assert data["price"] == 299
    assert data["subscription_price"] == 249


def test_public_get_pricing_all_services(client, db_session):
    from main import seed_default_pricings
    seed_default_pricings(db_session)

    services = ["walker", "boarding", "grooming", "vet", "vaccination", "pathology", "sitter"]
    for s in services:
        res = client.get(f"/pricing/{s}")
        assert res.status_code == 200
        data = res.json()
        assert data["price"] > 0
        assert data["subscription_price"] > 0


def test_public_get_pricing_unknown_service(client, db_session):
    res = client.get("/pricing/unknown_service")
    assert res.status_code == 404


def test_admin_get_all_pricings(client, db_session, admin_headers):
    from main import seed_default_pricings
    seed_default_pricings(db_session)

    res = client.get("/admin/pricing", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "walker" in data
    assert "boarding" in data


def test_admin_update_pricing_atomic_deactivation(client, db_session, admin_headers):
    from main import seed_default_pricings
    seed_default_pricings(db_session)

    payload = {"price": 350, "subscription_price": 300}
    res = client.put("/admin/pricing/walker", json=payload, headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["price"] == 350
    assert data["subscription_price"] == 300
    assert data["is_active"] is True

    # Verify in DB that only 1 record is active and previous ones are inactive
    active_records = db_session.query(WalkerPricing).filter(WalkerPricing.is_active == True).all()
    assert len(active_records) == 1
    assert active_records[0].price == 350

    # Public endpoint now returns updated price
    pub_res = client.get("/pricing/walker")
    assert pub_res.status_code == 200
    assert pub_res.json()["price"] == 350


def test_admin_update_pricing_negative_validation(client, db_session, admin_headers):
    payload = {"price": -100, "subscription_price": 200}
    res = client.put("/admin/pricing/walker", json=payload, headers=admin_headers)
    assert res.status_code == 422


def test_admin_pricing_unauthorized(client, db_session, user_headers):
    res = client.get("/admin/pricing", headers=user_headers)
    assert res.status_code == 403

    res_put = client.put("/admin/pricing/walker", json={"price": 300, "subscription_price": 250}, headers=user_headers)
    assert res_put.status_code == 403
