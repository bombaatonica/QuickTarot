# STACK — Tech Stack
Date: 2026-10-07

Monorepo with two deployables: Next.js frontend + Flask Python backend, shared tarot-card dataset. Deployed as two Vercel projects (`frontend/vercel.json`, `backend/vercel.json`).

## Languages & Runtimes (with versions + where configured)

- **Python 3.9+ required, 3.13.6 running locally**
  - Required floor documented in `SETUP.md` ("Python 3.9+").
  - Verified runtime via `python --version` → `Python 3.13.6`.
  - Backend entrypoints: `backend/api/main.py` (Flask app `app`), `backend/api/index.py` (Vercel serverless shim `from api.main import app`).
  - Local run: `python -m flask --app api.main:app run --port 8000 --debug` (see `README.md`, `SETUP.md`, `INSTALLACAO.md`).
- **Node.js 18+ required, v22.14.0 running locally / npm 11.17.0**
  - Required floor in `SETUP.md` ("Node.js 18+").
  - Verified via `node --version` / `npm --version`.
- **TypeScript ^5 (see `frontend/package.json`)**
  - Compiler config in `frontend/tsconfig.json`: `target: es5`, `strict: true`, `jsx: preserve`, `moduleResolution: bundler`, path alias `@/* -> ./*`, `include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"]`.
  - Type-check script: `npm run typecheck` → `tsc --noEmit` (`frontend/package.json`).
  - Types in `frontend/next-env.d.ts` (Next.js generated).
- **JavaScript (ESNext) for config files**
  - Example: `frontend/next.config.js`, `frontend/postcss.config.js` are plain CommonJS modules.

## Frameworks (frontend/backend with versions)

- **Frontend: Next.js ^14.2.0 (App Router) — `frontend/package.json`**
  - App dir: `frontend/app/layout.tsx`, `frontend/app/page.tsx` (client component, auth gate → `<Chat />`), `frontend/app/globals.css`.
  - Config: `frontend/next.config.js` sets `reactStrictMode: true` and exposes `env.NEXT_PUBLIC_API_URL` with fallback `http://localhost:8000`, e.g.:
    ```js
    env: { NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000' }
    ```
  - Vercel frontend config in `frontend/vercel.json`: `{"framework":"nextjs","buildCommand":"npm run build","outputDirectory":".next"}`.
- **UI: React ^18.2.0 + React-DOM ^18.2.0 — `frontend/package.json`**
  - Client components use `'use client'` pragma, e.g. `frontend/components/Chat.tsx`, `frontend/components/PixPaymentModal.tsx`, `frontend/components/BuyQuestionButton.tsx`, `frontend/components/TarotCards.tsx`, `frontend/components/AnimatedTarotCard.tsx`, `frontend/components/Message.tsx`, `frontend/components/FormattedTarotText.tsx`.
  - Styling via Tailwind (see below), no MUI/Chakra.
- **Backend: Flask >=3.0.0 — `backend/requirements.txt`**
  - App factory inline in `backend/api/main.py`: creates `Flask(__name__)`, registers blueprints:
    ```python
    app.register_blueprint(auth.bp, url_prefix="/api/auth")
    app.register_blueprint(payment.bp, url_prefix="/api/payment")
    app.register_blueprint(chat.bp, url_prefix="/api/chat")
    ```
  - Routes: `backend/api/routes/auth.py` (`/register`, `/login`, `/me`), `backend/api/routes/payment.py` (`/balance`, `/add-credit`, `/create-pix`, `/check-status/<id>`, `/webhook`), `backend/api/routes/chat.py` (`/tarot-question`).
  - Blueprint index in `backend/api/routes/__init__.py`; package markers `backend/api/__init__.py`, `backend/api/models/__init__.py`, `backend/api/services/__init__.py`, `backend/api/db/__init__.py`.
  - Vercel Python runtime in `backend/vercel.json`: `src: api/index.py` with `use: @vercel/python`, catch-all route `/(.*) -> api/index.py`.
  - CORS via `flask-cors>=4.0.0` configured in `backend/api/main.py` from `ALLOWED_ORIGINS` env, `supports_credentials=True`.
  - NOTE: `README.md` and `SETUP.md` (deploy section) still say "FastAPI" — stale docs; actual code is Flask (no `fastapi`, no `uvicorn`, no `mangum` in `backend/requirements.txt`).

