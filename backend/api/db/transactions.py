from pymongo import MongoClient
from bson.objectid import ObjectId
from .mongodb import get_database
from datetime import datetime

def get_transactions_collection():
    db = get_database()
    return db.transactions

def create_transaction_index():
    collection = get_transactions_collection()
    collection.create_index("user_id")
    collection.create_index("charge_id")
    collection.create_index("identifier")
    collection.create_index("status")
    collection.create_index("created_at")

def create_transaction(transaction_data: dict):
    collection = get_transactions_collection()
    result = collection.insert_one(transaction_data)
    return result.inserted_id

def get_transaction(transaction_id: str):
    collection = get_transactions_collection()
    return collection.find_one({"_id": ObjectId(transaction_id)})

def get_transaction_by_charge_id(charge_id: str):
    collection = get_transactions_collection()
    return collection.find_one({"charge_id": charge_id})

def get_transaction_by_identifier(identifier: str):
    collection = get_transactions_collection()
    return collection.find_one({"identifier": identifier})

def update_transaction(transaction_id: str, update_data: dict):
    collection = get_transactions_collection()
    result = collection.update_one(
        {"_id": ObjectId(transaction_id)},
        {"$set": update_data}
    )
    return result.modified_count

def update_transaction_status(transaction_id: str, status: str):
    return update_transaction(transaction_id, {"status": status, "updated_at": datetime.utcnow()})

def get_user_transactions(user_id: str):
    collection = get_transactions_collection()
    return list(collection.find({"user_id": user_id}).sort("created_at", -1))