

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.exceptions import HTTPException
import logging
import os

_dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path=_dotenv_path)
load_dotenv()

from .routes import auth, payment, chat

app = Flask(__name__)

# CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
CORS(app,
     origins=allowed_origins,
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Routes
app.register_blueprint(auth.bp, url_prefix="/api/auth")
app.register_blueprint(payment.bp, url_prefix="/api/payment")
app.register_blueprint(chat.bp, url_prefix="/api/chat")


# Erros sempre em JSON no formato {"detail": ...} que o frontend consome
@app.errorhandler(HTTPException)
def handle_http_exception(e: HTTPException):
    return jsonify({"detail": e.description}), e.code


@app.errorhandler(Exception)
def handle_unexpected_exception(e: Exception):
    logging.getLogger(__name__).exception("Erro não tratado")
    return jsonify({"detail": "Erro interno do servidor"}), 500


@app.route("/")
def root():
    return jsonify({"message": "QuickTarot API", "status": "running"})


@app.route("/health")
def health():
    return jsonify({"status": "healthy"})
