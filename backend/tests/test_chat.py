import pytest
from bson import ObjectId

from api.routes import chat as chat_module

FAKE_INTERPRETATION = "**Visão Geral da Tiragem**\n\nInterpretação de teste."


@pytest.fixture(autouse=True)
def mock_llm(monkeypatch):
    """Nunca chamar o Groq de verdade nos testes."""
    monkeypatch.setattr(
        chat_module,
        "generate_tarot_interpretation",
        lambda question, cards: FAKE_INTERPRETATION,
    )


def _set_balance(db, user_id: str, amount: float):
    db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"balance": amount}})


class TestTarotQuestion:
    def test_requires_auth(self, client):
        resp = client.post("/api/chat/tarot-question", json={"question": "Vou ser feliz?"})
        assert resp.status_code == 401

    def test_insufficient_balance(self, client, auth_headers):
        resp = client.post(
            "/api/chat/tarot-question",
            json={"question": "Vou ser feliz?"},
            headers=auth_headers,
        )
        assert resp.status_code == 402

    def test_empty_question(self, client, auth_headers):
        resp = client.post(
            "/api/chat/tarot-question",
            json={"question": "   "},
            headers=auth_headers,
        )
        assert resp.status_code == 400

    def test_missing_question(self, client, auth_headers):
        resp = client.post("/api/chat/tarot-question", json={}, headers=auth_headers)
        assert resp.status_code == 400

    def test_successful_reading(self, client, registered_user, db):
        headers, user = registered_user
        _set_balance(db, user["id"], 5.0)

        resp = client.post(
            "/api/chat/tarot-question",
            json={"question": "Vou ser feliz?"},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["cards"]) == 9
        assert data["interpretation"] == FAKE_INTERPRETATION
        assert data["balance"] == 4.0  # deduziu R$ 1,00

        for card in data["cards"]:
            assert card["name"]
            assert "meaning" in card
            assert "is_major" in card

    def test_reading_saved_to_history(self, client, registered_user, db):
        headers, user = registered_user
        _set_balance(db, user["id"], 2.0)
        client.post(
            "/api/chat/tarot-question",
            json={"question": "Pergunta histórica?"},
            headers=headers,
        )
        doc = db.readings.find_one({"question": "Pergunta histórica?"})
        assert doc is not None
        assert len(doc["cards"]) == 9

    def test_cards_are_unique_in_reading(self, client, registered_user, db):
        headers, user = registered_user
        _set_balance(db, user["id"], 2.0)
        resp = client.post(
            "/api/chat/tarot-question",
            json={"question": "Cartas repetidas?"},
            headers=headers,
        )
        names = [c["name"] for c in resp.get_json()["cards"]]
        assert len(names) == len(set(names))
