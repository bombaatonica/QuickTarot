class TestRegister:
    def test_register_success(self, client):
        resp = client.post(
            "/api/auth/register",
            json={"email": "novo@test.com", "password": "senha12345", "name": "Novo"},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["access_token"]
        assert data["user"]["email"] == "novo@test.com"
        assert data["user"]["balance"] == 0.0

    def test_register_duplicate_email(self, client, registered_user):
        resp = client.post(
            "/api/auth/register",
            json={"email": "user@test.com", "password": "senha12345"},
        )
        assert resp.status_code == 400
        assert "detail" in resp.get_json()

    def test_register_short_password(self, client):
        resp = client.post(
            "/api/auth/register",
            json={"email": "curto@test.com", "password": "1234567"},
        )
        assert resp.status_code == 400

    def test_register_invalid_email(self, client):
        resp = client.post(
            "/api/auth/register",
            json={"email": "nao-e-email", "password": "senha12345"},
        )
        assert resp.status_code == 400

    def test_register_no_body(self, client):
        resp = client.post("/api/auth/register", json={})
        assert resp.status_code == 400

    def test_password_is_hashed_in_db(self, client, db):
        client.post(
            "/api/auth/register",
            json={"email": "hash@test.com", "password": "senha12345"},
        )
        doc = db.users.find_one({"email": "hash@test.com"})
        assert doc["password_hash"] != "senha12345"
        assert doc["password_hash"].startswith("$2")


class TestLogin:
    def test_login_success(self, client, registered_user):
        resp = client.post(
            "/api/auth/login",
            json={"email": "user@test.com", "password": "senha12345"},
        )
        assert resp.status_code == 200
        assert resp.get_json()["access_token"]

    def test_login_wrong_password(self, client, registered_user):
        resp = client.post(
            "/api/auth/login",
            json={"email": "user@test.com", "password": "senha-errada"},
        )
        assert resp.status_code == 401

    def test_login_unknown_email(self, client):
        resp = client.post(
            "/api/auth/login",
            json={"email": "fantasma@test.com", "password": "senha12345"},
        )
        assert resp.status_code == 401

    def test_error_response_is_json_detail(self, client):
        """Frontend consome {detail: ...}; erros não podem vir em HTML."""
        resp = client.post(
            "/api/auth/login",
            json={"email": "fantasma@test.com", "password": "senha12345"},
        )
        assert resp.content_type.startswith("application/json")
        assert "detail" in resp.get_json()


class TestMe:
    def test_me_success(self, client, auth_headers):
        resp = client.get("/api/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["email"] == "user@test.com"
        assert data["balance"] == 0.0

    def test_me_without_token(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_me_invalid_token(self, client):
        resp = client.get("/api/auth/me", headers={"Authorization": "Bearer token-invalido"})
        assert resp.status_code == 401

    def test_me_malformed_header(self, client):
        resp = client.get("/api/auth/me", headers={"Authorization": "SemBearer"})
        assert resp.status_code == 401
