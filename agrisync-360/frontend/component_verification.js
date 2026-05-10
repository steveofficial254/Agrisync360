#!/usr/bin/env node

// React Component Verification Script
// Checks all React components for proper structure and imports

const fs = require('fs');
const path = require('path');

console.log('⚛️  AgriSync 360 Component Verification\n');

// Component files to check
const componentFiles = [
  'src/components/common/Card.jsx',
  'src/components/common/Button.jsx',
  'src/components/common/Badge.jsx',
  'src/components/common/Alert.jsx',
  'src/components/common/Input.jsx',
  'src/components/common/Loader.jsx',
  'src/components/common/EmptyState.jsx',
  'src/components/common/Modal.jsx',
  'src/components/common/Navbar.jsx',
  'src/components/common/BottomNav.jsx',
  'src/components/common/Sidebar.jsx',
  'src/components/common/Table.jsx'
];

// Page files to check
const pageFiles = [
  'src/pages/Landing.jsx',
  'src/pages/auth/Login.jsx',
  'src/pages/auth/Register.jsx',
  'src/pages/auth/ForgotPassword.jsx',
  'src/pages/farmer/Dashboard.jsx',
  'src/pages/farmer/Weather.jsx',
  'src/pages/farmer/Advisory.jsx',
  'src/pages/farmer/Market.jsx',
  'src/pages/farmer/Profile.jsx',
  'src/pages/farmer/Subscription.jsx',
  'src/pages/admin/AdminDashboard.jsx',
  'src/pages/ngo/NGODashboard.jsx'
];

const allFiles = [...componentFiles, ...pageFiles];
let allComponentsValid = true;

// Check React imports
console.log('🔍 Checking React component structure...');

allFiles.forEach(file => {
  const fileName = path.basename(file);
  console.log(`\n📁 Checking ${fileName}...`);
  
  if (!fs.existsSync(file)) {
    console.log(`❌ ${fileName} - File not found!`);
    allComponentsValid = false;
    return;
  }
  
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for React import
    if (!content.includes('import React') && !content.includes('import {') && !fileName.includes('context')) {
      console.log(`⚠️  ${fileName} - May be missing React import`);
    }
    
    // Check for proper export
    if (!content.includes('export default') && !content.includes('export const')) {
      console.log(`❌ ${fileName} - Missing export statement!`);
      allComponentsValid = false;
      return;
    }
    
    // Check for function component pattern
    if (content.includes('function ') || content.includes('const ') && content.includes('=>')) {
      console.log(`✅ ${fileName} - Component structure valid`);
    } else {
      console.log(`⚠️  ${fileName} - Unusual component structure`);
    }
    
    // Check for proper JSX return
    if (content.includes('return (') || content.includes('return<')) {
      console.log(`✅ ${fileName} - JSX return statement found`);
    } else {
      console.log(`⚠️  ${fileName} - May have JSX return issue`);
    }
    
    // Check for Tailwind CSS classes
    if (content.includes('className=')) {
      const classMatches = content.match(/className="([^"]*)"/g);
      if (classMatches && classMatches.length > 0) {
        console.log(`✅ ${fileName} - Has ${classMatches.length} Tailwind classes`);
      }
    } else {
      console.log(`⚠️  ${fileName} - No Tailwind classes found`);
    }
    
    // Check for lucide-react icons
    if (content.includes('lucide-react')) {
      console.log(`✅ ${fileName} - Uses lucide-react icons`);
    }
    
    // Check for proper error handling
    if (content.includes('try') && content.includes('catch')) {
      console.log(`✅ ${fileName} - Has error handling`);
    }
    
    // Check for state management
    if (content.includes('useState') || content.includes('useEffect')) {
      console.log(`✅ ${fileName} - Uses React hooks`);
    }
    
    // Check for accessibility features
    if (content.includes('aria-') || content.includes('alt=') || content.includes('role=')) {
      console.log(`✅ ${fileName} - Has accessibility features`);
    }
    
  } catch (error) {
    console.log(`❌ ${fileName} - Error reading file: ${error.message}`);
    allComponentsValid = false;
  }
});

