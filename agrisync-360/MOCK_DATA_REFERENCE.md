# Mock Data Reference Guide

This document provides a quick reference for the mock API data structures used in Agrisync360.

## Mock API Response Format

All mock APIs return responses in this format:

```javascript
{
  data: {
    success: true,
    data: { /* actual data */ },
    message: "Success message (optional)"
  }
}
```

## Data Structures by Module

### Admin Dashboard

**Stats Response**:
```javascript
{
  farmers: {
    total: 1250,
    active: 980,
    new_this_month: 85
  },
  subscriptions: {
    active: 650,
    basic: 300,
    premium: 350
  },
  sms: {
    sent_today: 520,
    sent_this_month: 15000
  },
  revenue_this_month: 450000,
  revenue_growth: 15.5
}
```

**Revenue Response**:
```javascript
{
  monthly: [
    { month: 'Jan', revenue: 320000 },
    { month: 'Feb', revenue: 380000 },
    // ... more months
  ],
  by_plan: {
    basic: 150000,
    standard: 200000,
    premium: 130000
  }
}
```

**Top Crops Response**:
```javascript
[
  { crop: 'Maize', count: 680, percentage: 25.3 },
  { crop: 'Beans', count: 420, percentage: 18.7 },
  // ... more crops
]
```

---

### Farmer Dashboard

**Farm Response**:
```javascript
{
  id: 'farm-001',
  name: 'Main Farm',
  location: 'Nakuru',
  size_acres: 5,
  soil_type: 'loam',
  crops: ['maize', 'beans'],
  status: 'active'
}
```

**Weather Response**:
```javascript
{
  location: 'Nakuru',
  current: {
    temperature: 24,
    humidity: 65,
    condition: 'partly_cloudy',
    wind_speed: 12
  },
  forecast: [
    { date: '2024-06-17', high: 28, low: 18, condition: 'sunny' },
    // ... more days
  ]
}
```

**Market Prices Response**:
```javascript
[
  { crop: 'Maize', price: 4500, unit: '90kg bag', change: 5.2 },
  { crop: 'Beans', price: 6800, unit: '90kg bag', change: -2.1 },
  // ... more crops
]
```

---

### Agro-Dealer Dashboard

**Stats Response**:
```javascript
{
  connected_farmers: 150,
  total_products: 25,
  pending_orders: 8,
  revenue_this_month: 125000
}
```

**Product Response**:
```javascript
{
  id: 'prod-001',
  name: 'NPK Fertilizer',
  category: 'fertilizer',
  price: 2500,
  unit: '50kg bag',
  stock: 150,
  available: true
}
```

**Farmer Response**:
```javascript
{
  id: 'farmer-001',
  name: 'John Kamau',
  phone: '0722123456',
  county: 'Nakuru',
  connected_date: '2024-01-15'
}
```

---

### NGO Dashboard

**Dashboard Response**:
```javascript
{
  impact: {
    registered_count: 2100,
    registered_target: 5000,
    score: 85,
    counties_covered: 12,
    crops_covered: 8
  },
  total_farmers: 2500,
  active_batches: 15,
  trainings_completed: 45,
  sms_sent_this_month: 15000
}
```

**Stats Response**:
```javascript
{
  active_farmers: 2100,
  advisories_delivered: 15000,
  trainings_completed: 37,
  trainings_conducted: 45,
  registered_this_month: 150,
  sms_delivery_rate: 98.5
}
```

**Batch Response**:
```javascript
{
  id: 'batch-001',
  batch_name: 'Maize Farmers Nakuru',
  county: 'Nakuru',
  farmer_count: 150,
  created_at: '2024-01-01',
  status: 'active',
  processed: 120
}
```

**Farmer Response**:
```javascript
{
  id: 'farmer-001',
  name: 'John Kamau',
  phone: '0722123456',
  county: 'Nakuru',
  farms_count: 2,
  subscription: 'pro',
  joined_at: '2024-01-15'
}
```

---

### Greenhouse Management

**Dashboard Response**:
```javascript
{
  total_greenhouses: 8,
  active_greenhouses: 6,
  total_capacity: 5000,
  current_utilization: 3800,
  avg_temperature: 24.5,
  avg_humidity: 65
}
```

