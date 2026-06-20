# Farmer Dashboard - Backend API Requirements

This document outlines all backend API endpoints and data structures required for the AgriSync 360 Farmer Dashboard.

## Table of Contents
1. [Authentication & User Management](#authentication--user-management)
2. [Farmer Profile Management](#farmer-profile-management)
3. [Farm Management](#farm-management)
4. [Crop Management](#crop-management)
5. [Weather API](#weather-api)
6. [Market Prices API](#market-prices-api)
7. [Advisory API](#advisory-api)
8. [Financial Management API](#financial-management-api)
9. [Payments & Subscriptions API](#payments--subscriptions-api)
10. [Planting Calendar API](#planting-calendar-api)
11. [Notifications API](#notifications-api)
12. [AI Assistant API](#ai-assistant-api)

---

## Authentication & User Management

### Endpoints

#### POST /api/auth/register
Register a new farmer user.

**Request Body:**
```json
{
  "phone": "+254712345678",
  "password": "SecurePass123",
  "first_name": "John",
  "last_name": "Kamau",
  "county": "Nakuru",
  "role": "farmer"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "farmer-001",
      "phone": "+254712345678",
      "first_name": "John",
      "last_name": "Kamau",
      "role": "farmer",
      "is_verified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /api/auth/login
Authenticate a user.

**Request Body:**
```json
{
  "phone": "+254712345678",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "farmer-001",
      "phone": "+254712345678",
      "first_name": "John",
      "last_name": "Kamau",
      "role": "farmer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /api/auth/logout
Logout current user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### POST /api/auth/change-password
Change user password.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "current_password": "SecurePass123",
  "new_password": "NewSecurePass456"
}
```

---

## Farmer Profile Management

### Endpoints

#### GET /api/farmers/profile
Get current farmer's profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "farmer-001",
    "phone": "+254712345678",
    "first_name": "John",
    "last_name": "Kamau",
    "county": "Nakuru",
    "sub_county": "Nakuru North",
    "ward": "Bahati",
    "village": "Molo",
    "latitude": -0.2833,
    "longitude": 36.0667,
    "role": "farmer",
    "is_verified": true,
    "is_active": true,
    "created_at": "2024-01-15T08:00:00Z",
    "updated_at": "2024-06-11T10:30:00Z"
  }
}
```

#### PUT /api/farmers/profile
Update farmer profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Kamau",
  "county": "Nakuru",
  "sub_county": "Nakuru North",
  "ward": "Bahati",
  "village": "Molo"
}
```

---

## Farm Management

### Endpoints

#### GET /api/farmers/farms
List all farms for current farmer.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "farm-001",
      "name": "Main Farm - Molo",
      "size_acres": 5.5,
      "county": "Nakuru",
      "sub_county": "Nakuru North",
      "soil_type": "loam",
      "water_source": "irrigation",
      "latitude": -0.2833,
      "longitude": 36.0667,
      "elevation": 2500,
      "is_primary": true,
      "created_at": "2024-01-20T10:00:00Z"
    }
  ]
}
```

#### POST /api/farmers/farms
Create a new farm.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Main Farm - Molo",
  "size_acres": 5.5,
  "county": "Nakuru",
  "sub_county": "Nakuru North",
  "soil_type": "loam",
  "water_source": "irrigation",
  "latitude": -0.2833,
  "longitude": 36.0667,
  "elevation": 2500,
  "is_primary": true
}
```

#### PUT /api/farmers/farms/:farm_id
Update farm details.

**Headers:** `Authorization: Bearer <token>`

#### DELETE /api/farmers/farms/:farm_id
Delete a farm.

**Headers:** `Authorization: Bearer <token>`

---

## Crop Management

### Endpoints

#### GET /api/farmers/farms/:farm_id/crops
List all crops for a specific farm.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "crop-001",
      "farm_id": "farm-001",
      "crop_name": "maize",
      "variety": "H614",
      "status": "growing",
      "area_planted_acres": 2.5,
      "area_acres": 2.5,
      "planting_date": "2024-04-15",
      "expected_harvest_date": "2024-08-15",
      "days_to_harvest": 65,
      "progress_percent": 75,
      "growth_stage": "flowering",
      "created_at": "2024-04-15T08:00:00Z"
    }
  ]
}
```

#### POST /api/farmers/farms/:farm_id/crops
Add a new crop to a farm.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "crop_name": "maize",
  "variety": "H614",
  "area_planted_acres": 2.5,
  "planting_date": "2024-04-15",
  "expected_harvest_date": "2024-08-15"
}
```

#### PUT /api/farmers/crops/:crop_id
Update crop details.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "growing",
  "growth_stage": "flowering",
  "progress_percent": 75
}
```

#### DELETE /api/farmers/crops/:crop_id
Delete a crop record.

**Headers:** `Authorization: Bearer <token>`

---

## Weather API

### Endpoints

#### GET /api/weather/forecast
Get weather forecast for a location.

**Query Parameters:**
- `lat` (required): Latitude
- `lon` (required): Longitude
- `days` (optional): Number of forecast days (default: 7)

**Response:**
```json
{
  "success": true,
  "data": {
    "location": {
      "name": "Molo, Nakuru",
      "latitude": -0.2833,
      "longitude": 36.0667
    },
    "current": {
      "temp": 22,
      "temp_min": 18,
      "temp_max": 26,
      "condition": "Partly cloudy",
      "humidity": 65,
      "wind_speed": 12,
      "wind_direction": "NE",
      "pressure": 1015,
      "visibility": 10,
      "uv_index": 6,
      "feels_like": 23
    },
    "forecast": [
      {
        "date": "2024-06-12",
        "temp_min": 17,
        "temp_max": 25,
        "condition": "Sunny",
        "humidity": 60,
        "wind_speed": 10,
        "precipitation_chance": 10,
        "precipitation_mm": 0
      }
    ],
    "summary": {
      "overall_disease_risk": "moderate",
      "pest_risk": "low",
      "frost_risk": "none",
      "heat_stress_risk": "low",
      "drought_risk": "low"
    },
    "alerts": [
      {
        "type": "rain",
        "severity": "moderate",
        "message": "Expected rain on June 15-16. Consider delaying spraying operations.",
        "date": "2024-06-12"
      }
    ]
  }
}
```

---

## Market Prices API

### Endpoints

#### GET /api/market/prices
Get current market prices.

**Query Parameters:**
- `crop` (optional): Filter by crop name
- `county` (optional): Filter by county
- `market` (optional): Filter by market name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "price-001",
      "crop_name": "maize",
      "price_per_kg": 32,
      "market": "Nakuru",
      "county": "Nakuru",
      "trend": "up",
      "change": 5.2,
      "date": "2024-06-11",
      "unit": "per kg"
    }
  ]
}
```

#### GET /api/market/trends
Get price trends for a crop.

**Query Parameters:**
- `crop` (required): Crop name
- `months` (optional): Number of months of data (default: 3)

**Response:**
```json
{
  "success": true,
  "data": {
    "crop": "maize",
    "trend": "increasing",
    "change_percent": 5.2,
    "data_points": [
      { "date": "2024-03-11", "price": 28 },
      { "date": "2024-04-11", "price": 29 },
      { "date": "2024-05-11", "price": 30 },
      { "date": "2024-06-11", "price": 32 }
    ]
  }
}
```

#### POST /api/market/profitability
Calculate crop profitability.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "crop": "maize",
  "quantity_kg": 5000,
  "acres": 5,
  "county": "nakuru"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "crop": "maize",
    "quantity_kg": 5000,
    "yield_per_acre": 20,
    "acres": 5,
    "county": "nakuru",
    "results": {
      "total_revenue": 160000,
      "total_costs": 50000,
      "net_profit": 110000,
      "profit_margin": 68.75,
      "profit_per_acre": 22000,
      "cost_breakdown": {
        "seeds": 5000,
        "fertilizer": 15000,
        "labor": 15000,
        "pesticides": 5000,
        "irrigation": 5000,
        "other": 5000
      }
    }
  }
}
```

---

## Advisory API

### Endpoints

#### GET /api/advisory/my-crops
Get advisories for farmer's registered crops.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "adv-001",
      "crop_name": "maize",
      "title": "Maize Fall Armyworm Alert",
      "type": "pest",
      "category": "pest",
      "severity": "high",
      "description": "Fall armyworm detected in Nakuru region...",
      "content": "Fall armyworm detected in Nakuru region...",
      "symptoms": "Irregular holes in leaves, frass on whorls...",
      "treatment": "Apply recommended pesticides...",
      "created_at": "2024-06-10T08:00:00Z"
    }
  ]
}
```

#### GET /api/advisory/all
Get all available advisories.

**Query Parameters:**
- `crop` (optional): Filter by crop
- `type` (optional): Filter by type (pest, disease, nutrition, harvest)
- `severity` (optional): Filter by severity

**Response:**
```json
{
  "success": true,
  "data": [...]
}
```

#### GET /api/advisory/calendar/:crop
Get planting calendar for a crop.

**Response:**
```json
{
  "success": true,
  "data": {
    "crop": "maize",
    "variety": "H614",
    "planting_date": "2024-04-15",
    "expected_harvest": "2024-08-15",
    "weeks": [
      {
        "week": 1,
        "task": "Land preparation",
        "watch_for": "Ensure proper seedbed",
        "inputs_needed": "Plow, harrow"
      }
    ]
  }
}
```

---

## Financial Management API

### Endpoints

#### GET /api/financial/dashboard
Get financial dashboard summary.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `period` (optional): Period (e.g., "2024-06", default: current month)

**Response:**
```json
{
  "success": true,
  "data": {
    "income_ksh": 125000,
    "expenses_ksh": 45000,
    "net_profit_ksh": 80000,
    "active_loans_count": 2,
    "total_outstanding_ksh": 150000,
    "active_policies_count": 1,
    "period": "2024-06",
    "currency": "KES"
  }
}
```

#### GET /api/financial/transactions
List all transactions.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `type` (optional): Filter by type (income, expense)
- `category` (optional): Filter by category
- `start_date` (optional): Start date
- `end_date` (optional): End date

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "tx-001",
        "transaction_type": "income",
        "amount_ksh": 45000,
        "description": "Maize sale - 1500kg @ KSH 30/kg",
        "category": "crop_sale",
        "transaction_date": "2024-06-10",
        "farm_id": "farm-001",
        "crop_id": "crop-001"
      }
    ]
  }
}
```

#### POST /api/financial/transactions
Create a new transaction.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "transaction_type": "income",
  "amount_ksh": 45000,
  "description": "Maize sale",
  "category": "crop_sale",
  "transaction_date": "2024-06-10",
  "farm_id": "farm-001",
  "crop_id": "crop-001"
}
```

#### GET /api/financial/loans
List all loans.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "loans": [
      {
        "id": "loan-001",
        "lender_name": "Agricultural Finance Corporation",
        "lender_type": "government",
        "principal_ksh": 100000,
        "outstanding_ksh": 75000,
        "repayment_percent": 25.0,
        "status": "active",
        "is_overdue": false,
        "interest_rate": 8.5,
        "due_date": "2024-12-31",
        "disbursement_date": "2024-01-15"
      }
    ]
  }
}
```

#### POST /api/financial/loans
Add a new loan.

**Headers:** `Authorization: Bearer <token>`

#### GET /api/financial/insurance
List all insurance policies.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "policies": [
      {
        "id": "ins-001",
        "provider_name": "APA Insurance",
        "insurance_type": "crop_insurance",
        "coverage_amount_ksh": 500000,
        "premium_ksh": 15000,
        "status": "active",
        "days_to_expiry": 180,
        "policy_number": "APA-2024-001234",
        "start_date": "2024-01-01",
        "expiry_date": "2024-12-31",
        "covered_crops": ["maize", "beans"]
      }
    ]
  }
}
```

#### GET /api/financial/budgets
List all budgets.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "budget-001",
      "season_name": "Long Rains 2024",
      "crop_name": "maize",
      "planned_total_cost": 45000,
      "planned_profit": 80000,
      "actual_cost": 42000,
      "actual_profit": 75000,
      "status": "in_progress"
    }
  ]
}
```

