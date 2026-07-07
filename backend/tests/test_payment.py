from bson import ObjectId

from api.routes import payment as payment_module
from api.routes.payment import deduct_balance


def _set_balance(db, user_id: str, amount: float):
    db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"balance": amount}})


class TestBalance:
    def test_get_balance(self, client, registered_user, db):
        headers, user = registered_user
        _set_balance(db, user["id"], 7.5)
        resp = client.get("/api/payment/balance", headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()["balance"] == 7.5

    def test_balance_requires_auth(self, client):
        assert client.get("/api/payment/balance").status_code == 401


class TestAddCredit:
    def test_blocked_without_flag(self, client, auth_headers, monkeypatch):
        monkeypatch.delenv("ALLOW_TEST_CREDIT", raising=False)
        resp = client.post("/api/payment/add-credit", json={"amount": 100}, headers=auth_headers)
        assert resp.status_code == 403

    def test_allowed_with_flag(self, client, auth_headers, monkeypatch):
        monkeypatch.setenv("ALLOW_TEST_CREDIT", "true")
        resp = client.post("/api/payment/add-credit", json={"amount": 10}, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.get_json()["balance"] == 10.0

    def test_rejects_negative_amount_with_flag(self, client, auth_headers, monkeypatch):
        monkeypatch.setenv("ALLOW_TEST_CREDIT", "true")
        resp = client.post("/api/payment/add-credit", json={"amount": -5}, headers=auth_headers)
        assert resp.status_code == 400


class TestDeductBalance:
    def test_deducts_when_sufficient(self, registered_user, db):
        _, user = registered_user
        _set_balance(db, user["id"], 5.0)
        assert deduct_balance(user["id"], 1.0) is True
        doc = db.users.find_one({"_id": ObjectId(user["id"])})
        assert doc["balance"] == 4.0

    def test_refuses_when_insufficient(self, registered_user, db):
        _, user = registered_user
        _set_balance(db, user["id"], 0.5)
        assert deduct_balance(user["id"], 1.0) is False
        doc = db.users.find_one({"_id": ObjectId(user["id"])})
        assert doc["balance"] == 0.5

    def test_refuses_unknown_user(self, db):
        assert deduct_balance(str(ObjectId()), 1.0) is False


class TestWebhook:
    def _create_pending_transaction(self, db, user_id: str, amount: float, identifier: str = "abc123"):
        result = db.transactions.insert_one({
            "user_id": user_id,
            "amount": amount,
            "charge_id": "gw-1",
            "identifier": identifier,
            "status": "pending",
            "pix_code": "pix",
            "qr_code_payload": "pix",
        })
        return result.inserted_id

    def test_credits_stored_amount_not_payload_amount(self, client, registered_user, db):
        """Valor creditado DEVE vir do banco; payload do webhook é input não confiável."""
        _, user = registered_user
        self._create_pending_transaction(db, user["id"], 10.0)

        resp = client.post("/api/payment/webhook", json={
            "event": "TRANSACTION_PAID",
            "transaction": {"identifier": "abc123", "amount": 99999.0},
        })
        assert resp.status_code == 200
        doc = db.users.find_one({"_id": ObjectId(user["id"])})
        assert doc["balance"] == 10.0

    def test_duplicate_webhook_credits_once(self, client, registered_user, db):
        _, user = registered_user
        self._create_pending_transaction(db, user["id"], 10.0)

        payload = {"event": "TRANSACTION_PAID", "transaction": {"identifier": "abc123"}}
        client.post("/api/payment/webhook", json=payload)
        client.post("/api/payment/webhook", json=payload)

        doc = db.users.find_one({"_id": ObjectId(user["id"])})
        assert doc["balance"] == 10.0

    def test_marks_transaction_paid(self, client, registered_user, db):
        _, user = registered_user
        tx_id = self._create_pending_transaction(db, user["id"], 5.0)
        client.post("/api/payment/webhook", json={
            "event": "TRANSACTION_PAID",
            "transaction": {"identifier": "abc123"},
        })
        assert db.transactions.find_one({"_id": tx_id})["status"] == "paid"

    def test_rejects_invalid_token(self, client, monkeypatch):
        monkeypatch.setattr(payment_module, "webhook_validation_token", "segredo")
        resp = client.post("/api/payment/webhook", json={
            "event": "TRANSACTION_PAID",
            "token": "errado",
            "transaction": {"identifier": "abc123"},
        })
        assert resp.status_code == 401

    def test_accepts_valid_token(self, client, registered_user, db, monkeypatch):
        _, user = registered_user
        self._create_pending_transaction(db, user["id"], 3.0)
        monkeypatch.setattr(payment_module, "webhook_validation_token", "segredo")
        resp = client.post("/api/payment/webhook", json={
            "event": "TRANSACTION_PAID",
            "token": "segredo",
            "transaction": {"identifier": "abc123"},
        })
        assert resp.status_code == 200
        assert db.users.find_one({"_id": ObjectId(user["id"])})["balance"] == 3.0

    def test_missing_identifier(self, client):
        resp = client.post("/api/payment/webhook", json={
            "event": "TRANSACTION_PAID",
            "transaction": {},
        })
        assert resp.status_code == 400


class TestCheckStatus:
    def test_owner_can_check(self, client, registered_user, db):
        headers, user = registered_user
        tx_id = db.transactions.insert_one({
            "user_id": user["id"],
            "amount": 10.0,
            "status": "pending",
        }).inserted_id
        resp = client.get(f"/api/payment/check-status/{tx_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "pending"

    def test_other_user_forbidden(self, client, registered_user, db):
        headers, _ = registered_user
        tx_id = db.transactions.insert_one({
            "user_id": str(ObjectId()),  # transação de outro usuário
            "amount": 10.0,
            "status": "pending",
        }).inserted_id
        resp = client.get(f"/api/payment/check-status/{tx_id}", headers=headers)
        assert resp.status_code == 403
