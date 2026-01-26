# Clario System Architecture

High-level architecture documentation for the Clario Forensic Fingerprint Analysis Platform.

## Overview

Clario is a forensic-grade fingerprint analysis platform combining AI-powered image enhancement with FBI/NCIC-compliant pattern classification. The system is designed for scalability, reproducibility, and forensic chain-of-custody compliance.

## Architecture Diagram

```
                                    ┌─────────────────────────────────────────┐
                                    │              INTERNET                    │
                                    └─────────────────┬───────────────────────┘
                                                      │
                                                      │ HTTPS (443)
                                                      ▼
                              ┌────────────────────────────────────────────────┐
                              │         CADDY REVERSE PROXY                     │
                              │    (Automatic SSL, Load Balancing)             │
                              │         :80 → :443 redirect                    │
                              └──────────────────┬─────────────────────────────┘
                                                 │
                      ┌──────────────────────────┼──────────────────────────┐
                      │                          │                          │
                      ▼                          ▼                          │
        ┌─────────────────────────┐  ┌─────────────────────────┐           │
        │      FRONTEND           │  │       BACKEND            │           │
        │    (React SPA)          │  │      (FastAPI)           │           │
        │                         │  │                          │           │
        │  • Nginx static server  │  │  • REST API              │           │
        │  • TypeScript/React     │  │  • JWT Authentication    │           │
        │  • Tailwind CSS         │  │  • Google OAuth 2.0      │           │
        │  • Zustand state        │  │  • Role-based access     │           │
        │  • PWA support          │  │  • Async SQLAlchemy      │           │
        └─────────────────────────┘  └──────────┬───────────────┘           │
                                                │                           │
                                                │                           │
              ┌─────────────────────────────────┼───────────────────────────┤
              │                                 │                           │
              ▼                                 ▼                           ▼
┌─────────────────────────┐     ┌─────────────────────────┐   ┌─────────────────────────┐
│      POSTGRESQL         │     │         REDIS           │   │    CELERY WORKER        │
│      (Database)         │     │     (Task Queue)        │   │   (Background Jobs)     │
│                         │     │                         │   │                         │
│  • User accounts        │     │  • Celery broker        │   │  • Fingerprint          │
│  • Cases & exhibits     │     │  • Task results         │   │    processing           │
│  • Fingerprints         │     │  • Session cache        │   │  • Image enhancement    │
│  • Audit logs           │     │  • Rate limiting        │   │  • Classification       │
│  • Pipeline configs     │     │                         │   │  • Batch operations     │
└─────────────────────────┘     └─────────────────────────┘   └──────────┬──────────────┘
                                                                         │
                                                                         │
                                                    ┌────────────────────┼────────────────────┐
                                                    │                    │                    │
                                                    ▼                    ▼                    ▼
                                       ┌─────────────────────┐  ┌────────────────┐  ┌─────────────────┐
                                       │   GOOGLE GEMINI     │  │  OPENCV        │  │  FILE STORAGE   │
                                       │   (AI Services)     │  │  (Fallback)    │  │  (Images)       │
                                       │                     │  │                │  │                 │
                                       │  • VLM classific.   │  │  • Traditional │  │  • Local FS     │
                                       │  • Image enhance.   │  │    processing  │  │  • S3/MinIO     │
                                       │  • gemini-2.5-pro   │  │  • Gabor/CLAHE │  │  • Presigned    │
                                       └─────────────────────┘  └────────────────┘  │    URLs         │
                                                                                    └─────────────────┘
```

---

## Component Details

### Frontend (React SPA)

**Technology:** React 18, TypeScript, Vite, Tailwind CSS

**Responsibilities:**
- User interface and experience
- Client-side routing and state management
- File uploads and image display
- Real-time processing status updates
- Responsive design (mobile-first)
- PWA capabilities for offline access

**Key Features:**
- Advanced fingerprint viewer with zoom/pan
- Side-by-side image comparison
- Dark mode support
- Role-based UI rendering
- Touch gesture support

**Deployment:** Nginx serving static files, proxied through Caddy

### Backend (FastAPI)

**Technology:** FastAPI, Python 3.11+, SQLAlchemy 2.0, Pydantic

**Responsibilities:**
- RESTful API endpoints
- Authentication and authorization
- Business logic orchestration
- Database operations
- Task queue management
- File storage abstraction

**Key Services:**
- `FingerprintProcessorService` - Pipeline orchestration
- `FingerprintEnhancer` - OpenCV image processing
- `GeminiImageEnhancer` - AI-powered enhancement
- `FingerprintClassifier` - Pattern classification
- `FingerprintQualityAssessor` - Quality analysis
- `StorageService` - File storage abstraction
- `AuditService` - Compliance logging

