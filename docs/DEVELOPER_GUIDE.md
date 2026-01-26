# Clario Developer Guide

Complete development setup and contribution guide for the Clario Forensic Fingerprint Analysis Platform.

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ | Frontend tooling |
| PostgreSQL | 14+ | Database |
| Redis | 7+ | Task queue |
| Docker | 24+ | Containerization |
| Docker Compose | 2.0+ | Multi-container orchestration |

### Optional Software

| Software | Purpose |
|----------|---------|
| Git | Version control |
| VS Code | Recommended IDE |
| pgAdmin | Database GUI |
| Redis Insight | Redis GUI |

### API Keys

| Service | Required | Purpose |
|---------|----------|---------|
| Google Gemini | Yes | AI classification and enhancement |
| Google OAuth | Optional | Social login |

---

## Development Environment Setup

### Quick Start (Docker)

The fastest way to get started:

```bash
# Clone the repository
git clone <repo-url> forensic_project
cd forensic_project

# Copy environment file
cp backend/.env.example backend/.env
# Edit .env and add your GEMINI_API_KEY

# Start all services
docker compose up -d

# Run database migrations
docker compose exec backend alembic upgrade head

# Access the application
open http://localhost        # Frontend
open http://localhost:8000/docs  # API docs
```

### Manual Setup (Development)

For active development with hot-reload:

#### 1. Database & Redis (Docker)

```bash
# Start only infrastructure services
docker compose up -d db redis

# Verify services are running
docker compose ps
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your settings

# Run database migrations
alembic upgrade head

# Seed default pipeline configurations
python -c "
from app.core.database import SessionLocal
from app.models.pipeline import seed_default_configs
db = SessionLocal()
seed_default_configs(db)
db.close()
"

# Start the API server (with hot-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Celery Worker

```bash
# In a new terminal, activate venv
cd backend
source venv/bin/activate

# Start Celery worker
celery -A app.workers.tasks:celery_app worker --loglevel=info -Q celery,processing,batch
```

#### 4. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server (with hot-reload)
npm run dev
```

The frontend runs at `http://localhost:3000` and proxies API calls to `http://localhost:8000`.

---

## Project Structure

```
forensic_project/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py           # Dependency injection
│   │   │   └── routes/
│   │   │       ├── auth.py       # Authentication endpoints
│   │   │       ├── cases.py      # Case management
│   │   │       ├── exhibits.py   # Exhibit management
│   │   │       ├── fingerprints.py # Fingerprint operations
│   │   │       ├── pipeline.py   # Pipeline configuration
│   │   │       ├── export.py     # Export functionality
│   │   │       └── users.py      # User management
│   │   ├── core/
│   │   │   ├── config.py         # Settings and configuration
│   │   │   ├── database.py       # Database connection
│   │   │   └── security.py       # Auth utilities
│   │   ├── models/
│   │   │   ├── user.py           # User model
│   │   │   ├── case.py           # Case model
│   │   │   ├── exhibit.py        # Exhibit model
│   │   │   ├── fingerprint.py    # Fingerprint model
│   │   │   ├── pipeline.py       # Pipeline models
│   │   │   └── audit.py          # Audit log model
│   │   ├── schemas/
│   │   │   ├── user.py           # User Pydantic schemas
│   │   │   ├── case.py           # Case schemas
│   │   │   ├── exhibit.py        # Exhibit schemas
│   │   │   ├── fingerprint.py    # Fingerprint schemas
│   │   │   └── pipeline.py       # Pipeline schemas
│   │   ├── services/
│   │   │   ├── fingerprint_processor.py  # Main orchestrator
│   │   │   ├── enhancement.py    # OpenCV enhancement
│   │   │   ├── gemini_enhancement.py     # AI enhancement
│   │   │   ├── classification.py # Pattern classification
│   │   │   ├── quality.py        # Quality assessment
│   │   │   ├── storage.py        # File storage
│   │   │   └── audit.py          # Audit logging
│   │   ├── workers/
│   │   │   ├── celery_app.py     # Celery configuration
│   │   │   └── tasks.py          # Background tasks
│   │   └── main.py               # FastAPI application
│   ├── alembic/
│   │   ├── versions/             # Migration files
│   │   └── env.py                # Alembic configuration
│   ├── tests/                    # Test files
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable components
│   │   ├── pages/                # Page components
│   │   ├── hooks/                # Custom hooks
│   │   ├── services/             # API client
│   │   ├── contexts/             # React contexts
│   │   ├── types/                # TypeScript types
│   │   ├── App.tsx               # Root component
│   │   └── main.tsx              # Entry point
│   ├── public/                   # Static assets
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── Dockerfile
├── docs/                         # Documentation
├── docker-compose.yml            # Development
├── docker-compose.prod.yml       # Production
├── Caddyfile                     # Reverse proxy config
└── README.md
```

---

## Code Architecture

### Backend Service Layer Pattern

The backend follows a service layer pattern:

```
┌─────────────────┐
│   API Routes    │  ← HTTP handling, validation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Services     │  ← Business logic
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Models      │  ← Data persistence
└─────────────────┘
```

### Adding a New API Endpoint

