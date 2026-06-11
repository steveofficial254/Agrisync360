#!/bin/bash

echo "════════════════════════════════════════"
echo "  AgriSync 360 — CI Setup"
echo "════════════════════════════════════════"
echo ""

REPO="Steveofficial254/agrisync-360"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI not installed"
  echo "Install from: https://cli.github.com"
  exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
  echo "❌ Not authenticated with GitHub"
  echo "Run: gh auth login"
  exit 1
fi

echo "Setting up GitHub secrets..."
echo ""

# Slack webhook
read -p "Enter Slack webhook URL (press Enter to skip): " SLACK_WEBHOOK
if [ -n "$SLACK_WEBHOOK" ]; then
  gh secret set SLACK_WEBHOOK_URL -b "$SLACK_WEBHOOK" -R $REPO
  echo "✅ SLACK_WEBHOOK_URL set"
fi

# Codecov token
read -p "Enter Codecov token (press Enter to skip): " CODECOV_TOKEN
if [ -n "$CODECOV_TOKEN" ]; then
  gh secret set CODECOV_TOKEN -b "$CODECOV_TOKEN" -R $REPO
  echo "✅ CODECOV_TOKEN set"
fi

# DigitalOcean token
read -p "Enter DigitalOcean token (press Enter to skip): " DO_TOKEN
if [ -n "$DO_TOKEN" ]; then
  gh secret set DIGITALOCEAN_TOKEN -b "$DO_TOKEN" -R $REPO
  echo "✅ DIGITALOCEAN_TOKEN set"
fi

# DigitalOcean app ID
read -p "Enter DigitalOcean App ID (press Enter to skip): " DO_APP_ID
if [ -n "$DO_APP_ID" ]; then
  gh secret set DIGITALOCEAN_APP_ID -b "$DO_APP_ID" -R $REPO
  echo "✅ DIGITALOCEAN_APP_ID set"
fi

echo ""
echo "════════════════════════════════════════"
echo "✅ CI Setup Complete"
echo "════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Push to GitHub"
echo "2. Watch workflow run: GitHub → Actions"
echo "3. Check test results"
echo "4. Deploy when main branch passes"
