#!/bin/bash

# Test Build Script for AgriSync 360
echo "🧪 Testing Optimized Build"
echo "========================="

cd "$(dirname "$0")"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Run optimized build
echo "🏗️  Running optimized build..."
npm run build

# Check build results
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📊 Build Analysis:"
    
    # Show file sizes
    echo "📁 Build files and sizes:"
    find dist -type f -exec ls -lh {} \; | awk '{print $5, $9}'
    
    echo ""
    echo "📈 Bundle Size Summary:"
    echo "Total size: $(du -sh dist | cut -f1)"
    echo "JS bundles: $(find dist -name '*.js' | wc -l) files"
    echo "CSS bundles: $(find dist -name '*.css' | wc -l) files"
    
    # Check for code splitting
    echo ""
    echo "🔍 Code Splitting Analysis:"
    if find dist -name '*vendor*' -o -name '*router*' -o -name '*charts*' | grep -q .; then
        echo "✅ Code splitting working - Found vendor chunks"
    else
        echo "ℹ️  No vendor chunks found (may be bundled together)"
    fi
    
    echo ""
    echo "🚀 Build optimization complete!"
    echo "Ready for production deployment!"
    
else
    echo "❌ Build failed!"
    exit 1
fi