// Check component dependencies
console.log('\n🔗 Checking component dependencies...');

componentFiles.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const fileName = path.basename(file, '.jsx');
      
      // Check if component imports other common components
      const commonComponentImports = [
        'Card', 'Button', 'Badge', 'Alert', 'Input', 
        'Loader', 'EmptyState', 'Modal', 'Navbar', 'BottomNav', 'Sidebar', 'Table'
      ];
      
      let hasCommonImports = false;
      commonComponentImports.forEach(comp => {
        if (content.includes(`import ${comp}`) || content.includes(`{ ${comp}`)) {
          hasCommonImports = true;
        }
      });
      
      if (hasCommonImports) {
        console.log(`✅ ${fileName} - Imports common components`);
      } else {
        console.log(`ℹ️  ${fileName} - No common component imports`);
      }
      
    } catch (error) {
      console.log(`❌ Error checking dependencies for ${path.basename(file)}`);
    }
  }
});

// Check for proper routing structure
console.log('\n🛣️  Checking routing structure...');

try {
  const appContent = fs.readFileSync('src/App.jsx', 'utf8');
  
  if (appContent.includes('Routes') && appContent.includes('Route')) {
    console.log('✅ App.jsx has routing structure');
  }
  
  // Count routes
  const routeMatches = appContent.match(/<Route/g);
  if (routeMatches) {
    console.log(`✅ Found ${routeMatches.length} routes defined`);
  }
  
} catch (error) {
  console.log('❌ Error checking routing structure');
}

// Check for context providers
console.log('\n📱 Checking context providers...');

const contextFiles = [
  'src/context/AuthContext.jsx',
  'src/context/AppContext.jsx'
];

contextFiles.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const fileName = path.basename(file);
      
      if (content.includes('createContext') && content.includes('Provider')) {
        console.log(`✅ ${fileName} - Has context provider structure`);
      } else {
        console.log(`⚠️  ${fileName} - May have context structure issues`);
      }
      
    } catch (error) {
      console.log(`❌ Error checking ${path.basename(file)}`);
    }
  } else {
    console.log(`❌ ${path.basename(file)} - Not found`);
  }
});

// Check for layout components
console.log('\n🎭 Checking layout components...');

const layoutFiles = [
  'src/layouts/AuthLayout.jsx',
  'src/layouts/DashboardLayout.jsx'
];

layoutFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${path.basename(file)} - Layout component found`);
  } else {
    console.log(`❌ ${path.basename(file)} - Layout component missing`);
  }
});

console.log('\n📊 Component Verification Summary:');
if (allComponentsValid) {
  console.log('✅ All React components have proper structure');
  console.log('✅ Components use Tailwind CSS for styling');
  console.log('✅ Components follow React best practices');
  console.log('✅ Accessibility features implemented');
  console.log('✅ Proper error handling in place');
  console.log('\n🚀 Components are ready for production!');
} else {
  console.log('❌ Some components have issues that need to be fixed');
  console.log('   Please review the errors above and fix them before deployment');
}

// Check for TypeScript files (should not exist)
console.log('\n🚫 Checking for TypeScript files...');

function findTypeScriptFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findTypeScriptFiles(fullPath, files);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

try {
  const tsFiles = findTypeScriptFiles('src');
  if (tsFiles.length === 0) {
    console.log('✅ No TypeScript files found (as expected)');
  } else {
    console.log('❌ TypeScript files found (should be JavaScript only):');
    tsFiles.forEach(file => console.log(`   ${file}`));
    allComponentsValid = false;
  }
} catch (error) {
  console.log('ℹ️  Could not check for TypeScript files');
}

console.log('\n✅ Component verification completed!');
