# CONVENTIONS — Code Style & Patterns
Date: 2026-10-07

## Code Style (formatting, lint, TS/Python style)

### Backend — Python / Flask (in `backend/`)
- No formatter/linter config in repo: no `pyproject.toml`, `ruff.toml`, `.flake8`, `pytest.ini`, or `.github/` CI found (verified via glob). Style is de-facto PEP8, 4-space indent, double quotes.
- Stack is Flask + Blueprints (not FastAPI despite `README.md` saying FastAPI): `backend/api/main.py` creates `Flask(__name__)` and registers `auth`, `payment`, `chat` blueprints under `/api/*`.
- Validation with Pydantic v2 models (`backend/requirements.txt`: `pydantic>=2.11.7,<3.0.0`); persistence is raw `pymongo` dicts, not ODM.
- Type hints on public functions, PT-BR docstrings/comments:
```python
# `backend/api/services/tarot.py:6`
def draw_cards(count: int = 9) -> List[Card]:
    """
    Sorteia 'count' cartas aleatórias do deck de tarot
    """
```
- Module-level singletons from env: e.g. `backend/api/routes/payment.py:22-27` builds `oasis_service = OasisPayService(...)` at import from `OASIS_PUBLIC_KEY`/`OASIS_SECRET_KEY`; `backend/api/routes/auth.py:19-29` reads `JWT_SECRET` at import with ephemeral `secrets.token_hex(32)` fallback + warning log.
- Logging is stdlib `logging.getLogger(__name__)`; startup init never crashes (`backend/api/db/init.py:9-19` wraps index creation in try/except + `logger.exception`).

### Frontend — TypeScript / Next.js 14 App Router (in `frontend/`)
- `frontend/tsconfig.json`: `strict: true`, `target: es5`, `jsx: preserve`, `moduleResolution: bundler`, path alias `@/*` → `./*`. No `.eslintrc*` file; lint is `next lint` via `frontend/package.json:9` (`"lint": "next lint"`). Typecheck is separate: `"typecheck": "tsc --noEmit"`.
- No Prettier config; style is 2-space indent, single quotes, semicolons, Tailwind utility classes inline.
- All interactive components start with `'use client';` (e.g. `frontend/components/Chat.tsx:1`, `frontend/components/Message.tsx:1`, `frontend/app/page.tsx:1`).
- Styling: Tailwind with custom theme tokens `bordeaux-*` / `gold-*`, `font-display`, `shadow-gold-glow`, animations `animate-fade-in` / `animate-orb-pulse` defined in `frontend/tailwind.config.ts:11-66`.

## Naming (files, vars, functions, components)

- **Files:** backend `snake_case.py` (`backend/api/services/payment.py`, `backend/api/db/transactions.py`); frontend components `PascalCase.tsx` (`frontend/components/Chat.tsx`, `frontend/components/BuyQuestionButton.tsx`, `frontend/components/PixPaymentModal.tsx`, `frontend/components/TarotCards.tsx`); lib/routes `snake_case` or lowercase (`frontend/lib/api.ts`, `backend/api/routes/chat.py`); tests `test_*.py` + `*.spec.ts`.
- **Vars/functions:** `snake_case` in Python (`get_password_hash`, `verify_password`, `deduct_balance`, `draw_cards` in `backend/api/routes/auth.py:32-51`, `backend/api/routes/payment.py:244`, `backend/api/services/tarot.py:6`); `camelCase` in TS (`handleSend`, `loadBalance`, `scrollToBottom` in `frontend/components/Chat.tsx:30-49`; `askTarotQuestion`, `getBalance`, `createPix` in `frontend/lib/api.ts:59-124`).
- **Components/interfaces:** `PascalCase` (`ChatMessage`, `TarotCard`, `TarotResponse`, `User` in `frontend/components/Chat.tsx:8-14` and `frontend/lib/api.ts:21-57`); Pydantic models `UserCreate`, `UserLogin`, `UserResponse`, `Card`, `Suit`, `Transaction` in `backend/api/models/user.py`, `backend/api/models/tarot.py`, `backend/api/models/payment.py`.
- **Routes/endpoints:** kebab-case URLs under `/api/*`: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/payment/balance`, `/api/payment/create-pix`, `/api/payment/check-status/<id>`, `/api/chat/tarot-question` (see `backend/api/main.py:31-33` + route decorators).
- **Constants:** `UPPER_SNAKE` for prices/keys (`QUESTION_PRICE = 1.0` in `backend/api/routes/chat.py:12`; `ACCESS_TOKEN_EXPIRE_MINUTES`, `ALGORITHM`, `SECRET_KEY` in `backend/api/routes/auth.py:28-29`; `API_URL` in `frontend/lib/api.ts:3`).

## Common Patterns (with short code examples + file refs)

1. **Blueprint + `require_auth` decorator** — every private route injects `current_user`:
```python
# `backend/api/routes/auth.py:88-94`
def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user = get_current_user()
        return f(current_user=current_user, *args, **kwargs)
    return decorated_function
