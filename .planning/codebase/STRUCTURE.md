# Codebase Structure

**Analysis Date:** 2026-07-07

## Directory Layout

```
QuickTarot/
├── backend/                        # Flask API server
│   ├── api/
│   │   ├── main.py                # Flask app entry point + blueprint registration
│   │   ├── __init__.py
│   │   ├── routes/                # HTTP endpoint handlers (3 blueprints)
│   │   │   ├── auth.py            # /api/auth/* - registration, login, current user
│   │   │   ├── payment.py         # /api/payment/* - balance, payments, webhooks
│   │   │   ├── chat.py            # /api/chat/* - tarot question endpoint
│   │   │   └── __init__.py
│   │   ├── services/              # Business logic layer
│   │   │   ├── tarot.py           # Card drawing + formatting
│   │   │   ├── llm.py             # Groq API calls for interpretation
│   │   │   ├── payment.py         # OasisPay API wrapper
│   │   │   └── __init__.py
│   │   ├── db/                    # Data access layer
│   │   │   ├── mongodb.py         # MongoDB connection singleton
│   │   │   ├── transactions.py    # Transaction CRUD operations
│   │   │   ├── init.py
│   │   │   └── __init__.py
│   │   ├── models/                # Pydantic schemas for validation
│   │   │   ├── user.py            # User, UserCreate, UserLogin, UserInDB
│   │   │   ├── tarot.py           # Card, Suit, TarotReading
│   │   │   ├── payment.py         # Transaction model
│   │   │   └── __init__.py
│   ├── requirements.txt           # Python dependencies
│   ├── setup.py                   # Dependency installer script
│   └── .env                       # Environment variables (not committed)
│
├── frontend/                       # Next.js 14 React app
│   ├── app/
│   │   ├── page.tsx               # Root page - auth check + renders Chat
│   │   ├── layout.tsx             # HTML structure + metadata
│   │   └── globals.css            # Global styles
│   ├── components/                # Reusable React components
│   │   ├── Chat.tsx               # Main chat interface + message history
│   │   ├── Message.tsx            # Individual message display
│   │   ├── BuyQuestionButton.tsx  # Balance + credit purchase modal
│   │   ├── PixPaymentModal.tsx    # QR code display for Pix
│   │   ├── AnimatedTarotCard.tsx  # Card animation display
│   │   ├── TarotCards.tsx         # Card grid layout
│   │   ├── TypewriterText.tsx     # Text animation effect
│   │   └── FormattedTarotText.tsx # Parse + format LLM response
│   ├── lib/
│   │   └── api.ts                 # Axios instance + API functions (authApi, paymentApi, chatApi)
│   ├── data/
│   │   └── tarot-data.ts          # Portuguese tarot card metadata (names, images, meanings)
│   ├── public/
│   │   └── tarot-cards/           # Card images (m00.jpg - m21.jpg, s01-s10, c01-c10, etc.)
│   ├── package.json               # npm dependencies + scripts
│   ├── tailwind.config.ts         # Tailwind CSS configuration
│   ├── tsconfig.json              # TypeScript configuration
│   ├── .next/                     # Build output (not committed)
│   └── next.config.js             # Next.js configuration
│
├── tarot-json/                     # Card data repository (JSON files)
│   └── cards/                     # Standardized tarot deck JSON
│
├── public/                         # Static assets (public CDN)
│   └── tarot-cards/               # Card images
│
├── .env                            # Root environment variables
├── .env.example                    # Template for environment variables
├── .gitignore                      # Git exclusions
├── .cursor/                        # Cursor IDE config
├── .vscode/                        # VS Code config
├── README.md                       # Project overview
├── SETUP.md                        # Setup instructions
├── INSTALLACAO.md                  # Portuguese installation guide
├── GROQ_SETUP.md                   # Groq API setup
├── PAYMENT_SETUP.md                # OasisPay setup
└── test_backend*.py                # Manual backend tests
```

