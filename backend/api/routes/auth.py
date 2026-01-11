from flask import Blueprint, request, jsonify, abort
from functools import wraps
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
from bson import ObjectId
from ..models.user import UserCreate, UserLogin
from ..db.mongodb import get_database

bp = Blueprint('auth', __name__)

SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 dias


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha corresponde ao hash usando bcrypt"""
    try:
        # Se o hash é string, precisa converter para bytes
        if isinstance(hashed_password, str):
            hashed_password = hashed_password.encode('utf-8')
        if isinstance(plain_password, str):
            plain_password = plain_password.encode('utf-8')
        return bcrypt.checkpw(plain_password, hashed_password)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Gera hash da senha usando bcrypt"""
    if isinstance(password, str):
        password = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password, salt)
    return hashed.decode('utf-8')


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user():
    """Extrai o usuário atual do token JWT no header Authorization"""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        abort(401, description="Token não fornecido")
    
    try:
        # Formato: "Bearer <token>"
        scheme, token = auth_header.split(" ", 1)
        if scheme.lower() != "bearer":
            abort(401, description="Formato de autenticação inválido")
    except ValueError:
        abort(401, description="Formato de autenticação inválido")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            abort(401, description="Token inválido")
        return {"user_id": user_id}
    except JWTError:
        abort(401, description="Token inválido")


def require_auth(f):
    """Decorator para rotas que requerem autenticação"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user = get_current_user()
        return f(current_user=current_user, *args, **kwargs)
    return decorated_function


@bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        abort(400, description="Dados não fornecidos")
    
    try:
        user_data = UserCreate(**data)
    except Exception as e:
        abort(400, description=f"Dados inválidos: {str(e)}")
    
    db = get_database()
    users_collection = db.users
    
    # Verifica se o email já existe
    if users_collection.find_one({"email": user_data.email}):
        abort(400, description="Email já cadastrado")
    
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
    
    return jsonify({
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "balance": 0.0
        }
    })


@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        abort(400, description="Dados não fornecidos")
    
    try:
        login_data = UserLogin(**data)
    except Exception as e:
        abort(400, description=f"Dados inválidos: {str(e)}")
    
    db = get_database()
    users_collection = db.users
    
    user_doc = users_collection.find_one({"email": login_data.email})
    if not user_doc:
        abort(401, description="Email ou senha incorretos")
    
    if not verify_password(login_data.password, user_doc["password_hash"]):
        abort(401, description="Email ou senha incorretos")
    
    user_id = str(user_doc["_id"])
    access_token = create_access_token(data={"sub": user_id})
    
    return jsonify({
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user_doc["email"],
            "name": user_doc.get("name"),
            "balance": user_doc.get("balance", 0.0)
        }
    })


@bp.route("/me", methods=["GET"])
@require_auth
def get_current_user_info(current_user: dict):
    db = get_database()
    users_collection = db.users
    
    user_obj_id = ObjectId(current_user["user_id"])
    user_doc = users_collection.find_one({"_id": user_obj_id})
    if not user_doc:
        abort(404, description="Usuário não encontrado")
    
    return jsonify({
        "id": str(user_doc["_id"]),
        "email": user_doc["email"],
        "name": user_doc.get("name"),
        "balance": user_doc.get("balance", 0.0),
        "created_at": user_doc.get("created_at").isoformat() if user_doc.get("created_at") else None
    })
