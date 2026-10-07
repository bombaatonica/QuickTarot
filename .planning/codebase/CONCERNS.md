# CONCERNS — Tech Debt & Risks
Date: 2026-10-07

Evidence-backed scan of `backend/` (Flask + MongoDB + Groq + OasisPay) and `frontend/` (Next.js 14 + axios). No secret values included — env var *names* only.

## Tech Debt (list with file:line refs)

- `backend/api/db/mongodb.py:14-27` — global mutable singleton (`client`/`db`) with lazy init, no timeout / pool / retry options, DB name parsed via `split('/')`. Fragile under serverless (Vercel) cold starts and concurrent workers.
- `backend/api/db/init.py:9-19` — `init_database()` catches all exceptions and only logs. App in `backend/api/main.py:20` boots without DB/indexes and fails later at request time.
- `backend/api/models/payment.py:11-12` — `created_at: datetime = datetime.utcnow()` evaluated once at import (classic Pydantic mutable-default bug); every `Transaction` shares same timestamp. Same naive-`utcnow` pattern in `backend/api/models/user.py:37`, `backend/api/routes/auth.py:57,125`, `backend/api/routes/chat.py:47`, `backend/api/db/transactions.py:44,52`.
- `backend/api/services/payment.py:48-50` — `get_charge_status()` is `raise NotImplementedError`. Dead compatibility shim; polling path never implemented.
- `backend/api/routes/payment.py:182-202` — `check-status/<id>` only returns local DB status, never queries OasisPay. If webhook is lost, payment stays `pending` forever (frontend times out locally but DB does not).
- `backend/api/db/transactions.py:18-21` — `create_transaction()` inserts raw dict with no `created_at`/`updated_at`, yet `backend/api/db/transactions.py:58` sorts by `created_at`. New rows from `backend/api/routes/payment.py:137-146` have no timestamp → sort misorders / nulls.
- `backend/api/services/payment.py:14` — gateway `base_url` hardcoded to `https://app.oasyfy.com/api/v1` (note spelling `oasyfy` vs `OasisPay`). No env override, no timeout on `requests.post` in `backend/api/services/payment.py:44`.
- `backend/api/routes/payment.py:113-119` — hardcoded placeholder PII `phone` / `document` sent to gateway because signup collects neither. Will fail real KYC validation and leaks test document pattern into prod payloads.
- `backend/api/routes/auth.py:19-29` — `JWT_SECRET` missing falls back to ephemeral `secrets.token_hex(32)` per process. Safe vs hardcode, but invalidates all sessions on every restart/scale-out; multi-instance deploys break auth.
- `backend/api/routes/auth.py:29` — `ACCESS_TOKEN_EXPIRE_MINUTES = 60*24*7` (7 days), no refresh-token rotation, no revocation list.
- `backend/requirements.txt:1-12` — mostly unpinned (`flask>=3.0.0`, `requests` bare, `qrcode[pil]` bare). Non-reproducible builds; `pymongo==4.6.0` pinned while Flask floats.
- `frontend/lib/api.ts:3` — `NEXT_PUBLIC_API_URL || 'http://localhost:8000'` fallback + `frontend/next.config.js:5` baking env at build time. Staging/prod misconfig silently hits localhost.
- `frontend/lib/api.ts:101,106`, `frontend/components/PixPaymentModal.tsx:22`, `frontend/app/page.tsx:45,60`, `frontend/components/Chat.tsx:87` — pervasive `any` for API responses/errors. No typed error contract; `detail` vs `error` vs `provider_response` handled ad-hoc (`frontend/components/PixPaymentModal.tsx:64`).
- `frontend/components/Chat.tsx:55,68,88` — message IDs from `Date.now()`. Collision under rapid send; React key instability.
- `backend/api/services/llm.py:54-59` — model allowlist hardcoded (`llama-3.3-70b-versatile`, etc.). Groq decommissions models frequently; fallback loop is the only mitigation, no config flag.
- `backend/api/index.py:1-3` — Vercel entry just `from api.main import app`; `backend/vercel.json:3-8` uses legacy `builds` + `routes` schema instead of current `functions`/`rewrites`. May break on Vercel runtime upgrades.
- Swallowed exceptions (broad `except Exception: return/abort` with no context): `backend/api/routes/auth.py:41,105,158`, `backend/api/routes/payment.py:162,178`, `backend/api/db/init.py:18`, `backend/api/services/llm.py:74-78`.
- Local artifact bloat: `backend/__pycache__/`, `backend/.pytest_cache/`, `frontend/.next/` present on disk. Covered by `.gitignore:3,14,46-49` but worth confirming none are tracked (`git ls-files` check pending).

## Known Bugs / Fragile Areas

