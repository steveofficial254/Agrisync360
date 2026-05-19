#!/bin/bash

# Quick Start Script for AgriSync 360
echo "🚀 AgriSync 360 - Quick Start"
echo "============================"

# Navigate to project root
cd "$(dirname "$0")"

echo "📍 Current directory: $(pwd)"

# Install Docker if needed
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    sudo apt update
    sudo apt install -y docker.io docker-compose
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    echo "✅ Docker installed!"
else
    echo "✅ Docker already installed"
fi

# Install docker-compose if needed
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed!"
else
    echo "✅ Docker Compose already installed"
fi

# Start backend services
echo "🐳 Starting backend services..."
docker-compose up -d postgres redis backend celery_worker celery_beat flower

# Check status
echo ""
echo "🔍 Checking service status..."
sleep 10
docker-compose ps

echo ""
echo "🎉 Backend services started!"
echo ""
echo "📋 Next steps:"
echo "1. cd frontend"
echo "2. chmod +x build_frontend.sh && ./build_frontend.sh"
echo "3. npm run dev"
echo ""
echo "🌐 Access points:"
echo "- Frontend: http://localhost:5173"
echo "- Backend API: http://localhost:5000"
echo "- Flower (Celery): http://localhost:5555"
