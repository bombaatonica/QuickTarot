# Guia de Setup - QuickTarot

## Pré-requisitos

- Python 3.9+
- Node.js 18+
- MongoDB (local ou MongoDB Atlas)
- Conta Groq (para API key gratuita)

## Setup Backend

1. Entre no diretório backend:
```bash
cd backend
```

2. Crie um ambiente virtual (opcional mas recomendado):
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
```

4. Crie um arquivo `.env` no diretório `backend`:
```
MONGODB_URI=mongodb://localhost:27017/quicktarot
GROQ_API_KEY=gsk_sua-chave-groq-aqui
JWT_SECRET=seu-secret-key-aleatorio
ALLOWED_ORIGINS=http://localhost:3000
```

**Para obter a chave Groq:**
1. Acesse https://console.groq.com/
2. Crie uma conta (gratuita)
3. Gere uma API key no dashboard
4. Copie a chave (começa com `gsk_`)

5. Execute o servidor:
```bash
python -m flask --app api.main:app run --port 8000 --debug
```

## Setup Frontend

1. Entre no diretório frontend:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Crie um arquivo `.env.local` no diretório `frontend`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

5. Acesse `http://localhost:3000`

## Deploy na Vercel

### Backend (FastAPI)

1. Certifique-se de que o `vercel.json` está configurado corretamente
2. Instale a CLI da Vercel: `npm i -g vercel`
3. Execute `vercel` no diretório raiz do projeto
4. Configure as variáveis de ambiente na Vercel:
   - MONGODB_URI
   - GROQ_API_KEY
   - JWT_SECRET
   - ALLOWED_ORIGINS

### Frontend (Next.js)

1. Conecte o repositório na Vercel
2. Configure as variáveis de ambiente:
   - NEXT_PUBLIC_API_URL (URL da API backend)
3. Deploy automático será feito a cada push

## Uso

1. Crie uma conta no sistema
2. Adicione crédito (R$ 1,00 por pergunta)
3. Faça uma pergunta no chat
4. Receba uma tiragem de 9 cartas interpretadas por IA

## Notas

- Para produção, use um JWT_SECRET forte e aleatório
- Configure CORS adequadamente para seu domínio
- Use MongoDB Atlas para produção (gratuito até 512MB)
- Cada pergunta custa R$ 1,00 e consome crédito do saldo do usuário