1. **Create/update schema** (`app/schemas/`):

```python
# app/schemas/example.py
from pydantic import BaseModel

class ExampleCreate(BaseModel):
    name: str
    description: str | None = None

class ExampleResponse(BaseModel):
    id: str
    name: str
    description: str | None
    created_at: datetime

    class Config:
        from_attributes = True
```

2. **Create/update model** (`app/models/`):

```python
# app/models/example.py
from sqlalchemy import Column, String, DateTime
from app.core.database import Base
import uuid
from datetime import datetime

class Example(Base):
    __tablename__ = "examples"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
```

3. **Create migration**:

```bash
alembic revision --autogenerate -m "add examples table"
alembic upgrade head
```

4. **Create route** (`app/api/routes/`):

```python
# app/api/routes/examples.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user
from app.models.example import Example
from app.schemas.example import ExampleCreate, ExampleResponse

router = APIRouter(prefix="/examples", tags=["examples"])

@router.post("", response_model=ExampleResponse, status_code=201)
async def create_example(
    data: ExampleCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    example = Example(**data.model_dump())
    db.add(example)
    await db.commit()
    await db.refresh(example)
    return example

@router.get("/{example_id}", response_model=ExampleResponse)
async def get_example(
    example_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    example = await db.get(Example, example_id)
    if not example:
        raise HTTPException(status_code=404, detail="Example not found")
    return example
```

5. **Register route** (`app/main.py`):

```python
from app.api.routes import examples

app.include_router(examples.router, prefix="/api/v1")
```

### Adding a New Database Model

1. **Create model file** in `app/models/`
2. **Import in `__init__.py`** (if using):
   ```python
   from app.models.example import Example
   ```
3. **Generate migration**:
   ```bash
   alembic revision --autogenerate -m "description"
   ```
4. **Review migration** in `alembic/versions/`
5. **Apply migration**:
   ```bash
   alembic upgrade head
   ```

### Adding Enhancement Presets

1. **Define preset** in `app/models/pipeline.py`:

```python
DEFAULT_PIPELINE_CONFIGS = [
    # ... existing presets ...
    {
        "name": "custom_preset",
        "display_name": "Custom Enhancement",
        "description": "Description of the preset",
        "artifact_risk_level": "medium",
        "config": {
            "denoise": {
                "enabled": True,
                "method": "bilateral",
                "d": 7,
                "sigma_color": 60,
                "sigma_space": 60
            },
            "contrast": {
                "enabled": True,
                "method": "clahe",
                "clip_limit": 2.5,
                "tile_grid_size": [8, 8]
            },
            # ... other settings
        }
    }
]
```

2. **Re-seed configurations**:

```bash
python -c "
from app.core.database import SessionLocal
from app.models.pipeline import seed_default_configs
db = SessionLocal()
seed_default_configs(db)
db.close()
"
```

### Adding Background Tasks

1. **Define task** in `app/workers/tasks.py`:

```python
@celery_app.task(bind=True, max_retries=3)
def my_background_task(self, param1: str, param2: int):
    try:
        # Task logic here
        result = do_something(param1, param2)
        return {"status": "success", "result": result}
    except Exception as e:
        self.retry(exc=e, countdown=60)
```

2. **Call from API**:

```python
from app.workers.tasks import my_background_task

@router.post("/trigger-task")
async def trigger_task(data: TaskInput):
    task = my_background_task.delay(data.param1, data.param2)
    return {"task_id": task.id}
```

---

## Testing

### Running Tests

```bash
# Backend tests
cd backend
pytest

# With coverage
pytest --cov=app --cov-report=html

# Specific test file
pytest tests/test_api.py

# Frontend tests
cd frontend
npm test
```

### Writing Tests

**Backend API test example:**

```python
# tests/test_cases.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def auth_headers(client):
    # Login and get token
    response = await client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_create_case(client, auth_headers):
    response = await client.post(
        "/api/v1/cases",
        json={
            "case_number": "TEST-001",
            "title": "Test Case"
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json()["case_number"] == "TEST-001"
```

**Frontend component test example:**

```typescript
// src/__tests__/CaseList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { CaseList } from '../pages/CaseList';
import { BrowserRouter } from 'react-router-dom';

// Mock API
jest.mock('../services/api', () => ({
  casesApi: {
    list: jest.fn().mockResolvedValue({
      data: {
        cases: [{ id: '1', case_number: '2024-001', title: 'Test' }],
        total: 1
      }
    })
  }
}));

test('renders case list', async () => {
  render(
    <BrowserRouter>
      <CaseList />
    </BrowserRouter>
  );

  await waitFor(() => {
    expect(screen.getByText('2024-001')).toBeInTheDocument();
  });
});
```

---

## Code Style & Linting

### Backend (Python)

**Configuration (pyproject.toml):**

```toml
[tool.black]
line-length = 88
target-version = ['py311']

[tool.isort]
profile = "black"
line_length = 88

[tool.mypy]
python_version = "3.11"
strict = true
```

**Commands:**

```bash
# Format code
black app/
isort app/

# Type checking
mypy app/

# Linting
ruff check app/
```

### Frontend (TypeScript)

