# ARCHITECTURE — System Design
Date: 2026-10-07

## Pattern Overview

QuickTarot is a **client/server split monorepo** (two deployables in one git repo):

- `frontend/` — Next.js 14 App Router SPA (React 18, TypeScript, Tailwind). ChatGPT-style
  single-page chat UI. No server components fetch data; all backend calls go through
  `frontend/lib/api.ts` (axios) to `NEXT_PUBLIC_API_URL`.
- `backend/` — Flask 3 API (note: README says FastAPI, but actual code in
  `backend/api/main.py` is **Flask + flask-cors** with Blueprints). Deployed as a Vercel
  Python serverless function via `backend/api/index.py` (`from api.main import app`)
  and `backend/vercel.json`.
- Persistence: **MongoDB Atlas** via `pymongo` (lazy singleton in
  `backend/api/db/mongodb.py`). Collections: `users`, `transactions`, `readings`.
- AI: **Groq API** (`groq` SDK) called server-side in `backend/api/services/llm.py`
  with a 4-model fallback chain (`llama-3.3-70b-versatile` → `llama-3.1-70b-versatile`
  → `llama-3.1-8b-instant` → `mixtral-8x7b-32768`).
- Payments: **OasisPay Pix gateway** (`https://app.oasyfy.com/api/v1`) wrapped by
  `backend/api/services/payment.py::OasisPayService`. Webhook-driven credit; polling
  endpoint exists but `get_charge_status()` raises `NotImplementedError`.
- Auth: JWT (HS256, `python-jose`) issued at login/register, 7-day expiry
  (`backend/api/routes/auth.py`). Bearer token in `Authorization` header, extracted by
  `get_current_user()` / enforced by `@require_auth`.
- Business model: each tarot question costs **R$ 1.00** (`QUESTION_PRICE = 1.0` in
  `backend/api/routes/chat.py`), debited atomically via `find_one_and_update` with a
  `balance >= amount` guard (`deduct_balance()` in `backend/api/routes/payment.py`).
  Pix top-up minimum is **R$ 2.00**.

There is no shared package between frontend/backend — the contract is the JSON HTTP
API plus mirrored TypeScript interfaces in `frontend/lib/api.ts` and Pydantic models
in `backend/api/models/`.

## Layers & Modules

### Backend (`backend/api/`)

| Layer | Location | Responsibility |
|---|---|---|
| App wiring | `backend/api/main.py` | Creates Flask `app`, loads `.env`, calls `init_database()`, configures CORS, registers 3 Blueprints (`/api/auth`, `/api/payment`, `/api/chat`), JSON error handlers (`{"detail": ...}`), `/` and `/health` routes |
| Serverless entry | `backend/api/index.py` | Re-exports `app` for Vercel (`@vercel/python`, see `backend/vercel.json`) |
| Routes (controllers) | `backend/api/routes/auth.py` | `POST /register`, `POST /login`, `GET /me`; bcrypt hashing, JWT create/verify, `@require_auth` decorator |
| Routes | `backend/api/routes/chat.py` | `POST /tarot-question`: validate question → `deduct_balance()` (402 if insufficient) → `draw_cards(9)` → `generate_tarot_interpretation()` → persist to `readings` → return cards + interpretation + new balance |
| Routes | `backend/api/routes/payment.py` | `GET /balance`, gated `POST /add-credit` (requires `ALLOW_TEST_CREDIT=true`), `POST /create-pix`, `GET /check-status/<id>`, unauthenticated `POST /webhook` (token check), plus `deduct_balance()` helper used by chat |
| Services | `backend/api/services/tarot.py` | `draw_cards(count=9)` via `random.sample(TAROT_DECK, 9)`; `format_cards_for_llm()` |
| Services | `backend/api/services/llm.py` | Builds PT-BR tarot prompt, calls Groq chat completions (`temperature=0.8`, `max_tokens=1500`), model-fallback loop |
| Services | `backend/api/services/payment.py` | `OasisPayService`: `receive_pix()` (`POST /gateway/pix/receive` with `X-Public-Key`/`X-Secret-Key`), `generate_qr_code()` (local PIL→base64, currently unused by route which uses gateway QR) |
| Models | `backend/api/models/user.py` | Pydantic `UserCreate` (email + password min 8), `UserLogin`, `UserResponse`; `UserInDB` dict wrapper |
| Models | `backend/api/models/tarot.py` | `Suit` enum (Paus/Copas/Espadas/Ouros), `Card`, `TarotReading`, and the full 78-card `TAROT_DECK` constant (22 major + 56 minor) |
| Models | `backend/api/models/payment.py` | Pydantic `Transaction` (user_id, amount, charge_id, status, pix_code, qr_code_payload) |
| DB | `backend/api/db/mongodb.py` | Lazy global `MongoClient`/`Database` singleton; db name parsed from `MONGODB_URI` or `quicktarot` |
| DB | `backend/api/db/transactions.py` | CRUD for `transactions`: create/get-by-id/get-by-charge-id/get-by-identifier/update + atomic `update_transaction_status_if_pending()` (pending→paid guard against double webhook credit) + `get_user_transactions()` |
| DB | `backend/api/db/init.py` | `init_database()`: transaction indexes + unique `users.email` index; failures logged, never crash |
| Tests | `backend/tests/` | `test_auth.py`, `test_chat.py`, `test_payment.py` + `conftest.py` fixtures; dev deps in `backend/requirements-dev.txt` |

