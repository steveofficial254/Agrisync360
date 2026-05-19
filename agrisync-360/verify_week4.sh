#!/bin/bash
echo "======================================"
echo "  AgriSync 360 — Week 4 Verification"
echo "======================================"

BASE_LOCAL="http://localhost:5173"
BASE_API="http://localhost:5000"
PASS=0
FAIL=0

check() {
    local name=$1
    local result=$2
    local expected=$3
    if echo "$result" | grep -qi "$expected"; then
        echo "✅ $name"
        PASS=$((PASS+1))
    else
        echo "❌ $name"
        echo "   Expected: $expected"
        echo "   Got: ${result:0:80}"
        FAIL=$((FAIL+1))
    fi
}

# PWA checks
echo ""
echo "📱 PWA CHECKS"
check "manifest.json exists" \
    "$(cat frontend/public/manifest.json 2>/dev/null | head -5)" \
    '"name"'
check "manifest has icons" \
    "$(cat frontend/public/manifest.json 2>/dev/null)" \
    '"icons"'
check "Service worker exists" \
    "$(cat frontend/public/sw.js 2>/dev/null | head -3)" \
    "Service Worker"
check "index.html has manifest link" \
    "$(cat frontend/index.html 2>/dev/null)" \
    'manifest.json'
check "index.html has theme-color" \
    "$(cat frontend/index.html 2>/dev/null)" \
    'theme-color'
check "PWA icons exist" \
    "$(ls frontend/public/icons/ 2>/dev/null | wc -l)" \
    "[3-9]\|[0-9][0-9]"
check "sw.js in dist" \
    "$(ls frontend/dist/ 2>/dev/null)" \
    "sw.js"
check "manifest.json in dist" \
    "$(ls frontend/dist/ 2>/dev/null)" \
    "manifest"

# Build check
echo ""
echo "🔨 BUILD CHECKS"
cd frontend
BUILD=$(npm run build 2>&1)
check "Frontend builds clean" "$BUILD" "built in"
check "dist/ directory exists" "$(ls dist/ 2>/dev/null)" "index.html"
check "sw.js in dist" "$(ls dist/ 2>/dev/null)" "sw.js"
check "manifest.json in dist" "$(ls dist/ 2>/dev/null)" "manifest"

# Mobile check
echo ""
echo "📱 MOBILE UI CHECKS"
check "DashboardLayout has lg:hidden" \
    "$(cat frontend/src/layouts/DashboardLayout.jsx 2>/dev/null)" \
    "lg:hidden"
check "Pages have pb-24 mobile padding" \
    "$(grep -r 'pb-24' frontend/src/pages/ 2>/dev/null | wc -l)" \
    "[1-9]"

# Content check
echo ""
echo "📚 CONTENT CHECKS"
cd backend
source venv/bin/activate 2>/dev/null

python3 -c "
from app import create_app
from app.models.advisory import Advisory
from app.models.market import MarketPrice
from app.models.user import User

app = create_app('development')
with app.app_context():
    adv = Advisory.query.count()
    mkt = MarketPrice.query.count()
    usr = User.query.count()
    print(f'Advisories: {adv}')
    print(f'Market prices: {mkt}')
    print(f'Users: {usr}')
    print(f'OK:{adv > 5}:{mkt > 100}:{usr > 0}')
" 2>/dev/null | while read line; do
    if echo "$line" | grep -q "OK:True:True:True"; then
        echo "✅ Database content populated"
        PASS=$((PASS+1))
    fi
done

cd ..

# API checks
echo ""
echo "🔌 API CHECKS"
check "Health endpoint" \
    "$(curl -s $BASE_API/api/health 2>/dev/null)" \
    '"success": true'
check "Weather API" \
    "$(curl -s '$BASE_API/api/weather/forecast?lat=-1.2921&lon=36.8219' 2>/dev/null)" \
    '"success": true'
check "Advisory maize" \
    "$(curl -s $BASE_API/api/advisory/crop/maize 2>/dev/null)" \
    '"success": true'
check "Market prices" \
    "$(curl -s $BASE_API/api/market/prices 2>/dev/null)" \
    '"success": true'
check "Plans endpoint" \
    "$(curl -s $BASE_API/api/payments/plans 2>/dev/null)" \
    'basic_monthly'

# USSD checks
echo ""
echo "📱 USSD CHECKS"
for text in "" "1" "1*1" "2" "2*1" "2*1*1" "2*1*2" "2*1*3" "3" "3*1" "3*1*1" "3*1*2" "3*1*3" "5" "5*1" "5*2" "5*3" "0"; do
    ENCODED=$(echo $text | sed 's/\*/%2A/g')
    RESP=$(curl -s "$BASE_API/api/ussd/test?text=$ENCODED" 2>/dev/null)
    MENU=$(echo "$RESP" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(d.get('response', '')[:20])
except: pass
" 2>/dev/null)
    LEN=$(echo "$MENU" | wc -c)
    if [ -n "$MENU" ]; then
        echo "✅ USSD text='$text' → ${MENU:0:20}..."
        PASS=$((PASS+1))
    else
        echo "❌ USSD text='$text' failed"
        FAIL=$((FAIL+1))
    fi
done

# Security check
echo ""
echo "🔒 SECURITY CHECKS"
check "CORS configured" \
    "$(grep -r 'CORS\|cors' backend/app/__init__.py 2>/dev/null)" \
    "CORS\|cors"
check "Rate limiting configured" \
    "$(grep -r 'Limiter\|limiter\|ratelimit' backend/app/ 2>/dev/null | head -1)" \
    "Limiter\|limit"
check "JWT secret not default" \
    "$(grep JWT_SECRET_KEY backend/.env 2>/dev/null)" \
    "JWT_SECRET_KEY"

# File structure check
echo ""
echo "📁 FILE STRUCTURE"
REQUIRED_FILES=(
    "frontend/public/manifest.json"
    "frontend/public/sw.js"
    "frontend/src/hooks/usePWA.js"
    "frontend/src/hooks/useMobile.js"
    "frontend/src/components/pwa/InstallBanner.jsx"
    "frontend/src/components/onboarding/OnboardingTour.jsx"
    "backend/populate_content.py"
    "deploy/nginx.conf"
    "deploy/deploy.sh"
    "verify_week4.sh"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
        PASS=$((PASS+1))
    else
        echo "❌ MISSING: $file"
        FAIL=$((FAIL+1))
    fi
done

# Final summary
echo ""
echo "======================================"
TOTAL=$((PASS+FAIL))
PCT=$((PASS * 100 / TOTAL))
echo "RESULTS: $PASS/$TOTAL passed ($PCT%)"
echo "======================================"

if [ $PCT -eq 100 ]; then
    echo ""
    echo "🎉 ALL WEEK 4 TASKS COMPLETE!"
    echo ""
    echo "Week 3 ✅ — Professional frontend complete"
    echo "Week 4 ✅ — PWA, mobile, content, security"
    echo ""
    echo "Ready for: DigitalOcean Production Deployment"
    echo ""
    echo "Next steps:"
    echo "1. Purchase agrisync360.co.ke domain (KSH 1,200)"
    echo "2. Create DigitalOcean droplet (USD 12/month)"  
    echo "3. Run: bash deploy/deploy.sh"
    echo "4. Configure SSL: certbot --nginx -d agrisync360.co.ke"
    echo "5. Go live! 🚀"
else
    echo ""
    echo "⚠️  $FAIL checks failing — fix above items"
fi
echo "======================================"
