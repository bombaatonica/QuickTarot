

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
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


@app.route("/")
def root():
    return jsonify({"message": "QuickTarot API", "status": "running"})


@app.route("/health")
def health():
    return jsonify({"status": "healthy"})
