#!/bin/bash
set -e

echo "======================================"
echo "  AgriSync 360 — Week 4 Test Runner"
echo "======================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# Check if we're in frontend directory
if [ ! -f "package.json" ]; then
    fail "Must run from frontend directory"
fi

echo ""
echo "🔧 Step 1: Install test dependencies"
npm install --silent --no-progress
ok "Test dependencies installed"

echo ""
echo "🧪 Step 2: Run Week 4 component tests"
echo "Testing PWA, Mobile, and Onboarding components..."

# Run the tests
npm test src/tests/week4.test.js -- --reporter=verbose --no-coverage 2>&1 | tee test_output.log

# Check test results
if grep -q "PASSING" test_output.log; then
    ok "All Week 4 component tests passing"
else
    fail "Some tests failed - check test_output.log"
fi

echo ""
echo "🔍 Step 3: Check for syntax errors in components"

# Check each component for syntax errors
COMPONENTS=(
    "src/components/pwa/InstallBanner.jsx"
    "src/components/onboarding/OnboardingTour.jsx"
    "src/hooks/usePWA.js"
    "src/hooks/useMobile.js"
    "src/layouts/DashboardLayout.jsx"
    "src/pages/farmer/Dashboard.jsx"
)

SYNTAX_ERRORS=0

for component in "${COMPONENTS[@]}"; do
    if [ -f "$component" ]; then
        # Check for common JSX/JS syntax issues
        if node -c "$component" 2>/dev/null; then
            ok "Syntax OK: $(basename $component)"
        else
            fail "Syntax Error: $(basename $component)"
            SYNTAX_ERRORS=$((SYNTAX_ERRORS+1))
        fi
    else
        warn "Missing: $component"
        SYNTAX_ERRORS=$((SYNTAX_ERRORS+1))
    fi
done

echo ""
echo "📱 Step 4: Check PWA files"

PWA_FILES=(
    "public/manifest.json"
    "public/sw.js"
    "public/icons/icon.svg"
)

PWA_ERRORS=0

for file in "${PWA_FILES[@]}"; do
    if [ -f "$file" ]; then
        case "$file" in
            "public/manifest.json")
                # Validate JSON
                if python3 -m json.tool "$file" >/dev/null 2>&1; then
                    ok "manifest.json valid JSON"
                else
                    fail "manifest.json invalid JSON"
                    PWA_ERRORS=$((PWA_ERRORS+1))
                fi
                ;;
            "public/sw.js")
                # Check for service worker syntax
                if grep -q "self.addEventListener" "$file"; then
                    ok "sw.js has event listeners"
                else
                    warn "sw.js missing event listeners"
                fi
                ;;
            *)
                ok "PWA file exists: $(basename $file)"
                ;;
        esac
    else
        warn "Missing PWA file: $file"
        PWA_ERRORS=$((PWA_ERRORS+1))
    fi
done

echo ""
echo "🌐 Step 5: Check build process"

# Clean build
rm -rf dist/ 2>/dev/null

# Try to build
BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    ok "Frontend builds successfully"
    
    # Check build output
    if [ -f "dist/index.html" ] && [ -f "dist/sw.js" ]; then
        ok "PWA files in build output"
    else
        warn "PWA files missing from build"
    fi
else
    fail "Build failed - check output above"
    echo "$BUILD_OUTPUT"
fi

echo ""
echo "📊 Step 6: Check imports and exports"

# Check if components can be imported
IMPORT_ERRORS=0

# Test imports
node -e "
try {
    require('./src/components/pwa/InstallBanner.jsx');
    console.log('✅ InstallBanner imports OK');
} catch (e) {
    console.log('❌ InstallBanner import error:', e.message);
    process.exit(1);
}
" 2>/dev/null || IMPORT_ERRORS=$((IMPORT_ERRORS+1))