## Directory Purposes

**`backend/api/routes/`:**
- Purpose: HTTP endpoint definitions and request/response handling
- Contains: Flask blueprints with `@bp.route()` decorators
- Key files: `auth.py` (authentication), `payment.py` (payments), `chat.py` (tarot core)
- Import pattern: Routes import from services and db layers

**`backend/api/services/`:**
- Purpose: Business logic implementation, external API calls
- Contains: Pure functions and service classes
- Key files: `tarot.py` (card logic), `llm.py` (Groq integration), `payment.py` (OasisPay wrapper)
- Import pattern: Services import from models; routes call services

**`backend/api/db/`:**
- Purpose: Database connection and data access operations
- Contains: MongoDB client initialization, collection operations
- Key files: `mongodb.py` (connection), `transactions.py` (CRUD)
- Import pattern: Routes and services call db functions

**`backend/api/models/`:**
- Purpose: Data validation and type definitions
- Contains: Pydantic BaseModel schemas for request/response validation
- Key files: `user.py`, `tarot.py`, `payment.py`
- Import pattern: Routes use models to validate request.get_json()

**`frontend/app/`:**
- Purpose: Next.js App Router entry point and root layout
- Contains: Root page.tsx (auth + Chat), layout.tsx (HTML), globals.css
- Key files: `page.tsx` (authentication logic), `layout.tsx` (metadata)

**`frontend/components/`:**
- Purpose: Reusable React components
- Contains: Chat interface, payment modals, message display, animations
- Key files: `Chat.tsx` (main UI), `BuyQuestionButton.tsx` (payment), `Message.tsx` (display)
- Pattern: Client components with 'use client' directive

**`frontend/lib/`:**
- Purpose: Utility functions and API client
- Contains: Axios instance with token interceptor, typed API functions
- Key files: `api.ts` (API client with authApi, paymentApi, chatApi namespaces)

**`frontend/data/`:**
- Purpose: Static data and lookup tables
- Contains: Tarot card metadata (Portuguese names, meanings, image URLs)
- Key files: `tarot-data.ts` (card catalog)

## Key File Locations

**Entry Points:**
- Backend API: `backend/api/main.py` - Flask app initialization, CORS, blueprint registration
- Frontend App: `frontend/app/page.tsx` - Auth check, login form, Chat component render

**Configuration:**
- Backend: `backend/requirements.txt` (Python dependencies), `backend/api/main.py` (Flask config)
- Frontend: `frontend/package.json` (npm dependencies), `frontend/tailwind.config.ts` (Tailwind CSS)
- Environment: `.env` file (not committed; use `.env.example` as template)

**Core Logic:**
- Authentication: `backend/api/routes/auth.py` (JWT, bcrypt)
- Payment Processing: `backend/api/routes/payment.py` (OasisPay integration)
- Tarot Reading: `backend/api/routes/chat.py` (orchestrates drawing + interpretation)
- Card Logic: `backend/api/services/tarot.py` (draw_cards function)
- LLM Integration: `backend/api/services/llm.py` (Groq API calls)
- Database: `backend/api/db/mongodb.py` (connection), `backend/api/db/transactions.py` (CRUD)

**Testing:**
- Test files: `test_backend.py`, `test_backend_import.py` (manual tests, not unit test framework)

## Naming Conventions

**Files:**
- Python: `snake_case.py` (e.g., `auth.py`, `llm.py`, `mongodb.py`)
- TypeScript/React: `PascalCase.tsx` for components, `camelCase.ts` for utilities
- Models/Data: `snake_case.py` for Python, `camelCase.ts` for TypeScript

**Functions:**
- Python: `snake_case` (e.g., `get_current_user()`, `deduct_balance()`, `draw_cards()`)
- TypeScript: `camelCase` (e.g., `handleLogin()`, `loadBalance()`)

