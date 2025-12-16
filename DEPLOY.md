# Deployment Guide - Forensic Fingerprint Platform

## Quick Start (Local Testing)

```bash
# 1. Clone and navigate to project
cd forensic_project

# 2. Copy and configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 3. Build and start
docker compose up -d --build

# 4. Run database migrations
docker compose exec backend alembic upgrade head

# 5. Access the app
open http://localhost  # Frontend on port 80
```

## Production Deployment (VPS/Cloud Server)

### Prerequisites

- Ubuntu 20.04+ or similar Linux server
- Docker and Docker Compose installed
- Domain name pointing to your server IP
- Ports 80 and 443 open in firewall

### Step 1: Server Setup

```bash
# Install Docker (if not installed)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for docker group to take effect
```

### Step 2: Clone and Configure

```bash
# Clone repository
git clone <your-repo-url> forensic_project
cd forensic_project

# Create production environment file
cp .env.example .env
```

Edit `.env` with secure production values:

```bash
# Generate secure passwords
POSTGRES_PASSWORD=$(openssl rand -hex 16)
REDIS_PASSWORD=$(openssl rand -hex 16)
SECRET_KEY=$(openssl rand -hex 32)
GEMINI_API_KEY=AIzaSyCbMPYHgThJ8zHqck-7jdYeXAp5_mlRkwI

echo "POSTGRES_USER=postgres"
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
echo "POSTGRES_DB=forensic_db"
echo "REDIS_PASSWORD=$REDIS_PASSWORD"
echo "SECRET_KEY=$SECRET_KEY"
echo "GEMINI_API_KEY=$GEMINI_API_KEY"
```

### Step 3: Configure Domain (SSL)

Edit `Caddyfile` and replace `localhost` with your domain:

```
your-domain.com {
    # ... rest of config
}
```

### Step 4: Deploy

```bash
# Build and start with production config
docker compose -f docker-compose.prod.yml up -d --build

# Run database migrations
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Check logs
docker compose -f docker-compose.prod.yml logs -f
```

### Step 5: Verify

```bash
# Check all services are running
docker compose -f docker-compose.prod.yml ps

# Test health endpoint
curl http://localhost/api/v1/health
```

## Architecture

```
                   ┌─────────────────┐
                   │     Caddy       │ :80/:443
                   │  (Reverse Proxy)│
                   └────────┬────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                │
   ┌─────────────┐  ┌─────────────┐        │
   │   Frontend  │  │   Backend   │        │
   │  (Nginx)    │  │  (FastAPI)  │        │
   └─────────────┘  └──────┬──────┘        │
                          │                │
          ┌───────────────┼───────────────┐│
          │               │               ││
          ▼               ▼               ▼│
   ┌─────────────┐ ┌─────────────┐ ┌──────────────┐
   │  PostgreSQL │ │    Redis    │ │Celery Worker │
   │  (Database) │ │   (Queue)   │ │ (Processing) │
   └─────────────┘ └─────────────┘ └──────────────┘
```

## Common Operations

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f celery_worker
```

### Restart Services

```bash
docker compose restart backend celery_worker
```

### Scale Celery Workers

```bash
# Run 3 worker instances
docker compose up -d --scale celery_worker=3
```

### Database Backup

```bash
# Backup
docker compose exec db pg_dump -U postgres forensic_db > backup_$(date +%Y%m%d).sql

# Restore
cat backup.sql | docker compose exec -T db psql -U postgres forensic_db
```

### Update Application

```bash
git pull origin main
docker compose up -d --build
docker compose exec backend alembic upgrade head
```

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker compose logs backend

# Common issues:
# - Database not ready: wait or restart
# - Missing env vars: check .env file
```

### Celery tasks not processing

```bash
# Check worker logs
docker compose logs celery_worker

# Verify Redis connection
docker compose exec redis redis-cli ping
```

### Database connection issues

```bash
# Check if PostgreSQL is healthy
docker compose exec db pg_isready -U postgres

# Reset database (WARNING: destroys data)
docker compose down -v
docker compose up -d
```

## Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Use strong `SECRET_KEY`
- [ ] Enable HTTPS (automatic with Caddy + domain)
- [ ] Restrict database access (no exposed ports in production)
- [ ] Regular backups configured
- [ ] Monitor logs for errors
- [ ] Keep Docker images updated

## Server Requirements

| Component | Minimum  | Recommended |
| --------- | -------- | ----------- |
| CPU       | 2 cores  | 4 cores     |
| RAM       | 4 GB     | 8 GB        |
| Storage   | 20 GB    | 50 GB+ SSD  |
| Network   | 100 Mbps | 1 Gbps      |

Note: Image processing (fingerprint analysis) benefits significantly from more CPU cores and RAM.
