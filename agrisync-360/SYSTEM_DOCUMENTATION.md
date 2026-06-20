# Agrisync360 System Documentation

## Overview

Agrisync360 is a comprehensive agricultural management platform designed to connect farmers, agro-dealers, NGOs, and administrators in a unified ecosystem. The system provides tools for farm management, market intelligence, advisory services, and administrative oversight.

## User Roles

The system supports four primary user roles:

1. **Admin** - System administrator with full oversight capabilities
2. **Farmer** - Primary users managing their farms and receiving advisories
3. **Agro-Dealer** - Agricultural input suppliers connecting with farmers
4. **NGO** - Non-governmental organizations managing farmer outreach programs

## Dashboards and Features

### 1. Admin Dashboard

**Purpose**: System-wide oversight and management

**Key Features**:
- **System Statistics**: Total farmers, active subscriptions, SMS sent, revenue tracking
- **Revenue Analytics**: Monthly revenue trends and breakdown by subscription plans
- **Geographic Insights**: Top counties by farmer registration
- **Crop Analytics**: Most popular crops and cultivation data
- **Farmer Management**: View and manage farmer accounts
- **System Health**: Monitor system performance and status

**Functionality**:
- Real-time dashboard statistics
- Revenue trend visualization
- Geographic distribution analysis
- Farmer account management
- System health monitoring

**API Endpoints**:
- `GET /admin/stats` - System statistics
- `GET /admin/revenue` - Revenue data
- `GET /admin/top-counties` - Geographic data
- `GET /admin/top-crops` - Crop analytics
- `GET /admin/farmers` - Farmer list
- `GET /admin/system-health` - System status

---

### 2. Farmer Dashboard

**Purpose**: Personal farm management and advisory services

**Key Features**:
- **Farm Overview**: View all registered farms with details
- **Crop Management**: Track crops, planting dates, and expected yields
- **Weather Integration**: Real-time weather data and forecasts
- **Market Prices**: Current market prices for agricultural products
- **Advisory Services**: Receive personalized farming advisories
- **SMS Alerts**: Weather alerts, pest warnings, and market updates
- **Financial Tracking**: Farm expenses and revenue

**Functionality**:
- Register and manage multiple farms
- Track crop planting and harvest cycles
- Receive weather-based recommendations
- Access market price information
- Get SMS alerts for critical events
- Monitor farm financial performance

**API Endpoints**:
- `GET /farmers/farms` - Farm list
- `POST /farmers/farms` - Register new farm
- `PUT /farmers/farms/:id` - Update farm details
- `GET /farmers/crops` - Crop data
- `GET /weather/current` - Current weather
- `GET /weather/forecast` - Weather forecast
- `GET /market/prices` - Market prices
- `GET /advisory/recommendations` - Advisory services
- `POST /alerts/send` - Send alerts

---

### 3. Agro-Dealer Dashboard

**Purpose**: Manage agricultural products and connect with farmers

**Key Features**:
- **Product Management**: List, create, update, and delete agricultural products
- **Inventory Tracking**: Monitor stock levels and availability
- **Farmer Connections**: View connected farmers in the region
- **Broadcast Messaging**: Send promotional messages to farmers
- **Order Management**: Track pending and completed orders
- **Revenue Tracking**: Monitor monthly revenue and sales performance

**Functionality**:
- Add and manage product listings
- Set product prices and availability
- View farmer directory
- Send bulk SMS broadcasts
- Track order status
- Monitor sales analytics

**API Endpoints**:
- `GET /dealer/stats` - Dealer statistics
- `GET /dealer/products` - Product list
- `POST /dealer/products` - Create product
- `PUT /dealer/products/:id` - Update product
- `DELETE /dealer/products/:id` - Delete product
- `GET /dealer/farmers` - Connected farmers
- `POST /dealer/broadcast` - Send broadcast
- `GET /dealer/orders` - Order list
- `GET /dealer/analytics` - Sales analytics

---

### 4. NGO Dashboard

**Purpose**: Manage farmer outreach programs and batch registrations

**Key Features**:
- **Impact Tracking**: Monitor farmer registration progress toward targets
- **Batch Management**: Create and manage farmer registration batches
- **Farmer Directory**: View and manage registered farmers
- **SMS Campaigns**: Send advisory SMS to farmer groups
- **Training Management**: Organize and track farmer training sessions
- **Analytics**: Track engagement rates, delivery rates, and program effectiveness
- **Export Functionality**: Export farmer data as CSV

