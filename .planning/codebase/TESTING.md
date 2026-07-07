# Testing Patterns

**Analysis Date:** 2026-07-07

## Test Framework

**Runner:**
- **Backend**: No formal test framework (pytest, unittest); uses manual integration test scripts
- **Frontend**: No test framework; no tests exist
- Config: No pytest.ini, setup.cfg, or test configuration files present

**Assertion Library:**
- Manual assertions using `if` statements and print statements in test scripts
- HTTP status code validation (e.g., `if response.status_code == 200:` in `test_backend.py` line 28)
- isinstance() checks for type validation (e.g., `if isinstance(app, Flask):` in `test_backend_import.py` line 32)

**Run Commands:**
```bash
# Backend integration test (manual process startup + health check)
python test_backend.py

# Backend import validation test (module and route verification)
python test_backend_import.py

# Frontend development
npm run dev          # from frontend/

# Frontend build
npm run build        # from frontend/

# Frontend lint
npm run lint         # from frontend/
```

## Test File Organization

**Location:**
- Test files at repository root: `test_backend.py` and `test_backend_import.py`
- No tests for frontend
- No tests under `backend/` or `frontend/` directories
- No pytest configuration or test discovery setup

**Naming:**
- Pattern: `test_<system>.py` (e.g., `test_backend.py`, `test_backend_import.py`)
- No `__pycache__` or `.pytest_cache` in gitignore

**Structure:**
```
QuickTarot/
├── test_backend.py           # Integration test
├── test_backend_import.py     # Module import validation
├── backend/
├── frontend/
└── .planning/
```

## Test Structure

**Suite Organization:**

Test files are standalone scripts with a single `main()` function:

```python
def test_backend():
    try:
        print("=== TESTE DO BACKEND ===")
        # Steps...
    except subprocess.CalledProcessError as e:
        print(f"Erro ao executar aplicação: {e}")

if __name__ == "__main__":
    test_backend()
```

**Patterns:**

1. **Setup phase** (lines 9-19 in `test_backend.py`):
   - Install dependencies via pip
   - Start backend process with `subprocess.Popen()`
   - Wait for process initialization with `time.sleep()`

2. **Test phase** (lines 24-33):
   - Make HTTP request to health endpoint
   - Validate response status code
   - Print ✅/❌ results

3. **Teardown phase** (lines 35-38):
   - Terminate process with `backend_process.terminate()`
   - Wait for cleanup with `backend_process.wait()`

Example from `test_backend_import.py`:

```python
def test_backend_import():
    try:
        print("=== TESTE DE IMPORTAÇÃO DO BACKEND ===")
        print("1. Instalando dependências...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "backend/requirements.txt"])
        
        print("\n2. Testando importação dos módulos...")
        try:
            # Import modules
            import pymongo
            from flask import Flask
            # ... more imports
            print("✅ Módulos importados com sucesso!")
        except Exception as e:
            print(f"❌ Erro ao importar módulos: {e}")
    except subprocess.CalledProcessError as e:
        print(f"Erro ao executar aplicação: {e}")
```

## Mocking

**Framework:** 
- No mocking framework present (unittest.mock not used)
- Manual test isolation via subprocess spawning

**Patterns:**
- Subprocess spawning for true integration testing (not mocking)
  - `subprocess.Popen()` starts real backend server (test_backend.py line 14-19)
  - Process runs with real file I/O, network ports, environment
- Real HTTP requests via `requests` library (not mocked)
  - `requests.get("http://localhost:8000/health")` in `test_backend.py` line 27

**What to Mock:**
- Currently: nothing is mocked; all tests are integration tests
- Future mocking candidates: external APIs (Groq LLM, OasisPay payment service)
- Currently these are tested via real API calls during development

**What NOT to Mock:**
- Database connections (not tested in current test suite)
- Flask app routes (tests import and check real app)
- HTTP layer (real subprocess and HTTP requests used)

## Fixtures and Factories

**Test Data:**
- No fixtures or factories found
- Tests use hardcoded test values when needed (e.g., in `test_backend_import.py`, imports are real dependency modules)
- No test database setup/teardown

**Location:**
- No dedicated fixtures directory
- Tests are self-contained in single files

## Coverage

**Requirements:** 
- No coverage enforcement; no coverage target defined
- No coverage measurement tools configured

**View Coverage:**
- No coverage command available; manual verification only by running tests

## Test Types

**Unit Tests:**
- Not present; no isolated function-level tests
- Would need to mock MongoDB, Flask request context, and external APIs

**Integration Tests:**
- **Backend Integration** (`test_backend.py`):
  - Starts real Flask server on localhost:8000
  - Installs real dependencies
  - Validates health endpoint response
  - Scope: End-to-end HTTP request/response cycle
  
- **Import Validation** (`test_backend_import.py`):
  - Tests that all required packages can be imported
  - Validates Flask app is properly instantiated
  - Checks that registered routes exist and are accessible
  - Tests: pymongo, flask, flask-cors, python-dotenv, and app routes
  - Lists all registered routes for verification

**E2E Tests:**
- Not present; no E2E testing framework (Playwright, Cypress, Selenium) configured
- Frontend has no test infrastructure

## Common Patterns

**Async Testing:**
- Backend: Synchronous routes; no async/await pattern in Flask code
- Frontend: useState hooks used for async operations
  - Pattern: `const [isLoading, setIsLoading] = useState(false)` followed by try-catch in handler
  - Example in `frontend/components/Chat.tsx` lines 18, 49-61
- Manual async handling via promises in API calls (`async/await` in frontend lib functions)

**Error Testing:**
- Backend: Routes validate inputs and call `abort()` with appropriate HTTP codes
  - Example: `abort(400, description="Dados inválidos: 'question' é obrigatório")` in `backend/api/routes/chat.py` line 21
  - Example: `abort(402, description=f"Saldo insuficiente...")`  in `backend/api/routes/chat.py` line 31
- Frontend: Try-catch blocks with user-facing error messages
  - Example in `frontend/app/page.tsx` lines 35-44: login error caught and displayed via alert
  - Example in `frontend/components/Chat.tsx` lines 88-94: API error with fallback message

**Process Management (test-specific):**
- `subprocess.Popen()` for background process spawning (test_backend.py line 14)
- `subprocess.check_call()` for dependency installation (both test files line 11 and line 9)
- `time.sleep()` for timing-based waits (test_backend.py line 22)

## Gap Analysis

**Missing Test Coverage:**
- Database layer: No tests for MongoDB connections, queries, or transactions
- Authentication: No tests for JWT token validation, password hashing, or authorization
- Services: No tests for Groq LLM integration, tarot card drawing, payment processing
- Frontend: No component tests, no state management tests, no integration tests
- Error scenarios: No explicit tests for edge cases (empty questions, invalid amounts, missing tokens)
- Concurrency: No load testing or concurrent request handling verification

**Recommendations for Expansion:**
1. Add pytest-based unit tests with mocking for backend services
2. Add integration tests for database operations
3. Add E2E tests for full user flows (register → ask question → payment)
4. Add frontend component tests with React Testing Library or Vitest
5. Add API contract tests to validate request/response schemas
6. Document manual testing procedures for external services (Groq, OasisPay)

---

*Testing analysis: 2026-07-07*
