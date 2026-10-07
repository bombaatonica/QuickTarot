# STRUCTURE — Directory Layout
Date: 2026-10-07

## Root Layout

```
QuickTarot/
├── frontend/                  # Next.js 14 App Router app (deployed to Vercel separately)
│   ├── app/                   # Routes: page.tsx (auth gate + chat), layout.tsx, globals.css
│   ├── components/            # UI: Chat, Message, TarotCards, AnimatedTarotCard,
│   │                          #   FormattedTarotText, BuyQuestionButton, PixPaymentModal
│   ├── lib/                   # api.ts — axios client + authApi/paymentApi/chatApi facades
│   ├── data/                  # tarot-data.ts — 78-card client catalog → /tarot-cards/*.jpg
│   ├── e2e/                   # ui.spec.ts — Playwright E2E (playwright.config.ts)
│   ├── public/                # (frontend-local static; canonical card art lives in /public below)
│   ├── next.config.js         # NEXT_PUBLIC_API_URL (default http://localhost:8000)
│   ├── tailwind.config.ts / postcss.config.js / tsconfig.json / package.json
│   └── vercel.json            # Frontend Vercel project config
├── backend/                   # Flask API (Vercel python serverless function)
│   ├── api/
│   │   ├── main.py            # Flask app factory: CORS, blueprint registration, error handlers
│   │   ├── index.py           # Vercel entry: `from api.main import app`
│   │   ├── routes/            # auth.py, chat.py, payment.py (+ empty __init__.py)
│   │   ├── services/          # tarot.py (draw/format), llm.py (Groq), payment.py (OasisPay)
│   │   ├── models/            # user.py, tarot.py (78-card deck), payment.py
│   │   └── db/                # mongodb.py (singleton), transactions.py, init.py (indexes)
│   ├── tests/                 # test_auth.py, test_chat.py, test_payment.py, conftest.py
│   ├── requirements.txt / requirements-dev.txt / setup.py / vercel.json
│   └── .env                   # MONGODB_URI, GROQ_API_KEY, JWT_SECRET, OASIS_* (git-ignored)
├── public/
│   └── tarot-cards/           # Card artwork: m00–m21 majors + c*/p*/s*/w* suits (~78 jpgs)
├── tarot-json/                # Vendored reference data: tarot.json, tarot-images.json
│                              # (+ README.md, LICENSE) — source material, not imported
├── .planning/
│   └── codebase/              # This doc + ARCHITECTURE.md (generated codebase map)
├── .env                       # Root env (backend loads backend/.env first, then cwd .env)
├── .vscode/settings.json      # Editor settings
├── .cursor/                   # Cursor rules/config
├── README.md / SETUP.md / INSTALLACAO.md / GROQ_SETUP.md / PAYMENT_SETUP.md
└── .gitignore
```

Notes:
- The README's `QuickTarot/vercel.json` + `frontend/` + `backend/` sketch is aspirational:
  in practice each half has its **own** `vercel.json` (`frontend/vercel.json`,
  `backend/vercel.json`) and deploys independently.
- README says "FastAPI" but the code is **Flask** (`backend/api/main.py`); the README's
  `python -m flask --app api.main:app` command is the accurate one.
- Two `.env` files exist: root `.env` and `backend/.env`. `main.py` loads
  `backend/.env` explicitly by path, then plain `load_dotenv()` (cwd). `mongodb.py`
  also calls `load_dotenv()`. When running Flask from `backend/`, both resolve to the
  same file; from repo root, the cwd fallback picks up root `.env`.

## Key Locations

