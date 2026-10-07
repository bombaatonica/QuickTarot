# INTEGRATIONS — External Services
Date: 2026-10-07

All external I/O goes through three touchpoints: Groq LLM (interpretations), OasisPay/Oasyfy Pix (monetization), MongoDB Atlas/local (persistence). Auth is self-rolled JWT (no OAuth provider). Static card art is vendored locally.

## APIs & External Services (Groq, payments, etc. + SDK files)

- **Groq LLM API — tarot interpretation engine**
  - SDK: `groq>=0.4.0` (`backend/requirements.txt`), official `Groq` client.
  - SDK files: `backend/api/services/llm.py` (`get_llm_client()` + `generate_tarot_interpretation(question, cards)`), prompt builder uses `backend/api/services/tarot.py` (`format_cards_for_llm()`), models `backend/api/models/tarot.py` (`Card`, `TAROT_DECK`).
  - Called from route `backend/api/routes/chat.py` (`ask_tarot_question()` → `draw_cards(count=9)` → `generate_tarot_interpretation(...)`, `temperature=0.8`, `max_tokens=1500`).
  - Model fallback chain in `backend/api/services/llm.py`:
    ```python
    models_to_try = ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"]
    ```
    retries on `decommissioned/model` errors, else returns Portuguese error string.
  - Setup doc: `GROQ_SETUP.md` (get key at `https://console.groq.com/`, `API Keys → Create`, free limits `14.400 req/min`, `30.000 req/day`).
  - Example request shape (from `backend/api/services/llm.py`):
    ```python
    client.chat.completions.create(model=model, messages=[{"role":"system",...},{"role":"user","content":prompt}], temperature=0.8, max_tokens=1500)
    ```

- **OasisPay / Oasyfy Pix gateway — payments (BR Pix)**
  - No dedicated SDK; thin wrapper over `requests` in `backend/api/services/payment.py` (`class OasisPayService`, `base_url = "https://app.oasyfy.com/api/v1"`).
  - SDK files: `backend/api/services/payment.py` (`receive_pix(identifier, amount, client, metadata)`, `generate_qr_code(payload) → data:image/png;base64,...`, `get_charge_status()` raises `NotImplementedError`), route layer `backend/api/routes/payment.py`, model `backend/api/models/payment.py` (`Transaction`), DB helpers `backend/api/db/transactions.py`.
  - Create-charge flow (`POST /api/payment/create-pix` in `backend/api/routes/payment.py`):
    ```python
    oasis_service.receive_pix(identifier=uuid.uuid4().hex, amount=amount,
      client={"name":..., "email":..., "phone":"(99) 99999-9999", "document":"123.456.789-09"},
      metadata={"provider":"QuickTarot"})
    # POST https://app.oasyfy.com/api/v1/gateway/pix/receive
    # headers X-Public-Key / X-Secret-Key from env
    ```
    Expects `{transactionId, pix:{code, base64}}`; persists `{user_id, amount, charge_id, identifier, status:"pending", pix_code, qr_code_payload}` via `create_transaction()`; returns `{success, transaction_id, amount, pix_code, qr_code, status:"pending"}`.
  - Frontend: `frontend/lib/api.ts` (`paymentApi.createPix()`, `paymentApi.checkStatus()`, `paymentApi.getBalance()`, `paymentApi.addCredit()`), UI `frontend/components/PixPaymentModal.tsx` (min `R$ 2,00`, 5s polling, 10-min timeout, QR `<img src={transaction.qr_code}>` + copy-paste `pix_code`), trigger `frontend/components/BuyQuestionButton.tsx`; E2E `frontend/e2e/payment.spec.ts` + `frontend/e2e/mocks.ts`.
  - Docs: `PAYMENT_SETUP.md` (flow, routes, components; uses legacy var names `OASYF_API_KEY`, `OASYF_WEBHOOK_URL` — actual code uses `OASIS_*`, see Env section).
  - Pricing: `QUESTION_PRICE = 1.0` (R$1 per question) in `backend/api/routes/chat.py`; min top-up `amount >= 2.0` enforced in both `backend/api/routes/payment.py` and `frontend/components/PixPaymentModal.tsx`.

- **No other SaaS**: no Stripe, no email/SMS provider, no analytics, no error tracker, no CDN beyond Vercel defaults. `frontend/lib/api.ts` uses only first-party `NEXT_PUBLIC_API_URL` backend.

## Databases & Storage

