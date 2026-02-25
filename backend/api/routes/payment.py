from flask import Blueprint, request, jsonify, abort
from ..routes.auth import require_auth, get_current_user
from ..db.mongodb import get_database
from bson import ObjectId
from ..services.payment import OasyfyService
from ..models.payment import Transaction
from ..db.transactions import (
    create_transaction,
    get_transaction,
    update_transaction_status,
    get_transaction_by_charge_id
)
import os

bp = Blueprint('payment', __name__)
oasyfy_service = OasyfyService(os.getenv("OASYF_API_KEY"))
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


@bp.route("/create-pix", methods=["POST"])
@require_auth
def create_pix(current_user: dict):
    """Cria cobrança Pix via Oasyfy"""
    data = request.get_json()
    if not data or "amount" not in data:
        abort(400, description="Dados inválidos: 'amount' é obrigatório")

    try:
        amount = float(data["amount"])
        if amount < 2.0:
            abort(400, description="Valor mínimo é R$ 2,00")
    except (ValueError, TypeError):
        abort(400, description="'amount' deve ser um número válido")

    # Criar cobrança no Oasyfy
    try:
        charge = oasyfy_service.create_pix_charge(
            amount=amount,
            description=f"Créditos QuickTarot - {current_user['email']}"
        )

        # Salvar transação no banco
        transaction_data = {
            "user_id": str(current_user["user_id"]),
            "amount": amount,
            "charge_id": charge["id"],
            "status": "pending",
            "pix_code": charge["pix_code"],
            "qr_code_payload": charge["qr_code_payload"]
        }
        transaction_id = create_transaction(transaction_data)

        # Gerar QR Code
        qr_code = oasyfy_service.generate_qr_code(charge["qr_code_payload"])

        return jsonify({
            "success": True,
            "transaction_id": str(transaction_id),
            "amount": amount,
            "pix_code": charge["pix_code"],
            "qr_code": qr_code,
            "status": "pending"
        })

    except Exception as e:
        abort(500, description=f"Erro ao criar cobrança: {str(e)}")


@bp.route("/check-status/<transaction_id>", methods=["GET"])
@require_auth
def check_status(current_user: dict, transaction_id: str):
    """Verifica status da transação"""
    transaction = get_transaction(transaction_id)
    if not transaction:
        abort(404, description="Transação não encontrada")

    if transaction["user_id"] != str(current_user["user_id"]):
        abort(403, description="Acesso não autorizado")

    if transaction["status"] != "pending":
        return jsonify({
            "status": transaction["status"],
            "amount": transaction["amount"]
        })

    # Verificar status com Oasyfy
    try:
        charge_status = oasyfy_service.get_charge_status(transaction["charge_id"])

        if charge_status["status"] == "paid":
            # Atualizar saldo do usuário
            db = get_database()
            users_collection = db.users
            users_collection.update_one(
                {"_id": ObjectId(current_user["user_id"])},
                {"$inc": {"balance": transaction["amount"]}}
            )
            # Atualizar status da transação
            update_transaction_status(transaction_id, "paid")
            return jsonify({
                "status": "paid",
                "amount": transaction["amount"]
            })
        elif charge_status["status"] == "expired":
            update_transaction_status(transaction_id, "expired")
            return jsonify({
                "status": "expired",
                "amount": transaction["amount"]
            })

        return jsonify({
            "status": "pending",
            "amount": transaction["amount"]
        })

    except Exception as e:
        abort(500, description=f"Erro ao verificar status: {str(e)}")


@bp.route("/webhook", methods=["POST"])
def webhook():
    """Recebe notificações do Oasyfy"""
    data = request.get_json()

    if not data or "event" not in data:
        return jsonify({"error": "Dados inválidos"}), 400

    if data["event"] == "charge.paid":
        charge_id = data["data"]["id"]
        amount = float(data["data"]["amount"])

        # Atualizar transação e saldo
        transaction = get_transaction_by_charge_id(charge_id)
        if transaction and transaction["status"] == "pending":
            db = get_database()
            users_collection = db.users
            users_collection.update_one(
                {"_id": ObjectId(transaction["user_id"])},
                {"$inc": {"balance": amount}}
            )
            update_transaction_status(str(transaction["_id"]), "paid")

    return jsonify({"status": "ok"}), 200


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
