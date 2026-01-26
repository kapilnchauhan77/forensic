# Clario - Forensic Fingerprint Analysis Platform

[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688.svg)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791.svg)](https://postgresql.org)

A forensic-grade application for fingerprint image analysis, classification, and enhancement. Clario provides decision-support tools for forensic practitioners with full audit trail, chain-of-custody compliance, and reproducibility.

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System architecture and design |
| [API Reference](docs/API_REFERENCE.md) | Complete API documentation |
| [Database Schema](docs/DATABASE_SCHEMA.md) | Database tables and relationships |
| [Frontend Architecture](docs/FRONTEND_ARCHITECTURE.md) | React application structure |
| [Developer Guide](docs/DEVELOPER_GUIDE.md) | Development setup and contribution |
| [User Guide](docs/USER_GUIDE.md) | End-user documentation |
| [Deployment Guide](DEPLOY.md) | Production deployment instructions |
| [Contributing](CONTRIBUTING.md) | Contribution guidelines |

## Features

### Core Capabilities

- **Fingerprint Upload & Management**: Support for PNG, JPG, TIFF, BMP formats with case/exhibit organization
- **Quality Assessment**: Automated quality scoring with issue detection (blur, noise, contrast, compression artifacts)
- **AI-Powered Enhancement**: Gemini AI enhancement with OpenCV fallback, multiple presets available
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
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Processing**: OpenCV, NumPy, scikit-image
- **AI/ML**: Google Gemini VLM (gemini-2.5-pro)
- **Task Queue**: Celery with Redis
- **Storage**: Local filesystem or S3-compatible

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Routing**: React Router
- **Build**: Vite

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Google Gemini API key

### Running with Docker

```bash
# Clone the repository
git clone <repo-url> forensic_project
cd forensic_project

# Create environment file
cp backend/.env.example backend/.env
# Edit .env and add your GEMINI_API_KEY

# Start the services
docker compose up -d

# Run database migrations
docker compose exec backend alembic upgrade head
```

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| API Docs | http://localhost:8000/docs |
| API | http://localhost:8000/api/v1 |

**Default credentials**: `admin` / `admin123`

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
│   │   └── workers/          # Celery tasks
│   ├── alembic/              # Database migrations
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API client
│   │   └── types/            # TypeScript types
│   └── Dockerfile
├── docs/                     # Documentation
├── docker-compose.yml        # Development
├── docker-compose.prod.yml   # Production
└── Caddyfile                 # Reverse proxy config
```

## Development

See the [Developer Guide](docs/DEVELOPER_GUIDE.md) for detailed setup instructions.

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Celery Worker
celery -A app.workers.tasks:celery_app worker --loglevel=info

# Frontend
cd frontend
npm install
npm run dev
```

## API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/auth/login` | User authentication |
| `GET /api/v1/cases` | List cases |
| `POST /api/v1/fingerprints/upload/{exhibit_id}` | Upload fingerprint |
| `POST /api/v1/fingerprints/{id}/process` | Process fingerprint |
| `GET /api/v1/export/case/{id}/evidence-pack` | Export evidence |

See [API Reference](docs/API_REFERENCE.md) for complete documentation.

## Enhancement Presets

| Preset | Risk Level | Use Case |
|--------|------------|----------|
| Rolled/Plain | Low | High-quality exemplar prints |
| Latent | Medium | Developed latent prints |
| Aggressive | High | Poor quality prints (may introduce artifacts) |

## Security

- JWT-based authentication with 24-hour expiry
- Google OAuth 2.0 support
- Role-based access control (RBAC)
- Complete audit trail
- SHA-256 integrity verification
- HTTPS with automatic certificates (Caddy)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This software is intended for authorized forensic use only.

## Acknowledgments

- [Google Gemini](https://deepmind.google/technologies/gemini/) for AI capabilities
- [OpenCV](https://opencv.org/) for image processing
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [React](https://reactjs.org/) for the frontend framework
