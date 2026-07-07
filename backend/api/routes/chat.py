from flask import Blueprint, request, jsonify, abort
from ..routes.auth import require_auth
from ..routes.payment import deduct_balance
from ..services.tarot import draw_cards
from ..services.llm import generate_tarot_interpretation
from ..db.mongodb import get_database
from datetime import datetime
from bson import ObjectId

bp = Blueprint('chat', __name__)

QUESTION_PRICE = 1.0


@bp.route("/tarot-question", methods=["POST"])
@require_auth
def ask_tarot_question(current_user: dict):
    """Processa uma pergunta de tarot: verifica saldo, deduz valor, sorteia cartas e gera interpretação"""
    data = request.get_json()
    if not data or "question" not in data:
        abort(400, description="Dados inválidos: 'question' é obrigatório")
    
    question = data["question"]
    if not question or not question.strip():
        abort(400, description="A pergunta não pode estar vazia")
    
    user_id = current_user["user_id"]
    
    # Verifica e deduz saldo (402 não tem exception no werkzeug; retorna JSON direto)
    if not deduct_balance(user_id, QUESTION_PRICE):
        return jsonify({"detail": f"Saldo insuficiente. Cada pergunta custa R$ {QUESTION_PRICE:.2f}"}), 402
    
    # Sorteia 9 cartas
    cards = draw_cards(count=9)
    
    # Gera interpretação com LLM
    interpretation = generate_tarot_interpretation(question, cards)
    
    # Salva no histórico
    db = get_database()
    readings_collection = db.readings
    reading_doc = {
        "user_id": ObjectId(user_id),
        "question": question,
        "cards": [{"name": c.name, "suit": c.suit.value if c.suit else None, "meaning": c.meaning} for c in cards],
        "interpretation": interpretation,
        "created_at": datetime.utcnow()
    }
    readings_collection.insert_one(reading_doc)
    
    # Retorna o novo saldo
    users_collection = db.users
    user_doc = users_collection.find_one({"_id": ObjectId(user_id)})
    new_balance = user_doc.get("balance", 0.0) if user_doc else 0.0
    
    return jsonify({
        "cards": [{"name": c.name, "suit": c.suit.value if c.suit else None, "meaning": c.meaning, "is_major": c.is_major} for c in cards],
        "interpretation": interpretation,
        "question": question,
        "balance": new_balance
    })