**Deployment:** Uvicorn ASGI server, proxied through Caddy

### Database (PostgreSQL)

**Technology:** PostgreSQL 14+, asyncpg, SQLAlchemy ORM

**Responsibilities:**
- Persistent data storage
- ACID transactions
- Referential integrity
- Full-text search capability

**Key Tables:**
- `users` - Authentication and roles
- `cases` - Investigation records
- `exhibits` - Evidence containers
- `fingerprints` - Core fingerprint data
- `fingerprint_processing_results` - Processing history
- `pipeline_configs` - Enhancement presets
- `audit_logs` - Compliance trail

**Performance:**
- Connection pooling (size: 10, max overflow: 20)
- Pre-ping for connection health
- Indexed foreign keys and search fields

### Task Queue (Celery + Redis)

**Technology:** Celery 5.3, Redis 7

**Responsibilities:**
- Asynchronous task processing
- Background job scheduling
- Task result storage
- Periodic task execution

**Task Types:**
- `process_fingerprint_task` - Single fingerprint processing
- `batch_process_task` - Multiple fingerprint processing
- `cleanup_failed_tasks` - Periodic cleanup

**Configuration:**
- Worker concurrency: 2 (configurable)
- Task timeout: 10 minutes
- Retry policy: 3 retries with 60s delay
- Late acknowledgment for reliability

### AI Services (Google Gemini)

**Technology:** Google Gemini API (gemini-2.5-pro, gemini-3-pro-image-preview)

**Responsibilities:**
- Vision-language model classification
- AI-powered image enhancement
- Pattern recognition
- Rationale generation

**Classification Capabilities:**
- Pattern type detection (arch, loop, whorl)
- Pattern subtype classification
- Confidence scoring
- Singular point detection (cores, deltas)
- Minutiae estimation
- Ridge flow analysis

**Enhancement Capabilities:**
- Noise removal
- Ridge sharpening
- Contrast enhancement
- Damage reconstruction

### OpenCV (Fallback Processing)

**Technology:** OpenCV 4.9, NumPy, scikit-image

**Responsibilities:**
- Traditional image processing
- Fallback when Gemini unavailable
- Deterministic enhancement

**Processing Pipeline:**
1. Denoising (bilateral, NLM, Gaussian)
2. Contrast enhancement (CLAHE, histogram eq)
3. Gabor filtering (ridge enhancement)
4. Sharpening (unsharp mask)
5. Background suppression
6. Morphological operations

### File Storage

**Technology:** Local filesystem or S3-compatible (MinIO, AWS S3)

**Responsibilities:**
- Original image storage (immutable)
- Enhanced image storage
- Overlay visualization storage
- Presigned URL generation

**Storage Structure:**
```
storage/
├── originals/{year}/{month}/{day}/{exhibit_id}/
│   └── {hash}_{uuid}.{ext}
├── enhanced/{year}/{month}/{day}/{fingerprint_id}/
│   └── {preset}_{uuid}.png
└── overlays/{year}/{month}/{day}/{fingerprint_id}/
    ├── ridge_orientation_{uuid}.png
    └── rationale_{uuid}.png
```

---

## Data Flow Diagrams

### Fingerprint Processing Pipeline