- **Charged before LLM succeeds:** `backend/api/routes/chat.py:30-37` — `deduct_balance()` runs before `draw_cards()` + `generate_tarot_interpretation()`. LLM error string (`backend/api/services/llm.py:78,83`) is still saved as `interpretation` in `backend/api/routes/chat.py:40-49` and user is not refunded. No `try/except` around LLM + no compensation.
- **Invalid ObjectId → 500:** `backend/api/db/transactions.py:23-25,35-41`, `backend/api/routes/auth.py:192`, `backend/api/routes/payment.py:36,69,110` call `ObjectId(...)` without `is_valid` guard (auth check at `backend/api/routes/auth.py:81` is the only guard). Malformed `transaction_id` raises `bson.errors.InvalidId`, caught by generic 500 handler `backend/api/main.py:42-45` instead of 400/404.
- **Unused import = latent crash path:** `backend/api/routes/auth.py:11` imports `InvalidId` but never uses it — evidence the above guard was intended but not wired.
- **Webhook without token accepts everything:** `backend/api/routes/payment.py:213-215` — `if webhook_validation_token:` means unset token disables auth entirely. Any caller can POST `TRANSACTION_PAID` with arbitrary `identifier`; only saving grace is amount is taken from DB (`backend/api/routes/payment.py:228`) and pending-guard (`backend/api/routes/payment.py:232`).
- **Frontend expiry diverges from backend:** `frontend/components/PixPaymentModal.tsx:13-14,74-79` marks `expired` after 10 min locally, but backend has no expiry transition — `check-status` (`backend/api/routes/payment.py:193-202`) only returns `pending`. Reopening modal re-polls a still-`pending` row.
- **XSS mitigation is order-dependent:** `frontend/components/FormattedTarotText.tsx:17-18,93` escapes HTML then uses `dangerouslySetInnerHTML`. Correct today, but `text.slice(0, visibleChars)` in `frontend/components/FormattedTarotText.tsx:87` can split mid-entity (`&amp;`) during typewriter, briefly rendering broken entities; any future regex added before `escapeHtml` reopens XSS (LLM echoes user question per `backend/api/services/llm.py:24-27`).
- **Auth state split-brain:** balance cached in `localStorage` (`frontend/lib/api.ts:63-64,72-73,116-120`, `frontend/components/Chat.tsx:35-39,78-82`, `frontend/components/BuyQuestionButton.tsx:34-39`) and trusted as fallback in `frontend/components/Chat.tsx:30-41`. Stale balance shown when `/me` fails; no 401 interceptor to force re-login (`frontend/lib/api.ts:12-19` only attaches token).
- **`UserInDB.to_dict()` can mint a new id:** `backend/api/models/user.py:41` — `ObjectId(self.id) if valid else ObjectId()` silently generates a fresh id on bad input instead of raising.
- **No question validation:** `backend/api/routes/chat.py:19-25` checks non-empty only. No max length, no rate limit — a multi-KB question inflates prompt tokens (`backend/api/services/llm.py:24-51`) and cost per request.

## Security Notes (patterns, missing validation — names only, no secret values)

- Env-var surface (names only): `JWT_SECRET` (`backend/api/routes/auth.py:19`), `MONGODB_URI` (`backend/api/db/mongodb.py:18`), `GROQ_API_KEY` (`backend/api/services/llm.py:10`), `OASIS_PUBLIC_KEY` / `OASIS_SECRET_KEY` (`backend/api/routes/payment.py:23-24,94-95`), `OASIS_WEBHOOK_TOKEN` (`backend/api/routes/payment.py:27`), `ALLOW_TEST_CREDIT` (`backend/api/routes/payment.py:52`), `ALLOWED_ORIGINS` (`backend/api/main.py:23`), `NEXT_PUBLIC_API_URL` (`frontend/lib/api.ts:3`). `.env` files exist at repo root, `backend/`, `frontend/` — verify none are tracked (`.gitignore:20-22` excludes them, but local presence + OneDrive sync path warrants `git ls-files | grep env`).
- Test-only credit gate (`backend/api/routes/payment.py:52-53`) is env-flag security; if ever set `true` in prod, any authenticated user mints unlimited balance via `add-credit`. No role check, no audit log.
- User enumeration: `register` (`backend/api/routes/auth.py:112-113,130-132`) returns distinct `Email já cadastrado` vs generic login failure (`backend/api/routes/auth.py:166-169`). Low severity but enables email harvesting; consider uniform timing/response.
- No rate limiting / lockout / CAPTCHA on `register`/`login`/`tarot-question`; no request-size limit on chat; CORS allows credentials (`backend/api/main.py:24-28`) with origins from env defaulting to `http://localhost:3000` — review prod `ALLOWED_ORIGINS` for wildcard/over-broad entries.
- JWT stored in `localStorage` (`frontend/lib/api.ts:14,63`) — vulnerable to theft via any XSS. Mitigations in place: `escapeHtml` (`frontend/components/FormattedTarotText.tsx:17`), no `eval`/`innerHTML` elsewhere; still, `HttpOnly` cookie + short expiry would reduce blast radius.
- Webhook has no signature verification (plain token equality at `backend/api/routes/payment.py:214`), no replay/nonce check, no source-IP allowlist. Duplicate delivery is handled (`update_transaction_status_if_pending` at `backend/api/db/transactions.py:46-54`), but forged `identifier` enumeration is cheap.
- `verify_password`/`get_password_hash` (`backend/api/routes/auth.py:32-51`) use `bcrypt` correctly; `UserCreate` enforces `min_length=8` (`backend/api/models/user.py:13`) but no complexity / breach-list check. `UserLogin.password` (`backend/api/models/user.py:18`) has no length cap — very long passwords reach bcrypt (72-byte truncation caveat) without pre-trim/reject.
- Gateway client PII placeholders (`backend/api/routes/payment.py:117-118`) — test document value in code risks accidental submission to prod KYC and PII logging by provider.