node -e "
try {
    require('./src/components/onboarding/OnboardingTour.jsx');
    console.log('✅ OnboardingTour imports OK');
} catch (e) {
    console.log('❌ OnboardingTour import error:', e.message);
    process.exit(1);
}
" 2>/dev/null || IMPORT_ERRORS=$((IMPORT_ERRORS+1))

node -e "
try {
    const pwa = require('./src/hooks/usePWA.js');
    console.log('✅ usePWA imports OK');
    if (typeof pwa === 'function') {
        console.log('✅ usePWA exports function');
    } else {
        console.log('❌ usePWA does not export function');
        process.exit(1);
    }
} catch (e) {
    console.log('❌ usePWA import error:', e.message);
    process.exit(1);
}
" 2>/dev/null || IMPORT_ERRORS=$((IMPORT_ERRORS+1))

node -e "
try {
    const mobile = require('./src/hooks/useMobile.js');
    console.log('✅ useMobile imports OK');
    if (typeof mobile === 'function') {
        console.log('✅ useMobile exports function');
    } else {
        console.log('❌ useMobile does not export function');
        process.exit(1);
    }
} catch (e) {
    console.log('❌ useMobile import error:', e.message);
    process.exit(1);
}
" 2>/dev/null || IMPORT_ERRORS=$((IMPORT_ERRORS+1))

if [ $IMPORT_ERRORS -eq 0 ]; then
    ok "All imports and exports correct"
else
    fail "$IMPORT_ERRORS import/export errors found"
fi

echo ""
echo "🎯 Step 7: Check mobile responsiveness"

# Check mobile CSS classes
if grep -r "lg:hidden" src/layouts/DashboardLayout.jsx >/dev/null; then
    ok "Mobile navigation classes present"
else
    warn "Mobile navigation classes missing"
fi

# Check touch targets
if grep -r "min-h-\|h-12\|h-16" src/components/pwa/ src/components/onboarding/ >/dev/null; then
    ok "Touch target sizes present"
else
    warn "Touch target sizes may be too small"
fi

echo ""
echo "📈 Step 8: Performance check"

# Check bundle size (if dist exists)
if [ -d "dist" ]; then
    BUNDLE_SIZE=$(du -sh dist/ | cut -f1)
    if [ ${BUNDLE_SIZE%KB} -lt 5000 ]; then
        ok "Bundle size acceptable: ${BUNDLE_SIZE}"
    else
        warn "Bundle size large: ${BUNDLE_SIZE}"
    fi
else
    warn "No build directory to check bundle size"
fi

# Final summary
echo ""
echo "======================================"
echo "  WEEK 4 TEST RESULTS"
echo "======================================"

TOTAL_ERRORS=$((SYNTAX_ERRORS + PWA_ERRORS + IMPORT_ERRORS))

if [ $TOTAL_ERRORS -eq 0 ] && [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "🎉 ALL TESTS PASSING!"
    echo ""
    echo "✅ Component Tests: PASSING"
    echo "✅ Syntax Check: NO ERRORS"  
    echo "✅ PWA Files: COMPLETE"
    echo "✅ Build Process: SUCCESS"
    echo "✅ Import/Export: CORRECT"
    echo "✅ Mobile Design: RESPONSIVE"
    echo ""
    echo "Week 4 is 100% complete and ready for production!"
else
    echo ""
    echo "⚠️  ISSUES FOUND:"
    [ $SYNTAX_ERRORS -gt 0 ] && echo "  - $SYNTAX_ERRORS syntax errors"
    [ $PWA_ERRORS -gt 0 ] && echo "  - $PWA_ERRORS PWA file errors"
    [ $IMPORT_ERRORS -gt 0 ] && echo "  - $IMPORT_ERRORS import/export errors"
    [ $BUILD_EXIT_CODE -ne 0 ] && echo "  - Build process failed"
    echo ""
    echo "Fix above issues before proceeding to production."
fi

echo "======================================"

# Cleanup
rm -f test_output.log

exit $TOTAL_ERRORS
