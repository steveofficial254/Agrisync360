#!/bin/bash
set -e

echo "======================================"
echo "  AgriSync 360 — Production Deployment"
echo "  $(date)"
echo "======================================"

# Configuration
APP_DIR="/var/www/agrisync360"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
NGINX_CONF="/etc/nginx/nginx.conf"
DOMAIN="agrisync360.co.ke"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

ok() { echo -e "${GREEN}✅ $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# Step 1: Update code
echo ""
echo "Step 1: Pulling latest code..."
cd $APP_DIR
git pull origin main || fail "Git pull failed"
ok "Code updated"

# Step 2: Backend dependencies
echo ""
echo "Step 2: Updating backend dependencies..."
cd $BACKEND_DIR
source venv/bin/activate
pip install -r requirements.txt -q
ok "Backend dependencies updated"

# Step 3: Database migrations
echo ""
echo "Step 3: Running database migrations..."
cd $BACKEND_DIR
FLASK_APP=run.py flask db upgrade
ok "Database migrations complete"

# Step 4: Populate content
echo ""
echo "Step 4: Updating content..."
cd $BACKEND_DIR
python populate_content.py
ok "Content populated"

# Step 5: Build frontend
echo ""
echo "Step 5: Building frontend..."
cd $FRONTEND_DIR
npm ci --silent
npm run build
ok "Frontend built"

# Step 6: Restart services
echo ""
echo "Step 6: Restarting services..."

# Restart Gunicorn
sudo systemctl restart agrisync-api
ok "API service restarted"

# Restart Celery
sudo systemctl restart agrisync-celery
sudo systemctl restart agrisync-celery-beat
ok "Celery services restarted"

# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx
ok "Nginx reloaded"

# Step 7: Health check
echo ""
echo "Step 7: Running health checks..."
sleep 3

HEALTH=$(curl -s https://$DOMAIN/api/health 2>/dev/null)
if echo "$HEALTH" | grep -q '"success": true'; then
    ok "Production health check passed"
else
    fail "Health check failed: $HEALTH"
fi

echo ""
echo "======================================"
echo "  DEPLOYMENT COMPLETE"
echo "  Site: https://$DOMAIN"
echo "  API:  https://$DOMAIN/api/health"
echo "======================================"