## Key Dependencies (grouped, with purpose)

Frontend runtime (`frontend/package.json` → `dependencies`):
- `axios@^1.6.2` — HTTP client; singleton in `frontend/lib/api.ts` with `baseURL = NEXT_PUBLIC_API_URL` + request interceptor injecting `localStorage.getItem('token')` as `Bearer`, exports `authApi`, `paymentApi`, `chatApi`.
- `next@^14.2.0`, `react@^18.2.0`, `react-dom@^18.2.0` — SSR/SSG + UI.

Frontend dev (`frontend/package.json` → `devDependencies`):
- `typescript@^5`, `@types/node@^20`, `@types/react@^18`, `@types/react-dom@^18` — typing.
- `tailwindcss@^3.3.0`, `autoprefixer@^10.0.1`, `postcss@^8` — styling pipeline; config `frontend/tailwind.config.ts` (content globs `./pages/**`, `./components/**`, `./app/**`; custom `bordeaux`/`gold` palettes, `gold-glow` shadows, `fadeIn/shimmer/orbPulse` keyframes), `frontend/postcss.config.js` (`tailwindcss: {}, autoprefixer: {}`).
- `@playwright/test@^1.61.1` — E2E; config `frontend/playwright.config.ts` (`testDir: ./e2e`, `baseURL: http://localhost:3100`, projects `desktop` + `mobile/Pixel 7`); specs `frontend/e2e/auth.spec.ts`, `frontend/e2e/chat.spec.ts`, `frontend/e2e/payment.spec.ts`, `frontend/e2e/ui.spec.ts`, mocks `frontend/e2e/mocks.ts`.

Backend runtime (`backend/requirements.txt`):
- `flask>=3.0.0`, `flask-cors>=4.0.0` — API + CORS (`backend/api/main.py`).
- `pymongo==4.6.0` — MongoDB driver; used in `backend/api/db/mongodb.py` (`MongoClient`), `backend/api/db/transactions.py`, `backend/api/db/init.py`.
- `python-dotenv==1.0.0` — `.env` loading in `backend/api/main.py` (`load_dotenv(dotenv_path=../.env)` + `load_dotenv()`) and `backend/api/db/mongodb.py`.
- `python-jose[cryptography]==3.3.0` + `bcrypt>=4.0.0` — auth in `backend/api/routes/auth.py` (`jwt.encode/decode HS256`, `bcrypt.hashpw/checkpw`, 7-day `ACCESS_TOKEN_EXPIRE_MINUTES`).
- `groq>=0.4.0` — LLM client in `backend/api/services/llm.py` (`Groq(api_key=...)`, `client.chat.completions.create`, fallback chain `llama-3.3-70b-versatile` → `llama-3.1-70b-versatile` → `llama-3.1-8b-instant` → `mixtral-8x7b-32768`).
- `pydantic>=2.11.7,<3.0.0`, `pydantic-settings>=2.3.0`, `email-validator>=2.0.0` — validation; models `backend/api/models/user.py` (`UserCreate` with `EmailStr` + `password min_length=8`), `backend/api/models/tarot.py` (`Card`, `Suit`, `TAROT_DECK` 78 cards), `backend/api/models/payment.py` (`Transaction`).
- `requests` — outbound HTTPS to OasisPay in `backend/api/services/payment.py` (`requests.post(url, json=payload, headers=...)` to `https://app.oasyfy.com/api/v1/gateway/pix/receive`).
- `qrcode[pil]` — QR PNG base64 in `backend/api/services/payment.py` (`generate_qr_code()` → `data:image/png;base64,...`).

Backend dev/test (`backend/requirements-dev.txt`):
- `pytest>=8.0.0`, `mongomock>=4.1.0` — tests in `backend/tests/` (`test_auth.py`, `test_chat.py`, `test_payment.py`, `conftest.py` injects `mongomock.MongoClient` into `backend/api/db/mongodb.py` before app import).

