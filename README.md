# Fingerprint Classification + Enhancement Platform

A forensic-grade application for fingerprint image analysis, classification, and enhancement. This platform provides decision-support tools for forensic practitioners with full audit trail, chain-of-custody compliance, and reproducibility.

## Features

### Core Capabilities
- **Fingerprint Upload & Management**: Support for PNG, JPG, TIFF, BMP formats with case/exhibit organization
- **Quality Assessment**: Automated quality scoring with issue detection (blur, noise, contrast, compression artifacts)
- **Enhancement Pipeline**: OpenCV-based enhancement with multiple presets (Latent, Rolled/Plain, Aggressive)
- **Pattern Classification**: Gemini VLM-powered classification (Arch, Tented Arch, Left/Right Loop, Whorl) with confidence scores and rationale
- **Evidence Export**: ZIP evidence packs with full provenance and processing reports

### Forensic Features
- Immutable original storage with SHA-256 hashing
- Complete audit logging for all operations
- Pipeline and model versioning for reproducibility
- Role-based access control (Admin, Examiner, Technician, Read-only)
- Side-by-side image comparison viewer

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Processing**: OpenCV, NumPy, scikit-image
- **Classification**: Google Gemini VLM
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
- (Optional) Google Gemini API key for classification

### Running with Docker

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
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- Default login: `admin` / `admin123`

### Development Setup

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start PostgreSQL and Redis (or use Docker)
docker-compose up -d db redis

# Run the API
uvicorn app.main:app --reload
```

#### Celery Worker
```bash
cd backend
celery -A app.workers.celery_app worker --loglevel=info -Q processing,batch
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
│   │   │   ├── enhancement.py    # OpenCV pipeline
│   │   │   ├── quality.py        # Quality assessment
│   │   │   ├── classification.py # Gemini VLM
│   │   │   └── storage.py        # File storage
│   │   └── workers/          # Celery tasks
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
└── docker-compose.yml
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
- `POST /api/v1/fingerprints/{id}/reprocess` - Reprocess

### Export
- `GET /api/v1/export/case/{id}/evidence-pack` - Download evidence pack
- `GET /api/v1/export/fingerprint/{id}/report` - Get processing report

## Enhancement Pipeline

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

## Classification

Pattern types detected:
- Arch
- Tented Arch
- Left Loop
- Right Loop
- Whorl
- Unknown/Partial

Each classification includes:
- Confidence score (0-1)
- Rationale explanation
- Core/delta detection status
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
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | Required |
| `GEMINI_API_KEY` | Google Gemini API key | Optional (fallback to OpenCV) |
| `USE_LOCAL_STORAGE` | Use local filesystem | `true` |
| `LOCAL_STORAGE_PATH` | Storage directory | `./storage` |
| `SECRET_KEY` | JWT signing key | Required in production |

## License

This software is intended for authorized forensic use only.