- **MongoDB (Atlas for prod, local for dev) — primary DB via `pymongo==4.6.0`**
  - Connector: `backend/api/db/mongodb.py` (`get_database()` reads `MONGODB_URI`, derives db name from URI path or defaults `quicktarot`; `close_database()`).
  - Bootstrap: `backend/api/db/init.py` (`init_database()` called at import in `backend/api/main.py`; creates `users.email unique` + transaction indexes; logs instead of crashing).
  - Index helpers: `backend/api/db/transactions.py` (`create_transaction_index()` on `user_id`, `charge_id`, `identifier`, `status`, `created_at`; CRUD `create_transaction`, `get_transaction`, `get_transaction_by_charge_id`, `get_transaction_by_identifier`, `update_transaction_status_if_pending` atomic `pending→paid`).
  - Collections:
    - `users` — `{email (unique), name, password_hash (bcrypt), balance: float, created_at}`; model `backend/api/models/user.py` (`UserCreate`, `UserLogin`, `UserResponse`, `UserInDB.to_dict()`); accessed in `backend/api/routes/auth.py` + `backend/api/routes/payment.py` (`get_balance`, `add_credit`, `deduct_balance` via atomic `find_one_and_update {_id, balance:{$gte}} + $inc`).
    - `transactions` — `{user_id: str, amount, charge_id (gateway transactionId), identifier (uuid hex), status: pending|paid|expired, pix_code, qr_code_payload, created_at/updated_at}`; model `backend/api/models/payment.py`; written in `backend/api/routes/payment.py` (`create_pix`), read in `check_status`, mutated in `webhook`.
    - `readings` — history `{user_id: ObjectId, question, cards:[{name, suit, meaning}], interpretation, created_at}`; written in `backend/api/routes/chat.py`, no dedicated model file (inline dict).
  - Tests use `mongomock>=4.1.0` swap in `backend/tests/conftest.py` (`mongodb.client = mongomock.MongoClient()`, db `quicktarot_test`, autouse `clean_db` fixture); suites `backend/tests/test_auth.py`, `backend/tests/test_chat.py`, `backend/tests/test_payment.py`.
  - Local URI example from docs: `mongodb://localhost:27017/quicktarot` (`SETUP.md`, `PAYMENT_SETUP.md`).

- **Static file storage (no S3/R2; vendored images served by Next.js)**
  - Sources: `tarot-json/cards/` (RWS scans `m00–m21`, `c/s/w/p 01–14`, 350×600px per `tarot-json/README.md`), manifests `tarot-json/tarot.json` + `tarot-json/tarot-images.json`.
  - Served copies: `public/tarot-cards/` (root) + `frontend/public/`; referenced as `/tarot-cards/*.jpg` in `frontend/data/tarot-data.ts` (`image_url: '/tarot-cards/m00.jpg'` etc.) and rendered in `frontend/components/TarotCards.tsx` / `frontend/components/AnimatedTarotCard.tsx`.
  - QR codes are NOT stored; generated on the fly (`backend/api/services/payment.py` → `generate_qr_code()`) and returned as base64 data-URL, with `pix_code` persisted in `transactions` for copy-paste.

## Auth Providers

- **Self-rolled JWT, no external IdP (no Auth0/Clerk/Firebase/Supabase Auth)**
  - Backend impl `backend/api/routes/auth.py`:
    ```python
    SECRET_KEY = os.getenv("JWT_SECRET") or secrets.token_hex(32)  # ephemeral fallback
    ALGORITHM = "HS256"; ACCESS_TOKEN_EXPIRE_MINUTES = 60*24*7
    jwt.encode({"sub": user_id, "exp": ...}, SECRET_KEY, algorithm=ALGORITHM)
    ```
  - Passwords: `bcrypt.hashpw/gensalt/checkpw` (`get_password_hash()`, `verify_password()`); validation via `backend/api/models/user.py` (`EmailStr` + `password min_length=8`).
  - Guards: `get_current_user()` parses `Authorization: Bearer <token>`, validates `ObjectId`, aborts `401`; decorator `require_auth(f)` injects `current_user={"user_id":...}` into `backend/api/routes/auth.py` (`/me`), `backend/api/routes/payment.py` (`/balance`, `/add-credit`, `/create-pix`, `/check-status/*`), `backend/api/routes/chat.py` (`/tarot-question`).
  - Frontend session: `frontend/lib/api.ts` (`authApi.login/register` persist `access_token` + `user` in `localStorage`, interceptor adds `Bearer`, `authApi.logout()` clears); gate in `frontend/app/page.tsx` (`checkAuth()` → `authApi.getMe()`, login/register forms, minLength 8); E2E `frontend/e2e/auth.spec.ts`.
  - Flows: `POST /api/auth/register` → `{access_token, token_type:"bearer", user:{id,email,name,balance}}`; `POST /api/auth/login` same; `GET /api/auth/me` → `{id,email,name,balance,created_at}`.

