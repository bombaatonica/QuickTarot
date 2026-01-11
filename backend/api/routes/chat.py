from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from ..routes.auth import get_current_user
from ..routes.payment import deduct_balance
from ..services.tarot import draw_cards
from ..services.llm import generate_tarot_interpretation
from ..models.tarot import Card, TarotReading
from ..db.mongodb import get_database
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/api/chat", tags=["chat"])

QUESTION_PRICE = 1.0


class TarotQuestionRequest(BaseModel):
    question: str


class TarotQuestionResponse(BaseModel):
    cards: List[dict]
    interpretation: str
    question: str
    balance: float


@router.post("/tarot-question", response_model=TarotQuestionResponse)
async def ask_tarot_question(
    request: TarotQuestionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Processa uma pergunta de tarot: verifica saldo, deduz valor, sorteia cartas e gera interpretação"""
    user_id = current_user["user_id"]
    
    # Verifica e deduz saldo
    if not deduct_balance(user_id, QUESTION_PRICE):
        raise HTTPException(
            status_code=402,
            detail=f"Saldo insuficiente. Cada pergunta custa R$ {QUESTION_PRICE:.2f}"
        )
    
    # Sorteia 9 cartas
    cards = draw_cards(count=9)
    
    # Gera interpretação com LLM
    interpretation = generate_tarot_interpretation(request.question, cards)
    
    # Salva no histórico
    db = get_database()
    readings_collection = db.readings
    reading_doc = {
        "user_id": ObjectId(user_id),
        "question": request.question,
        "cards": [{"name": c.name, "suit": c.suit.value if c.suit else None, "meaning": c.meaning} for c in cards],
        "interpretation": interpretation,
        "created_at": datetime.utcnow()
    }
    readings_collection.insert_one(reading_doc)
    
    # Retorna o novo saldo
    users_collection = db.users
    user_doc = users_collection.find_one({"_id": ObjectId(user_id)})
    new_balance = user_doc.get("balance", 0.0) if user_doc else 0.0
    
    return TarotQuestionResponse(
        cards=[{"name": c.name, "suit": c.suit.value if c.suit else None, "meaning": c.meaning, "is_major": c.is_major} for c in cards],
        interpretation=interpretation,
        question=request.question,
        balance=new_balance
    )
