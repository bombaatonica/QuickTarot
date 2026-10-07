# TESTING — Test Structure & Practices
Date: 2026-10-07

## Framework & Runner

- **Backend:** `pytest>=8.0.0` + `mongomock>=4.1.0` (only entries in `backend/requirements-dev.txt:1-2`). Flask test client via `flask_app.test_client()` (`backend/tests/conftest.py:36`). No coverage plugin, no `pytest.ini`/`pyproject.toml` config — defaults apply.
- **Frontend:** `@playwright/test@^1.61.1` E2E only (`frontend/package.json:20`, script `frontend/package.json:10` `"test:e2e": "playwright test"`). Config in `frontend/playwright.config.ts:3-29`: `testDir: './e2e'`, `timeout: 60_000`, `fullyParallel: true`, `baseURL: http://localhost:3100`, projects `desktop` (Desktop Chrome 1280×800) + `mobile` (Pixel 7), `webServer: npm run dev -- -p 3100` with `reuseExistingServer: true`. No unit runner (no Jest/Vitest) — `frontend/package.json` has no `test` script besides `test:e2e` and `typecheck`.
- **No CI config:** no `.github/` workflows, no lint/typecheck gate in repo (verified via glob).

## Test Layout (where tests live)

- **Backend** — `backend/tests/` (4 files):
  - `backend/tests/conftest.py` — env setup + fixtures (sets `JWT_SECRET`, injects `mongomock`, `clean_db`, `client`, `registered_user`, `auth_headers`).
  - `backend/tests/test_auth.py` (100 lines) — classes `TestRegister` / `TestLogin` / `TestMe` (14 cases: success, duplicate email, short password, invalid email, empty body, bcrypt hash check, wrong password, unknown email, JSON-`detail` shape, `/me` auth variants).
  - `backend/tests/test_chat.py` (89 lines) — class `TestTarotQuestion` (7 cases: requires auth, 402 insufficient balance, empty/missing question, successful 9-card reading + `balance == 4.0`, history persisted, cards unique).
  - `backend/tests/test_payment.py` (155 lines) — classes `TestBalance` / `TestAddCredit` / `TestDeductBalance` / `TestWebhook` / `TestCheckStatus` (15 cases incl. `ALLOW_TEST_CREDIT` gate, webhook double-spend, token validation).
  - `backend/tests/__init__.py` — empty package marker.
- **Frontend** — `frontend/e2e/` (5 files):
  - `frontend/e2e/mocks.ts` — shared `mockUser`, 9-card `mockCards` (names must match `frontend/data/tarot-data.ts`), `mockInterpretation`, `fulfillJson` route helper (CORS + OPTIONS aware), `loginAs` (localStorage token + `/api/auth/me` mock).
  - `frontend/e2e/auth.spec.ts` (76 lines) — 6 tests: login screen, login→chat, wrong-credential inline error (`role=alert`), register→chat, bad token→login, valid session→chat + balance `5,00`.
  - `frontend/e2e/chat.spec.ts` (76 lines) — 5 tests: welcome + price, 9-card reveal + interpretation + balance `4,00`, 402 insufficient-balance message, 500 keeps UI usable, empty input disables `Enviar`.
  - `frontend/e2e/payment.spec.ts` (107 lines) — 5 tests: min-value `R$ 2,00` inline validation, Pix QR + copia-e-cola, paid→modal closes + balance `15,00` (20s timeout for 5s polling), 502 provider error inline, modal cancel resets.
  - `frontend/e2e/ui.spec.ts` (96 lines) — 6 visual/screenshot tests writing to `e2e/screenshots/<project>-*.png` (login, registro, chat-vazio, tiragem, modal-valor/qrcode, login-erro).

## Mocking & Fixtures

- **Backend `mongomock` instead of real Mongo** (`backend/tests/conftest.py:13-15`):
```python
_mock_client = mongomock.MongoClient()
mongodb.client = _mock_client
mongodb.db = _mock_client["quicktarot_test"]
```
`clean_db` autouse fixture wipes every collection per test (`backend/tests/conftest.py:27-31`); `registered_user` registers `user@test.com` / `senha12345` and returns `(headers, user)` (`backend/tests/conftest.py:39-49`).
- **LLM never called in tests** — `monkeypatch` replaces the symbol imported into the route module (`backend/tests/test_chat.py:9-16`):
```python
monkeypatch.setattr(chat_module, "generate_tarot_interpretation",
    lambda question, cards: FAKE_INTERPRETATION)
```
- **Env/feature-flag control via `monkeypatch`** (`backend/tests/test_payment.py:24-37`): `monkeypatch.delenv("ALLOW_TEST_CREDIT")` → 403; `monkeypatch.setenv("ALLOW_TEST_CREDIT","true")` → 200; `monkeypatch.setattr(payment_module, "webhook_validation_token", "segredo")` for webhook auth tests.
- **Frontend network interception, no backend** (`frontend/e2e/mocks.ts:44-63`): `page.route('**/api/...', fulfillJson(...))` + `loginAs(page)` seeding `localStorage`. Selectors are accessible-role based: `getByRole`, `getByLabel('Email')`, `getByPlaceholder('Faça sua pergunta ao oráculo...')`, `getByTestId('balance')`, `getByAltText(card.name)` / `'QR Code Pix'`.

## Coverage & Gaps

- **Well covered:** auth register/login/me + bcrypt hashing (`backend/tests/test_auth.py:39-46` asserts `$2` prefix); tarot price deduction, 9-card uniqueness, history write (`backend/tests/test_chat.py:48-89`); webhook security — credits DB-stored amount not payload amount, duplicate webhook credits once, `pending→paid` atomic transition (`backend/tests/test_payment.py:73-104`); E2E happy paths + 401/402/500 inline-error UX (`frontend/e2e/chat.spec.ts:46-70`, `frontend/e2e/auth.spec.ts:27-40`).
- **Gaps (no tests found):**
  - `backend/api/services/tarot.py:17-29` (`format_cards_for_llm`), `backend/api/services/llm.py` fallback loop, `backend/api/services/payment.py` (`receive_pix`, `generate_qr_code`) — no unit tests; `create-pix` success path untested (only webhook/check-status covered).
  - `backend/api/db/mongodb.py`, `backend/api/db/init.py`, `backend/api/db/transactions.py` helpers (except via integration) — no direct tests.
  - Frontend has zero unit/component tests (no Jest/Vitest); `frontend/components/*` (`AnimatedTarotCard`, `TarotCards`, `FormattedTarotText`, `PixPaymentModal`, `BuyQuestionButton`) covered only indirectly via Playwright.
  - No coverage thresholds, no mutation/load tests, no contract tests for `OasisPay`/`Groq`; screenshot tests in `frontend/e2e/ui.spec.ts` produce artifacts but assert little beyond visibility.

## How To Run Tests (commands)

```bash
# Backend (from backend/): install + run full suite
pip install -r requirements.txt -r requirements-dev.txt
pytest -v
# single file / single test
pytest tests/test_auth.py -v
pytest tests/test_payment.py::TestWebhook -v

# Frontend (from frontend/): E2E spins its own dev server on :3100
npm install
npm run test:e2e              # all specs, both projects
npx playwright test e2e/chat.spec.ts        # one file
npx playwright test e2e/auth.spec.ts --project=desktop
# static checks (no unit tests exist)
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
```