**Greenhouse Response**:
```javascript
{
  id: 'gh-001',
  name: 'Greenhouse A',
  capacity: 500,
  current_crops: 'Tomatoes',
  status: 'active',
  temperature: 25,
  humidity: 65
}
```

**Environmental Data Response**:
```javascript
{
  temperature: 25,
  humidity: 65,
  co2_level: 450,
  light_level: 85,
  soil_moisture: 72
}
```

---

### MarketPro

**Market Data Response**:
```javascript
{
  prices: [
    { crop: 'Maize', price: 4500, unit: '90kg bag', market: 'Nairobi', change: 5.2, trend: 'up' },
    // ... more prices
  ],
  trends: {
    maize: { current: 4500, forecast: 4800, confidence: 85 },
    beans: { current: 6800, forecast: 7200, confidence: 78 }
  }
}
```

**Profitability Response**:
```javascript
{
  estimated_revenue: 45000,
  estimated_costs: 28000,
  estimated_profit: 17000,
  profit_margin: 37.8,
  risk_level: 'low'
}
```

---

### AI Assistant

**Chat Response**:
```javascript
{
  response: 'Based on your query about maize farming...',
  confidence: 0.92,
  sources: ['Kenya Agricultural Research Institute', 'CIMMYT']
}
```

**Crop Recommendations Response**:
```javascript
[
  { crop: 'Maize', variety: 'H614', suitability: 95, expected_yield: '40-50 bags/acre' },
  { crop: 'Beans', variety: 'KK8', suitability: 88, expected_yield: '15-20 bags/acre' }
]
```

**Disease Detection Response**:
```javascript
{
  disease: 'Fall Armyworm',
  confidence: 0.87,
  treatment: 'Apply appropriate pesticide...',
  severity: 'moderate'
}
```

---

### Authentication

**Login Response**:
```javascript
{
  success: true,
  token: 'jwt_token_here',
  user: {
    id: 'user-001',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '0777000001',
    role: 'farmer'
  }
}
```

---

### Notifications

**Notifications Response**:
```javascript
[
  {
    id: 'notif-001',
    type: 'advisory',
    title: 'Maize Fall Armyworm Alert',
    message: 'Fall armyworm detected in your region...',
    is_read: false,
    created_at: '2024-06-10T08:00:00Z'
  },
  // ... more notifications
]
```

---

## Common Patterns

### Pagination Response
```javascript
{
  data: [...],
  total: 100,
  page: 1,
  per_page: 20
}
```

### Success Response (No Data)
```javascript
{
  success: true,
  message: 'Operation completed successfully'
}
```

### Error Response
```javascript
{
  success: false,
  message: 'Error description here'
}
```

---

## Adding New Mock Data

When adding new mock endpoints:

1. Follow the standard response format
2. Include realistic sample data
3. Use the `delay()` function to simulate network latency
4. Return appropriate success/error states
5. Include proper data types (strings, numbers, arrays, objects)

Example:
```javascript
newEndpoint: async (params) => {
  await delay()
  return {
    data: {
      success: true,
      data: {
        // your data here
      }
    }
  }
}
```

---

## Testing Mock Data

To test mock data without the UI:

```javascript
import { mockAdminAPI } from './api/mockApi'

// Test admin stats
const stats = await mockAdminAPI.getStats()
console.log(stats.data.data)

// Test with error handling
try {
  const result = await mockAdminAPI.getStats()
  if (result.data.success) {
    console.log('Success:', result.data.data)
  }
} catch (error) {
  console.error('Error:', error)
}
```

---

## Data Validation

Components should always:
- Check for `success: true` flag
- Handle missing or undefined data
- Provide fallback values
- Use defensive rendering for arrays

Example:
```javascript
const data = response.data?.success ? response.data.data : response.data
const items = Array.isArray(data) ? data : []
```

---

## Notes

- All mock data is static and doesn't persist between sessions
- IDs use patterns like `entity-001`, `entity-002` for consistency
- Dates use ISO format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`
- Phone numbers follow Kenyan format: `07XXXXXXXX` or `+254XXXXXXXXX`
- Currency values are in KES (Kenyan Shillings)
