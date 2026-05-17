# Haznet

Intranet for Procurement - A modern full-stack web application built with FastAPI and React.

## Tech Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **SQLAlchemy** - ORM for database operations
- **PostgreSQL** - Relational database
- **Pydantic** - Data validation and settings management
- **Argon2** - Password hashing
- **python-jose** - JWT authentication

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first CSS framework
- **React Router 7** - Client-side routing
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **React Hook Form + Zod** - Form handling and validation
- **Framer Motion** - Animations
- **Lucide React** - Icon library

## Prerequisites

- **Python** >= 3.12
- **Node.js** >= 18
- **PostgreSQL** >= 14
- **uv** (Python package manager) - [Installation guide](https://docs.astral.sh/uv/getting-started/installation/)
- **npm** or equivalent

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/haznet.git
cd haznet
```

### 2. Setup Backend

```bash
cd backend

# Create and activate virtual environment
uv venv
source .venv/bin/activate

# Install dependencies
uv sync

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your database credentials and secret key
```

### 3. Setup Database

```bash
# Create PostgreSQL database
createdb neodb  # or use psql to create manually

# Run migrations and seed data
./db_setup.sh

# Or force re-seed (clears existing data)
./db_setup.sh --force
```

**Manual migration commands:**

```bash
cd backend
source .venv/bin/activate

# Create a new migration after model changes
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Seed data
python -m app.seed
python -m app.seed --force  # force re-seed
```

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install
```

### 5. Run the Application

**Option 1: Run both servers together**
```bash
./start.sh
```

**Option 2: Run backend only**
```bash
./run.sh
```

**Option 3: Run manually**

Terminal 1 (Backend):
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

## Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (Swagger UI)

## Project Structure

```
Haznet/
├── backend/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── middleware/   # Custom middleware
│   │   ├── seed_data/    # Seed data files
│   │   ├── config.py     # Configuration
│   │   ├── database.py   # Database setup
│   │   ├── main.py       # FastAPI app entry
│   │   └── seed.py       # Database seeding
│   ├── .env.example      # Environment template
│   └── pyproject.toml    # Python dependencies
├── frontend/
│   ├── src/              # React source code
│   ├── package.json      # Node dependencies
│   └── vite.config.ts    # Vite configuration
├── start.sh              # Start both servers
└── run.sh                # Start backend only
```

## Development

### Backend

```bash
cd backend
source .venv/bin/activate

# Run linter (ruff)
ruff check .

# Format code
ruff format .
```

### Frontend

```bash
cd frontend

# Type check
npx tsc -b

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `postgres` |
| `POSTGRES_HOST` | Database host | `localhost` |
| `POSTGRES_PORT` | Database port | `5432` |
| `POSTGRES_DB` | Database name | `neodb` |
| `SECRET_KEY` | JWT secret key | *(change in production)* |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry | `480` |
| `CORS_ORIGINS` | Allowed CORS origins | `["http://localhost:5173"]` |

## License

See [LICENSE](LICENSE) for details.