---

## Payments & Subscriptions API

### Endpoints

#### GET /api/payments/subscription
Get current subscription status.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "plan": "pro_monthly",
    "plan_id": "pro_monthly",
    "is_active": true,
    "expires_at": "2024-09-11T00:00:00Z",
    "days_remaining": 92,
    "features": {
      "weather_forecast": true,
      "weather_days": 7,
      "crop_advisory": true,
      "market_prices": true,
      "sms_alerts": true,
      "sms_per_month": 999,
      "disease_risk": true,
      "planting_calendar": true,
      "profitability_calc": true
    },
    "payment_method": "mpesa",
    "auto_renew": true
  }
}
```

#### GET /api/payments/plans
List available subscription plans.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "plan_id": "free",
      "name": "Free",
      "price": 0,
      "billing_cycle": "monthly",
      "currency": "KES",
      "features": {
        "weather_forecast": true,
        "weather_days": 3,
        "crop_advisory": false,
        "market_prices": true,
        "sms_alerts": false,
        "sms_per_month": 0,
        "disease_risk": false,
        "planting_calendar": false,
        "profitability_calc": false
      },
      "popular": false
    },
    {
      "plan_id": "basic_monthly",
      "name": "Basic Monthly",
      "price": 99,
      "billing_cycle": "monthly",
      "currency": "KES",
      "features": {...},
      "popular": true
    }
  ]
}
```

