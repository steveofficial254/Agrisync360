// Run with: node verify_day8.js
const fs = require('fs');
const path = require('path');

const srcPath = './src';
const results = {};

function checkFile(filePath, checks) {
  const fullPath = path.join(srcPath, filePath);
  const exists = fs.existsSync(fullPath);
  
  if (!exists) {
    results[filePath] = { exists: false, checks: {} };
    console.log(`❌ MISSING: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const fileChecks = {};
  
  checks.forEach(check => {
    const found = content.includes(check.search);
    fileChecks[check.name] = found;
    if (!found) {
      console.log(`  ⚠️  ${filePath}: missing "${check.name}"`);
    }
  });
  
  results[filePath] = { exists: true, checks: fileChecks };
}

console.log('\n=== AgriSync 360 Day 8 File Verification ===\n');

// Check API files
checkFile('api/axios.js', [
  { name: 'axios.create', search: 'axios.create' },
  { name: 'baseURL /api', search: "baseURL: '/api'" },
  { name: 'request interceptor', search: 'interceptors.request' },
  { name: 'response interceptor', search: 'interceptors.response' },
  { name: '401 handling', search: '401' },
]);

checkFile('api/auth.js', [
  { name: 'authAPI export', search: 'export const authAPI' },
  { name: 'register method', search: 'register:' },
  { name: 'verifyOTP method', search: 'verifyOTP:' },
  { name: 'login method', search: 'login:' },
  { name: 'logout method', search: 'logout:' },
  { name: 'forgotPassword method', search: 'forgotPassword:' },
  { name: 'resetPassword method', search: 'resetPassword:' },
]);

checkFile('api/farmers.js', [
  { name: 'farmersAPI export', search: 'export const farmersAPI' },
  { name: 'getProfile', search: 'getProfile:' },
  { name: 'createProfile', search: 'createProfile:' },
  { name: 'createFarm', search: 'createFarm:' },
  { name: 'addCrop', search: 'addCrop:' },
  { name: 'getFarms', search: 'getFarms:' },
]);

checkFile('api/weather.js', [
  { name: 'weatherAPI export', search: 'export const weatherAPI' },
  { name: 'getForecast', search: 'getForecast:' },
  { name: 'getDiseaseRisk', search: 'getDiseaseRisk:' },
]);

checkFile('api/payments.js', [
  { name: 'paymentsAPI export', search: 'export const paymentsAPI' },
  { name: 'getPlans', search: 'getPlans:' },
  { name: 'subscribe', search: 'subscribe:' },
  { name: 'getSubscription', search: 'getSubscription:' },
]);

// Check context
checkFile('context/AuthContext.jsx', [
  { name: 'AuthProvider', search: 'AuthProvider' },
  { name: 'useAuth hook', search: 'export function useAuth' },
  { name: 'isAuthenticated', search: 'isAuthenticated' },
  { name: 'getDashboardPath', search: 'getDashboardPath' },
  { name: 'isFarmer', search: 'isFarmer' },
  { name: 'isAdmin', search: 'isAdmin' },
  { name: 'login function', search: 'login:' },
  { name: 'logout function', search: 'logout:' },
]);

checkFile('context/AppContext.jsx', [
  { name: 'AppProvider', search: 'AppProvider' },
  { name: 'useApp hook', search: 'export function useApp' },
]);

// Check layouts
checkFile('layouts/AuthLayout.jsx', [
  { name: 'AuthLayout default export', search: 'export default function AuthLayout' },
  { name: 'children prop', search: 'children' },
  { name: 'AgriSync branding', search: 'AgriSync' },
]);

checkFile('layouts/DashboardLayout.jsx', [
  { name: 'DashboardLayout default export', search: 'export default function DashboardLayout' },
  { name: 'sidebar navigation', search: 'sidebar' },
  { name: 'bottom navigation', search: 'BottomNav\\|bottom' },
  { name: 'logout function', search: 'logout' },
  { name: 'useAuth import', search: 'useAuth' },
]);

// Check components
const components = [
  ['components/common/Button.jsx', [
    { name: 'default export', search: 'export default function Button' },
    { name: 'variants', search: 'variants' },
    { name: 'isLoading prop', search: 'isLoading' },
    { name: 'primary variant', search: 'primary' },
    { name: 'Loader2 import', search: 'Loader2' },
  ]],
  ['components/common/Input.jsx', [
    { name: 'default export', search: 'export default function Input' },
    { name: 'error prop', search: 'error' },
    { name: 'label prop', search: 'label' },
    { name: 'password toggle', search: 'showPassword' },
    { name: 'Eye icon', search: 'Eye' },
  ]],
  ['components/common/Card.jsx', [
    { name: 'default export', search: 'export default function Card' },
    { name: 'hover prop', search: 'hover' },
    { name: 'padding prop', search: 'padding' },
  ]],
  ['components/common/Badge.jsx', [
    { name: 'default export', search: 'export default function Badge' },
    { name: 'variants', search: 'variants' },
    { name: 'pro variant', search: 'pro' },
    { name: 'basic variant', search: 'basic' },
  ]],
  ['components/common/Loader.jsx', [
    { name: 'Spinner export', search: 'export function Spinner' },
    { name: 'PageLoader export', search: 'export function PageLoader' },
    { name: 'Skeleton export', search: 'export function Skeleton' },
    { name: 'CardSkeleton export', search: 'export function CardSkeleton' },
    { name: 'Loader2 import', search: 'Loader2' },
  ]],
  ['components/common/Alert.jsx', [
    { name: 'default export', search: 'export default function Alert' },
    { name: 'success type', search: 'success' },
    { name: 'error type', search: 'error' },
    { name: 'dismissible', search: 'dismissible' },
    { name: 'AlertCircle import', search: 'AlertCircle' },
  ]],
  ['components/common/EmptyState.jsx', [
    { name: 'default export', search: 'export default function EmptyState' },
    { name: 'icon prop', search: 'icon' },
    { name: 'title prop', search: 'title' },
    { name: 'action prop', search: 'action' },
  ]],
];

components.forEach(([file, checks]) => {
  checkFile(file, checks);
});

// Check auth pages
const authPages = [
  ['pages/auth/Landing.jsx', [
    { name: 'default export', search: 'export default' },
    { name: 'AgriSync content', search: 'AgriSync' },
    { name: 'register link', search: '/register' },
    { name: 'login link', search: '/login' },
    { name: 'pricing section', search: 'KSH 99' },
    { name: 'features section', search: 'Weather Forecasts' },
    { name: 'USSD info', search: '*384*360#' },
  ]],
  ['pages/auth/Register.jsx', [
    { name: 'default export', search: 'export default' },
    { name: 'multi-step', search: 'step' },
    { name: 'OTP step', search: 'otp\\|OTP' },
    { name: 'role selection', search: 'role' },
    { name: 'authAPI.register', search: 'authAPI.register\\|register(' },
  ]],
  ['pages/auth/Login.jsx', [
    { name: 'default export', search: 'export default' },
    { name: 'phone input', search: 'phone' },
    { name: 'password input', search: 'password' },
    { name: 'authAPI.login', search: 'authAPI.login\\|login(' },
    { name: 'redirect by role', search: 'getDashboardPath\\|role' },
  ]],
  ['pages/auth/VerifyOTP.jsx', [
    { name: 'default export', search: 'export default' },
    { name: 'OTP inputs', search: 'otp\\|OTP' },
  ]],
  ['pages/auth/ForgotPassword.jsx', [
    { name: 'default export', search: 'export default' },
    { name: 'multi-step', search: 'step' },
    { name: 'reset password', search: 'resetPassword\\|reset' },
    { name: '3 steps', search: 'Step 1 of 3' },
    { name: 'authAPI.forgotPassword', search: 'authAPI.forgotPassword' },
  ]],
];

authPages.forEach(([file, checks]) => {
  checkFile(file, checks);
});

// Check farmer pages exist
const farmerPages = [
  'pages/farmer/Dashboard.jsx',
  'pages/farmer/Weather.jsx',
  'pages/farmer/Advisory.jsx',
  'pages/farmer/Market.jsx',
  'pages/farmer/Profile.jsx',
  'pages/farmer/FarmSetup.jsx',
  'pages/farmer/Subscription.jsx',
  'pages/admin/AdminDashboard.jsx',
  'pages/admin/FarmerManagement.jsx',
  'pages/agro_dealer/DealerDashboard.jsx',
  'pages/ngo/NGODashboard.jsx',
];

farmerPages.forEach(file => {
  const exists = fs.existsSync(path.join(srcPath, file));
  if (!exists) {
    console.log(`❌ MISSING PAGE: ${file}`);
    results[file] = { exists: false };
  } else {
    const content = fs.readFileSync(path.join(srcPath, file), 'utf8');
    const hasExport = content.includes('export default');
    results[file] = { exists: true, hasExport };
    if (!hasExport) {
      console.log(`⚠️  ${file}: missing default export`);
    }
  }
});

// Check App.jsx routing
checkFile('App.jsx', [
  { name: 'BrowserRouter', search: 'BrowserRouter' },
  { name: 'Routes', search: 'Routes' },
  { name: 'Route', search: 'Route' },
  { name: 'AuthProvider', search: 'AuthProvider' },
  { name: 'AppProvider', search: 'AppProvider' },
  { name: '/dashboard route', search: '/dashboard' },
  { name: '/login route', search: '/login' },
  { name: '/register route', search: '/register' },
  { name: '/admin route', search: '/admin' },
  { name: 'ProtectedRoute', search: 'ProtectedRoute' },
  { name: 'role redirect', search: 'roles' },
  { name: 'Toaster', search: 'Toaster' },
]);

// Summary
console.log('\n=== SUMMARY ===\n');
let totalFiles = 0;
let missingFiles = 0;
let totalChecks = 0;
let failedChecks = 0;

Object.entries(results).forEach(([file, data]) => {
  totalFiles++;
  if (!data.exists) {
    missingFiles++;
  } else if (data.checks) {
    Object.values(data.checks).forEach(passed => {
      totalChecks++;
      if (!passed) failedChecks++;
    });
  }
});

console.log(`Files: ${totalFiles - missingFiles}/${totalFiles} exist`);
console.log(`Checks: ${totalChecks - failedChecks}/${totalChecks} passed`);

if (missingFiles === 0 && failedChecks === 0) {
  console.log('\n✅ ALL DAY 8 FILES VERIFIED SUCCESSFULLY');
  console.log('🚀 Ready to test in browser');
} else {
  console.log('\n❌ Issues found — fix before proceeding');
  if (missingFiles > 0) {
    console.log(`   Create ${missingFiles} missing files`);
  }
  if (failedChecks > 0) {
    console.log(`   Fix ${failedChecks} content issues`);
  }
}
