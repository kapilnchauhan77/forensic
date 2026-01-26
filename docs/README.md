# Clario Documentation

Welcome to the Clario Forensic Fingerprint Analysis Platform documentation.

## What is Clario?

Clario is a forensic-grade application for fingerprint image analysis, classification, and enhancement. It provides decision-support tools for forensic practitioners with full audit trail, chain-of-custody compliance, and reproducibility.

## Key Features

| Feature | Description |
|---------|-------------|
| **AI Enhancement** | Gemini-powered image enhancement with OpenCV fallback |
| **Pattern Classification** | FBI/NCIC compliant fingerprint pattern recognition |
| **Quality Assessment** | Automated quality scoring and issue detection |
| **Evidence Management** | Case and exhibit organization with full audit trail |
| **Export** | Evidence packs with provenance documentation |

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Google Gemini API key

### Installation

```bash
# Clone the repository
git clone <repo-url> forensic_project
cd forensic_project

# Configure environment
cp backend/.env.example backend/.env
# Edit .env and add your GEMINI_API_KEY

# Start services
docker compose up -d

# Run migrations
docker compose exec backend alembic upgrade head
```

### Access

| Service | URL |
|---------|-----|
| Application | http://localhost |
| API Documentation | http://localhost:8000/docs |

**Default credentials:** `admin` / `admin123`

## Documentation Structure

### For Users

- **[User Guide](USER_GUIDE.md)** - Learn how to use Clario
- **[FAQ](USER_GUIDE?id=troubleshooting)** - Common questions and answers

### For Developers

- **[Architecture](ARCHITECTURE.md)** - System design and components
- **[API Reference](API_REFERENCE.md)** - Complete API documentation
- **[Database Schema](DATABASE_SCHEMA.md)** - Data model documentation
- **[Frontend Architecture](FRONTEND_ARCHITECTURE.md)** - React application details
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Setup and contribution guide

### For Operations

- **[Deployment Guide](../DEPLOY.md)** - Production deployment instructions
- **[Security](ARCHITECTURE?id=security-architecture)** - Security considerations

## Technology Stack

```
┌─────────────────────────────────────────────────────┐
│                     Frontend                         │
│         React 18 + TypeScript + Tailwind CSS        │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                      Backend                         │
│              FastAPI + SQLAlchemy + Celery          │
└─────────────────────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │PostgreSQL│   │  Redis   │   │  Gemini  │
    │ Database │   │  Queue   │   │    AI    │
    └──────────┘   └──────────┘   └──────────┘
```

## Support

- **Issues**: Report bugs via GitHub Issues
- **Documentation**: Check the relevant guide above
- **Contributing**: See [Contributing Guide](../CONTRIBUTING.md)

## License

This software is intended for authorized forensic use only.
