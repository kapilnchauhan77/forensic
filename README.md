# Fingerprint Classification + Enhancement Platform

A forensic-grade application for fingerprint image analysis, classification, and enhancement. This platform provides decision-support tools for forensic practitioners with full audit trail, chain-of-custody compliance, and reproducibility.

## Features

### Core Capabilities
- **Fingerprint Upload & Management**: Support for PNG, JPG, TIFF, BMP formats with case/exhibit organization
- **Quality Assessment**: Automated quality scoring with issue detection (blur, noise, contrast, compression artifacts)
- **Enhancement Pipeline**: Gemini AI-powered enhancement with OpenCV fallback, multiple presets available
- **Pattern Classification**: Gemini VLM-powered classification following FBI/NCIC standards
- **Evidence Export**: ZIP evidence packs with full provenance and processing reports

### Forensic Classification (FBI/NCIC Standards)
- **Evidence Type**: Latent, Patent, Plastic
- **Detail Level**: Level 1 (Pattern), Level 2 (Minutiae), Level 3 (Pores/Ridge shapes)
- **Pattern Types**: Arch, Tented Arch, Loop (Ulnar/Radial), Whorl (Plain/Central Pocket/Double Loop/Accidental)
- **NCIC Codes**: AA, TT, PI/PM/PO, II/IM/IO, WI/WM/WO, XX, SR
- **Henry System Values**: Calculated based on finger position and whorl presence
- **Minutiae Analysis**: Ridge endings, bifurcations, short ridges, dots, islands
- **Singular Points**: Core and delta detection with positions

### Forensic Features
- Immutable original storage with SHA-256 hashing
- Complete audit logging for all operations
- Pipeline and model versioning for reproducibility
- Role-based access control (Admin, Examiner, Technician, Read-only)
- Side-by-side image comparison viewer
- Classification rationale overlay visualization

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Processing**: OpenCV, NumPy, scikit-image
- **Classification**: Google Gemini VLM (gemini-3-pro-preview)
- **Task Queue**: Celery with Redis
- **Storage**: Local filesystem or S3-compatible

### Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Routing**: React Router

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Google Gemini API key for classification and enhancement

### Running with Docker (Development)

1. Clone the repository:
```bash
cd forensic_project
```

2. Create environment file:
```bash
cp backend/.env.example backend/.env
# Edit .env and add your GEMINI_API_KEY
```

3. Start the services:
```bash
docker-compose up -d
```

4. Access the application:
- Frontend: http://localhost:80
- API Docs: http://localhost:8000/docs
- Default login: `admin` / `admin123`

### Production Deployment

1. Create production environment file:
```bash
# Create .env in project root
cat > .env << 'EOF'
POSTGRES_USER=forensic_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=forensic_db
REDIS_PASSWORD=your_redis_password
GEMINI_API_KEY=your_gemini_api_key
SECRET_KEY=your_jwt_secret_key
ACCESS_TOKEN_EXPIRE_MINUTES=1440
EOF
```

2. Deploy with production compose:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

3. Run database migrations:
```bash
docker-compose exec backend alembic upgrade head
```

4. Create initial admin user (if needed):
```bash
docker-compose exec backend python -c "
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
db = SessionLocal()
admin = User(username='admin', email='admin@example.com', hashed_password=get_password_hash('admin123'), role='admin', is_active=True)
db.add(admin)
db.commit()
"
```

### Development Setup

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start PostgreSQL and Redis (or use Docker)
docker-compose up -d db redis

# Run database migrations
alembic upgrade head