```
┌─────────────────┐
│   User Upload   │
│  (via Browser)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│   API Gateway   │────▶│  Validate File  │
│   (FastAPI)     │     │  Type & Size    │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  Create Record  │────▶│  Store Original │
│  (PostgreSQL)   │     │  (Storage Svc)  │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       │
┌─────────────────┐              │
│  Queue Task     │◀─────────────┘
│  (Celery/Redis) │
└────────┬────────┘
         │
         │  Async
         ▼
┌─────────────────────────────────────────────────────┐
│                CELERY WORKER                         │
│  ┌───────────────┐  ┌───────────────┐               │
│  │ 1. Normalize  │  │ 2. Quality    │               │
│  │   Orientation │─▶│   Assessment  │               │
│  └───────────────┘  └───────┬───────┘               │
│                             │                        │
│  ┌───────────────┐  ┌───────▼───────┐               │
│  │ 3. Presence   │  │ 4. Multiple   │               │
│  │   Detection   │─▶│   FP Check    │               │
│  └───────┬───────┘  └───────┬───────┘               │
│          │                  │                        │
│  ┌───────▼───────────────────▼───────┐              │
│  │         5. Enhancement             │              │
│  │  ┌─────────────┐ ┌─────────────┐  │              │
│  │  │   Gemini    │ │   OpenCV    │  │              │
│  │  │   (AI)      │ │  (Fallback) │  │              │
│  │  └─────────────┘ └─────────────┘  │              │
│  └───────────────────┬───────────────┘              │
│                      │                               │
│  ┌───────────────────▼───────────────┐              │
│  │      6. Pre-Classification Gate   │              │
│  │   "Is this a genuine fingerprint?" │              │
│  └───────────────────┬───────────────┘              │
│                      │                               │
│  ┌───────────────────▼───────────────┐              │
│  │       7. Full Classification       │              │
│  │  • Pattern type/subtype            │              │
│  │  • NCIC code, Henry value          │              │
│  │  • Core/delta detection            │              │
│  │  • Minutiae estimation             │              │
│  └───────────────────┬───────────────┘              │
│                      │                               │
│  ┌───────────────────▼───────────────┐              │
│  │     8. Generate Visualizations    │              │
│  │  • Ridge orientation map           │              │
│  │  • Rationale overlay               │              │
│  └───────────────────┬───────────────┘              │
│                      │                               │
│  ┌───────────────────▼───────────────┐              │
│  │        9. Store Results           │              │
│  │  • Update fingerprint record       │              │
│  │  • Save processing result          │              │
│  │  • Store enhanced images           │              │
│  └───────────────────┬───────────────┘              │
│                      │                               │
│  ┌───────────────────▼───────────────┐              │
│  │   10. Generate Variants (Opt.)    │              │
│  │  • Alternative presets             │              │
│  └───────────────────────────────────┘              │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│   Update Status │
│   COMPLETED     │
└─────────────────┘
```

### Authentication Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     LOCAL AUTHENTICATION                          │
└──────────────────────────────────────────────────────────────────┘

  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │   Client    │────▶│   FastAPI   │────▶│  Verify     │
  │  (Browser)  │     │  /auth/login│     │  Password   │
  └─────────────┘     └─────────────┘     └──────┬──────┘
                                                  │
                                                  ▼
  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │   Store     │◀────│   Return    │◀────│  Generate   │
  │   Token     │     │   JWT       │     │  JWT Token  │
  └─────────────┘     └─────────────┘     └─────────────┘


┌──────────────────────────────────────────────────────────────────┐
│                     GOOGLE OAUTH 2.0                              │
└──────────────────────────────────────────────────────────────────┘

  ┌───────────────┐
  │    Client     │
  │   (Browser)   │
  └───────┬───────┘
          │
          │ 1. Click "Sign in with Google"
          ▼
  ┌───────────────┐
  │   FastAPI     │
  │ /auth/google/ │
  │   authorize   │
  └───────┬───────┘
          │
          │ 2. Return auth URL + CSRF state
          ▼
  ┌───────────────┐
  │   Redirect    │
  │   to Google   │
  └───────┬───────┘
          │
          │ 3. User authenticates
          ▼
  ┌───────────────┐
  │   Google      │
  │   Callback    │
  │   with code   │
  └───────┬───────┘
          │
          │ 4. POST code + state
          ▼
  ┌───────────────┐     ┌───────────────┐
  │   FastAPI     │────▶│   Exchange    │
  │ /auth/google/ │     │   Code for    │
  │   callback    │     │   Tokens      │
  └───────────────┘     └───────┬───────┘
                                │
                                │ 5. Verify ID token
                                ▼
                        ┌───────────────┐
                        │   Get/Create  │
                        │   User Record │
                        └───────┬───────┘
                                │
                                │ 6. Return JWT
                                ▼
                        ┌───────────────┐
                        │   Client      │
                        │   Stores JWT  │
                        └───────────────┘
```

### Request Authorization Flow

```
┌─────────────────┐
│   API Request   │
│  with Bearer    │
│     Token       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│   Extract JWT   │────▶│   Verify        │
│   from Header   │     │   Signature     │
└─────────────────┘     └────────┬────────┘
                                 │
                     ┌───────────┴───────────┐
                     │                       │
              Invalid│                       │Valid
                     ▼                       ▼
            ┌─────────────────┐     ┌─────────────────┐
            │   401 Error     │     │   Decode Claims │
            │   Unauthorized  │     │   (user_id,     │
            └─────────────────┘     │    role, exp)   │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │   Check Role    │
                                    │   Permission    │
                                    └────────┬────────┘
                                             │
                                  ┌──────────┴──────────┐
                                  │                     │
                           Denied │                     │ Allowed
                                  ▼                     ▼
                         ┌─────────────────┐   ┌─────────────────┐
                         │   403 Error     │   │   Process       │
                         │   Forbidden     │   │   Request       │
                         └─────────────────┘   └─────────────────┘