## Webhooks / Callbacks

- **OasisPay `TRANSACTION_PAID` webhook — `POST /api/payment/webhook` (public, no JWT) in `backend/api/routes/payment.py`**
  - Handler sketch:
    ```python
    @bp.route("/webhook", methods=["POST"])
    def webhook():
        data = request.get_json()
        if data.get("token") != os.getenv("OASIS_WEBHOOK_TOKEN"): return 401  # only if env set
        if data["event"] == "TRANSACTION_PAID":
            identifier = (data.get("transaction") or {}).get("identifier")
            txn = get_transaction_by_identifier(identifier)
            if txn and txn["status"] == "pending":
                if update_transaction_status_if_pending(str(txn["_id"]), "paid"):
                    users.update_one({"_id": ObjectId(txn["user_id"])}, {"$inc": {"balance": float(txn["amount"])}})
        return {"status":"ok"}, 200
    ```
  - Security properties: optional shared-secret `token` check (`OASIS_WEBHOOK_TOKEN`); credits `float(transaction["amount"])` from DB, never webhook payload; atomic `pending→paid` transition prevents double-credit on duplicate deliveries (`backend/api/db/transactions.py`).
  - Client-side fallback polling (webhook not required for UX): `frontend/components/PixPaymentModal.tsx` polls `GET /api/payment/check-status/{transaction_id}` every 5s (10-min expiry → `expired`); backend `check_status()` currently returns stored `pending`/`paid` without live gateway query (`get_charge_status` unimplemented).
  - Doc drift: `PAYMENT_SETUP.md` documents older payload `{event:"charge.paid", data:{id, amount}}`; code expects `{event:"TRANSACTION_PAID", transaction:{identifier}, token?}` — trust code.
  - No Stripe/Supabase/other webhooks; no outbound webhooks from this repo.

## Env Vars & Secrets (names only, NEVER values)

Backend (`backend/.env`, root `.env`, Vercel backend env; code refs in `backend/api/db/mongodb.py`, `backend/api/services/llm.py`, `backend/api/routes/auth.py`, `backend/api/routes/payment.py`, `backend/api/main.py`):
- `MONGODB_URI` — Mongo connection string (db name parsed from path, default `quicktarot`).
- `GROQ_API_KEY` — Groq key (`gsk_...` format per `GROQ_SETUP.md`); missing → `ValueError` in `backend/api/services/llm.py`.
- `JWT_SECRET` — HS256 signing secret; missing → ephemeral `secrets.token_hex(32)` + warning (tokens die on restart) in `backend/api/routes/auth.py`; tests set `JWT_SECRET=test-secret-key-for-tests` in `backend/tests/conftest.py`.
- `ALLOWED_ORIGINS` — comma-separated CORS origins, default `http://localhost:3000` in `backend/api/main.py` (docs example `http://localhost:3000` in `SETUP.md`).
- `OASIS_PUBLIC_KEY` — OasisPay public key → `X-Public-Key` header.
- `OASIS_SECRET_KEY` — OasisPay secret key → `X-Secret-Key` header; both required or `POST /create-pix` aborts 500 (`backend/api/routes/payment.py`).
- `OASIS_WEBHOOK_TOKEN` — shared secret compared to webhook body `token`; if unset, token check is skipped (present in root `.env`, absent from `backend/.env` — set it in both + Vercel).
- `ALLOW_TEST_CREDIT` — must equal `"true"` to enable `POST /api/payment/add-credit` test faucet (default disabled → 403); explicitly popped in `backend/tests/conftest.py`.

Frontend (`frontend/.env` / `.env.local`, `frontend/next.config.js`, `frontend/lib/api.ts`, Vercel frontend env):
- `NEXT_PUBLIC_API_URL` — backend base URL (fallback `http://localhost:8000` in both `frontend/lib/api.ts` and `frontend/next.config.js`; prod set to deployed `backend/vercel.json` URL per `SETUP.md`).

Legacy/doc-only (do NOT set; renamed):
- `OASYF_API_KEY`, `OASYF_WEBHOOK_URL` — appear only in `PAYMENT_SETUP.md`; replaced by `OASIS_PUBLIC_KEY` / `OASIS_SECRET_KEY` / `OASIS_WEBHOOK_TOKEN` in code.

Missing-file note: no `.env.example` in root, `backend/`, or `frontend/`; canonical key lists live in `SETUP.md` (backend: `MONGODB_URI`, `GROQ_API_KEY`, `JWT_SECRET`, `ALLOWED_ORIGINS`; frontend: `NEXT_PUBLIC_API_URL`) plus `PAYMENT_SETUP.md` / `GROQ_SETUP.md` for provider keys.