### Frontend (`frontend/`)

| Layer | Location | Responsibility |
|---|---|---|
| Pages (App Router) | `frontend/app/page.tsx` | Single-page root: auth gate (login/register forms) → renders `<Chat />` when authenticated; `checkAuth()` via `authApi.getMe()` |
| Layout | `frontend/app/layout.tsx` | Root layout: Cinzel (display) + Cormorant Garamond (body) fonts, `globals.css`, `lang="pt-BR"`, metadata |
| State + API client | `frontend/lib/api.ts` | axios instance (`NEXT_PUBLIC_API_URL` or `localhost:8000`), Bearer interceptor from `localStorage.token`; `authApi` (login/register/getMe/logout), `paymentApi` (getBalance/addCredit/createPix/checkStatus), `chatApi.askTarotQuestion()`; TS interfaces `User`, `TarotCard`, `TarotResponse` |
| Components | `frontend/components/Chat.tsx` | Message list, input, send flow (`chatApi.askTarotQuestion`), balance state, loading skeleton, `BuyQuestionButton` in header |
| Components | `frontend/components/Message.tsx` | Renders user/assistant bubbles |
| Components | `frontend/components/TarotCards.tsx` + `frontend/components/AnimatedTarotCard.tsx` | 9-card spread display/animation |
| Components | `frontend/components/FormattedTarotText.tsx` | Renders structured LLM markdown (Visão Geral / por carta / sinergia / insights) |
| Components | `frontend/components/BuyQuestionButton.tsx` + `frontend/components/PixPaymentModal.tsx` | Balance display + Pix purchase modal (create-pix → QR → check-status polling → `getMe()` refresh) |
| Static data | `frontend/data/tarot-data.ts` | 78-card catalog (`TarotCardData`: EN/PT names, meanings, `image_url` → `/tarot-cards/*.jpg`) for client-side card artwork lookup |
| E2E | `frontend/e2e/ui.spec.ts` | Playwright spec (`npm run test:e2e`, config `frontend/playwright.config.ts`) |

### Static assets

- `public/tarot-cards/` (repo root) mirrors into the deployed frontend: `m00–m21`-style
  majors (`m00.jpg`…`m17.jpg`+) and suit cards (`c*`, `p*`, `s*`, `w*.jpg`).
- `tarot-json/` — vendored reference data (`tarot.json`, `tarot-images.json`, own
  `README.md`/`LICENSE`); source material for `tarot-data.ts`, not imported at runtime.

## Data Flow (request lifecycle, key flows)

### 1. Register / Login → authenticated session

```
page.tsx form → authApi.login|register() [lib/api.ts]
  → POST /api/auth/register|login [routes/auth.py]
  → validate via UserCreate/UserLogin [models/user.py]
  → db.users.find_one / insert_one (bcrypt hash, balance=0.0)
  → create_access_token(sub=user_id, exp=+7d, HS256)
  ← { access_token, token_type, user }
→ localStorage.token + localStorage.user set [lib/api.ts]
→ subsequent requests carry Authorization: Bearer <token> (axios interceptor)
```

`GET /api/auth/me` re-validates the token on page load (`checkAuth()` in `page.tsx`).

### 2. Ask a tarot question (core loop, R$ 1.00)

```
Chat.tsx handleSend() → chatApi.askTarotQuestion(question)
  → POST /api/chat/tarot-question [routes/chat.py, @require_auth]
  → deduct_balance(user_id, 1.0) [routes/payment.py]:
       users.find_one_and_update({_id, balance >= 1.0}, $inc: -1.0)  # atomic
       → False? return 402 {"detail": "Saldo insuficiente..."}
  → draw_cards(9) [services/tarot.py] → random.sample(TAROT_DECK, 9)
  → generate_tarot_interpretation(question, cards) [services/llm.py]
       → Groq chat.completions (model fallback chain, PT-BR structured prompt)
  → readings.insert_one({user_id, question, cards, interpretation, created_at})
  → re-read users.balance
  ← { cards[{name, suit, meaning, is_major}], interpretation, question, balance }
→ Chat.tsx appends assistant message + cards, updates balance + localStorage.user
→ Message.tsx + TarotCards.tsx + FormattedTarotText.tsx render the spread
```

On 402, the frontend surfaces `error.response.data.detail` as an error bubble.

### 3. Buy credit via Pix (OasisPay webhook flow)

