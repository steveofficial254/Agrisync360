# Farmer Dashboard Mock Data - Quick Reference

## Quick Start

### Development (Automatic Mock Mode)
```bash
cd frontend
npm run dev
```
Mock data is automatically enabled in development mode.

### Force Real API in Development
```bash
VITE_USE_MOCK=false npm run dev
```

### Production Build
```bash
npm run build
```
Uses real API by default (mock data not included).

## File Locations

| File | Purpose |
|------|---------|
| `frontend/src/data/mockFarmerData.js` | All mock data objects |
| `frontend/src/api/mockApi.js` | Mock API implementations |
| `frontend/src/api/config.js` | API configuration |
| `docs/FARMER_DASHBOARD_BACKEND_REQUIREMENTS.md` | Backend API specs |
| `docs/FARMER_DASHBOARD_MOCK_DATA_GUIDE.md` | Detailed usage guide |
| `docs/FARMER_DASHBOARD_MOCK_INTEGRATION_SUMMARY.md` | Integration summary |

## Mock Data Objects

```javascript
import {
  mockFarmerProfile,
  mockFarms,
  mockCrops,
  mockWeatherData,
  mockMarketPrices,
  mockMarketTrends,
  mockAdvisories,
  mockPlantingCalendar,
  mockSubscription,
  mockPlans,
  mockFinancialDashboard,
  mockTransactions,
  mockLoans,
  mockInsurance,
  mockBudgets,
  mockCalendarEntries,
  mockProfitability
} from '../data/mockFarmerData'
```

## Mock API Functions

```javascript
import { mockFarmersAPI } from '../api/mockApi'

// Profile
await mockFarmersAPI.getProfile()
await mockFarmersAPI.updateProfile(data)

// Farms
await mockFarmersAPI.listFarms()
await mockFarmersAPI.createFarm(data)
await mockFarmersAPI.updateFarm(farmId, data)
await mockFarmersAPI.deleteFarm(farmId)

// Crops
await mockFarmersAPI.listCrops(farmId)
await mockFarmersAPI.createCrop(farmId, data)
await mockFarmersAPI.updateCrop(cropId, data)
await mockFarmersAPI.deleteCrop(cropId)
```

## Environment Variables

```bash
# .env file
VITE_USE_MOCK=true              # Force mock mode
VITE_USE_MOCK=false             # Force real API
VITE_API_URL=http://localhost:5000/api  # Backend URL
```

## Common Tasks

### Add New Mock Data
```javascript
// In mockFarmerData.js
export const mockNewData = {
  id: 'new-001',
  name: 'Example',
  // ... fields
}
```

### Add New Mock API Function
```javascript
// In mockApi.js
export const mockExampleAPI = {
  getData: async () => {
    await delay()
    return { data: { data: mockNewData } }
  }
}
```

### Update Existing Mock Data
```javascript
// Modify values in mockFarmerData.js
export const mockFarmerProfile = {
  ...mockFarmerProfile,
  first_name: 'New Name'
}
```

### Test Specific Scenario
```javascript
// Create custom mock data for testing
const testScenario = {
  ...mockFinancialDashboard,
  income_ksh: 0,  // Test zero income
  expenses_ksh: 100000  // Test high expenses
}
```

## API Files Updated

All these files now support mock/real switching:
- `api/farmers.js`
- `api/weather.js`
- `api/market.js`
- `api/advisory.js`
- `api/payments.js`
- `api/financial.js`
- `api/farmIntel.js`

## Verification

### Check Mock Mode Status
```javascript
import { apiConfig } from './api/config'
console.log('Using mock API:', apiConfig.useMock)
```

### Test Mock Data Loading
```javascript
import { mockFarmerDashboardData } from '../data/mockFarmerData'
console.log('Mock data loaded:', Object.keys(mockFarmerDashboardData))
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Mock data not loading | Check `import.meta.env.DEV` is true |
| API calls failing | Verify API files have mock integration |
| Data structure mismatch | Compare with backend requirements doc |
| Want real API | Set `VITE_USE_MOCK=false` |

## Key Numbers

- **17 mock data objects**
- **40+ mock API functions**
- **40 backend endpoints documented**
- **12 database tables documented**
- **7 API files updated**

## Documentation Links

- [Backend Requirements](./FARMER_DASHBOARD_BACKEND_REQUIREMENTS.md)
- [Mock Data Guide](./FARMER_DASHBOARD_MOCK_DATA_GUIDE.md)
- [Integration Summary](./FARMER_DASHBOARD_MOCK_INTEGRATION_SUMMARY.md)