**Functionality**:
- Create farmer registration batches
- Upload farmer data in bulk
- Monitor batch processing progress
- Send advisory SMS campaigns
- Track training completion
- Export farmer data for reporting
- Monitor program impact metrics

**API Endpoints**:
- `GET /ngo/dashboard` - Dashboard overview
- `GET /ngo/stats` - NGO statistics
- `GET /ngo/batches` - Batch list
- `POST /ngo/batches` - Create batch
- `DELETE /ngo/batches/:id` - Delete batch
- `GET /ngo/batches/:id/status` - Batch status
- `GET /ngo/farmers` - Farmer directory
- `POST /ngo/farmers/export` - Export CSV
- `POST /ngo/send-advisory-sms` - Send SMS
- `GET /ngo/trainings` - Training list
- `GET /ngo/analytics` - Program analytics

---

## Additional Modules

### Greenhouse Management

**Purpose**: Monitor and control greenhouse environments

**Features**:
- Greenhouse inventory management
- Environmental monitoring (temperature, humidity, CO2)
- Automated irrigation scheduling
- Crop cycle tracking
- Resource usage analytics

**API Endpoints**:
- `GET /greenhouse/dashboard` - Greenhouse overview
- `GET /greenhouse` - Greenhouse list
- `POST /greenhouse` - Create greenhouse
- `GET /greenhouse/:id/environment` - Environmental data
- `GET /greenhouse/:id/crops` - Crop data
- `GET /greenhouse/:id/irrigation` - Irrigation schedule

---

### MarketPro

**Purpose**: Market intelligence and profitability analysis

**Features**:
- Real-time market price tracking
- Price trend forecasting
- Profitability calculator
- Market demand analysis
- Price alerts

**API Endpoints**:
- `GET /market/pro/data` - Market data
- `POST /market/pro/profitability` - Calculate profitability
- `GET /market/pro/intelligence/:crop` - Market intelligence
- `GET /market/alerts` - Price alerts
- `POST /market/alerts` - Create alert

---

### AI Assistant

**Purpose**: Intelligent farming recommendations

**Features**:
- Chat-based advisory system
- Crop recommendations based on conditions
- Disease detection from images
- Weather-based predictions
- Yield forecasting

**API Endpoints**:
- `POST /ai/chat` - Chat with AI assistant
- `GET /ai/recommendations` - Crop recommendations
- `POST /ai/detect-disease` - Disease detection
- `GET /ai/weather-predictions` - Weather predictions
- `POST /ai/predict-yield` - Yield forecasting

---

## API Structure

### Configuration

The system uses a mock API configuration for development:

```javascript
// frontend/src/api/config.js
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.DEV
```

When `USE_MOCK_API` is true, all API calls are routed through mock implementations instead of real backend endpoints.

### Mock API Implementation

Mock APIs are implemented in `frontend/src/api/mockApi.js`:

- **mockAdminAPI** - Admin dashboard endpoints
- **mockFarmersAPI** - Farmer management endpoints
- **mockDealerAPI** - Agro-dealer endpoints
- **mockNGOAPI** - NGO management endpoints
- **mockGreenhouseAPI** - Greenhouse management
- **mockMarketProAPI** - Market intelligence
- **mockAIAPI** - AI assistant features
- **mockWeatherAPI** - Weather data
- **mockMarketAPI** - Market prices
- **mockAdvisoryAPI** - Advisory services
- **mockPaymentsAPI** - Payment processing
- **mockFinancialAPI** - Financial tracking
- **mockFarmIntelAPI** - Farm intelligence
- **mockAuthAPI** - Authentication
- **mockNotificationsAPI** - Notification system

### API Response Format

Mock APIs return responses in the following format:

```javascript
{
  data: {
    success: true,
    data: { /* actual data */ },
    message: "Success message (optional)"
  }
}
```

Components handle both mock format and direct API responses for compatibility.

---

## Authentication

### Login Credentials

**Admin**:
- Email: `admin@agrisync.com`
- Phone: `0777000001`

**Dealer**:
- Email: `dealer@agrisync.com`
- Phone: `0777000002`

