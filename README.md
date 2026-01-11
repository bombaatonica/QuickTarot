# QuickTarot - Plataforma de Tarot com IA

Plataforma web estilo ChatGPT onde usuários podem comprar perguntas (R$ 1,00 cada) e receber tiragens de 9 cartas de tarot interpretadas por IA.

## Stack Tecnológica

- **Frontend**: Next.js 14 (App Router)
- **Backend**: FastAPI (Python)
- **Banco de Dados**: MongoDB Atlas
- **LLM**: Groq API (gratuita)
- **Hospedagem**: Vercel

## Estrutura do Projeto

```
QuickTarot/
├── frontend/          # Next.js app
├── backend/           # FastAPI
└── vercel.json        # Config Vercel
```

## Setup Local

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn api.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Variáveis de Ambiente

Crie um arquivo `.env.local` no frontend e `.env` no backend:

```
MONGODB_URI=mongodb://...
GROQ_API_KEY=gsk_...
JWT_SECRET=...
```

## Deploy

O projeto está configurado para deploy na Vercel. As funções Python do FastAPI serão executadas como serverless functions.