# usage `backend/api/routes/chat.py:15-17`
@bp.route("/tarot-question", methods=["POST"])
@require_auth
def ask_tarot_question(current_user: dict):
```
2. **Pydantic-validate then raw-dict Mongo insert** (`backend/api/routes/auth.py:103-133`): `UserCreate(**data)` → `bcrypt` hash → `users_collection.insert_one(user_doc)`.
3. **Atomic balance ops** to avoid races (`backend/api/routes/payment.py:253-256`):
```python
result = users_collection.find_one_and_update(
    {"_id": ObjectId(user_id), "balance": {"$gte": amount}},
    {"$inc": {"balance": -amount}}
)
```
Same idea for idempotent webhook: `update_transaction_status_if_pending` filters `status: pending` (`backend/api/db/transactions.py:46-54`).
4. **Service-layer split `routes/` → `services/` → `db/`/`models/`**: `backend/api/routes/chat.py` orchestrates `deduct_balance` + `draw_cards` + `generate_tarot_interpretation`; `backend/api/services/llm.py:54-80` loops `models_to_try` with fallback; `backend/api/db/transactions.py:18-21` wraps collection access.
5. **Axios singleton + interceptors + `localStorage` session** (`frontend/lib/api.ts:5-19`, `59-87`):
```ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) { config.headers.Authorization = `Bearer ${token}`; }
  return config;
});
```
`authApi.login/register` persist `token`+`user`; `chatApi.askTarotQuestion` refreshes `user.balance` from response (`frontend/lib/api.ts:112-124`).
6. **Optimistic chat UI with local state + `useRef` scroll** (`frontend/components/Chat.tsx:51-98`): push user msg → `setIsLoading(true)` → append assistant msg or `isError` msg; `messagesEndRef.current?.scrollIntoView({behavior:'smooth'})`.
7. **Memoized presentational components** (`frontend/components/Message.tsx:63`: `export default memo(Message)`; `useCallback` for `handleAnimationComplete`).

## Error Handling (patterns + examples)

- **Backend always returns JSON `{"detail": ...}`** — enforced by global handlers (`backend/api/main.py:36-45`):
```python
@app.errorhandler(HTTPException)
def handle_http_exception(e: HTTPException):
    return jsonify({"detail": e.description}), e.code
@app.errorhandler(Exception)
def handle_unexpected_exception(e: Exception):
    logging.getLogger(__name__).exception("Erro não tratado")
    return jsonify({"detail": "Erro interno do servidor"}), 500
```
Routes use `abort(400/401/403/404, description="...")` with PT-BR messages (e.g. `backend/api/routes/auth.py:112-113` `"Email já cadastrado"`; `backend/api/routes/chat.py:30-31` returns `402` JSON directly because Werkzeug has no 402 exception).
- **Defensive auth parsing** (`backend/api/routes/auth.py:64-85`): missing header → 401 `"Token não fornecido"`; non-Bearer/split failure → 401; `JWTError` or invalid `ObjectId` → 401 `"Token inválido"`. `verify_password` catches all exceptions → `False` (`backend/api/routes/auth.py:41-42`).
- **`DuplicateKeyError` → 400** on register race (`backend/api/routes/auth.py:129-132`); `init_database()` swallows index errors to log-only (`backend/api/db/init.py:18-19`).
- **Payment provider errors mapped to 502** with provider payload passthrough (`backend/api/routes/payment.py:157-175`); webhook validates `OASIS_WEBHOOK_TOKEN` → 401, missing `identifier` → 400, trusts only DB-stored `amount` not webhook payload (`backend/api/routes/payment.py:205-241`).
- **LLM fallback chain** (`backend/api/services/llm.py:61-83`): try `llama-3.3-70b-versatile` → `llama-3.1-*` → `mixtral-*`; non-model errors return inline `"Erro ao gerar interpretação: ..."` string instead of raising.
- **Frontend surfaces `detail` inline, never `alert()`** (`frontend/components/Chat.tsx:87-94`: `error.response?.data?.detail || 'Erro ao processar pergunta...'`; `frontend/app/page.tsx:45-46`: `setAuthError(error.response?.data?.detail || 'Erro ao fazer login')` rendered in `<p role="alert">`).
