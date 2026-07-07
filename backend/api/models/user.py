from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId


class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: str
    balance: float
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserInDB:
    def __init__(self, data: dict):
        self.id = str(data.get("_id", ObjectId()))
        self.email = data.get("email")
        self.name = data.get("name")
        self.password_hash = data.get("password_hash")
        self.balance = data.get("balance", 0.0)
        self.created_at = data.get("created_at", datetime.utcnow())
    
    def to_dict(self) -> dict:
        return {
            "_id": ObjectId(self.id) if ObjectId.is_valid(self.id) else ObjectId(),
            "email": self.email,
            "name": self.name,
            "password_hash": self.password_hash,
            "balance": self.balance,
            "created_at": self.created_at
        }
