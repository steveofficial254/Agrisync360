# Farmer Dashboard Mock Data Usage Guide

This guide explains how to use the mock data in the farmer dashboard components for development and testing.

## Overview

The mock data file (`frontend/src/data/mockFarmerData.js`) provides comprehensive mock data for all farmer dashboard components, enabling development without backend dependencies.

## Mock Data Structure

### Available Mock Data Sets

1. **mockFarmerProfile** - Farmer user profile information
2. **mockFarms** - List of farms owned by the farmer
3. **mockCrops** - Crops planted across all farms
4. **mockWeatherData** - Current weather and 7-day forecast
5. **mockMarketPrices** - Current market prices for crops
6. **mockMarketTrends** - Price trends over time
7. **mockAdvisories** - Crop advisories (pests, diseases, nutrition)
8. **mockPlantingCalendar** - Weekly planting calendar for crops
9. **mockSubscription** - Current subscription status
10. **mockPlans** - Available subscription plans
11. **mockFinancialDashboard** - Financial summary
12. **mockTransactions** - Income and expense transactions
13. **mockLoans** - Active loans
14. **mockInsurance** - Insurance policies
15. **mockBudgets** - Season budgets
16. **mockCalendarEntries** - Planting calendar entries
17. **mockProfitability** - Profitability calculation results

### Combined Data

Use `mockFarmerDashboardData` to import all mock data at once:

```javascript
import { mockFarmerDashboardData } from '../data/mockFarmerData'
```

## Integration with Components

### Option 1: Direct Import in Components

Replace API calls with mock data imports:

```javascript
// Before (with API)
import { farmersAPI } from '../../api/farmers'

const loadProfile = async () => {
  const resp = await farmersAPI.getProfile()
  setProfile(resp.data?.data)
}

// After (with mock data)
import { mockFarmerProfile } from '../../data/mockFarmerData'

const loadProfile = async () => {
  setProfile(mockFarmerProfile)
}
```

### Option 2: Mock API Layer

Create a mock API layer that returns mock data:

```javascript
// frontend/src/api/mockApi.js
import {
  mockFarmerProfile,
  mockFarms,
  mockCrops,
  mockWeatherData,
  mockMarketPrices,
  mockAdvisories,
  mockSubscription,
  mockPlans,
  mockFinancialDashboard,
  mockTransactions,
  mockLoans,
  mockInsurance,
  mockBudgets,
  mockCalendarEntries
} from '../data/mockFarmerData'

export const mockFarmersAPI = {
  getProfile: () => Promise.resolve({ data: { data: mockFarmerProfile } }),
  listFarms: () => Promise.resolve({ data: { data: mockFarms } }),
  listCrops: (farmId) => Promise.resolve({ 
    data: { data: mockCrops.filter(c => c.farm_id === farmId) } 
  }),
}

export const mockWeatherAPI = {
  getForecast: (lat, lon) => Promise.resolve({ 
    data: { success: true, data: mockWeatherData } 
  }),
}

export const mockMarketAPI = {
  getPrices: () => Promise.resolve({ data: { data: mockMarketPrices } }),
}

export const mockAdvisoryAPI = {
  getMyCropsAdvisory: () => Promise.resolve({ data: { data: mockAdvisories } }),
  getAll: () => Promise.resolve({ data: { data: mockAdvisories } }),
}

export const mockPaymentsAPI = {
  getSubscription: () => Promise.resolve({ data: { data: mockSubscription } }),
  getPlans: () => Promise.resolve({ data: { data: mockPlans } }),
}

export const mockFinancialAPI = {
  getDashboard: () => Promise.resolve({ data: { data: mockFinancialDashboard } }),
  listTransactions: () => Promise.resolve({ data: { data: { transactions: mockTransactions } } }),
  listLoans: () => Promise.resolve({ data: { data: { loans: mockLoans } } }),
  listInsurance: () => Promise.resolve({ data: { data: { policies: mockInsurance } } }),
  listBudgets: () => Promise.resolve({ data: { data: mockBudgets } }),
}

export const mockFarmIntelAPI = {
  getCalendar: () => Promise.resolve({ data: { data: mockCalendarEntries } }),
  createCalendarEntry: (entry) => Promise.resolve({ 
    data: { data: { ...entry, id: `cal-${Date.now()}` } } 
  }),
}
```

### Option 3: Environment-Based Switching

Use environment variables to switch between real API and mock data:

```javascript
// frontend/src/api/farmers.js
import { farmersAPI as realFarmersAPI } from './realApi'
import { mockFarmersAPI } from './mockApi'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const farmersAPI = USE_MOCK ? mockFarmersAPI : realFarmersAPI
```

Add to `.env`:
```
VITE_USE_MOCK=true
```

## Component-Specific Integration

### Dashboard.jsx

```javascript
import { mockFarmerDashboardData } from '../../data/mockFarmerData'

export default function Dashboard() {
  const [profile, setProfile] = useState(mockFarmerDashboardData.profile)
  const [farms, setFarms] = useState(mockFarmerDashboardData.farms)
  const [crops, setCrops] = useState(mockFarmerDashboardData.crops)
  const [weather, setWeather] = useState(mockFarmerDashboardData.weather)
  const [prices, setPrices] = useState(mockFarmerDashboardData.marketPrices)
  const [advisories, setAdvisories] = useState(mockFarmerDashboardData.advisories)
  const [subscription, setSubscription] = useState(mockFarmerDashboardData.subscription)
  const [financials, setFinancials] = useState(mockFarmerDashboardData.financials)
  
  const [loading, setLoading] = useState(false) // Set to false for mock data
  
  // Remove useEffect and API calls when using mock data
}
```

### Weather.jsx