#### POST /api/payments/subscribe
Subscribe to a plan.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "plan": "pro_monthly",
  "phone": "+254712345678"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "checkout_request_id": "ws_CO_110620241234567890",
    "merchant_request_id": "12345-67890-12345",
    "response_code": "0",
    "response_message": "Success. Request accepted for processing",
    "response_description": "The payment request has been accepted successfully"
  }
}
```

#### POST /api/payments/verify
Verify payment status.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "checkout_request_id": "ws_CO_110620241234567890"
}
```

---

## Planting Calendar API

### Endpoints

#### GET /api/farm-intel/calendar
Get calendar entries for farmer.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `start_date` (optional): Start date
- `end_date` (optional): End date
- `crop` (optional): Filter by crop

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cal-001",
      "crop_name": "maize",
      "variety": "H614",
      "planned_planting_date": "2024-04-15",
      "planned_harvest_date": "2024-08-15",
      "actual_planting_date": "2024-04-15",
      "status": "growing",
      "area_acres": 2.5,
      "notes": "Main season planting"
    }
  ]
}
```

#### POST /api/farm-intel/calendar
Create a calendar entry.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "crop_name": "maize",
  "variety": "H614",
  "planned_planting_date": "2024-04-15",
  "planned_harvest_date": "2024-08-15",
  "area_acres": 2.5,
  "notes": "Main season planting"
}
```