```
BuyQuestionButton → PixPaymentModal → paymentApi.createPix({amount >= 2.0})
  → POST /api/payment/create-pix [routes/payment.py, @require_auth]
  → OasisPayService.receive_pix(identifier=uuid4hex, amount, client, metadata)
       → POST https://app.oasyfy.com/api/v1/gateway/pix/receive
  → transactions.insert_one({user_id, amount, charge_id, identifier, status: pending,
                             pix_code, qr_code_payload})
  ← { success, transaction_id, pix_code, qr_code(base64), status: pending }
→ modal shows QR; frontend polls GET /api/payment/check-status/<id>
→ gateway calls POST /api/payment/webhook {event: TRANSACTION_PAID, transaction, token}
  → token check vs OASIS_WEBHOOK_TOKEN (if configured)
  → get_transaction_by_identifier(identifier)
  → update_transaction_status_if_pending(id, "paid")  # atomic; dup webhooks lose
  → users.update_one({_id}, $inc: {balance: <stored amount>})  # trusts DB, not payload
→ frontend handlePixPaymentSuccess() → authApi.getMe() → fresh balance
```

`POST /api/payment/add-credit` is a test-only shortcut, hard-blocked with 403 unless
`ALLOW_TEST_CREDIT=true`.

### 4. Error contract

All backend errors return `{"detail": "..."}` (Flask `errorhandler`s in `main.py`;
frontend reads `error.response?.data?.detail` in `page.tsx` and `Chat.tsx`).
Payment gateway failures use `{"success": False, "error": ..., "provider_status": ...}`
with 502. Insufficient balance is 402 (returned directly, since Werkzeug has no 402
exception).

## Key Abstractions

- **Blueprint-per-domain** (`auth` / `payment` / `chat` in `backend/api/routes/`):
  each owns its URL prefix (`/api/auth`, `/api/payment`, `/api/chat`) registered in
  `backend/api/main.py`. Cross-domain reuse is a plain function import
  (`chat.py` imports `deduct_balance` from `payment.py`; both import
  `require_auth`/`get_current_user` from `auth.py`).
- **`Card` / `TAROT_DECK`** (`backend/api/models/tarot.py`): the domain constant —
  78 Pydantic `Card`s (22 `is_major=True`, 56 with `Suit` + number). `draw_cards()`
  samples it; `format_cards_for_llm()` serializes for the prompt; readings persist a
  denormalized snapshot `{name, suit, meaning}` so history survives deck edits.
- **`OasisPayService`** (`backend/api/services/payment.py`): thin HTTP wrapper over
  the Pix gateway; constructed once at import with `OASIS_PUBLIC_KEY`/`OASIS_SECRET_KEY`.
- **Atomic Mongo guards**: `deduct_balance()` (balance-gated `$inc`) and
  `update_transaction_status_if_pending()` (pending-gated status transition) are the
  two concurrency-safety primitives — no DB transactions, just single-document atomic
  updates.
- **Frontend API facades** (`authApi` / `paymentApi` / `chatApi` in
  `frontend/lib/api.ts`): the only module that talks HTTP; components never use axios
  directly. Auth state is dual-stored: server truth via `getMe()`, optimistic cache in
  `localStorage.user`.
- **`tarotCardsData`** (`frontend/data/tarot-data.ts`): client-side card catalog keyed
  to `/tarot-cards/*.jpg` artwork; bridges backend card names to images.

## Entry Points

| Entry | File | How to run |
|---|---|---|
| Frontend dev server | `frontend/app/page.tsx` (root route via `frontend/app/layout.tsx`) | `cd frontend; npm install; npm run dev` → `http://localhost:3000` |
| Backend API (local) | `backend/api/main.py` (`app` object) | `cd backend; pip install -r requirements.txt; python -m flask --app api.main:app run --port 8000 --debug` (README; `api/main.py` also importable directly) |
| Backend (Vercel serverless) | `backend/api/index.py` | Built via `backend/vercel.json` (`@vercel/python`, all routes → `api/index.py`); no local command |
| DB bootstrap | `backend/api/db/init.py::init_database()` | Runs automatically on `main.py` import; also `python -m api.db.init` (as `__main__`) |
| Backend tests | `backend/tests/test_auth.py`, `backend/tests/test_chat.py`, `backend/tests/test_payment.py` (`backend/tests/conftest.py` fixtures) | `cd backend; pytest` (dev deps: `backend/requirements-dev.txt`) |
| Frontend E2E | `frontend/e2e/ui.spec.ts` (`frontend/playwright.config.ts`) | `cd frontend; npm run test:e2e`; typecheck via `npm run typecheck` (`tsc --noEmit`) |
| Config | `frontend/next.config.js`, `frontend/tailwind.config.ts`, `frontend/tsconfig.json`, `backend/setup.py`, `backend/requirements.txt` | Build/lint configs; see STRUCTURE.md |
