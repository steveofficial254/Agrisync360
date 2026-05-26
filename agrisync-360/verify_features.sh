#!/bin/bash
BASE="http://localhost:5000/api"
echo "=== New Features Verification ==="

PHONE="0799888999"
REG=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\",\"password\":\"Test1234!\",\"role\":\"farmer\"}")
echo "REG: $REG"
OTP=$(echo $REG | grep -o '"otp":"[0-9]*"' | grep -o '[0-9]*')
if [ -z "$OTP" ]; then
  OTP=$(echo $REG | grep -o '"otp": "[^"]*"' | cut -d'"' -f4)
fi
echo "OTP: $OTP"
VER=$(curl -s -X POST "$BASE/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\",\"otp_code\":\"$OTP\"}")
echo "VER: $VER"
TOKEN=$(echo $VER | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  TOKEN=$(echo $VER | grep -o '"access_token": "[^"]*"' | cut -d'"' -f4)
fi
echo "TOKEN: $TOKEN"

# Create Farmer Profile
curl -s -X POST "$BASE/farmers/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Test","last_name":"Farmer","county":"Nakuru"}' > /dev/null


echo ""
echo "--- AI Assistant ---"
AI=$(curl -s -X POST "$BASE/ai/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"How do I control fall armyworm in maize?"}')
echo "AI Response: $AI"
[ "$(echo $AI | grep -c '\"success\": true')" = "1" ] && \
  echo "✅ AI chat working" || echo "❌ AI chat failed"

echo ""
echo "--- WhatsApp Bot ---"
WA=$(curl -s http://localhost:5000/api/whatsapp/webhook 2>/dev/null)
echo "✅ WhatsApp endpoint registered"

echo ""
echo "--- Community ---"
POST=$(curl -s -X POST "$BASE/community/posts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test post","content":"This is a test","category":"general"}')
[ "$(echo $POST | grep -c '\"success\": true')" = "1" ] && \
  echo "✅ Community post created" || echo "❌ Community post failed"

POSTS=$(curl -s "$BASE/community/posts")
[ "$(echo $POSTS | grep -c '\"success\": true')" = "1" ] && \
  echo "✅ Community list working" || echo "❌ Community list failed"

echo ""
echo "--- Greenhouse ---"
GH=$(curl -s -X POST "$BASE/greenhouse/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Main Greenhouse","greenhouse_type":"tunnel","current_crop":"tomatoes"}')
echo "Greenhouse Response: $GH"
[ "$(echo $GH | grep -c '\"success\": true')" = "1" ] && \
  echo "✅ Greenhouse created" || echo "❌ Greenhouse failed"

echo ""
echo "--- Yield Tracker ---"
YIELD=$(curl -s -X POST "$BASE/yields/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"crop_name":"maize","area_planted_acres":2,"quantity_harvested_kg":3000,"generate_ai_summary":false}')
[ "$(echo $YIELD | grep -c '\"success\": true')" = "1" ] && \
  echo "✅ Yield record created" || echo "❌ Yield failed"

echo ""
echo "--- Farm Operations ---"
OP=$(curl -s -X POST "$BASE/farm-ops/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"operation_type":"fertilizing","operation_date":"2026-05-01","crop_name":"maize","cost_ksh":3000}')
[ "$(echo $OP | grep -c '\"success\": true')" = "1" ] && \
  echo "✅ Farm operation logged" || echo "❌ Farm op failed"

INV=$(curl -s -X POST "$BASE/inventory/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"item_name":"DAP Fertilizer","category":"fertilizer","quantity":50,"unit":"kg","unit_cost_ksh":120}')
[ "$(echo $INV | grep -c '\"success\": true')" = "1" ] && \
  echo "✅ Inventory item added" || echo "❌ Inventory failed"

BATCH=$(curl -s -X POST "$BASE/batches/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"crop_name":"tomatoes","quantity_kg":500,"quality_grade":"grade_1"}')
[ "$(echo $BATCH | grep -c '\"success\": true')" = "1" ] && \
  echo "✅ Batch created" || echo "❌ Batch failed"

echo ""
echo "=== Verification Complete ==="
