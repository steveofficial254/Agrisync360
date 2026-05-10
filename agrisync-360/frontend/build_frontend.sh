#!/bin/bash

# Frontend Build Script for AgriSync 360
echo "🏗️  AgriSync 360 - Frontend Build"
echo "=================================="

# Navigate to frontend directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if Tailwind CSS is properly configured
echo "🎨 Checking Tailwind CSS configuration..."
if [ ! -f "tailwind.config.js" ]; then
    echo "❌ Tailwind config not found"
    exit 1
fi

echo "✅ Tailwind config found"

# Run verification scripts first
echo "🔍 Running verification scripts..."

if [ -f "build_verification.js" ]; then
    echo "Running build verification..."
    node build_verification.js
    if [ $? -ne 0 ]; then
        echo "❌ Build verification failed"
        exit 1
    fi
fi

if [ -f "api_verification.js" ]; then
    echo "Running API verification..."
    node api_verification.js
    if [ $? -ne 0 ]; then
        echo "❌ API verification failed"
        exit 1
    fi
fi

if [ -f "component_verification.js" ]; then
    echo "Running component verification..."
    node component_verification.js
    if [ $? -ne 0 ]; then
        echo "❌ Component verification failed"
        exit 1
    fi
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Build the frontend
echo "🏗️  Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📁 Build output: dist/"
    
    # Show build size
    if [ -d "dist" ]; then
        echo "📊 Build size:"
        du -sh dist
        echo ""
        echo "📁 Build files:"
        find dist -type f | head -10
    fi
    
    echo ""
    echo "🚀 Frontend is ready for deployment!"
    echo ""
    echo "Next steps:"
    echo "1. Start backend services: cd ../ && docker-compose up -d postgres redis backend"
    echo "2. Start frontend: npm run dev"
    echo "3. Or serve build: npx serve dist"
    
else
    echo "❌ Build failed!"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check Tailwind CSS configuration"
    echo "2. Verify all imports are correct"
    echo "3. Check for syntax errors in components"
    echo "4. Run: npm run build --verbose for detailed errors"
    exit 1
fi