# Run the API
uvicorn app.main:app --reload
```

#### Celery Worker
```bash
cd backend
celery -A app.workers.celery_app worker --loglevel=info -Q celery,processing,batch
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
forensic_project/
├── backend/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── core/             # Config, security, database
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   │   ├── enhancement.py        # OpenCV pipeline
│   │   │   ├── gemini_enhancement.py # Gemini AI enhancement
│   │   │   ├── quality.py            # Quality assessment
│   │   │   ├── classification.py     # Gemini VLM classification
│   │   │   └── storage.py            # File storage
│   │   └── workers/          # Celery tasks
│   ├── alembic/              # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API services
│   │   └── types/            # TypeScript types
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml        # Development
├── docker-compose.prod.yml   # Production with Caddy
└── Caddyfile                 # Caddy reverse proxy config
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/me` - Get current user

### Cases
- `GET /api/v1/cases` - List cases
- `POST /api/v1/cases` - Create case
- `GET /api/v1/cases/{id}` - Get case details
- `PATCH /api/v1/cases/{id}` - Update case
- `DELETE /api/v1/cases/{id}` - Delete case

### Exhibits
- `GET /api/v1/exhibits/case/{case_id}` - List exhibits for case
- `POST /api/v1/exhibits` - Create exhibit
- `GET /api/v1/exhibits/{id}` - Get exhibit details

### Fingerprints
- `POST /api/v1/fingerprints/upload/{exhibit_id}` - Upload fingerprint
- `POST /api/v1/fingerprints/upload-batch/{exhibit_id}` - Batch upload
- `GET /api/v1/fingerprints/{id}` - Get fingerprint details
- `POST /api/v1/fingerprints/{id}/process` - Start processing
- `POST /api/v1/fingerprints/{id}/reprocess` - Reprocess fingerprint

### Export
- `GET /api/v1/export/case/{id}/evidence-pack` - Download evidence pack
- `GET /api/v1/export/fingerprint/{id}/report` - Get processing report

## Enhancement Pipeline

### Enhancement Methods

1. **Gemini AI Enhancement** (Primary)
   - AI-powered image enhancement
   - Preserves forensic authenticity
   - Automatically falls back to OpenCV if unavailable

2. **OpenCV Enhancement** (Fallback)
   - Traditional image processing pipeline
   - Multiple presets available

### Presets

1. **Latent Print** (Medium Risk)
   - Aggressive noise reduction
   - High contrast enhancement (CLAHE)
   - Gabor filtering for ridge enhancement
   - Background suppression

2. **Rolled/Plain Print** (Low Risk)
   - Light noise reduction
   - Standard contrast enhancement
   - Mild Gabor filtering
   - Preserves natural appearance

3. **Aggressive** (High Risk)
   - Non-local means denoising
   - Maximum contrast enhancement
   - Strong Gabor filtering
   - Morphological operations
   - **Warning**: May introduce artifacts

### Quality Metrics
- Contrast score
- Sharpness (Laplacian variance)
- Noise level (MAD estimation)
- Ridge clarity (gradient coherence)
- Completeness (segmentation)
- Compression artifacts

## Classification System

### Evidence Types
| Type | Description |
|------|-------------|
| Latent | Invisible prints requiring development |
| Patent | Visible prints (blood, ink, etc.) |
| Plastic | 3D impressions in soft materials |

### Detail Levels
| Level | Features Analyzed |
|-------|-------------------|
| Level 1 | Overall pattern type (arch, loop, whorl) |
| Level 2 | Minutiae points (ridge endings, bifurcations) |
| Level 3 | Pores, ridge shapes, incipient ridges |

### Pattern Classification
- **Arch**: Plain Arch, Tented Arch
- **Loop**: Ulnar Loop, Radial Loop, Central Pocket Loop, Double Loop, Nutant Loop
- **Whorl**: Plain Whorl, Central Pocket Whorl, Double Loop Whorl, Accidental Whorl, Composite Whorl

### FBI/NCIC Codes
| Code | Pattern |
|------|---------|
| AA | Arch |
| TT | Tented Arch |
| PI/PM/PO | Loop (Inner/Meeting/Outer) |
| II/IM/IO | Radial Loop |
| WI/WM/WO | Whorl (Inner/Meeting/Outer) |
| XX | Scarred/Amputated |
| SR | Scarred |

Each classification includes:
- Confidence score (0-1)
- Rationale explanation with visual overlay
- Core/delta positions (as percentage coordinates)
- Minutiae breakdown by type
- Ridge count and density
- Alternative pattern possibilities

## Security & Compliance

- All originals stored immutably with SHA-256 verification
- Complete audit trail for all operations
- Role-based access control
- JWT authentication
- Full provenance tracking (pipeline version, model version, timestamps)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL async connection string | Required |
| `DATABASE_SYNC_URL` | PostgreSQL sync connection string | Required |
| `REDIS_URL` | Redis connection string | Required |
| `CELERY_BROKER_URL` | Celery broker URL | Required |
| `CELERY_RESULT_BACKEND` | Celery result backend | Required |
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `GEMINI_MODEL` | Gemini model to use | `gemini-3-pro-preview` |
| `USE_LOCAL_STORAGE` | Use local filesystem | `true` |
| `LOCAL_STORAGE_PATH` | Storage directory | `./storage` |
| `SECRET_KEY` | JWT signing key | Required in production |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry | `1440` (24 hours) |

## Troubleshooting

### Tasks Stuck in Queue
If fingerprints are stuck in "queued" status:

1. Check Celery worker is running:
```bash
docker-compose logs celery_worker
```

2. Verify worker is listening on correct queues (should include `celery`):
```bash
# Worker should show: -Q celery,processing,batch
```

3. Reset stuck fingerprints:
```bash
docker-compose exec db psql -U postgres -d forensic_db -c "UPDATE fingerprints SET status = 'PENDING' WHERE status = 'QUEUED';"
```

### Database Migration Errors
If you get column missing errors after updating:

```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Or manually add missing columns (example)
docker-compose exec db psql -U postgres -d forensic_db -c "ALTER TABLE fingerprints ADD COLUMN IF NOT EXISTS detail_level VARCHAR(10);"
```

## License

This software is intended for authorized forensic use only.