```

---

## Security Architecture

### Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    TRANSPORT                             │   │
│   │  • HTTPS (TLS 1.3)                                      │   │
│   │  • Automatic certificate via Caddy/Let's Encrypt        │   │
│   │  • HTTP → HTTPS redirect                                │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   AUTHENTICATION                         │   │
│   │  • JWT tokens (HS256, 24hr expiry)                      │   │
│   │  • Bcrypt password hashing                              │   │
│   │  • Google OAuth 2.0 + CSRF protection                   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   AUTHORIZATION                          │   │
│   │  • Role-based access control (RBAC)                     │   │
│   │  • Roles: admin > examiner > technician > readonly      │   │
│   │  • Per-endpoint permission checks                       │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                     AUDIT                                │   │
│   │  • All operations logged                                │   │
│   │  • User, IP, action, resource, timestamp                │   │
│   │  • Before/after values for changes                      │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Role Hierarchy

| Role | Cases | Exhibits | Fingerprints | Processing | Users | Pipeline |
|------|-------|----------|--------------|------------|-------|----------|
| `readonly` | View | View | View | - | - | - |
| `technician` | CRUD | CRUD | CRUD | Start | - | View |
| `examiner` | CRUD | CRUD | CRUD | Start | - | View |
| `admin` | CRUD | CRUD | CRUD | Start | CRUD | CRUD |

### Data Integrity

```
┌─────────────────────────────────────────────────────────────────┐
│                  FORENSIC INTEGRITY MEASURES                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Original Image Storage:                                        │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  • SHA-256 hash calculated on upload                    │   │
│   │  • Hash stored in database                              │   │
│   │  • Original never modified (immutable)                  │   │
│   │  • Date-organized storage paths                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   Processing Provenance:                                         │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  • Pipeline version recorded                            │   │
│   │  • Full config parameters stored                        │   │
│   │  • Model name/version captured                          │   │
│   │  • Prompt template hash recorded                        │   │
│   │  • Processing timestamps logged                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   Chain of Custody:                                              │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  • Upload user recorded                                 │   │
│   │  • All access logged in audit trail                     │   │
│   │  • Delete operations preserve originals                 │   │
│   │  • Soft delete recommended for records                  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Scalability Considerations

### Horizontal Scaling

```
                            Load Balancer (Caddy)
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            ▼                       ▼                       ▼
    ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
    │   Backend     │       │   Backend     │       │   Backend     │
    │   Instance 1  │       │   Instance 2  │       │   Instance N  │
    └───────┬───────┘       └───────┬───────┘       └───────┬───────┘
            │                       │                       │
            └───────────────────────┼───────────────────────┘
                                    │
                            ┌───────┴───────┐
                            │               │
                    ┌───────▼───────┐ ┌─────▼─────┐
                    │  PostgreSQL   │ │   Redis   │
                    │   Primary     │ │  Cluster  │
                    └───────┬───────┘ └───────────┘
                            │
                    ┌───────▼───────┐
                    │  PostgreSQL   │
                    │   Replica     │
                    └───────────────┘


            Celery Workers (Independent Scaling)
            ┌───────────────────────────────────────────────┐
            │                                               │
    ┌───────┴───────┐ ┌───────────────┐ ┌─────────────────┐
    │   Worker 1    │ │   Worker 2    │ │    Worker N     │
    │               │ │               │ │                 │
    │  • Processing │ │  • Processing │ │  • Processing   │
    │  • GPU opt.   │ │  • GPU opt.   │ │  • GPU opt.     │
    └───────────────┘ └───────────────┘ └─────────────────┘
```

### Vertical Scaling

| Component | CPU Intensive | Memory Intensive | I/O Intensive |
|-----------|--------------|------------------|---------------|
| Frontend | Low | Low | Medium |
| Backend API | Low | Medium | High |
| Celery Worker | **High** | **High** | Medium |
| PostgreSQL | Medium | Medium | **High** |
| Redis | Low | Medium | Low |

### Performance Bottlenecks

1. **Gemini API Calls** (5-30s per image)
   - Mitigation: Batch processing, parallel workers
   - Fallback: OpenCV processing (~1-5s)

2. **Image Processing** (1-5s per image)
   - Mitigation: GPU acceleration, parallel workers
   - Optimization: Resize large images before processing

