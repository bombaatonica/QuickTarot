from flask import Blueprint, request, jsonify
from ..db.transactions import get_transaction_by_charge_id, update_transaction_status
from ..db.mongodb import get_database
from ..services.payment import OasyfyService
import os

bp = Blueprint('webhook', __name__)
oasyfy_service = OasyfyService(os.getenv("OASYF_API_KEY"))

@bp.route("/payment", methods=["POST"])
def payment_webhook():
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