#### PUT /api/farm-intel/calendar/:entry_id
Update calendar entry.

**Headers:** `Authorization: Bearer <token>`

#### DELETE /api/farm-intel/calendar/:entry_id
Delete calendar entry.

**Headers:** `Authorization: Bearer <token>`

---

## Notifications API

### Endpoints

#### GET /api/notifications
Get user notifications.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `unread_only` (optional): Filter by unread only
- `type` (optional): Filter by type

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-001",
      "type": "advisory",
      "title": "Maize Fall Armyworm Alert",
      "message": "Fall armyworm detected in your region...",
      "is_read": false,
      "created_at": "2024-06-10T08:00:00Z"
    }
  ]
}
```

#### PUT /api/notifications/:notification_id/read
Mark notification as read.

**Headers:** `Authorization: Bearer <token>`

#### PUT /api/notifications/mark-all-read
Mark all notifications as read.

**Headers:** `Authorization: Bearer <token>`

---

## AI Assistant API

### Endpoints

#### POST /api/ai/chat
Send message to AI assistant.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "message": "What fertilizer should I use for maize at flowering stage?",
  "context": {
    "crop": "maize",
    "growth_stage": "flowering",
    "county": "Nakuru"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "At flowering stage, maize requires additional potassium (K) to support grain filling. Apply potassium-rich fertilizer such as MOP (Muriate of Potash) at 50kg/ha. Also ensure adequate irrigation as water stress during flowering can significantly reduce yield.",
    "sources": [
      "Kenya Agricultural and Livestock Research Organization",
      "International Maize and Wheat Improvement Center"
    ]
  }
}
```

---

## Database Schema Requirements

### Tables