## Performance Risks

- **Synchronous LLM blocks Flask worker:** `generate_tarot_interpretation` (`backend/api/services/llm.py:63-71`) does sequential `client.chat.completions.create` with no `timeout`, `max_tokens=1500`, `temperature=0.8`, up to 4 model attempts in a loop. Under latency, all gunicorn/flask workers saturate; no async, queue, streaming, or caching. Combined with pre-charge (above), slow LLM = paid-for timeouts.
- **Prompt error-path string matching:** `backend/api/services/llm.py:77` branches on `"decommissioned" in error_str.lower()` — brittle; any non-model error containing word `model` retries needlessly, other transient errors return user-facing error text immediately with no retry/backoff.
- **Frontend poll storm:** `frontend/components/PixPaymentModal.tsx:13,74` polls `checkStatus` every 5 s up to 10 min per open modal. Many concurrent buyers = sustained GET load on an endpoint that does two DB reads with no index guarantee on `_id` beyond default (secondary indexes at `backend/api/db/transactions.py:10-16` lack `unique=True` on `identifier`/`charge_id`).
- **Typewriter re-render churn:** `frontend/components/FormattedTarotText.tsx:72-81,86-89` re-runs full regex `processMarkdown` every 12 ms × 4 chars. Long interpretations (~1500 tokens) cause sustained main-thread work on low-end mobile; `useMemo` dep on `visibleChars` invalidates each tick.
- **Unbounded reads:** `get_user_transactions` (`backend/api/db/transactions.py:56-58`) has no `limit`; `readings` insert (`backend/api/routes/chat.py:40-49`) has no pagination/cap per user. History endpoints (when added) will degrade.
- **MongoDB connection:** `MongoClient(mongodb_uri)` (`backend/api/db/mongodb.py:23`) with driver defaults — no `serverSelectionTimeoutMS`, `maxPoolSize`, or TLS options explicit. Serverless bursts may exhaust connections.
- **No CDN/caching headers** for static tarot data (`frontend/data/tarot-data.ts`) and card components (`frontend/components/TarotCards.tsx`, `AnimatedTarotCard.tsx`); images (if any) served without `next/image` optimization.

## Suggested Next Investigation

1. Confirm `.env` untracked + rotate any exposed credentials: `git ls-files | grep -i env; git log --all --full-history -- "*\.env*"`; verify `backend/.env`, `frontend/.env`, root `.env` ignored per `.gitignore:20-22`.
2. Reproduce invalid-ObjectId 500s: `GET /api/payment/check-status/not-an-id`, `GET /api/auth/me` with malformed `sub`; add `ObjectId.is_valid` guards + tests (see `backend/tests/conftest.py:39-49` fixture pattern).
3. Close charge-then-fail gap: wrap `backend/api/routes/chat.py:34-49` LLM+insert in try/except with refund (`$inc` balance) or move `deduct_balance` after successful LLM; add regression test in `backend/tests/test_chat.py`.
4. Harden webhook: require `OASIS_WEBHOOK_TOKEN` in prod (fail-closed), add HMAC/signature check if provider supports it, add `unique` index on `identifier` (`backend/api/db/transactions.py:10-16`).
5. Add rate limiting (e.g. Flask-Limiter) on `/api/auth/*` and `/api/chat/tarot-question`, plus `max_length` on `question` and request-size cap.
6. Fix Pydantic timestamps: use `Field(default_factory=datetime.utcnow)` (or timezone-aware `datetime.now(timezone.utc)`) in `backend/api/models/payment.py:11-12`; backfill missing `created_at` on `transactions`.
7. Pin `backend/requirements.txt` fully (`pip freeze`), add `timeout` to Groq + `requests` calls, make Oasis `base_url` env-configurable, replace placeholder `phone`/`document` with real signup fields or provider test-mode flag.
8. Frontend: add axios 401 interceptor + typed error union; replace `Date.now()` keys with `crypto.randomUUID()`; debounce poll with exponential backoff and stop on unmount already done (`frontend/components/PixPaymentModal.tsx:29-46`) — extend with `visibilitychange` pause.
