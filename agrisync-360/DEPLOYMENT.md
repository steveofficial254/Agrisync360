# Deployment Guide

This guide covers deploying AgriSync 360 to production.

## Prerequisites

- Docker and Docker Compose installed
- SSL certificates for your domain
- DigitalOcean account (for App Platform deployment)
- GitHub repository with CI/CD configured

## Local Development

### Using Docker Compose

```bash
# Start all services
docker-compose up --build

# Start specific services
docker-compose up backend frontend

# Stop all services
docker-compose down

# Remove volumes (WARNING: deletes database data)
docker-compose down -v
```

### Without Docker

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
python run.py
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Production Deployment

### Option 1: DigitalOcean App Platform (Recommended)

The CI/CD pipeline automatically deploys to DigitalOcean when you push to `main`.

**Setup:**
1. Create a DigitalOcean App Platform account
2. Create a new app
3. Connect your GitHub repository
4. Configure environment variables
5. Add the following secrets to your GitHub repository:
   - `DIGITALOCEAN_TOKEN`
   - `DIGITALOCEAN_APP_ID`
   - `SLACK_WEBHOOK_URL` (optional)

**Manual Deployment:**
```bash
# Build and push images
docker build -t ghcr.io/yourusername/agrisync-360/backend:latest ./backend
docker build -t ghcr.io/yourusername/agrisync-360/frontend:latest ./frontend

# Push to GitHub Container Registry
docker login ghcr.io
docker push ghcr.io/yourusername/agrisync-360/backend:latest
docker push ghcr.io/yourusername/agrisync-360/frontend:latest

# Trigger deployment via DigitalOcean API or dashboard
```

### Option 2: Docker Compose Production

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

**Required Environment Variables:**
Create a `.env` file in the `backend` directory:
```env
FLASK_ENV=production
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://agrisync_user:password@postgres:5432/agrisync_db
REDIS_URL=redis://redis:6379/0
AT_API_KEY=africastalking-api-key
AT_USERNAME=sandbox
MPESA_CONSUMER_KEY=mpesa-consumer-key
MPESA_CONSUMER_SECRET=mpesa-consumer-secret
ANTHROPIC_API_KEY=anthropic-api-key
```

### Option 3: Manual Server Deployment

#### Backend
```bash
# Install dependencies
sudo apt-get update
sudo apt-get install python3.10 python3-pip postgresql-client

# Clone repository
git clone https://github.com/Steveofficial254/agrisync-360.git
cd agrisync-360/backend

# Create virtual environment
python3.10 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with production values

# Run migrations
flask db upgrade

# Start with Gunicorn
gunicorn --bind 0.0.0.0:5000 --workers 4 --timeout 120 run:app
```

#### Frontend
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
cd agrisync-360/frontend

# Install dependencies
npm ci

# Build for production
npm run build

# Serve with nginx or serve
npm install -g serve
serve -s dist -l 3000
```

## SSL/TLS Configuration

For production, you need SSL certificates. Use Let's Encrypt for free certificates:

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d agrisync360.co.ke

# Copy to nginx ssl directory
sudo cp /etc/letsencrypt/live/agrisync360.co.ke/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/agrisync360.co.ke/privkey.pem nginx/ssl/key.pem
```

## Monitoring

### Flower (Celery Monitoring)
Access Flower at `http://your-domain:5555` or `http://your-domain/flower/` (behind nginx)

### Health Checks
- Backend: `GET /api/health`
- Frontend: `GET /`

### Logs
```bash
# Docker Compose
docker-compose logs -f backend
docker-compose logs -f frontend

# Systemd (if using systemd)
sudo journalctl -u agrisync-backend -f
sudo journalctl -u agrisync-frontend -f
```

## Backup

### Database Backup
```bash
# Backup
docker exec agrisync360_postgres_1 pg_dump -U agrisync_user agrisync_db > backup.sql

# Restore
docker exec -i agrisync360_postgres_1 psql -U agrisync_user agrisync_db < backup.sql
```

### Automated Backups
Set up a cron job for automated backups:
```bash
# Add to crontab
0 2 * * * docker exec agrisync360_postgres_1 pg_dump -U agrisync_user agrisync_db > /backups/agrisync_$(date +\%Y\%m\%d).sql
```

## Troubleshooting

### Backend won't start
- Check database connection in `.env`
- Verify PostgreSQL is running
- Check logs: `docker-compose logs backend`

### Frontend build fails
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version (should be 18)
- Verify environment variables

### Celery tasks not executing
- Check Redis connection
- Verify Celery worker is running: `docker-compose logs celery_worker`
- Check Flower dashboard for task status

### SSL certificate errors
- Verify certificate paths in nginx.conf
- Check certificate expiration
- Ensure nginx has read permissions on certificate files

## Security Checklist

- [ ] Change default passwords
- [ ] Use strong SECRET_KEY
- [ ] Enable HTTPS
- [ ] Configure firewall rules
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Use environment variables for sensitive data
- [ ] Enable rate limiting
- [ ] Regular database backups
- [ ] Implement log rotation

## Scaling

### Horizontal Scaling
```bash
# Scale backend
docker-compose up -d --scale backend=3

# Scale Celery workers
docker-compose up -d --scale celery_worker=5
```

### Load Balancing
Use nginx or a cloud load balancer to distribute traffic across multiple backend instances.

## Support

For issues or questions:
- GitHub Issues: https://github.com/Steveofficial254/agrisync-360/issues
- Documentation: https://github.com/Steveofficial254/agrisync-360/wiki