| What | Where |
|---|---|
| Chat request handler (R$ 1.00 debit + draw + LLM) | `backend/api/routes/chat.py` (`ask_tarot_question`, `QUESTION_PRICE = 1.0`) |
| Auth: register/login/me, JWT, bcrypt, `@require_auth` | `backend/api/routes/auth.py` |
| Payments: balance, create-pix, check-status, webhook, `deduct_balance()` | `backend/api/routes/payment.py` |
| Tarot draw + LLM prompt formatting | `backend/api/services/tarot.py` (`draw_cards`, `format_cards_for_llm`) |
| Groq interpretation + model fallback chain | `backend/api/services/llm.py` (`generate_tarot_interpretation`) |
| OasisPay Pix gateway wrapper | `backend/api/services/payment.py` (`OasisPayService.receive_pix`) |
| 78-card deck constant + `Card`/`Suit` schemas | `backend/api/models/tarot.py` (`TAROT_DECK`) |
| User schemas (register/login/response) | `backend/api/models/user.py` |
| Transaction schema | `backend/api/models/payment.py` |
| Mongo singleton + DB name resolution | `backend/api/db/mongodb.py` (`get_database`) |
| Transaction CRUD + atomic pending→paid guard | `backend/api/db/transactions.py` |
| Index bootstrap (unique `users.email`) | `backend/api/db/init.py` (`init_database`) |
| Vercel serverless adapter | `backend/api/index.py` + `backend/vercel.json` |
| App root / auth gate → `<Chat />` | `frontend/app/page.tsx` |
| Root layout, fonts (Cinzel/Cormorant), metadata | `frontend/app/layout.tsx` |
| Global styles / theme (bordeaux + gold) | `frontend/app/globals.css` |
| HTTP client + `authApi`/`paymentApi`/`chatApi` + TS types | `frontend/lib/api.ts` |
| Chat container (send flow, balance state) | `frontend/components/Chat.tsx` |
| Message bubbles | `frontend/components/Message.tsx` |
| 9-card spread + animated card | `frontend/components/TarotCards.tsx`, `frontend/components/AnimatedTarotCard.tsx` |
| LLM markdown renderer | `frontend/components/FormattedTarotText.tsx` |
| Balance button + Pix modal (QR, polling) | `frontend/components/BuyQuestionButton.tsx`, `frontend/components/PixPaymentModal.tsx` |
| Client card catalog → artwork URLs | `frontend/data/tarot-data.ts` |
| Card images served to frontend | `public/tarot-cards/*.jpg` |
| Backend tests | `backend/tests/test_auth.py`, `backend/tests/test_chat.py`, `backend/tests/test_payment.py`, `backend/tests/conftest.py` |
| Frontend E2E | `frontend/e2e/ui.spec.ts` |
| Env vars (API URL for browser) | `frontend/.env` (`NEXT_PUBLIC_API_URL`) + `frontend/next.config.js` |
| Env vars (secrets: Mongo, Groq, JWT, OasisPay) | `backend/.env` (see `PAYMENT_SETUP.md`, `GROQ_SETUP.md`) |
| Setup guides | `README.md`, `SETUP.md`, `INSTALLACAO.md`, `GROQ_SETUP.md`, `PAYMENT_SETUP.md` |

Example — balance debit (the money-safety primitive, `backend/api/routes/payment.py`):

```python
def deduct_balance(user_id: str, amount: float) -> bool:
    db = get_database()
    users_collection = db.users
    result = users_collection.find_one_and_update(
        {"_id": ObjectId(user_id), "balance": {"$gte": amount}},
        {"$inc": {"balance": -amount}}
    )
    return result is not None
```

Example — frontend call shape (`frontend/lib/api.ts`):

```ts
export const chatApi = {
  askTarotQuestion: async (question: string): Promise<TarotResponse> => {
    const response = await api.post('/api/chat/tarot-question', { question });
    ...
  },
};
```

## Naming Conventions

- **Backend files**: `snake_case.py` throughout (`tarot.py`, `payment.py`, `mongodb.py`,
  `transactions.py`, `test_auth.py`). One concern per module; route modules expose a
  Flask `bp = Blueprint(...)` named after the domain (`'auth'`, `'chat'`, `'payment'`).
- **Backend symbols**: `snake_case` functions (`draw_cards`, `deduct_balance`,
  `create_access_token`, `get_current_user`, `require_auth`,
  `update_transaction_status_if_pending`); `PascalCase` Pydantic models
  (`UserCreate`, `UserLogin`, `Card`, `TarotReading`, `Transaction`); UPPER_SNAKE
  constants (`TAROT_DECK`, `QUESTION_PRICE`, `SECRET_KEY`, `ALGORITHM`).
- **Backend routes**: kebab-case under `/api/<domain>/` prefixes —
  `/api/auth/register`, `/api/auth/login`, `/api/auth/me`,
  `/api/payment/balance`, `/api/payment/add-credit`, `/api/payment/create-pix`,
  `/api/payment/check-status/<transaction_id>`, `/api/payment/webhook`,
  `/api/chat/tarot-question`. Errors always `{"detail": "<msg>"}`.
- **Mongo collections**: plural snake_case — `users`, `transactions`, `readings`
  (documents use `snake_case` keys: `password_hash`, `charge_id`, `pix_code`,
  `created_at`, `user_id`).
- **Frontend files**: `PascalCase.tsx` for components (`Chat.tsx`, `PixPaymentModal.tsx`),
  `camelCase.ts` for modules (`api.ts`, `tarot-data.ts`); App Router files are
  lowercase by Next.js convention (`page.tsx`, `layout.tsx`, `globals.css`).
