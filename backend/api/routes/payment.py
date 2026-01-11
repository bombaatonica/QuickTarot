from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from ..routes.auth import get_current_user
from ..db.mongodb import get_database
from bson import ObjectId

router = APIRouter(prefix="/api/payment", tags=["payment"])


class AddCreditRequest(BaseModel):
    amount: float


@router.get("/balance")
async def get_balance(current_user: dict = Depends(get_current_user)):
    db = get_database()
    users_collection = db.users
    
    user_doc = users_collection.find_one({"_id": ObjectId(current_user["user_id"])})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    return {"balance": user_doc.get("balance", 0.0)}


@router.post("/add-credit")
async def add_credit(request: AddCreditRequest, current_user: dict = Depends(get_current_user)):
    """Adiciona crédito ao saldo do usuário (simulado para MVP)"""
    db = get_database()
    users_collection = db.users
    
    user_id = ObjectId(current_user["user_id"])
    user_doc = users_collection.find_one({"_id": user_id})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    current_balance = user_doc.get("balance", 0.0)
    new_balance = current_balance + request.amount
    
    users_collection.update_one(
        {"_id": user_id},
        {"$set": {"balance": new_balance}}
    )
    
    return {"balance": new_balance, "added": request.amount}


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