#### users
```sql
- id (UUID, PK)
- phone (VARCHAR, UNIQUE, NOT NULL)
- password_hash (VARCHAR, NOT NULL)
- first_name (VARCHAR)
- last_name (VARCHAR)
- county (VARCHAR)
- sub_county (VARCHAR)
- ward (VARCHAR)
- village (VARCHAR)
- latitude (DECIMAL)
- longitude (DECIMAL)
- role (VARCHAR: farmer, admin, agro_dealer, ngo)
- is_verified (BOOLEAN, DEFAULT FALSE)
- is_active (BOOLEAN, DEFAULT TRUE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### farms
```sql
- id (UUID, PK)
- farmer_id (UUID, FK -> users.id)
- name (VARCHAR, NOT NULL)
- size_acres (DECIMAL)
- county (VARCHAR)
- sub_county (VARCHAR)
- soil_type (VARCHAR)
- water_source (VARCHAR)
- latitude (DECIMAL)
- longitude (DECIMAL)
- elevation (INTEGER)
- is_primary (BOOLEAN, DEFAULT FALSE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### crops
```sql
- id (UUID, PK)
- farm_id (UUID, FK -> farms.id)
- crop_name (VARCHAR, NOT NULL)
- variety (VARCHAR)
- status (VARCHAR: planned, growing, harvested, failed)
- area_planted_acres (DECIMAL)
- planting_date (DATE)
- expected_harvest_date (DATE)
- actual_harvest_date (DATE)
- growth_stage (VARCHAR)
- progress_percent (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### weather_data
```sql
- id (UUID, PK)
- location_name (VARCHAR)
- latitude (DECIMAL)
- longitude (DECIMAL)
- temp (DECIMAL)
- temp_min (DECIMAL)
- temp_max (DECIMAL)
- condition (VARCHAR)
- humidity (INTEGER)
- wind_speed (DECIMAL)
- wind_direction (VARCHAR)
- pressure (INTEGER)
- visibility (DECIMAL)
- uv_index (INTEGER)
- feels_like (DECIMAL)
- forecast_date (DATE)
- created_at (TIMESTAMP)
```

#### market_prices
```sql
- id (UUID, PK)
- crop_name (VARCHAR, NOT NULL)
- price_per_kg (DECIMAL, NOT NULL)
- market (VARCHAR)
- county (VARCHAR)
- trend (VARCHAR: up, down, stable)
- change (DECIMAL)
- date (DATE, NOT NULL)
- unit (VARCHAR)
- created_at (TIMESTAMP)
```

#### advisories
```sql
- id (UUID, PK)
- crop_name (VARCHAR)
- title (VARCHAR, NOT NULL)
- type (VARCHAR: pest, disease, nutrition, harvest)
- category (VARCHAR)
- severity (VARCHAR: low, moderate, high, very_high)
- description (TEXT)
- content (TEXT)
- symptoms (TEXT)
- treatment (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### subscriptions
```sql
- id (UUID, PK)
- farmer_id (UUID, FK -> users.id)
- plan_id (VARCHAR, NOT NULL)
- is_active (BOOLEAN, DEFAULT TRUE)
- expires_at (TIMESTAMP)
- payment_method (VARCHAR)
- auto_renew (BOOLEAN, DEFAULT FALSE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### financial_transactions
```sql
- id (UUID, PK)
- farmer_id (UUID, FK -> users.id)
- farm_id (UUID, FK -> farms.id)
- crop_id (UUID, FK -> crops.id)
- transaction_type (VARCHAR: income, expense)
- amount_ksh (DECIMAL, NOT NULL)
- description (VARCHAR)
- category (VARCHAR)
- transaction_date (DATE, NOT NULL)
- created_at (TIMESTAMP)
```

#### loans
```sql
- id (UUID, PK)
- farmer_id (UUID, FK -> users.id)
- lender_name (VARCHAR, NOT NULL)
- lender_type (VARCHAR)
- principal_ksh (DECIMAL, NOT NULL)
- outstanding_ksh (DECIMAL, NOT NULL)
- repayment_percent (DECIMAL)
- status (VARCHAR: active, paid, overdue)
- is_overdue (BOOLEAN, DEFAULT FALSE)
- interest_rate (DECIMAL)
- due_date (DATE)
- disbursement_date (DATE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### insurance_policies
```sql
- id (UUID, PK)
- farmer_id (UUID, FK -> users.id)
- provider_name (VARCHAR, NOT NULL)
- insurance_type (VARCHAR)
- coverage_amount_ksh (DECIMAL)
- premium_ksh (DECIMAL)
- status (VARCHAR: active, expired, cancelled)
- policy_number (VARCHAR, UNIQUE)
- start_date (DATE)
- expiry_date (DATE)
- covered_crops (JSON)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### budgets
```sql
- id (UUID, PK)
- farmer_id (UUID, FK -> users.id)
- season_name (VARCHAR, NOT NULL)
- crop_name (VARCHAR, NOT NULL)
- planned_total_cost (DECIMAL)
- planned_profit (DECIMAL)
- actual_cost (DECIMAL)
- actual_profit (DECIMAL)
- status (VARCHAR: planned, in_progress, completed)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### planting_calendar
```sql
- id (UUID, PK)
- farmer_id (UUID, FK -> users.id)
- crop_name (VARCHAR, NOT NULL)
- variety (VARCHAR)
- planned_planting_date (DATE)
- planned_harvest_date (DATE)
- actual_planting_date (DATE)
- actual_harvest_date (DATE)
- status (VARCHAR: planned, planted, growing, harvested, failed, cancelled)
- area_acres (DECIMAL)
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### notifications
```sql
- id (UUID, PK)
- farmer_id (UUID, FK -> users.id)
- type (VARCHAR: advisory, weather, market, system)
- title (VARCHAR, NOT NULL)
- message (TEXT, NOT NULL)
- is_read (BOOLEAN, DEFAULT FALSE)
- created_at (TIMESTAMP)
```

---

## External API Integrations

### Weather Data
- **Provider**: Open-Meteo (free) or NASA POWER
- **Endpoints**: 
  - Current weather: `https://api.open-meteo.com/v1/forecast`
  - Historical data: `https://power.larc.nasa.gov/api/temporal/daily/point`
- **Data Required**: Temperature, humidity, wind, precipitation, UV index

### Market Prices
- **Provider**: Kenya Agricultural and Livestock Research Organization (KALRO) or manual entry
- **Data Sources**: Local markets, county aggregation
- **Update Frequency**: Daily

### SMS Notifications
- **Provider**: Africa's Talking
- **API**: `https://api.africastalking.com/version1/messaging`
- **Required**: API key, username

### Payment Processing
- **Provider**: M-Pesa Daraja API
- **Endpoints**: STK Push, Transaction Status
- **Required**: Consumer key, consumer secret, passkey

### AI Assistant
- **Provider**: Anthropic Claude API
- **API**: `https://api.anthropic.com/v1/messages`
- **Required**: API key

---

## Security Requirements

### Authentication
- JWT tokens with 24-hour expiration
- Refresh token mechanism
- Password hashing with bcrypt
- Rate limiting on auth endpoints

### Authorization
- Role-based access control (RBAC)
- Farmer can only access their own data
- Admin has full access

### Data Protection
- Encrypt sensitive data at rest
- HTTPS for all API calls
- Input validation and sanitization
- SQL injection prevention
- XSS protection

---

## Performance Requirements

### Response Times
- Profile/Farm data: < 200ms
- Weather data: < 500ms (cached)
- Market prices: < 300ms
- Advisories: < 400ms
- Financial data: < 300ms

### Caching Strategy
- Weather data: Cache for 1 hour
- Market prices: Cache for 30 minutes
- Advisories: Cache for 1 hour
- Static data (plans, counties): Cache for 24 hours

### Rate Limiting
- Auth endpoints: 10 requests per minute
- API endpoints: 100 requests per minute per user
- External API calls: Respect provider limits

---

## Testing Requirements

### Unit Tests
- All API endpoints
- Business logic
- Data validation

### Integration Tests
- API integration with external services
- Database operations
- Payment flow

### End-to-End Tests
- Complete user flows
- Dashboard loading
- Subscription purchase

---

## Monitoring & Logging

### Metrics to Track
- API response times
- Error rates
- User activity
- Subscription conversions
- Payment success rates

### Logging
- Request/response logs
- Error logs with stack traces
- User action logs
- Payment transaction logs

---

## Deployment Requirements

### Environment Variables
```
DATABASE_URL=postgresql://user:pass@localhost:5432/agrisync_db
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-secret-key
AT_API_KEY=africastalking-api-key
AT_USERNAME=sandbox
MPESA_CONSUMER_KEY=mpesa-consumer-key
MPESA_CONSUMER_SECRET=mpesa-consumer-secret
MPESA_PASSKEY=mpesa-passkey
ANTHROPIC_API_KEY=anthropic-api-key
FLASK_ENV=production
```

### Scalability
- Horizontal scaling with load balancer
- Database read replicas
- Redis for caching and session management
- Celery for background tasks (weather updates, SMS sending)

---

## Summary

The Farmer Dashboard requires **23 API endpoints** across **8 main API modules**:

1. **Authentication** (4 endpoints)
2. **Farmer Profile** (2 endpoints)
3. **Farm Management** (4 endpoints)
4. **Crop Management** (4 endpoints)
5. **Weather API** (1 endpoint)
6. **Market Prices API** (3 endpoints)
7. **Advisory API** (3 endpoints)
8. **Financial Management API** (7 endpoints)
9. **Payments & Subscriptions API** (4 endpoints)
10. **Planting Calendar API** (4 endpoints)
11. **Notifications API** (3 endpoints)
12. **AI Assistant API** (1 endpoint)

Total: **40 API endpoints** required for complete farmer dashboard functionality.
