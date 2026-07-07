# Technology Stack

**Analysis Date:** 2026-07-07

## Languages

**Primary:**
- Python 3 - Backend API, business logic, LLM integrations (`backend/api/`)
- TypeScript 5 - Frontend type definitions and configuration
- JavaScript (JSX/TSX) - Frontend components and pages

**Secondary:**
- SQL/MongoDB Query Language - Database queries via PyMongo

## Runtime

**Environment:**
- Node.js - Frontend development and Next.js execution
- Python 3.x - Backend Flask application

**Package Manager:**
- npm - Frontend dependencies, lockfile present at `frontend/package-lock.json`
- pip - Backend dependencies from `backend/requirements.txt`

## Frameworks

**Core:**
- Flask >= 3.0.0 - Python backend API framework (`backend/api/main.py`)
- Next.js ^14.2.0 - React-based frontend framework (`frontend/package.json`)
- React ^18.2.0 - UI component library

**Styling:**
- Tailwind CSS ^3.3.0 - Utility-first CSS framework (`frontend/tailwind.config.ts`)
- PostCSS ^8 - CSS transformation tool
- Autoprefixer ^10.0.1 - Browser prefix handling

**Testing:**
- Not detected - No test runner or test files found

**Build/Dev:**
- TypeScript ^5 - Static type checking
- ESLint (via Next.js) - Code linting and quality

## Key Dependencies

**Backend - Critical:**
- flask-cors >= 4.0.0 - Cross-origin request handling (`backend/api/main.py`)
- pymongo == 4.6.0 - MongoDB driver and ORM (`backend/api/db/mongodb.py`)
- groq >= 0.4.0 - Groq LLM API client (`backend/api/services/llm.py`)
- python-jose[cryptography] == 3.3.0 - JWT token creation and validation (`backend/api/routes/auth.py`)
- bcrypt >= 4.0.0 - Password hashing (`backend/api/routes/auth.py`)
- pydantic >= 2.11.7, < 3.0.0 - Data validation models (`backend/api/models/`)
- pydantic-settings >= 2.3.0 - Configuration management
- python-dotenv == 1.0.0 - Environment variable loading (`backend/api/main.py`)

**Backend - Infrastructure:**
- email-validator >= 2.0.0 - Email format validation
- requests - HTTP client for external APIs
- qrcode[pil] - QR code generation for payment receipts

**Frontend - Critical:**
- axios ^1.6.2 - HTTP client with request interceptors (`frontend/lib/api.ts`)

## Configuration

**Environment:**
- Environment variables via `.env` files in `backend/`, `frontend/`, and root directory
- Backend loads from `backend/.env` in `backend/api/main.py`
- Frontend uses `NEXT_PUBLIC_API_URL` from `frontend/.env`

**Build:**
- Next.js config: `frontend/next.config.js`
  - API URL configurable via environment variable
  - ReactStrictMode enabled
- Tailwind config: `frontend/tailwind.config.ts`
  - Content paths for purging: `./app/**`, `./components/**`, `./pages/**`
  - Theme extensions for custom colors
- TypeScript config: `frontend/tsconfig.json`
- PostCSS config: `frontend/postcss.config.js`

## Platform Requirements

**Development:**
- Node.js (LTS recommended)
- Python 3.8+
- MongoDB database connection (local or cloud)
- Groq API key (for LLM features)
- OasisPay API credentials (for payment features)

**Production:**
- Vercel (indicated by `backend/api/index.py` - "Flask funciona nativamente na Vercel")
- MongoDB cloud database (Atlas recommended)
- Environment variables configured in deployment platform

## Scripts

**Frontend:**
```bash
npm run dev       # Start development server
npm run build     # Production build
npm start         # Start production server
npm run lint      # Run Next.js linter
```

**Backend:**
```bash
python backend/setup.py  # Install dependencies
python -m flask run      # Run development server
```

---

*Stack analysis: 2026-07-07*
