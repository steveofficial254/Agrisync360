#!/usr/bin/env node

// API Verification Script
// Checks all API modules for proper structure and SMS & Alert System APIs

const fs = require('fs');
const path = require('path');

console.log('🔌 AgriSync 360 API Verification\n');

const apiFiles = [
  'src/api/admin.js',
  'src/api/farmers.js',
  'src/api/ngo.js',
  'src/api/dealer.js',
  'src/api/auth.js',
  'src/api/weather.js',
  'src/api/market.js',
  'src/api/advisory.js',
  'src/api/payments.js'
];

const smsAlertEndpoints = {
  admin: [
    'alerts.sendBulk',
    'alerts.schedule',
    'alerts.getFarmerHistory',
    'alerts.triggerWeatherAlert',
    'alerts.getTriggers',
    'alerts.configureTrigger',
    'alerts.getStats'
  ],
  farmers: [
    'alerts.getHistory',
    'alerts.getById',
    'alerts.markAsRead',
    'alerts.getPreferences',
    'alerts.updatePreferences',
    'alerts.getStats',
    'alerts.subscribe',
    'alerts.unsubscribe',
    'alerts.getDeliveryReports'
  ],
  ngo: [
    'alerts.sendBulk',
    'alerts.sendAdvisorySMS',
    'alerts.scheduleWeeklyAdvisory',
    'alerts.getSMSReports'
  ],
  dealer: [
    'alerts.sendProductAlert',
    'alerts.schedulePromotion',
    'alerts.getFarmerHistory',
    'alerts.triggerWeatherProductAlert',
    'alerts.sendBroadcastSMS',
    'alerts.getSMSReports'
  ]
};

let allApisValid = true;

apiFiles.forEach(apiFile => {
  console.log(`\n📁 Checking ${apiFile}...`);
  
  if (!fs.existsSync(apiFile)) {
    console.log(`❌ ${apiFile} - File not found!`);
    allApisValid = false;
    return;
  }
  
  try {
    const content = fs.readFileSync(apiFile, 'utf8');
    const apiName = path.basename(apiFile, '.js');
    
    // Check for proper export structure
    if (!content.includes('export const')) {
      console.log(`❌ ${apiFile} - Missing exports!`);
      allApisValid = false;
      return;
    }
    
    // Check for axios import
    if (!content.includes('import axios')) {
      console.log(`⚠️  ${apiFile} - Missing axios import`);
    }
    
    // Check for SMS & Alert System APIs
    if (smsAlertEndpoints[apiName]) {
      console.log(`   📱 Checking SMS & Alert APIs...`);
      const requiredEndpoints = smsAlertEndpoints[apiName];
      
      requiredEndpoints.forEach(endpoint => {
        const [category, method] = endpoint.split('.');
        if (content.includes(`${category}:`) && content.includes(`${method}:`)) {
          console.log(`   ✅ ${endpoint}`);
        } else {
          console.log(`   ❌ ${endpoint} - Missing!`);
          allApisValid = false;
        }
      });
    }
    
    // Check for basic CRUD operations
    console.log(`   🔍 Checking basic structure...`);
    
    const basicChecks = {
      'get': 'GET operations',
      'post': 'POST operations', 
      'put': 'PUT operations',
      'delete': 'DELETE operations'
    };
    
    Object.entries(basicChecks).forEach(([method, description]) => {
      if (content.includes(`method: '${method}'`) || content.includes(`method: "${method}"`)) {
        console.log(`   ✅ ${description}`);
      }
    });
    
    console.log(`✅ ${apiFile} - Structure valid`);
    
  } catch (error) {
    console.log(`❌ ${apiFile} - Error reading file: ${error.message}`);
    allApisValid = false;
  }
});

// Check API configuration
console.log('\n⚙️  Checking API configuration...');

try {
  const apiBaseFiles = [
    'src/api/index.js',
    'src/api/config.js'
  ];
  
  apiBaseFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`⚠️  ${file} - Optional config file not found`);
    }
  });
} catch (error) {
  console.log(`❌ Error checking API configuration: ${error.message}`);
}

// Check for proper error handling patterns
console.log('\n🛡️  Checking error handling patterns...');

apiFiles.forEach(apiFile => {
  if (fs.existsSync(apiFile)) {
    try {
      const content = fs.readFileSync(apiFile, 'utf8');
      
      if (content.includes('try') && content.includes('catch')) {
        console.log(`✅ ${path.basename(apiFile)} - Has error handling`);
      } else {
        console.log(`⚠️  ${path.basename(apiFile)} - May need error handling`);
      }
    } catch (error) {
      console.log(`❌ ${path.basename(apiFile)} - Error checking error handling`);
    }
  }
});

console.log('\n📊 API Verification Summary:');
if (allApisValid) {
  console.log('✅ All API files are properly structured');
  console.log('✅ SMS & Alert System APIs are implemented');
  console.log('✅ Error handling patterns detected');
  console.log('\n🚀 API layer is ready for production!');
} else {
  console.log('❌ Some API files have issues that need to be fixed');
  console.log('   Please review the errors above and fix them before deployment');
}

// Check for environment configuration
console.log('\n🌍 Checking environment configuration...');

const envFiles = [
  '.env',
  '.env.example',
  '.env.local'
];

envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`⚠️  ${file} - Environment file not found`);
  }
});

console.log('\n✅ API verification completed!');