3. **Database Writes**
   - Mitigation: Batch inserts, connection pooling
   - Optimization: Async operations, read replicas

4. **File Storage**
   - Mitigation: S3 with CDN, presigned URLs
   - Optimization: Compression, caching

---

## Disaster Recovery

### Backup Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                      BACKUP SCHEDULE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Database (PostgreSQL):                                         │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  • Full backup: Daily at 02:00 UTC                      │   │
│   │  • Incremental: Every 6 hours                           │   │
│   │  • WAL archiving: Continuous                            │   │
│   │  • Retention: 30 days                                   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   File Storage:                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  • S3 cross-region replication (if using S3)            │   │
│   │  • Local: rsync to backup server                        │   │
│   │  • Retention: Indefinite (forensic evidence)            │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   Configuration:                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  • Git repository for code                              │   │
│   │  • Secrets in vault/secure storage                      │   │
│   │  • Docker images in registry                            │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Recovery Procedures

**Database Recovery:**
```bash
# Stop application
docker-compose down

# Restore from backup
pg_restore -d forensic_db backup.dump

# Verify integrity
docker-compose exec db psql -U postgres -d forensic_db -c "SELECT COUNT(*) FROM fingerprints;"

# Restart application
docker-compose up -d
```

**File Storage Recovery:**
```bash
# Restore from backup
rsync -av backup/storage/ /app/storage/

# Verify file integrity
find /app/storage -name "*.png" -exec sha256sum {} \; > checksums.txt
```

### Recovery Time Objectives

| Scenario | RTO | RPO |
|----------|-----|-----|
| Application failure | 5 min | 0 |
| Database corruption | 1 hour | 6 hours |
| Complete server loss | 4 hours | 24 hours |
| Data center failure | 8 hours | 24 hours |

---

## Monitoring & Observability

### Recommended Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY STACK                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Metrics (Prometheus):                                          │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  • API response times                                   │   │
│   │  • Request counts by endpoint                           │   │
│   │  • Celery queue depth                                   │   │
│   │  • Processing success/failure rates                     │   │
│   │  • Database connection pool                             │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   Logging (ELK/Loki):                                            │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  • Application logs (JSON format)                       │   │
│   │  • Access logs                                          │   │
│   │  • Error tracking                                       │   │
│   │  • Audit log analysis                                   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   Dashboards (Grafana):                                          │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  • System overview                                      │   │
│   │  • Processing pipeline                                  │   │
│   │  • User activity                                        │   │
│   │  • Error rates                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   Alerting:                                                      │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  • API error rate > 5%                                  │   │
│   │  • Celery queue > 100 tasks                            │   │
│   │  • Database connections exhausted                       │   │
│   │  • Disk usage > 80%                                    │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Health Check Endpoints

```
GET /api/v1/health
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "redis": "connected",
  "celery": "active",
  "storage": "available"
}
```

---

## Deployment Environments

### Development

```yaml
# docker-compose.yml
services:
  frontend:
    build: ./frontend
    ports: ["80:80"]

  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      - DEBUG=true

  db:
    image: postgres:14
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  celery_worker:
    build: ./backend
    command: celery -A app.workers.tasks worker
```

### Production

```yaml
# docker-compose.prod.yml
services:
  caddy:
    image: caddy:2
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile

  frontend:
    build: ./frontend
    # No exposed ports - accessed via Caddy

  backend:
    build: ./backend
    # No exposed ports - accessed via Caddy
    environment:
      - DEBUG=false

  db:
    image: postgres:14
    # No exposed ports - internal network only
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    # No exposed ports - internal network only
    command: redis-server --requirepass ${REDIS_PASSWORD}

  celery_worker:
    build: ./backend
    deploy:
      replicas: 2
```

---

## Technology Decision Rationale

| Decision | Rationale |
|----------|-----------|
| **FastAPI** | Async support, automatic OpenAPI docs, Pydantic validation |
| **PostgreSQL** | ACID compliance, JSON support, forensic reliability |
| **Redis** | Fast broker, simple setup, pub/sub capabilities |
| **Celery** | Mature, well-documented, flexible task routing |
| **React** | Component ecosystem, TypeScript support, performance |
| **Tailwind CSS** | Rapid development, consistent design, dark mode |
| **Google Gemini** | State-of-art VLM, image understanding, reliability |
| **OpenCV** | Deterministic fallback, proven algorithms |
| **Docker** | Consistent environments, easy deployment |
| **Caddy** | Automatic HTTPS, simple config, reverse proxy |
