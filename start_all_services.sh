#!/bin/bash
echo "========================================"
echo "  AgriSync 360 — Full System Startup"
echo "========================================"

# Services
sudo service postgresql start
sudo service redis-server start
sleep 2

echo "PostgreSQL: $(pg_isready -q && echo OK || echo FAILED)"
echo "Redis: $(redis-cli ping 2>/dev/null)"

# Backend
cd ~/Development/Agrisync360/agrisync-360/backend
source venv/bin/activate
export FLASK_APP=run.py
export FLASK_ENV=development

# Kill existing
pkill -f "python run.py" 2>/dev/null
sleep 1

# Run migrations for new tables
echo "Running migrations..."
flask db migrate -m "New features $(date +%s)" 2>/dev/null
flask db upgrade
echo "Migrations: done"

# Start Flask
python run.py > /tmp/flask.log 2>&1 &
sleep 4

HEALTH=$(curl -s http://localhost:5000/api/health 2>/dev/null)
if echo "$HEALTH" | grep -q '"success": true'; then
    echo "✅ Flask running on :5000"
else
    echo "❌ Flask failed"
    cat /tmp/flask.log | tail -15
    exit 1
fi

# Frontend
cd ~/Development/Agrisync360/agrisync-360/frontend
pkill -f vite 2>/dev/null
sleep 1
npm run dev > /tmp/vite.log 2>&1 &
sleep 5

FRONT=$(curl -s -o /dev/null -w "%{http_code}" \
    http://localhost:5173 2>/dev/null)
echo "Frontend: $FRONT"

PROXY=$(curl -s http://localhost:5173/api/health 2>/dev/null)
if echo "$PROXY" | grep -q '"success"'; then
    echo "✅ API proxy working"
else
    echo "❌ Proxy broken"
fi

echo ""
echo "All services ready"
echo "========================================"
