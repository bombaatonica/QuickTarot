from pydantic import BaseModel
from datetime import datetime

class Transaction(BaseModel):
    user_id: str
    amount: float
    charge_id: str
    status: str  # pending, paid, expired
    pix_code: str
    qr_code_payload: str
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()