**NGO**:
- Email: `ngo@agrisync.com`
- Phone: `0777000003`

**Farmer**:
- Phone: `0777000004` (or any valid phone number)

### Authentication Flow

1. User enters credentials (phone/email)
2. System validates credentials via auth API
3. On success, JWT token is stored in localStorage
4. User is redirected to appropriate dashboard based on role
5. AuthContext manages authentication state across the app

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Modern web browser

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd agrisync-360/frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open browser to `http://localhost:5173`

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_USE_MOCK=true
VITE_API_BASE_URL=http://localhost:8000
```

---

## Mock Data Usage

### Enabling Mock Mode

Mock mode is automatically enabled in development. To use real APIs:

1. Set `VITE_USE_MOCK=false` in `.env`
2. Ensure backend server is running at `VITE_API_BASE_URL`
3. Restart the development server

### Mock Data Coverage

All major features have comprehensive mock data:
- Dashboard statistics and analytics
- User management data
- Product and inventory data
- Market and pricing data
- Weather and advisory data
- Financial and payment data
- Notification and alert data

---

## Component Architecture

### Common Components

Located in `frontend/src/components/common/`:

- **Card** - Reusable card component with variants
- **Badge** - Status and category badges
- **Button** - Consistent button styling with variants
- **Alert** - Alert messages with types (success, error, warning, info)
- **Loader** - Loading indicators and page loaders
- **Modal** - Modal dialogs and overlays

### Page Components

Located in `frontend/src/pages/`:

- **Admin** - Admin dashboard and management pages
- **Farmer** - Farmer dashboard and farm management
- **Agro-Dealer** - Dealer dashboard and product management
- **NGO** - NGO dashboard and program management
- **Auth** - Login and authentication pages

---

## Styling System

### Color Palette

- **Primary**: Emerald/Teal gradients for main actions
- **Secondary**: Blue/Indigo for information
- **Accent**: Purple/Pink for highlights
- **Success**: Green for positive states
- **Warning**: Orange/Amber for caution
- **Error**: Red for negative states

### Design Principles

- **Gradient backgrounds** for visual depth
- **Shadows** for elevation and hierarchy
- **Rounded corners** for modern appearance
- **Transitions** for smooth interactions
- **Responsive design** for all screen sizes
- **Glassmorphism** effects for overlays

---

## Features by Role Summary

### Admin
- ✅ System statistics and analytics
- ✅ Revenue tracking
- ✅ Geographic analysis
- ✅ Farmer management
- ✅ System health monitoring

### Farmer
- ✅ Farm management
- ✅ Crop tracking
- ✅ Weather integration
- ✅ Market prices
- ✅ Advisory services
- ✅ SMS alerts
- ✅ Financial tracking

### Agro-Dealer
- ✅ Product management
- ✅ Inventory tracking
- ✅ Farmer connections
- ✅ Broadcast messaging
- ✅ Order management
- ✅ Revenue tracking

### NGO
- ✅ Impact tracking
- ✅ Batch management
- ✅ Farmer directory
- ✅ SMS campaigns
- ✅ Training management
- ✅ Analytics
- ✅ CSV export

---

## Development Notes

### API Integration

All API calls are wrapped in role-specific API files:
- `frontend/src/api/admin.js`
- `frontend/src/api/farmers.js`
- `frontend/src/api/dealer.js`
- `frontend/src/api/ngo.js`
- `frontend/src/api/greenhouse.js`
- `frontend/src/api/marketPro.js`
- `frontend/src/api/auth.js`

### State Management

- **AuthContext** - Authentication state
- **AppContext** - Application-wide state
- Local component state for specific features

### Error Handling

- Defensive rendering for API responses
- Error boundaries for component errors
- Toast notifications for user feedback
- Alert components for error messages

---

## Future Enhancements

- Real-time data synchronization
- Offline mode support
- Mobile app development
- Advanced analytics dashboard
- Integration with external agricultural services
- Multi-language support
- Advanced reporting features

---

## Support

For issues or questions:
- Check the mock API implementation in `frontend/src/api/mockApi.js`
- Review component implementations in `frontend/src/pages/`
- Examine API wrappers in `frontend/src/api/`
- Check authentication flow in `frontend/src/context/AuthContext.jsx`

---

## License

Proprietary - All rights reserved
