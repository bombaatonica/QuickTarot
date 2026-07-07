# External Integrations

**Analysis Date:** 2026-07-07

## APIs & External Services

**LLM (Language Model):**
- Groq - AI-powered tarot interpretation generation
  - SDK/Client: `groq >= 0.4.0`
  - Auth: `GROQ_API_KEY` environment variable
  - Implementation: `backend/api/services/llm.py`
  - Models tried (fallback chain): llama-3.3-70b-versatile, llama-3.1-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768
  - Use case: Generates detailed tarot card interpretations based on drawn cards and user questions (`backend/api/routes/chat.py`)

**Payment Gateway:**
- OasisPay - Brazilian Pix payment processing
  - SDK/Client: Custom service class `OasisPayService` in `backend/api/services/payment.py`
  - Base URL: `https://app.oasyfy.com/api/v1`
  - Auth: `OASIS_PUBLIC_KEY` and `OASIS_SECRET_KEY` environment variables
  - Methods implemented:
    - `receive_pix()` - Creates Pix charge for receiving payments
    - `generate_qr_code()` - Generates QR code in base64 for payment display
  - Webhook support: Receives `TRANSACTION_PAID` events at `POST /api/payment/webhook`
  - Use case: Enables users to purchase tarot readings via Pix payment method (`backend/api/routes/payment.py`)

## Data Storage

**Databases:**
- MongoDB
  - Connection: `MONGODB_URI` environment variable
  - Client: PyMongo 4.6.0
  - Implementation: `backend/api/db/mongodb.py`
  - Database name: Extracted from URI or defaults to `quicktarot`
  - Collections:
    - `users` - User accounts with email, password hash, balance, creation timestamp
    - `readings` - Tarot reading history (user_id, question, cards, interpretation, timestamp)
    - `transactions` - Payment transactions (user_id, amount, status, charge_id, identifier, pix_code)

**File Storage:**
- Local filesystem only - No cloud storage integration detected
- QR codes generated in-memory and returned as base64 strings

**Caching:**
- In-memory only - No dedicated caching service (Redis, etc.)

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication
  - Token creation: `backend/api/routes/auth.py` - `create_access_token()`
  - Secret: `JWT_SECRET` environment variable (default: "your-secret-key-change-in-production")
  - Algorithm: HS256
  - Token expiry: 7 days
  - Password hashing: bcrypt (salt generation in `get_password_hash()`)

**Endpoints:**
- `POST /api/auth/register` - User registration with email validation
- `POST /api/auth/login` - User login returning JWT access token
- `GET /api/auth/me` - Get current authenticated user

**Frontend Implementation:**
- Token stored in `localStorage` as `token` key (`frontend/lib/api.ts`)
- User data stored in `localStorage` as `user` key (JSON stringified)
- Axios interceptor automatically adds `Authorization: Bearer <token>` header to all requests

## Monitoring & Observability

**Error Tracking:**
- Not detected - No error tracking service integrated

**Logs:**
- Console output only via Flask default logging
- Structured logging: Not implemented

## CI/CD & Deployment

**Hosting:**
- Vercel - Indicated by `backend/api/index.py` comments: "Flask funciona nativamente na Vercel"
- Deployment model: Serverless (backend as Vercel Function, frontend as Next.js app)

**CI Pipeline:**
- Not detected - No CI/CD workflow files found

## Environment Configuration

**Required env vars:**

Backend:
- `MONGODB_URI` - MongoDB connection string (required for database operations)
- `GROQ_API_KEY` - Groq LLM API key (required for tarot interpretations)
- `OASIS_PUBLIC_KEY` - OasisPay public key (required for Pix payments)
- `OASIS_SECRET_KEY` - OasisPay secret key (required for Pix payments)
- `JWT_SECRET` - JWT signing secret (defaults provided but should be changed in production)
- `ALLOWED_ORIGINS` - CORS allowed origins (default: "http://localhost:3000")
- `OASIS_WEBHOOK_TOKEN` - Token for validating OasisPay webhook calls

Frontend:
- `NEXT_PUBLIC_API_URL` - Backend API base URL (default: "http://localhost:8000")

**Secrets location:**
- `.env` files in project root, `backend/`, and `frontend/` directories
- **NOTE:** .env files contain secrets and are not committed to git (in .gitignore)

## Webhooks & Callbacks

**Incoming:**
- `POST /api/payment/webhook` - OasisPay payment notification webhook
  - Event: `TRANSACTION_PAID`
  - Payload validation: Token check via `OASIS_WEBHOOK_TOKEN`
  - Actions on payment: Credits balance to user account, updates transaction status to "paid"

**Outgoing:**
- None detected

## API Contract Patterns

**Frontend to Backend Communication:**

**Authentication Flow:**
```
POST /api/auth/register | login → JWT access_token in response
Store token in localStorage
Attach to all subsequent requests: Authorization: Bearer <token>
```

**Tarot Reading Flow:**
```
POST /api/chat/tarot-question
  Request: { question: string }
  Response: { cards, interpretation, question, balance }
  - Deducts R$ 1.00 from user balance
  - Calls Groq LLM for interpretation
  - Saves reading to MongoDB
  - Returns 9 drawn cards with interpretations
```

**Payment Flow:**
```
POST /api/payment/create-pix
  Request: { amount: number }
  Response: { success, transaction_id, pix_code, qr_code, status }
  - Creates OasisPay transaction
  - Stores transaction record in MongoDB
  - Returns Pix code and QR code for payment
  
OasisPay Webhook → POST /api/payment/webhook
  - OasisPay notifies of payment completion
  - Confirms transaction and credits user balance
```

---

*Integration audit: 2026-07-07*