```javascript
import { mockWeatherData } from '../../data/mockFarmerData'

export default function Weather() {
  const [weatherData, setWeatherData] = useState(mockWeatherData)
  const [loading, setLoading] = useState(false)
  
  // Remove API calls
}
```

### Market.jsx

```javascript
import { mockMarketPrices, mockMarketTrends, mockProfitability } from '../../data/mockFarmerData'

export default function Market() {
  const [prices, setPrices] = useState(mockMarketPrices)
  const [priceHistory, setPriceHistory] = useState(mockMarketTrends.data_points)
  const [profitData, setProfitData] = useState(mockProfitability)
  const [loading, setLoading] = useState(false)
}
```

### Advisory.jsx

```javascript
import { mockAdvisories, mockPlantingCalendar } from '../../data/mockFarmerData'

export default function Advisory() {
  const [advisories, setAdvisories] = useState(mockAdvisories)
  const [calendarData, setCalendarData] = useState(mockPlantingCalendar)
  const [loading, setLoading] = useState(false)
}
```

### FinancialManager.jsx

```javascript
import { 
  mockFinancialDashboard, 
  mockTransactions, 
  mockLoans, 
  mockInsurance, 
  mockBudgets 
} from '../../data/mockFarmerData'

export default function FinancialManager() {
  const [dashboard, setDashboard] = useState(mockFinancialDashboard)
  const [transactions, setTransactions] = useState(mockTransactions)
  const [loans, setLoans] = useState(mockLoans)
  const [insurance, setInsurance] = useState(mockInsurance)
  const [budgets, setBudgets] = useState(mockBudgets)
  const [loading, setLoading] = useState(false)
}
```

### Subscription.jsx

```javascript
import { mockSubscription, mockPlans } from '../../data/mockFarmerData'

export default function Subscription() {
  const [subscription, setSubscription] = useState(mockSubscription)
  const [plans, setPlans] = useState(mockPlans)
  const [loading, setLoading] = useState(false)
}
```

### Profile.jsx

```javascript
import { mockFarmerProfile, mockFarms } from '../../data/mockFarmerData'

export default function Profile() {
  const [profile, setProfile] = useState(mockFarmerProfile)
  const [farms, setFarms] = useState(mockFarms)
  const [loading, setLoading] = useState(false)
}
```

### FarmSetup.jsx

```javascript
import { mockFarms } from '../../data/mockFarmerData'

export default function FarmSetup() {
  const [existingFarms, setExistingFarms] = useState(mockFarms)
  // Keep form handling logic
}
```

### PlantingCalendar.jsx

```javascript
import { mockCalendarEntries } from '../../data/mockFarmerData'

export default function PlantingCalendar() {
  const [entries, setEntries] = useState(mockCalendarEntries)
  const [loading, setLoading] = useState(false)
}
```

## Testing with Mock Data

### Unit Tests

```javascript
import { render, screen } from '@testing-library/react'
import { mockFarmerDashboardData } from '../data/mockFarmerData'
import Dashboard from '../pages/farmer/Dashboard'

test('displays farmer profile', () => {
  render(<Dashboard />)
  expect(screen.getByText(/John Kamau/i)).toBeInTheDocument()
})
```

### Storybook Stories

```javascript
import { mockFarmerDashboardData } from '../data/mockFarmerData'
import Dashboard from './Dashboard'

export default {
  title: 'Pages/Farmer/Dashboard',
  component: Dashboard,
}

export const WithMockData = () => <Dashboard />
```

## Customizing Mock Data

### Adding More Data

```javascript
export const mockAdditionalCrops = [
  {
    id: 'crop-004',
    farm_id: 'farm-001',
    crop_name: 'tomatoes',
    variety: 'Money Maker',
    status: 'growing',
    area_planted_acres: 0.5,
    planting_date: '2024-05-15',
    expected_harvest_date: '2024-08-15',
    days_to_harvest: 65,
    progress_percent: 40,
    growth_stage: 'flowering'
  }
]
```

### Modifying Existing Data

```javascript
export const mockFarmerProfile = {
  ...mockFarmerProfile,
  first_name: 'Jane',
  last_name: 'Wanjiku',
  county: 'Kiambu'
}
```

### Dynamic Mock Data

```javascript
const generateMockCrops = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `crop-${i + 1}`,
    crop_name: ['maize', 'beans', 'potatoes'][i % 3],
    status: 'growing',
    progress_percent: Math.floor(Math.random() * 100)
  }))
}
```

## Best Practices

1. **Keep Mock Data Realistic**: Use realistic values that match actual Kenyan farming scenarios
2. **Document Changes**: Update this guide when adding new mock data
3. **Version Control**: Commit mock data changes with clear commit messages
4. **Test Coverage**: Ensure mock data covers all edge cases
5. **Consistency**: Keep mock data consistent across components
6. **Performance**: Mock data should load instantly (no async delays needed)

## Removing Mock Data for Production

When switching to production:

1. Remove mock data imports
2. Restore original API calls
3. Remove environment variable for mock mode
4. Test with real backend
5. Remove mock data file (optional)

## Troubleshooting

### Mock Data Not Loading
- Check import path is correct
- Verify file exists in `frontend/src/data/`
- Check for TypeScript errors if using TS

### Data Structure Mismatch
- Compare mock data structure with API response
- Update mock data to match API response format
- Check for missing required fields

### Component Still Loading
- Set `loading` state to `false`
- Remove `useEffect` hooks that call APIs
- Check for conditional rendering based on loading state

## Summary

Using mock data enables:
- ✅ Fast development without backend dependency
- ✅ Consistent data across components
- ✅ Easy testing and debugging
- ✅ Offline development capability
- ✅ Demonstration without production data

Switch to real API when backend is ready by:
1. Removing mock data imports
2. Restoring API calls
3. Testing with real backend
4. Deploying to production
