import os

import mongomock
import pytest

# Configura ambiente ANTES de importar o app (JWT_SECRET é lido no import)
os.environ.setdefault("JWT_SECRET", "test-secret-key-for-tests")
os.environ.pop("ALLOW_TEST_CREDIT", None)

from api.db import mongodb  # noqa: E402

# Injeta mongomock no lugar da conexão real antes do app inicializar índices
_mock_client = mongomock.MongoClient()
mongodb.client = _mock_client
mongodb.db = _mock_client["quicktarot_test"]

from api.main import app as flask_app  # noqa: E402

flask_app.config.update(TESTING=True)


@pytest.fixture()
def db():
    return mongodb.db


@pytest.fixture(autouse=True)
def clean_db():
    for name in mongodb.db.list_collection_names():
        mongodb.db[name].delete_many({})
    yield


@pytest.fixture()
def client():
    return flask_app.test_client()


@pytest.fixture()
def registered_user(client):
    """Registra um usuário e retorna (headers de auth, user dict)."""
    resp = client.post(
        "/api/auth/register",
        json={"email": "user@test.com", "password": "senha12345", "name": "Testador"},
    )
    assert resp.status_code == 200, resp.get_json()
    data = resp.get_json()
    headers = {"Authorization": f"Bearer {data['access_token']}"}
    return headers, data["user"]


@pytest.fixture()
def auth_headers(registered_user):
    return registered_user[0]
