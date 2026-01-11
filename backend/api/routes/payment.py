from flask import Blueprint, request, jsonify, abort
from ..routes.auth import require_auth, get_current_user
from ..db.mongodb import get_database
from bson import ObjectId

bp = Blueprint('payment', __name__)


@bp.route("/balance", methods=["GET"])
@require_auth
def get_balance(current_user: dict):
    db = get_database()
    users_collection = db.users
    
    user_doc = users_collection.find_one({"_id": ObjectId(current_user["user_id"])})
    if not user_doc:
        abort(404, description="Usuário não encontrado")
    
    return jsonify({"balance": user_doc.get("balance", 0.0)})


@bp.route("/add-credit", methods=["POST"])
@require_auth
def add_credit(current_user: dict):
    """Adiciona crédito ao saldo do usuário (simulado para MVP)"""
    data = request.get_json()
    if not data or "amount" not in data:
        abort(400, description="Dados inválidos: 'amount' é obrigatório")
    
    try:
        amount = float(data["amount"])
        if amount <= 0:
            abort(400, description="O valor deve ser maior que zero")
    except (ValueError, TypeError):
        abort(400, description="'amount' deve ser um número válido")
    
    db = get_database()
    users_collection = db.users
    
    user_id = ObjectId(current_user["user_id"])
    user_doc = users_collection.find_one({"_id": user_id})
    
    if not user_doc:
        abort(404, description="Usuário não encontrado")
    
    current_balance = user_doc.get("balance", 0.0)
    new_balance = current_balance + amount
    
    users_collection.update_one(
        {"_id": user_id},
        {"$set": {"balance": new_balance}}
    )
    
    return jsonify({"balance": new_balance, "added": amount})


def deduct_balance(user_id: str, amount: float) -> bool:
    """Deduz saldo do usuário. Retorna True se teve saldo suficiente, False caso contrário"""
    db = get_database()
    users_collection = db.users
    
    user_obj_id = ObjectId(user_id)
    user_doc = users_collection.find_one({"_id": user_obj_id})
    
    if not user_doc:
        return False
    
    current_balance = user_doc.get("balance", 0.0)
    
    if current_balance < amount:
        return False
    
    new_balance = current_balance - amount
    users_collection.update_one(
        {"_id": user_obj_id},
        {"$set": {"balance": new_balance}}
    )
    
    return True
