#!/bin/bash

echo "════════════════════════════════════════"
echo "  AgriSync 360 — CI Monitor"
echo "════════════════════════════════════════"
echo ""

REPO="Steveofficial254/agrisync-360"
BRANCH="${1:-main}"

echo "Branch: $BRANCH"
echo ""

# Get latest workflow runs
echo "📊 Latest runs:"
gh run list -R $REPO \
  --branch $BRANCH \
  --workflow tests.yml \
  --limit 10

echo ""
echo "Latest run details:"
LATEST_RUN=$(gh run list -R $REPO \
  --branch $BRANCH \
  --workflow tests.yml \
  --limit 1 \
  --json databaseId \
  --jq '.[0].databaseId')

if [ -z "$LATEST_RUN" ]; then
  echo "No runs found"
  exit 1
fi

gh run view $LATEST_RUN -R $REPO --log

echo ""
echo "Coverage:"
curl -s https://codecov.io/api/gh/$REPO | jq '.coverage'
