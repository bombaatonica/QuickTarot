# Coding Conventions

**Analysis Date:** 2026-07-07

## Naming Patterns

**Files:**
- **Backend**: snake_case, module files match their function scope (e.g., `auth.py` for authentication routes, `tarot.py` for tarot service)
- **Frontend**: PascalCase for React components (e.g., `Chat.tsx`, `Message.tsx`, `BuyQuestionButton.tsx`), camelCase for utilities (e.g., `api.ts`, `tarot-data.ts`)
- **Models/Data**: PascalCase classes in backend (e.g., `UserCreate`, `TarotReading`), interfaces in frontend (e.g., `User`, `LoginData`, `TarotResponse`)

**Functions:**
- **Backend**: snake_case (e.g., `draw_cards()`, `verify_password()`, `get_database()`, `get_current_user()`)
- **Frontend**: camelCase (e.g., `handleLogin()`, `handleSend()`, `loadBalance()`, `scrollToBottom()`)
- **Handler functions**: prefix with `handle` in React components (e.g., `handleLogin`, `handleRegister`, `handleSend`)
- **Load/Fetch functions**: prefix with `load` or use async patterns (e.g., `loadBalance()`, `loadUser()`)

**Variables:**
- **Backend**: snake_case throughout (e.g., `user_id`, `hashed_password`, `current_balance`, `mongodb_uri`)
- **Frontend**: camelCase (e.g., `isAuthenticated`, `isLoading`, `showLogin`, `loginData`)
- **Constants**: UPPER_CASE in both (e.g., `ACCESS_TOKEN_EXPIRE_MINUTES`, `QUESTION_PRICE`, `ALGORITHM`)
- **State variables**: Use verb + noun pattern in React (e.g., `isLoading`, `showModal`, `showInterpretation`)

**Types:**
- **Backend**: Pydantic models for validation and serialization (e.g., `UserBase`, `UserCreate`, `UserLogin`, `Card`, `TarotReading`)
- **Frontend**: TypeScript interfaces for API contracts (e.g., `User`, `LoginData`, `TarotResponse`, `TarotCard`, `Message`)
- **Enums**: Used for fixed sets (e.g., `Suit` enum in `backend/api/models/tarot.py` with `WANDS`, `CUPS`, `SWORDS`, `PENTACLES`)

## Code Style

**Formatting:**
- No explicit ESLint or Prettier config found in frontend; Next.js lint enabled via `npm run lint` in `frontend/package.json`
- Python backend follows standard PEP8 conventions (implied by Flask best practices)
- Indentation: 2 spaces for TypeScript/React, 4 spaces for Python (standard)

**Linting:**
- **Frontend**: Next.js built-in linting (`next lint` command in `frontend/package.json`)
- **Backend**: No explicit linter configured; follows Flask conventions
- **TypeScript**: Strict mode enabled (`"strict": true` in `frontend/tsconfig.json`)

**Imports:**
- **Frontend**: Path aliases used (`@/*` resolves to project root) - see `frontend/tsconfig.json` line 21-23
  - Example: `import { chatApi, authApi, User } from '@/lib/api';` in `frontend/app/page.tsx` line 5
  - Example: `import Message from '@/components/Message';` in `frontend/components/Chat.tsx` line 4
- **Backend**: Relative imports with dot notation (e.g., `from ..routes.auth import require_auth` in `backend/api/routes/chat.py` line 2)
- **Organization**: No strict grouping visible, but imports ordered by external → internal packages

## Error Handling

**Backend Patterns:**
- Uses Flask's `abort()` function with HTTP status codes and descriptions
- Example: `abort(400, description="Email já cadastrado")` in `backend/api/routes/auth.py` line 101
- Example: `abort(402, description=f"Saldo insuficiente...")`  in `backend/api/routes/chat.py` line 31
- Returns boolean flags for soft failures (e.g., `deduct_balance()` returns `False` if insufficient funds in `backend/api/routes/payment.py` line 231)
- Try-except blocks for external API calls with specific exception handling:
  - `requests.exceptions.HTTPError` caught separately for API errors
  - `requests.exceptions.RequestException` for network issues
  - Generic `Exception` as final fallback
  - Example in `backend/api/routes/payment.py` lines 147-167

**Frontend Patterns:**
- Try-catch with fallback error display via alert or error messages in state
- Example: `catch (error: any) { alert(error.response?.data?.detail || 'Erro ao fazer login'); }` in `frontend/app/page.tsx` line 42
- Graceful degradation: if API fails, fall back to localStorage data
  - Example in `frontend/components/Chat.tsx` lines 27-39: loads balance from server, falls back to localStorage
