#!/bin/bash
echo "========================================"
echo "  AgriSync 360 — MVP Health Check"
echo "  $(date)"
echo "========================================"

PASS=0
FAIL=0

ok() { echo "✅ $1"; PASS=$((PASS+1)); }
fail() { echo "❌ $1 — $2"; FAIL=$((FAIL+1)); }

echo ""
echo "--- SERVICES ---"

# PostgreSQL
if pg_isready -q 2>/dev/null; then
  ok "PostgreSQL running"
else
  fail "PostgreSQL" "not running"
fi

# Redis
if redis-cli ping 2>/dev/null | grep -q PONG; then
  ok "Redis running"
else
  fail "Redis" "not running"
fi

# Database exists
DB_CHECK=$(PGPASSWORD=agrisync_pass psql -h localhost \
  -U agrisync_user agrisync_db -c "SELECT 1" 2>/dev/null)
if echo "$DB_CHECK" | grep -q "1"; then
  ok "Database agrisync_db accessible"
else
  fail "Database" "agrisync_db not accessible"
fi

echo ""
echo "--- BACKEND ---"

# Start Flask if not running
if ! curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
  cd /home/stevemburu/Development/Agrisync360/agrisync-360/backend
  source venv/bin/activate
  export FLASK_APP=run.py
  export FLASK_ENV=development
  python run.py > /tmp/flask.log 2>&1 &
  sleep 4
fi

HEALTH=$(curl -s http://localhost:5000/api/health 2>/dev/null)
if echo "$HEALTH" | grep -q '"success": true'; then
  ok "Flask API running on :5000"
else
  fail "Flask API" "not responding"
  cat /tmp/flask.log | tail -10
fi

# Check DB in health
if echo "$HEALTH" | grep -q '"database": "ok"'; then
  ok "Database connected to Flask"
else
  fail "Database connection" "from Flask"
fi

# Check Redis in health
if echo "$HEALTH" | grep -q '"redis": "ok"'; then
  ok "Redis connected to Flask"
else
  fail "Redis connection" "from Flask"
fi

echo ""
echo "--- BACKEND ENDPOINTS ---"

BASE="http://localhost:5000/api"

# Public endpoints
for ep in \
  "/health" \
  "/payments/plans" \
  "/market/prices" \
  "/advisory/crop/maize" \
  "/weather/forecast?lat=-1.2921&lon=36.8219" \
  "/ussd/test?text="; do
  
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$ep" 2>/dev/null)
  if [ "$STATUS" = "200" ]; then
    ok "GET $ep → $STATUS"
  else
    fail "GET $ep" "returned $STATUS"
  fi
done

# Auth endpoint
REG=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"phone":"0799777666","password":"Test1234!","role":"farmer"}' \
  2>/dev/null)
if echo "$REG" | grep -q '"success"'; then
  ok "POST /auth/register responds"
else
  fail "POST /auth/register" "not responding"
fi

# USSD endpoints
for text in "" "1" "1*1" "3" "3*1" "5"; do
  ENCODED=$(echo "$text" | sed 's/\*/%2A/g')
  RESP=$(curl -s "$BASE/ussd/test?text=$ENCODED" 2>/dev/null)
  if echo "$RESP" | grep -q '"response"'; then
    ok "USSD text='$text' responds"
  else
    fail "USSD text='$text'" "not responding"
  fi
done

echo ""
echo "--- FRONTEND ---"

# Start frontend if not running
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
  cd /home/stevemburu/Development/Agrisync360/agrisync-360/frontend
  npm run dev > /tmp/vite.log 2>&1 &
  sleep 5
fi

FRONT=$(curl -s -o /dev/null -w "%{http_code}" \
  http://localhost:5173 2>/dev/null)
if [ "$FRONT" = "200" ]; then
  ok "Frontend running on :5173"
else
  fail "Frontend" "not running — check /tmp/vite.log"
fi

PROXY=$(curl -s http://localhost:5173/api/health 2>/dev/null)
if echo "$PROXY" | grep -q '"success"'; then
  ok "API proxy working"
else
  fail "API proxy" "not forwarding requests"
fi

echo ""
echo "--- DATABASE CONTENT ---"

CONTENT=$(cd /home/stevemburu/Development/Agrisync360/agrisync-360/backend && \
  source venv/bin/activate && \
  python3 -c "
from app import create_app
app = create_app('development')
with app.app_context():
    from app.models.advisory import Advisory
    from app.models.market import Market
    from app.models.user import User
    adv = Advisory.query.count()
    mkt = Market.query.count()
    usr = User.query.count()
    print(f'adv:{adv} mkt:{mkt} usr:{usr}')
" 2>/dev/null)

ADV=$(echo $CONTENT | grep -o 'adv:[0-9]*' | cut -d: -f2)
MKT=$(echo $CONTENT | grep -o 'mkt:[0-9]*' | cut -d: -f2)
USR=$(echo $CONTENT | grep -o 'usr:[0-9]*' | cut -d: -f2)

[ "${ADV:-0}" -gt "5" ] && ok "Advisories: $ADV records" \
  || fail "Advisories" "only $ADV records — need more"
[ "${MKT:-0}" -gt "50" ] && ok "Market prices: $MKT records" \
  || fail "Market prices" "only $MKT records — need more"
[ "${USR:-0}" -gt "0" ] && ok "Users: $USR accounts" \
  || fail "Users" "no accounts — run seed"

echo ""
echo "--- BUILD CHECK ---"

BUILD=$(cd /home/stevemburu/Development/Agrisync360/agrisync-360/frontend && \
  npm run build 2>&1)
if echo "$BUILD" | grep -q "built in"; then
  ok "Frontend builds successfully"
else
  fail "Frontend build" "has errors"
  echo "$BUILD" | grep -i "error" | head -5
fi

echo ""
echo "========================================"
echo "HEALTH CHECK: $PASS passed / $((PASS+FAIL)) total"
SCORE=$((PASS * 100 / (PASS + FAIL)))
echo "Score: $SCORE%"
echo "========================================"
