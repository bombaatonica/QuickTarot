from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from .routes import auth, payment, chat

load_dotenv()

app = FastAPI(title="QuickTarot API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router)
app.include_router(payment.router)
app.include_router(chat.router)


@app.get("/")
async def root():
    return {"message": "QuickTarot API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