**Variables:**
- Python: `snake_case` (e.g., `user_id`, `hashed_password`, `access_token`)
- TypeScript: `camelCase` (e.g., `isLoading`, `setBalance`, `userMessage`)

**Types:**
- Python: PascalCase classes (e.g., `User`, `Card`, `UserCreate`, `OasisPayService`)
- TypeScript: PascalCase interfaces/types (e.g., `Message`, `TarotResponse`, `LoginData`)

**Constants:**
- Python: `UPPER_CASE` (e.g., `QUESTION_PRICE`, `ACCESS_TOKEN_EXPIRE_MINUTES`)
- TypeScript: `camelCase` for config, `UPPER_CASE` for truly global constants

## Where to Add New Code

**New Feature (e.g., Reading History):**
- **Primary code:**
  - Backend route: `backend/api/routes/chat.py` (new endpoint for reading history)
  - Frontend component: `frontend/components/ReadingHistory.tsx` (new component)
  - Database access: `backend/api/db/transactions.py` (add query function)
- **Tests:** Create `test_reading_history.py` in project root following existing test pattern

**New Component/Module (e.g., User Profile):**
- **Implementation:**
  - Component: `frontend/components/UserProfile.tsx` (new file)
  - Route: `backend/api/routes/user.py` (new blueprint if multiple endpoints)
  - Model: `backend/api/models/user.py` (add UserProfile schema if needed)
- **Integration:**
  - Register blueprint in `backend/api/main.py`
  - Import/render component in `frontend/app/page.tsx` or route

**Shared Utilities:**
- **Helpers:**
  - Backend: `backend/api/services/` (add new file e.g., `analytics.py`)
  - Frontend: `frontend/lib/` (add new file e.g., `formatting.ts`)
- **Constants/Data:**
  - Backend: Add to relevant `models/` file or create `constants.py` in `services/`
  - Frontend: Add to `frontend/data/` if client-specific, or fetch from backend

**Database Operations:**
- **New CRUD:** Add to `backend/api/db/transactions.py` following existing pattern (functions not classes)
- **New Collection:** Initialize in `backend/api/db/mongodb.py` if needed, document in `db/init.py`

**API Endpoints:**
- **New route:** Create function in appropriate file under `backend/api/routes/`
- **New blueprint:** Create file, register in `backend/api/main.py` line 25-27
- **Pattern:** Use `@require_auth` decorator for protected endpoints, validate with Pydantic model

**Frontend Pages:**
- **New page:** Create `.tsx` file in `frontend/app/` (App Router convention)
- **New component:** Add to `frontend/components/`
- **Shared logic:** Extract to `frontend/lib/`

## Special Directories

**`.env` File:**
- Purpose: Environment-specific configuration (secrets, API keys, URLs)
- Generated: No, must be created per environment
- Committed: No (listed in `.gitignore`)
- Required variables: `MONGODB_URI`, `GROQ_API_KEY`, `OASIS_PUBLIC_KEY`, `OASIS_SECRET_KEY`, `JWT_SECRET`
- Example: See `.env.example` template

**`backend/.env`:**
- Purpose: Backend-specific environment variables
- Located: `backend/.env` (not root)
- Usage: Python `load_dotenv()` loads this automatically

**`tarot-json/`:**
- Purpose: External card data repository (JSON format)
- Generated: No, cloned from external repo
- Committed: Yes
- Usage: Referenced by frontend for card metadata

**`public/tarot-cards/`:**
- Purpose: Static card image files
- Generated: No, manually added
- Committed: No (images in `.gitignore`)
- Usage: Serve via CDN or static file server

**`frontend/.next/`:**
- Purpose: Next.js build output
- Generated: Yes, created by `npm run build`
- Committed: No (in `.gitignore`)
- Usage: Production deployment artifact

**`frontend/node_modules/`:**
- Purpose: npm dependency directory
- Generated: Yes, created by `npm install`
- Committed: No (in `.gitignore`)
- Usage: Local development dependencies

---

*Structure analysis: 2026-07-07*