- Promise rejection handling via axios interceptors for failed requests

## Logging

**Framework:** 
- **Frontend**: `console` API only (not explicitly shown, but standard React pattern)
- **Backend**: `print()` statements for stdout logging (simple integration tests use print in `test_backend.py` and `test_backend_import.py`)

**Patterns:**
- **Test files**: Verbose print statements documenting test flow (e.g., `print("=== TESTE DO BACKEND ===")` in `test_backend.py` line 9)
- **Backend services**: Minimal logging; relies on exception handling to surface errors
- **Frontend**: No explicit logging; relies on browser console and error alerts

## Comments

**When to Comment:**
- **Docstrings**: Used on service functions explaining purpose and parameters
  - Example: `"""Verifica se a senha corresponde ao hash usando bcrypt"""` in `backend/api/routes/auth.py` line 21
  - Example: `"""Sorteia 'count' cartas aleatórias do deck de tarot"""` in `backend/api/services/tarot.py` line 7
- **Inline comments**: Minimal; used to explain complex logic
  - Example: `# Aguardar um pouco para o backend iniciar` in `test_backend.py` line 21
  - Example: `# Formato: "Bearer <token>"` in `backend/api/routes/auth.py` line 59

**JSDoc/TSDoc:**
- No explicit JSDoc or TSDoc found in TypeScript components
- Interface definitions serve as documentation in `frontend/lib/api.ts`

## Function Design

**Size:**
- Functions generally 10-50 lines; keeps logic focused and readable
- Service functions like `generate_tarot_interpretation()` in `backend/api/services/llm.py` are ~40 lines including prompt construction
- Route handlers like `register()` and `login()` in `backend/api/routes/auth.py` are ~50-65 lines

**Parameters:**
- **Backend**: Use Pydantic models for complex inputs (e.g., `UserCreate` in register route)
- **Frontend**: Props interfaces for React components (e.g., `MessageProps`, `BuyQuestionButtonProps`)
- **Decorators**: Backend uses Flask decorators for route definition and auth requirement (`@bp.route()`, `@require_auth`)

**Return Values:**
- **Backend**: Flask routes return `jsonify()` responses with dicts/lists, service functions return plain Python objects
  - Example: `return jsonify({ "access_token": access_token, ...})` in `backend/api/routes/auth.py` line 122
- **Frontend**: Async functions return typed data via promises (e.g., `async getMe(): Promise<User>` in `frontend/lib/api.ts` line 78)

## Module Design

**Exports:**
- **Backend**: Flask Blueprints with `bp` naming convention
  - Example: `bp = Blueprint('auth', __name__)` in `backend/api/routes/auth.py` line 13
  - Registered in main app via `app.register_blueprint(auth.bp, url_prefix="/api/auth")` in `backend/api/main.py` line 25
- **Frontend**: Named exports for utilities (e.g., `export const authApi = { ... }` in `frontend/lib/api.ts` line 59)
  - Components exported as `export default` (e.g., `export default function Home()` in `frontend/app/page.tsx` line 7)

**Barrel Files:**
- **Backend**: Minimal use; each module imports directly from source
- **Frontend**: No barrel files observed; direct imports from files

## Cross-Cutting Concerns

**Authentication:**
- Backend: Custom decorator `@require_auth` wraps route handlers, extracts JWT from `Authorization` header
  - Example in `backend/api/routes/auth.py` lines 76-82
- Frontend: API interceptor adds token to every request, logout clears token/user from localStorage
  - Example in `frontend/lib/api.ts` lines 13-19

**State Synchronization:**
- Frontend: Multiple sources of truth pattern — localStorage, component state, and API response
  - Example: `Chat.tsx` updates `balance` from API response and syncs back to localStorage (lines 74-87)
  - Pattern: External prop from parent + internal state fallback (e.g., `BuyQuestionButton.tsx` line 22: `const balance = externalBalance !== undefined ? externalBalance : internalBalance`)

**Configuration:**
- Backend: Uses `.env` files loaded via `python-dotenv` at app startup
  - Example: `_dotenv_path = os.path.abspath(...)` in `backend/api/main.py` line 8
  - Environment variables accessed via `os.getenv()`
- Frontend: Environment variables prefixed with `NEXT_PUBLIC_` (e.g., `process.env.NEXT_PUBLIC_API_URL` in `frontend/lib/api.ts` line 3)

---

*Convention analysis: 2026-07-07*
