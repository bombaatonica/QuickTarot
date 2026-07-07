# Architecture

**Analysis Date:** 2026-07-07

## System Overview

```text
┌────────────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js 14)                          │
│  User Auth (Login/Register) → Chat Interface → Payment Flow        │
│         `frontend/app/page.tsx`    `frontend/components/`          │
└────────────────────┬─────────────────────────────────┬─────────────┘
                     │                                 │
                     ▼                                 ▼
        ┌──────────────────────────┐      ┌──────────────────────────┐
        │   API Client (Axios)     │      │   Local Storage State     │
        │   `frontend/lib/api.ts`  │      │   (User + Token)          │
        └──────────────┬───────────┘      └──────────────┬───────────┘
                       │                                 │
                       └─────────────────┬────────────────┘
                                         ▼
┌────────────────────────────────────────────────────────────────────┐
│                    Backend API (Flask)                              │
│  Routes: /api/auth, /api/payment, /api/chat                        │
│         `backend/api/routes/`                                       │
├───────────────────┬──────────────────┬──────────────────────────────┤
│  Auth Service      │  Payment Service │  Chat/Tarot Service         │
│  (JWT, bcrypt)    │  (OasisPay)      │  (Card Draw + LLM)          │
│  `routes/auth.py` │ `routes/payment` │  `routes/chat.py`           │
└───────────────────┴──────────────────┴──────────────────────────────┘
         │                    │                          │
         ▼                    ▼                          ▼
    ┌───────────────────────────────────────────────────────────────┐
    │          Service Layer (Business Logic)                        │
    │  tarot.py (draw_cards) | llm.py (Groq) | payment.py (OasisPay)│
    │         `backend/api/services/`                               │
    └───────────────────────────────────────────────────────────────┘
         │                    │                          │
         └────────────────────┼──────────────────────────┘
                              ▼
    ┌───────────────────────────────────────────────────────────────┐
    │            Data Access Layer (MongoDB)                         │
    │  `backend/api/db/mongodb.py`, `db/transactions.py`            │
    └─────────────┬──────────────────────┬─────────────────────────┘
                  ▼                      ▼
    ┌──────────────────────────┐  ┌─────────────────────────────────┐
    │   Users Collection       │  │   Readings Collection            │
    │   (auth, balance)        │  │   (questions, cards, responses)  │
    └──────────────────────────┘  └─────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **Frontend Root** | Auth check, login/register form, renders Chat on auth | `frontend/app/page.tsx` |
| **Chat Component** | Message display, tarot question input, balance updates | `frontend/components/Chat.tsx` |
| **BuyQuestionButton** | Balance display, credit purchase modal | `frontend/components/BuyQuestionButton.tsx` |
| **PixPaymentModal** | QR code display, payment confirmation | `frontend/components/PixPaymentModal.tsx` |
| **API Client** | Axios instance with JWT interceptor, all API calls | `frontend/lib/api.ts` |
| **Auth Routes** | Register, login, current user endpoint | `backend/api/routes/auth.py` |
| **Payment Routes** | Balance check, credit add, Pix creation, webhook | `backend/api/routes/payment.py` |
| **Chat Routes** | Tarot question processing | `backend/api/routes/chat.py` |
| **Tarot Service** | Card deck, random draw logic | `backend/api/services/tarot.py` |
| **LLM Service** | Groq API calls for interpretation | `backend/api/services/llm.py` |
| **Payment Service** | OasisPay API wrapper | `backend/api/services/payment.py` |
| **MongoDB Layer** | Database connection, transaction operations | `backend/api/db/mongodb.py`, `db/transactions.py` |
| **Models** | Pydantic schemas for validation | `backend/api/models/*.py` |

## Pattern Overview

**Overall:** Monolithic three-layer backend (Routes → Services → Data Access) with decoupled frontend

**Key Characteristics:**
- **Frontend-backend separation**: Next.js frontend consumes REST API
- **JWT authentication**: Stateless token-based auth (7-day expiry)
- **Service layer abstraction**: Business logic isolated in `services/`
- **Database abstraction**: `db/` layer handles all MongoDB interactions
- **Payment gateway integration**: OasisPay for Pix payments with webhook support
- **Streaming LLM**: Groq API for real-time tarot interpretation

## Layers

**Presentation Layer (Frontend):**
- Purpose: User interface for authentication, chat, payment
- Location: `frontend/app/page.tsx`, `frontend/components/`
- Contains: React components using Next.js 14 App Router
- Depends on: Axios API client (`frontend/lib/api.ts`)
- Used by: End users via browser

**API Client Layer (Frontend):**
- Purpose: Abstraction over HTTP calls, JWT token management
- Location: `frontend/lib/api.ts`
- Contains: Axios instance with interceptor that adds Bearer token
- Depends on: localStorage for token/user storage
- Used by: All frontend components via `authApi`, `paymentApi`, `chatApi`

**Routes Layer (Backend):**
- Purpose: HTTP endpoint definitions, request/response handling
- Location: `backend/api/routes/` (auth.py, payment.py, chat.py)
- Contains: Flask blueprints, JWT decorator, request validation
- Depends on: Service layer, auth helpers
- Used by: Flask app router

**Service Layer (Backend):**
- Purpose: Core business logic — card draws, LLM calls, payment processing
- Location: `backend/api/services/` (tarot.py, llm.py, payment.py)
- Contains: Pure functions and classes for business operations
- Depends on: External APIs (Groq, OasisPay), models
- Used by: Routes layer

**Data Access Layer (Backend):**
- Purpose: MongoDB connection, CRUD operations, transaction handling
- Location: `backend/api/db/` (mongodb.py, transactions.py)
- Contains: Database initialization, collection operations
- Depends on: PyMongo, environment variables
- Used by: Routes layer for user/reading persistence

**Models Layer (Backend):**
- Purpose: Data validation and schema definition
- Location: `backend/api/models/` (user.py, tarot.py, payment.py)
- Contains: Pydantic BaseModel definitions
- Depends on: Pydantic, typing
- Used by: Routes, services for request/response validation

## Data Flow

### Primary Request Path: Ask Tarot Question

1. **Frontend sends question** (`frontend/components/Chat.tsx` line 63)
   - Axios POST `/api/chat/tarot-question` with JWT token from localStorage
   
2. **Backend validates request** (`backend/api/routes/chat.py` line 15-25)
   - JWT decorator extracts user_id
   - Validates question is non-empty

3. **Check balance & deduct** (`backend/api/routes/chat.py` line 30)
   - `deduct_balance()` from `backend/api/routes/payment.py` line 231
   - Fails with 402 if insufficient balance

4. **Draw 9 tarot cards** (`backend/api/routes/chat.py` line 34)
   - `tarot.draw_cards(9)` from `backend/api/services/tarot.py` line 6
   - Random sample from TAROT_DECK

5. **Generate LLM interpretation** (`backend/api/routes/chat.py` line 37)
   - `llm.generate_tarot_interpretation()` from `backend/api/services/llm.py` line 16
   - Groq API call with formatted cards and prompt
   - Tries multiple models (llama-3.3-70b → llama-3.1-70b → fallbacks)

6. **Save reading to database** (`backend/api/routes/chat.py` line 39-49)
   - Insert reading document into `readings` collection with cards, interpretation, timestamp

7. **Return response** (`backend/api/routes/chat.py` line 56-61)
   - Send cards, interpretation, question, updated balance to frontend

8. **Frontend updates state** (`frontend/components/Chat.tsx` line 73-86)
   - Display cards via Message component
   - Update balance in localStorage and Chat state

### Secondary Flow: Payment (Pix)

1. **User clicks "Adicionar Crédito"** (`frontend/components/BuyQuestionButton.tsx` line 79)
   - Opens credit amount modal (minimum R$ 2.00)

2. **Frontend requests Pix QR code** (`frontend/components/PixPaymentModal.tsx` - not shown but called from line 125)
   - Axios POST `/api/payment/create-pix` with amount

3. **Backend creates OasisPay charge** (`backend/api/routes/payment.py` line 77-168)
   - Validates amount, calls `OasisPayService.receive_pix()`
   - Stores transaction in database with status "pending"
   - Returns QR code + transaction_id

4. **User scans QR & pays** (External: OasisPay payment gateway)

5. **OasisPay sends webhook** (`backend/api/routes/payment.py` line 193-228)
   - POST `/api/payment/webhook` with TRANSACTION_PAID event
   - Validates webhook token
   - Updates user balance (increment by amount)
   - Updates transaction status to "paid"

6. **Frontend polls or refreshes** 
   - Fetches updated balance via `authApi.getMe()`

### Auth Flow

1. **User submits login** (`frontend/app/page.tsx` line 35-44)
   - Axios POST `/api/auth/login` with email/password

2. **Backend validates credentials** (`backend/api/routes/auth.py` line 134-167)
   - Fetch user by email from `users` collection
   - Verify password hash with bcrypt
   - Generate JWT token with user_id as subject
   - Return token + user object

3. **Frontend stores token** (`frontend/lib/api.ts` line 62-65)
   - localStorage.setItem('token') + localStorage.setItem('user')

4. **API interceptor adds token** (`frontend/lib/api.ts` line 13-19)
   - All subsequent requests include `Authorization: Bearer {token}`

5. **Backend validates token** (`backend/api/routes/auth.py` line 52-73)
   - `get_current_user()` extracts Bearer token from header
   - Decodes JWT with SECRET_KEY
   - Returns user_id to route handler via `current_user` parameter

**State Management:**
- **Frontend**: React useState for messages, loading, balance; localStorage for auth token + user object
- **Backend**: Stateless; all state persisted in MongoDB (users, readings, transactions)
- **Session**: JWT token valid for 7 days (`backend/api/routes/auth.py` line 17)

## Key Abstractions

**Card Abstraction (`backend/api/models/tarot.py`):**
- Purpose: Represent a single tarot card with metadata
- Examples: `Card(name="O Louco", meaning="...", is_major=True)`
- Pattern: Pydantic BaseModel with name, suit (optional), meaning, is_major

**TAROT_DECK Constant (`backend/api/models/tarot.py` line 28+):**
- Purpose: Single source of truth for all 78 cards
- Pattern: List of Card instances (22 major arcana + 56 minor arcana)
- Used by: `tarot.draw_cards()` to sample randomly

**User Abstraction (`backend/api/models/user.py`):**
- Purpose: Represent user account with credentials and balance
- Models: UserCreate, UserLogin, UserResponse, UserInDB
- Pattern: Pydantic for request/response validation, UserInDB for MongoDB representation

**Transaction Abstraction (`backend/api/models/payment.py`):**
- Purpose: Represent a Pix payment transaction with status lifecycle
- Status flow: pending → paid or expired
- Pattern: Pydantic with timestamps for audit trail

**OasisPayService Abstraction (`backend/api/services/payment.py`):**
- Purpose: Encapsulate OasisPay API interactions
- Methods: receive_pix(), get_charge_status(), generate_qr_code()
- Pattern: Class-based service with request headers builder

## Entry Points

**Frontend Entry:**
- Location: `frontend/app/page.tsx` (Next.js App Router root)
- Triggers: Browser navigation to app URL
- Responsibilities: Auth check, conditional render (login form or Chat)

**Backend Entry:**
- Location: `backend/api/main.py` (Flask app initialization)
- Triggers: `python -m backend.api.main` or Gunicorn
- Responsibilities: Flask app setup, CORS config, blueprint registration

**API Endpoints:**
- POST `/api/auth/register` - Create account
- POST `/api/auth/login` - Get JWT token
- GET `/api/auth/me` - Current user info (requires auth)
- POST `/api/chat/tarot-question` - Ask tarot question (requires auth)
- GET `/api/payment/balance` - Get user balance (requires auth)
- POST `/api/payment/add-credit` - Add credit (requires auth)
- POST `/api/payment/create-pix` - Create Pix charge (requires auth)
- GET `/api/payment/check-status/{transaction_id}` - Check payment status (requires auth)
- POST `/api/payment/webhook` - OasisPay webhook (no auth required)

## Architectural Constraints

- **Threading:** Backend is single-threaded event loop (Flask development); production uses Gunicorn with multiple workers
- **Global state:** `db` singleton in `backend/api/db/mongodb.py` line 10-11; MongoDB connection lazily initialized on first call
- **Circular imports:** None detected; routes import services, services import models, models have no dependencies on routes/services
- **Session persistence:** JWT tokens stored in localStorage; no server-side session storage
- **External dependencies:** Groq API (LLM), OasisPay (payments), MongoDB (database)
- **API rate limiting:** Not implemented; Groq may have rate limits per API key
- **Database indexes:** None explicitly created in code; recommend indexes on `users.email`, `readings.user_id`, `transactions.user_id`

## Anti-Patterns

### Balance Deduction Without Transaction Rollback

**What happens:** `deduct_balance()` updates user balance in MongoDB, then LLM call may fail. Balance is deducted but reading is not saved.

**Why it's wrong:** User loses credits without receiving the tarot interpretation, creating support burden and revenue loss.

**Do this instead:** Wrap balance deduction and reading generation in a database transaction or implement refund logic on LLM failure. Store readings atomically with balance update, or defer balance deduction until both reading generation AND storage succeed.

Reference: `backend/api/routes/chat.py` line 30-49

### Password Validation in Frontend Auth Form

**What happens:** Frontend validates password requirements but backend has no validation; users can submit malformed data.

**Why it's wrong:** Client-side validation is easily bypassed. Direct API calls bypass frontend checks entirely.

**Do this instead:** Move all validation to backend routes. `backend/api/routes/auth.py` should validate password minimum length, complexity, etc. before hashing.

Reference: `frontend/app/page.tsx` line 135-142 (password input with no minlength attribute)

### Token Stored in Unencrypted localStorage

**What happens:** JWT token visible in browser DevTools, stays in localStorage after logout (requires explicit removal).

**Why it's wrong:** XSS attack can steal token; logout doesn't guarantee token deletion if user doesn't close browser.

**Do this instead:** Use HTTP-only cookies with Secure + SameSite flags. Implement token refresh via refresh tokens with shorter expiry. Add CSRF protection.

Reference: `frontend/lib/api.ts` line 14-15

## Error Handling

**Strategy:** Frontend catches Axios errors and displays error detail from backend; backend returns JSON error responses with HTTP status codes

**Patterns:**
- **401 Unauthorized**: Invalid/missing JWT token (`backend/api/routes/auth.py` line 56-73)
- **400 Bad Request**: Validation errors (empty question, invalid email, etc.)
- **402 Payment Required**: Insufficient balance (`backend/api/routes/chat.py` line 31)
- **404 Not Found**: User/transaction not found
- **500 Internal Server Error**: Groq API failure, database error

**Frontend error display**: Alert dialog with `error.response?.data?.detail || fallback message` (`frontend/app/page.tsx` line 42, 52)

## Cross-Cutting Concerns

**Logging:** Not implemented; recommend adding Python logging module to backend routes and services

**Validation:** 
- Frontend: HTML form validation (email type, required attributes)
- Backend: Pydantic models on request bodies (`backend/api/routes/auth.py` line 92)

**Authentication:** 
- Frontend: Check localStorage for token before rendering Chat
- Backend: `@require_auth` decorator on protected routes

**Authorization:** 
- Only owner of transaction can check status (`backend/api/routes/payment.py` line 178)

---

*Architecture analysis: 2026-07-07*