**ESLint configuration (.eslintrc.cjs):**

```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
};
```

**Commands:**

```bash
# Lint
npm run lint

# Format (with Prettier)
npx prettier --write src/
```

---

## Git Workflow

### Branch Strategy

```
main           ← Production-ready code
  │
  └── dev      ← Integration branch
        │
        ├── feature/add-user-auth
        ├── feature/improve-classification
        ├── bugfix/fix-upload-error
        └── hotfix/security-patch
```

### Commit Convention

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```
feat(api): add batch fingerprint upload endpoint
fix(frontend): resolve zoom gesture on mobile
docs: update API reference with new endpoints
```

### Pull Request Process

1. Create feature branch from `dev`
2. Make changes with atomic commits
3. Write/update tests
4. Update documentation if needed
5. Create PR with description
6. Request review
7. Address feedback
8. Squash and merge

---

## Environment Variables

### Backend (.env)

```bash
# Application
APP_NAME=Clario
DEBUG=false
SECRET_KEY=your-secret-key-change-in-production

# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/forensic_db
DATABASE_SYNC_URL=postgresql://postgres:password@localhost:5432/forensic_db

# Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Google Gemini
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.5-pro
GEMINI_IMAGE_MODEL=gemini-3-pro-image-preview
USE_GEMINI_ENHANCEMENT=true
GEMINI_ENHANCEMENT_FALLBACK=true

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
FRONTEND_URL=http://localhost:3000

# Storage
USE_LOCAL_STORAGE=true
LOCAL_STORAGE_PATH=./storage
# For S3:
# S3_ENDPOINT_URL=http://localhost:9000
# S3_ACCESS_KEY=minioadmin
# S3_SECRET_KEY=minioadmin
# S3_BUCKET_ORIGINALS=fingerprint-originals
# S3_BUCKET_ENHANCED=fingerprint-enhanced

# Security
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ALGORITHM=HS256
```

### Frontend (Vite)

Frontend configuration is in `vite.config.ts`. Environment variables use `VITE_` prefix:

```bash
# .env.local
VITE_API_BASE_URL=/api/v1
VITE_ENABLE_PWA=true
```

---

## Debugging Tips

### Backend Debugging

**VS Code launch.json:**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["app.main:app", "--reload"],
      "cwd": "${workspaceFolder}/backend"
    },
    {
      "name": "Celery Worker",
      "type": "python",
      "request": "launch",
      "module": "celery",
      "args": ["-A", "app.workers.tasks:celery_app", "worker", "-l", "debug"],
      "cwd": "${workspaceFolder}/backend"
    }
  ]
}
```

**Common issues:**

1. **Database connection errors:**
   ```bash
   # Check PostgreSQL is running
   docker compose ps db

   # Check connection string
   psql $DATABASE_SYNC_URL
   ```

2. **Celery tasks not running:**
   ```bash
   # Check worker logs
   docker compose logs celery_worker

   # Verify Redis connection
   redis-cli ping
   ```

3. **Gemini API errors:**
   ```bash
   # Test API key
   python -c "
   import google.generativeai as genai
   genai.configure(api_key='YOUR_KEY')
   model = genai.GenerativeModel('gemini-2.5-pro')
   print(model.generate_content('Hello').text)
   "
   ```

### Frontend Debugging

**Browser DevTools:**
- React DevTools extension for component inspection
- Network tab for API calls
- Console for errors and logs

**Common issues:**

1. **API proxy not working:**
   - Ensure backend is running on port 8000
   - Check `vite.config.ts` proxy configuration

2. **State not updating:**
   - Check Zustand devtools (Redux DevTools extension works)
   - Verify API response format matches expected types

---

## Performance Optimization

### Backend

1. **Database queries:**
   - Use eager loading for relationships
   - Add indexes for frequently queried columns
   - Use pagination for large result sets

2. **Async operations:**
   - Use `asyncio.gather()` for parallel operations
   - Offload heavy processing to Celery

3. **Caching:**
   - Cache pipeline configs in memory
   - Use Redis for session/frequent data

### Frontend

1. **Code splitting:**
   - Lazy load pages with `React.lazy()`
   - Split vendor chunks in Vite config

2. **Image optimization:**
   - Use appropriate image formats
   - Implement lazy loading for images

3. **State management:**
   - Avoid unnecessary re-renders
   - Use `useMemo` and `useCallback` appropriately

---

## Deployment

See [DEPLOY.md](../DEPLOY.md) for detailed deployment instructions.

### Quick Production Deploy

```bash
# Build and deploy
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Check status
docker compose -f docker-compose.prod.yml ps
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Module not found" | Ensure venv is activated, reinstall dependencies |
| Database migration errors | Check for pending migrations, verify model changes |
| Celery tasks stuck | Restart worker, check Redis connection |
| CORS errors | Verify CORS settings in FastAPI, check request origin |
| Auth token invalid | Check token expiry, verify SECRET_KEY matches |
| File upload fails | Check file size limits, verify storage permissions |

### Getting Help

1. Check existing documentation
2. Search GitHub issues
3. Ask in team chat
4. Create detailed bug report with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages/logs
   - Environment details
