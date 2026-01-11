from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
from bson import ObjectId
from ..models.user import UserCreate, UserLogin, UserResponse, UserInDB
from ..db.mongodb import get_database

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 dias


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return {"user_id": user_id}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")


@router.post("/register", response_model=dict)
async def register(user_data: UserCreate):
    db = get_database()
    users_collection = db.users
    
    # Verifica se o email já existe
    if users_collection.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Cria novo usuário
    password_hash = get_password_hash(user_data.password)
    user_doc = {
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": password_hash,
        "balance": 0.0,
        "created_at": datetime.utcnow()
    }
    
    result = users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Gera token
    access_token = create_access_token(data={"sub": user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "balance": 0.0
        }
    }


@router.post("/login", response_model=dict)
async def login(login_data: UserLogin):
    db = get_database()
    users_collection = db.users
    
    user_doc = users_collection.find_one({"email": login_data.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    if not verify_password(login_data.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    user_id = str(user_doc["_id"])
    access_token = create_access_token(data={"sub": user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user_doc["email"],
            "name": user_doc.get("name"),
            "balance": user_doc.get("balance", 0.0)
        }
    }


@router.get("/me", response_model=dict)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    db = get_database()
    users_collection = db.users
    
    user_obj_id = ObjectId(current_user["user_id"])
    user_doc = users_collection.find_one({"_id": user_obj_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    return {
        "id": str(user_doc["_id"]),
        "email": user_doc["email"],
        "name": user_doc.get("name"),
        "balance": user_doc.get("balance", 0.0),
        "created_at": user_doc.get("created_at")
    }