Tarot data (no package, vendored JSON + TS mirror):
- `tarot-json/tarot.json`, `tarot-json/tarot-images.json`, `tarot-json/cards/` (RWS scans, see `tarot-json/README.md`).
- Frontend mirror `frontend/data/tarot-data.ts` (78 entries with `namePt`, `image_url: /tarot-cards/*.jpg`), static serving from `public/tarot-cards/` and `frontend/public/`.

## Configuration (env files, config files, build tools)

- Env files (gitignored per `.gitignore` → `.env`, `.env.local`, `.env*.local`):
  - `backend/.env` — backend secrets/config (keys only, see INTEGRATIONS.md).
  - `frontend/.env` (+ documented `.env.local` variant in `SETUP.md`) — holds `NEXT_PUBLIC_API_URL`.
  - Root `.env` — duplicate of backend keys used for local tooling.
  - No `.env.example` files exist (checked root, `backend/`, `frontend/`).
- Flask config: `backend/api/main.py` (CORS origins, error handlers returning `{"detail": ...}`, `/` and `/health` routes); DB bootstrap `backend/api/db/init.py` (`init_database()` creates `users.email unique` + transaction indexes, failure → log not crash).
- Next config: `frontend/next.config.js`; TS: `frontend/tsconfig.json`; Tailwind: `frontend/tailwind.config.ts`; PostCSS: `frontend/postcss.config.js`; Playwright: `frontend/playwright.config.ts`; Vercel: `frontend/vercel.json` + `backend/vercel.json`.
- Build tools: `pip` + `backend/setup.py` (`pip install -r requirements.txt` wrapper) and `backend/requirements.txt`; `npm` + `frontend/package-lock.json`; `tsc`, `next build`, `pytest`, `playwright test`.
- Hosting: Vercel dual-project (Python serverless + Next.js). Local dev ports: backend `:8000`, frontend `:3000` (E2E uses `:3100` per `frontend/playwright.config.ts`).

## Package Managers & Scripts (key npm/pip scripts)

- `frontend/package.json` scripts (run from `frontend/` via npm):
  - `npm run dev` → `next dev` (E2E overrides port: `npm run dev -- -p 3100` in `frontend/playwright.config.ts` → `webServer.command`).
  - `npm run build` → `next build` (also `frontend/vercel.json` → `buildCommand`).
  - `npm start` → `next start`.
  - `npm run lint` → `next lint`.
  - `npm run typecheck` → `tsc --noEmit`.
  - `npm run test:e2e` → `playwright test` (specs in `frontend/e2e/`).
  - Install: `npm install` (see `SETUP.md`, `INSTALLACAO.md`, `PAYMENT_SETUP.md`; Windows EPERM workaround in `INSTALLACAO.md`: `taskkill /f /im node.exe`, `npm cache clean --force`).
- Backend (run from `backend/` via pip/flask/pytest):
  - `pip install -r requirements.txt` — prod deps (`backend/requirements.txt`); dev adds `pip install -r requirements-dev.txt` (`backend/requirements-dev.txt` → `pytest`, `mongomock`).
  - `pip install --upgrade "pydantic>=2.11.7,<3.0.0" "pydantic-settings>=2.3.0"` first on conflict (per `INSTALLACAO.md`), then `pip install -r requirements.txt`.
  - `python setup.py` — thin wrapper calling `pip install -r requirements.txt` (`backend/setup.py`).
  - `python -m flask --app api.main:app run --port 8000 --debug` — local API (`README.md`, `SETUP.md`, `INSTALLACAO.md`).
  - `python -c "from api.db.init import init_database; init_database()"` — create Mongo indexes (`PAYMENT_SETUP.md`, impl `backend/api/db/init.py`).
  - `pytest` — backend suite (`backend/tests/test_auth.py`, `backend/tests/test_chat.py`, `backend/tests/test_payment.py` with fixtures in `backend/tests/conftest.py`).
