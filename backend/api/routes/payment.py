from flask import Blueprint, request, jsonify, abort
from ..routes.auth import require_auth, get_current_user
from ..db.mongodb import get_database
from bson import ObjectId
from ..services.payment import OasisPayService
from ..models.payment import Transaction
from ..db.transactions import (
    create_transaction,
    get_transaction,
    update_transaction_status,
    get_transaction_by_charge_id,
    get_transaction_by_identifier
)
import os
import uuid

bp = Blueprint('payment', __name__)

oasis_service = OasisPayService(
    public_key=os.getenv("OASIS_PUBLIC_KEY"),
    secret_key=os.getenv("OASIS_SECRET_KEY"),
)

webhook_validation_token = os.getenv("OASIS_WEBHOOK_TOKEN")


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
    """Cria cobrança Pix via OasisPay"""
    data = request.get_json()
    if not data or "amount" not in data:
        abort(400, description="Dados inválidos: 'amount' é obrigatório")

    try:
        amount = float(data["amount"])
        if amount < 2.0:
            abort(400, description="Valor mínimo é R$ 2,00")
    except (ValueError, TypeError):
        abort(400, description="'amount' deve ser um número válido")

    # Criar cobrança no OasisPay
    try:
        identifier = uuid.uuid4().hex

        client = {
            "name": current_user.get("email", "Cliente"),
            "email": current_user.get("email"),
        }

        pix_response = oasis_service.receive_pix(
            identifier=identifier,
            amount=amount,
            client=client,
            metadata={"provider": "QuickTarot"},
        )

        gateway_transaction_id = pix_response.get("transactionId")
        pix_obj = pix_response.get("pix") or {}
        pix_code = pix_obj.get("code")
        qr_code = pix_obj.get("base64")

        if not gateway_transaction_id or not pix_code or not qr_code:
            abort(500, description="Resposta inválida do provedor de pagamento")

        # Salvar transação no banco
        transaction_data = {
            "user_id": str(current_user["user_id"]),
            "amount": amount,
            "charge_id": gateway_transaction_id,
            "identifier": identifier,
            "status": "pending",
            "pix_code": pix_code,
            "qr_code_payload": pix_code
        }
        transaction_id = create_transaction(transaction_data)

        return jsonify({
            "success": True,
            "transaction_id": str(transaction_id),
            "amount": amount,
            "pix_code": pix_code,
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

    return jsonify({
        "status": "pending",
        "amount": transaction["amount"]
    })


@bp.route("/webhook", methods=["POST"])
def webhook():
    """Recebe notificações do OasisPay"""
    data = request.get_json()

    if not data or "event" not in data:
        return jsonify({"error": "Dados inválidos"}), 400

    if webhook_validation_token:
        if data.get("token") != webhook_validation_token:
            return jsonify({"error": "Token inválido"}), 401

    if data["event"] == "TRANSACTION_PAID":
        transaction_obj = data.get("transaction") or {}
        identifier = transaction_obj.get("identifier")
        amount = transaction_obj.get("amount")

        if not identifier:
            return jsonify({"error": "Identifier ausente"}), 400

        try:
            amount_value = float(amount)
        except (TypeError, ValueError):
            return jsonify({"error": "Valor inválido"}), 400

        transaction = get_transaction_by_identifier(identifier)
        if transaction and transaction.get("status") == "pending":
            db = get_database()
            users_collection = db.users
            users_collection.update_one(
                {"_id": ObjectId(transaction["user_id"])},
                {"$inc": {"balance": amount_value}}
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