- **Frontend symbols**: `PascalCase` components/interfaces (`Chat`, `ChatMessage`,
  `TarotResponse`, `TarotCardData`); `camelCase` functions/state
  (`askTarotQuestion`, `handleSend`, `loadBalance`, `formatBRL`); `*Api` facade
  objects (`authApi`, `paymentApi`, `chatApi`).
- **Card assets**: `mNN.jpg` = 22 major arcana (`public/tarot-cards/m00.jpg`…),
  suit prefixes for minors — `c*` (Copas), `p*` (Paus), `s*` (Espadas), `w*` (Ouros).
  Frontend `TarotCardData.id` values (`'0'`–`'21'`, suit ids) mirror `tarot-json/`.
- **Env vars**: `UPPER_SNAKE`, split by consumer — `NEXT_PUBLIC_*` (browser-safe,
  `NEXT_PUBLIC_API_URL`) vs server-only (`MONGODB_URI`, `GROQ_API_KEY`, `JWT_SECRET`,
  `OASIS_PUBLIC_KEY`, `OASIS_SECRET_KEY`, `OASIS_WEBHOOK_TOKEN`, `ALLOW_TEST_CREDIT`,
  `ALLOWED_ORIGINS`).

## Where To Add New Code

| Task | Where | How (follow existing patterns) |
|---|---|---|
| New chat/AI endpoint | New or existing module in `backend/api/routes/` + register in `backend/api/main.py` via `app.register_blueprint(<bp>, url_prefix="/api/...")` | Copy `backend/api/routes/chat.py`: `@bp.route(...)` + `@require_auth`, `abort(4xx, description=...)` for errors so the frontend `detail` contract holds; return `jsonify({...})` |
| New auth-adjacent route | `backend/api/routes/auth.py` | Reuse `require_auth`/`get_current_user()`; never invent a second token scheme |
| New payment operation | `backend/api/routes/payment.py` + gateway method in `backend/api/services/payment.py` | Keep money movement in atomic single-doc updates (see `deduct_balance()`); credit only on `TRANSACTION_PAID` webhook via `update_transaction_status_if_pending()` in `backend/api/db/transactions.py` — never trust webhook payload amounts |
| New Mongo collection helper | `backend/api/db/` (new file or extend `transactions.py`) + index in `backend/api/db/init.py` | Use `get_database()` from `backend/api/db/mongodb.py`; add `create_index()` calls in `init_database()` (failure-tolerant pattern) |
| New Pydantic schema | `backend/api/models/` (`user.py`, `tarot.py`, `payment.py` or a new file) | `BaseModel` + route-level `try/except → abort(400, ...)` as in `auth.py::register` |
| New LLM behavior/prompt | `backend/api/services/llm.py` (`generate_tarot_interpretation`) and/or `backend/api/services/tarot.py` | Keep the structured PT-BR prompt contract that `FormattedTarotText.tsx` parses; add fallback models to `models_to_try`, don't replace the list blindly |
| New tarot deck content | `TAROT_DECK` in `backend/api/models/tarot.py` + mirror entry in `frontend/data/tarot-data.ts` + artwork in `public/tarot-cards/` | Backend is source of truth for draws; frontend catalog only maps names → `image_url`; readings store denormalized snapshots so history is unaffected |
| New frontend component | `frontend/components/<Name>.tsx` (`'use client';` at top) | Presentational components take props (see `Message.tsx`); container logic lives in `Chat.tsx`; styling via Tailwind bordeaux/gold tokens in `frontend/app/globals.css` + `frontend/tailwind.config.ts` |
| New frontend page/route | `frontend/app/<route>/page.tsx` | App Router convention; reuse `authApi.getMe()` gate from `frontend/app/page.tsx` for anything authenticated |
| New API client method | `frontend/lib/api.ts` (extend `authApi`/`paymentApi`/`chatApi` + TS interfaces) | Never call axios directly from components; handle `error.response?.data?.detail`; update `localStorage.user` balance when the server returns a new `balance` (pattern in `chatApi.askTarotQuestion`) |
| New backend test | `backend/tests/test_<domain>.py` using `backend/tests/conftest.py` fixtures | Run `pytest` from `backend/` with `backend/requirements-dev.txt` installed |
| New E2E test | `frontend/e2e/*.spec.ts` | Run `npm run test:e2e` from `frontend/`; typecheck with `npm run typecheck` |
| New env var | `backend/.env` (server) or `frontend/.env` + `frontend/next.config.js` (browser, must be `NEXT_PUBLIC_*`) | Document in the matching `*_SETUP.md`; server-only secrets must never get a `NEXT_PUBLIC_` prefix |
