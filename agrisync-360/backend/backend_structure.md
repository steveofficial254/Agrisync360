# AgriSync 360 — Backend Architecture Documentation

This document provides a comprehensive analysis and mapping of the AgriSync 360 Flask backend.

---

## 1. Models Summary

All database models reside in `app/models/` and utilize SQLAlchemy with a PostgreSQL dialect.

### `User` (Table: `users`)
- **Columns**:
  - `id`: `UUID(as_uuid=True)`, Primary Key, Default: `uuid.uuid4`
  - `email`: `String(255)`, Nullable, Unique, Index
  - `phone`: `String(20)`, Non-Nullable, Unique, Index
  - `password_hash`: `String(255)`, Non-Nullable
  - `role`: `Enum('farmer', 'admin', 'ngo_partner', 'agro_dealer', 'county_officer')`, Default: `'farmer'`, Index
  - `is_active`: `Boolean`, Default: `True`
  - `is_verified`: `Boolean`, Default: `False`
  - `otp_code`: `String(6)`, Nullable
  - `otp_expires_at`: `DateTime(timezone=True)`, Nullable
  - `otp_type`: `Enum('phone_verification', 'password_reset')`, Nullable
  - `created_at`: `DateTime(timezone=True)`, Default: UTC Now
  - `updated_at`: `DateTime(timezone=True)`, Default: UTC Now, onupdate: UTC Now
- **Relationships**:
  - `farmer_profile`: `relationship("Farmer", back_populates="user", uselist=False)`
- **Methods**:
  - `set_password(password)`: Hashes password using `werkzeug.security.generate_password_hash`.
  - `check_password(password)`: Verifies password using `werkzeug.security.check_password_hash`.
  - `generate_otp(otp_type)`: Generates a 6-digit random code valid for 10 minutes.
  - `verify_otp(code)`: Validates code and checks expiry.
  - `to_dict()`: Serializes fields (excluding password hashes and OTP codes).

### `Farmer` (Table: `farmers`)
- **Columns**:
  - `id`: `UUID(as_uuid=True)`, Primary Key
  - `user_id`: `UUID(as_uuid=True)`, ForeignKey(`users.id`, ondelete="CASCADE"), Unique, Non-Nullable
  - `first_name`: `String(120)`, Non-Nullable
  - `last_name`: `String(120)`, Non-Nullable
  - `national_id`: `String(20)`, Nullable, Unique, Index
  - `county`: `String(100)`, Non-Nullable, Index
  - `sub_county`: `String(100)`, Nullable
  - `ward`: `String(100)`, Nullable
  - `village`: `String(120)`, Nullable
  - `profile_photo`: `String(500)`, Nullable
  - `created_at` / `updated_at`: `DateTime(timezone=True)`
- **Relationships**:
  - `user`: `relationship("User", back_populates="farmer_profile")`
  - `farms`: `relationship("Farm", back_populates="farmer", lazy="dynamic", cascade="all, delete-orphan")`
  - `subscriptions`: `relationship("Payment", back_populates="farmer", lazy="dynamic")`
  - `alerts`: `relationship("Alert", back_populates="farmer", lazy="dynamic", cascade="all, delete-orphan")`
- **Properties**:
  - `full_name`: Returns `first_name last_name` (stripped).

### `Farm` (Table: `farms`)
- **Columns**:
  - `id`: `UUID(as_uuid=True)`, Primary Key
  - `farmer_id`: `UUID(as_uuid=True)`, ForeignKey(`farmers.id`, ondelete="CASCADE"), Non-Nullable, Index
  - `name`: `String(200)`, Non-Nullable
  - `location`: `Geometry("POINT", srid=4326)`, Non-Nullable (PostGIS coordinates)
  - `county`: `String(100)`, Non-Nullable, Index
  - `sub_county`: `String(100)`, Nullable
  - `size_acres`: `Float`, Non-Nullable
  - `soil_type`: `Enum('clay', 'loam', 'sandy', 'silt', 'peat')`, Non-Nullable
  - `water_source`: `Enum('rain', 'irrigation', 'river', 'borehole', 'none')`, Non-Nullable
  - `elevation_meters`: `Float`, Nullable
  - `is_primary`: `Boolean`, Default: `False`
  - `is_deleted`: `Boolean`, Default: `False`
  - `created_at`: `DateTime(timezone=True)`
- **Relationships**:
  - `farmer`: `relationship("Farmer", back_populates="farms")`
  - `crop_subscriptions`: `relationship("Crop", back_populates="farm", lazy="dynamic", cascade="all, delete-orphan")`

### `Crop` (Table: `crops`)
- **Columns**:
  - `id`: `UUID(as_uuid=True)`, Primary Key
  - `farm_id`: `UUID(as_uuid=True)`, ForeignKey(`farms.id`, ondelete="CASCADE"), Non-Nullable, Index
  - `crop_name`: `Enum('maize', 'beans', 'potatoes', 'tomatoes', 'tea', 'wheat', 'rice', 'cassava', 'sorghum', 'cabbage', 'kale', 'onions', 'other')`, Non-Nullable, Index
  - `variety`: `String(150)`, Nullable
  - `planting_date`: `Date`, Non-Nullable
  - `expected_harvest_date`: `Date`, Nullable
  - `area_planted_acres`: `Float`, Non-Nullable
  - `growth_stage`: `Enum('land_prep', 'planting', 'germination', 'vegetative', 'flowering', 'fruiting', 'maturity', 'harvested')`, Non-Nullable
  - `is_active`: `Boolean`, Default: `True`
  - `created_at`: `DateTime(timezone=True)`
- **Relationships**:
  - `farm`: `relationship("Farm", back_populates="crop_subscriptions")`

### `Payment` (Table: `payments`)
- **Columns**:
  - `id`: `UUID(as_uuid=True)`, Primary Key
  - `farmer_id`: `UUID(as_uuid=True)`, ForeignKey(`farmers.id`, ondelete="CASCADE"), Non-Nullable, Index
  - `plan`: `Enum('basic_monthly', 'pro_monthly', 'basic_annual', 'pro_annual', 'ngo_annual', 'county_annual')`, Non-Nullable
  - `amount_ksh`: `Float`, Non-Nullable
  - `mpesa_reference`: `String(100)`, Unique, Nullable
  - `checkout_request_id`: `String(120)`, Nullable, Index
  - `merchant_request_id`: `String(120)`, Nullable
  - `mpesa_receipt_number`: `String(120)`, Nullable
  - `phone_number`: `String(20)`, Non-Nullable
  - `status`: `Enum('pending', 'completed', 'failed', 'cancelled', 'refunded')`, Default: `'pending'`
  - `payment_date`: `DateTime(timezone=True)`
  - `subscription_start`: `Date`
  - `subscription_end`: `Date`
- **Relationships**:
  - `farmer`: `relationship("Farmer", back_populates="subscriptions")`
- **Properties**:
  - `is_active`: Evaluates status and end date.

### `SMS` (Table: `sms_logs`)
- **Columns**:
  - `id`: `UUID(as_uuid=True)`, Primary Key
  - `farmer_id`: `UUID(as_uuid=True)`, ForeignKey(`farmers.id`, ondelete="SET NULL"), Nullable, Index
  - `phone_number`: `String(20)`, Non-Nullable, Index
  - `message`: `Text`, Non-Nullable
  - `message_type`: `Enum('otp', 'advisory', 'weather_alert', 'market_alert', 'subscription', 'bulk', 'ussd_response')`, Non-Nullable
  - `status`: `Enum('pending', 'sent', 'delivered', 'failed')`, Default: `'pending'`
  - `at_message_id`: `String(120)`, Nullable
  - `cost`: `Float`, Nullable
  - `sent_at` / `delivered_at`: `DateTime(timezone=True)`

### `Advisory` (Table: `advisories`)
- **Columns**:
  - `id`: `UUID(as_uuid=True)`, Primary Key
  - `crop_name`: `Enum('maize', 'beans', 'potatoes', 'tomatoes', 'tea', 'wheat', 'rice', 'cassava', 'sorghum', 'cabbage', 'kale', 'onions', 'other')`, Non-Nullable
  - `title`: `String(200)`, Non-Nullable
  - `content`: `Text`, Non-Nullable
  - `advisory_type`: `Enum('planting', 'nutrition', 'pest_control', 'irrigation', 'harvest', 'general', 'disease_alert', 'weather_alert')`, Non-Nullable, Index
  - `growth_stage`: `String(50)`, Nullable
  - `season`: `Enum('long_rains', 'short_rains', 'dry_season', 'all')`, Default: `'all'`
  - `counties_applicable`: `ARRAY(String)`, Nullable (List of applicable counties)
  - `is_active`: `Boolean`, Default: `True`

### `Market` (Table: `market_prices`)
- **Columns**:
  - `id`: `UUID(as_uuid=True)`, Primary Key
  - `crop_name`: `String(50)`, Non-Nullable, Index
  - `county`: `String(100)`, Non-Nullable, Index
  - `market_name`: `String(120)`, Non-Nullable
  - `price_per_kg`: `Float`, Non-Nullable
  - `unit`: `Enum('kg', 'bag_90kg', 'bag_50kg', 'crate', 'bunch')`, Default: `'kg'`
  - `price_per_unit`: `Float`, Non-Nullable
  - `demand_level`: `Enum('low', 'medium', 'high', 'very_high')`, Default: `'medium'`
  - `source`: `String(120)`, Non-Nullable
  - `recorded_date`: `Date`, Non-Nullable, Index

### `Weather` (Table: `weather_cache`)
- **Columns**:
  - `id`: `UUID(as_uuid=True)`, Primary Key
  - `latitude` / `longitude`: `Float`, Non-Nullable, Index
  - `county`: `String(100)`
  - `forecast_date`: `Date`, Non-Nullable, Index
  - `temperature_max` / `temperature_min` / `precipitation_mm` / `humidity_percent` / `wind_speed_kmh` / `uv_index`: `Float`
  - `weather_code`: `Integer`
  - `weather_description`: `String(160)`
  - `disease_risk_level`: `Enum('low', 'medium', 'high', 'very_high')`, Default: `'low'`
  - `frost_risk`: `Boolean`
  - `planting_window`: `Boolean`
  - `expires_at`: `DateTime(timezone=True)`
- **Properties**:
  - `is_expired`: Checks current time against `expires_at`.

### `Alert` (Table: `alerts`)
- **Columns**:
  - `id`: `UUID(as_uuid=True)`, Primary Key
  - `farmer_id`: `UUID(as_uuid=True)`, ForeignKey(`farmers.id`, ondelete="CASCADE"), Non-Nullable
  - `alert_type`: `Enum('weather', 'disease_risk', 'planting_window', 'market_price', 'subscription_expiry', 'general')`
  - `title`: `String(200)`, Non-Nullable
  - `message`: `Text`, Non-Nullable
  - `severity`: `Enum('info', 'warning', 'critical')`, Default: `'info'`
  - `is_read` / `sent_via_sms`: `Boolean`, Default: `False`

### `AgroDealer` (Table: `agro_dealer`)
- **Columns**:
  - `id`: `UUID(as_uuid=True)`, Primary Key
  - `user_id`: `UUID(as_uuid=True)`, ForeignKey(`users.id`), Unique
  - `business_name` / `business_location`: `String(200)`
  - `county`: `String(100)`
  - `products`: `ARRAY(String)` (Products catalog list)
  - `is_verified`: `Boolean`, Default: `False`
  - `monthly_reach`: `Integer`, Default: `0`

### `ProductRecommendation` (Table: `product_recommendation`)
- **Columns**:
  - `id`: `UUID(as_uuid=True)`, Primary Key
  - `agro_dealer_id`: `UUID(as_uuid=True)`, ForeignKey(`agro_dealer.id`)
  - `crop_name`: `String(100)`
  - `product_name`: `String(200)`
  - `product_type`: `Enum('fertilizer', 'pesticide', 'herbicide', 'seed', 'equipment')`
  - `description`: `Text`
  - `price_ksh`: `Float`
  - `available`: `Boolean`, Default: `True`

### `NGOProfile` (Table: `ngo_profile`)
- **Columns**:
  - `id`: `UUID(as_uuid=True)`, Primary Key
  - `user_id`: `UUID(as_uuid=True)`, ForeignKey(`users.id`), Unique
  - `organization_name`: `String(200)`, Non-Nullable
  - `organization_type`: `Enum('ngo', 'cbo', 'government', 'cooperative', 'development_partner')`
  - `focus_counties` / `focus_crops`: `ARRAY(String)`
  - `total_beneficiaries_target`: `Integer`
  - `is_verified`: `Boolean`, Default: `False`
  - `contract_start` / `contract_end`: `Date`

### `BulkFarmerRegistration` (Table: `bulk_farmer_registration`)
- **Columns**:
  - `id`: `UUID(as_uuid=True)`, Primary Key
  - `ngo_id`: `UUID(as_uuid=True)`, ForeignKey(`ngo_profile.id`)
  - `batch_name`: `String(200)`
  - `total_farmers` / `successful_registrations` / `failed_registrations`: `Integer`
  - `county`: `String(100)`
  - `status`: `Enum('pending', 'processing', 'completed', 'failed')`

### `AIConversation`, `AIMessage` & `AIChat`
- **AIConversation** (Table: `ai_conversations`): Tracks conversations for farmers. `user_id` links to `User`. Has relationship `messages`.
- **AIMessage** (Table: `ai_messages`): Stores roles (`'user'`, `'assistant'`) and contents.
- **AIChat** (Table: `ai_chats`): Legacy flat table for questions and responses.

### `Greenhouse` & `GreenhouseReading`
- **Greenhouse** (Table: `greenhouses`): Tracks farmer greenhouses (covering materials, crop, dimensions).
- **GreenhouseReading** (Table: `greenhouse_readings`): Logs sensor data (temp, humidity, pH, EC, soil moisture). Has dynamic thresholds for threshold alerts.

### `YieldRecord` (Table: `yield_records`)
- **Columns**: Crop details, land size, harvested/sold quantities, revenue, cost categories, harvesting dates, and AI analysis comments.

### `CommunityPost`, `CommunityComment` & `CommunityLike`
- Models supporting forum features: categorized posts, nested replies, and post likes.

### `FarmOperation`, `InventoryItem`, `Batch` & `ComplianceRecord`
- Operation scheduling, pesticide/fertilizer inventory stocks, harvest traceability batch numbering, and compliance audits/certificates.

### `PlantingCalendarEntry`, `SoilHealthRecord`, `IrrigationSchedule` & `PestDiseaseEntry`
- Specialized agriculture models: smart calendars, soil PH/NPK logs, irrigation schedules, and the local pest database.

---

## 2. Services Summary

Services live in `app/services/` and manage core business logic and API wrappers.

1. **`WeatherService`**
   - `get_forecast(lat, lon)`: Fetches 7-day weather. Tries OpenWeatherMap (`ExternalDataService`), falls back to Open-Meteo API, and then to a default mock template. Computes disease risk and planting windows. Caches in Redis for 6 hours.
   - `get_current_weather(lat, lon)`: Fetches OWM weather.
   - `calculate_disease_risk(temp_max, temp_min, humidity, crop)`: Humidity-based risk assessment.
   - `check_planting_window(forecast_days)`: Detects 3+ consecutive rainy days with >10mm rainfall.
   - `get_historical_rainfall(lat, lon, crop)`: Fetches NASA POWER API data for historical soil calculations.

2. **`AdvisoryService`**
   - `get_crop_advisory(crop_name, county, growth_stage)`: Queries active advisories filtered by growth stage and county applicability.
   - `get_planting_calendar(crop_name, planting_date, county)`: Queries FAO calendars, falls back to a 12-week schedule for maize/beans/tomatoes/potatoes.
   - `get_disease_alert(crop_name, weather_risk, county)`: Generates crop disease alerts under high/very-high risk.
   - `get_nutrition_guide(crop_name, growth_stage)`: Recommends specific NPK fertilization products.

3. **`MarketService`**
   - `get_current_prices(crop_name, county)`: Obtains latest market price and compares it with the 7-day average to determine trend direction (`"up"`, `"down"`, `"stable"`).
   - `get_price_history(crop_name, months)`: Aggregates historical monthly averages.
   - `calculate_profitability(crop_name, acres, county)`: Break-even pricing, ROI, and profitability estimations.
   - `detect_price_spikes(threshold_percent)`: Identifies anomalous daily market price spikes.

4. **`MpesaService`**
   - `get_access_token()`: Generates Safaricom OAuth token; cached in Redis for 55 minutes.
   - `stk_push(phone_number, amount, account_ref, description, farmer_id, plan)`: Sends Lipa Na M-Pesa STK push. Registers a pending `Payment` record in the database.
   - `handle_callback(callback_data)`: Validates M-Pesa transaction results, marks payments as `completed`/`failed`, calculates subscription start/end dates, and triggers SMS confirmation.
   - `check_subscription_status(farmer_id)`: Checks for active payments ending after the current date.

5. **`SMSService`**
   - `initialize()`: Connects to Africa's Talking API.
   - `send_sms(phone_number, message, message_type, farmer_id)`: Logs SMS logs and dispatches messages (logs in console in dev mode).
   - `send_bulk_sms(phone_numbers, message, message_type)`: Dispatches bulk SMS in batches of 100.
   - Helpers: `send_otp`, `send_weather_alert`, `send_subscription_confirmation`, `send_market_alert`.

6. **`USSDService`**
   - `handle(session_id, service_code, phone_number, text)`: Main Entrypoint parsing text paths (e.g. `1*1`, `2*3`).
   - Translates navigation menus, handles Swahili localization, queries crop prices/weather for location, triggers password-reset OTP SMS, and invokes STK push for subscriptions.
   - Manages USSD session states using Redis.

7. **`AIService`**
   - `generate_chat_response(message)`: Returns AI message mock completions.
   - `generate_yield_summary(crop_name, area, quantity)`: Builds yield records summaries.

---

## 3. Routes Summary

Endpoints are organized into blueprints with rate-limit limits.

| Blueprint | Method | Path | Authentication / Role | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | None | Registers user. Returns OTP in dev. |
| | `POST` | `/api/auth/verify-otp` | None | Validates OTP. Returns access/refresh JWTs. |
| | `POST` | `/api/auth/login` | None | Authenticates password. Returns JWTs. |
| | `POST` | `/api/auth/refresh` | JWT Refresh Token | Issues new access token. |
| | `POST` | `/api/auth/forgot-password` | None | Sends password reset OTP. |
| | `POST` | `/api/auth/verify-reset-otp` | None | Generates reset token. |
| | `POST` | `/api/auth/reset-password` | None | Saves new password using reset token. |
| | `POST` | `/api/auth/logout` | JWT Access Token | Logs out user. |
| **Farmers** | `GET` | `/api/farmers/profile` | JWT Access Token | Retrieves profile (farms, active crops). |
| | `POST` | `/api/farmers/profile` | JWT Access Token | Creates profile. Validates Kenyan counties. |
| | `PUT` | `/api/farmers/profile` | JWT Access Token | Updates profile details. |
| | `GET` | `/api/farmers/<farmer_id>`| JWT (Admin Only) | Fetches farmer profile. |
| | `GET` | `/api/farmers/` | JWT (Admin Only) | Lists farmers (filters, search, pagination). |
| **Farms** | `POST` | `/api/farms/` | JWT (Farmer Only) | Registers farm. Saves POINT geometry. |
| | `GET` | `/api/farms/` | JWT (Farmer Only) | Lists farmer's active farms. |
| | `GET` | `/api/farms/<farm_id>`| JWT (Farmer Only) | Retrieves farm details + weather + crops. |
| | `PUT` | `/api/farms/<farm_id>`| JWT (Farmer Only) | Updates farm parameters. |
| | `DELETE`| `/api/farms/<farm_id>`| JWT (Farmer Only) | Soft deletes a farm. |
| | `POST` | `/api/farms/<id>/crops`| JWT (Farmer Only) | Plants a new crop. Expected harvest date calculated. |
| | `GET` | `/api/farms/<id>/crops`| JWT (Farmer Only) | Lists active crops in a farm. |
| **Advisory** | `GET` | `/api/advisory/crop/<name>`| None | Fetch crop-specific guides. |
| | `GET` | `/api/advisory/calendar/<name>`| JWT | Returns planting calendar. |
| | `GET` | `/api/advisory/nutrition/<name>`| JWT + Pro Subscription | Fetch NPK guide. |
| | `GET` | `/api/advisory/pests/<name>`| JWT | Retrieves disease risks. |
| | `POST`/`PUT`/`DELETE`| `/api/advisory/...` | JWT (Admin Only) | Advisory catalog management. |
| **Market** | `GET` | `/api/market/prices` | None | Gets current prices & trends. |
| | `GET` | `/api/market/profitability`| None | Calculations for break-even, ROI. |
| **Payments**| `POST` | `/api/payments/subscribe`| JWT Access Token | Triggers STK Push. |
| | `GET` | `/api/payments/subscription`| JWT Access Token | Returns current plan details. |
| | `POST` | `/api/payments/mpesa/callback`| None (M-Pesa IPN) | M-Pesa Callback webhook IPN. |
| **USSD** | `POST` | `/api/ussd/callback` | None (Africa's Talking)| Processes USSD requests. |
| **AgroDealer**| `GET`/`POST`/`PUT`| `/api/dealer/profile` | JWT (AgroDealer Only) | Manages dealer profile. |
| | `POST` | `/api/dealer/products` | JWT (AgroDealer Only) | Lists/manages product inventory. |
| | `POST` | `/api/dealer/broadcast` | JWT (AgroDealer Only) | Sends broadcast alerts to county farmers. |
| **NGO** | `GET`/`POST` | `/api/ngo/profile` | JWT (NGO Only) | NGO profile management. |
| | `POST` | `/api/ngo/farmers/bulk-register`| JWT (NGO Only) | Registers farmers from uploaded batches. |
| | `POST` | `/api/ngo/broadcast` | JWT (NGO Only) | Sends alerts to focus counties. |
| **Admin** | `GET` | `/api/admin/stats` | JWT (Admin Only) | System metrics & analytical charts. |

---

## 4. Authentication Flow

JWT authentication is managed via `Flask-JWT-Extended`.
1. **User Registration**: Password hashed using `generate_password_hash`. An OTP is generated and sent via SMS.
2. **OTP Verification**: Verifies OTP. On success, `is_verified` is marked `True`, and an access JWT (valid for 12 hours) and refresh JWT (valid for 30 days) are returned.
3. **Role claims**: JWT claims store the user's role (`role`). The `@role_required` decorator checks claims to enforce RBAC.
4. **Token Refresh**: Client POSTs refresh token to `/api/auth/refresh` to obtain a fresh access token.

---

## 5. Error Handling Patterns

Application error handlers register JSON formatting for HTTP status codes:
- **`400 Bad Request`**: `{"success": False, "error": "bad_request", "message": "<error_message>"}`
- **`401 Unauthorized`**: `{"success": False, "error": "unauthorized", "message": "<reason>"}`
- **`403 Forbidden`**: `{"success": False, "error": "forbidden", "message": "<reason>"}`
- **`404 Not Found`**: `{"success": False, "error": "not_found", "message": "Resource not found"}`
- **`500 Internal Server Error`**: Logs exception details, returning: `{"success": False, "error": "server_error", "message": "An unexpected error occurred"}`

---

## 6. Database and PostGIS

- **Engine**: PostgreSQL database with `PostGIS` extension enabled.
- **Geometries**: Farms use `Geometry("POINT", srid=4326)` for geospatial tracking.
- **Relationships**:
  - `User` (1) ↔ (1) `Farmer` (Cascaded delete)
  - `Farmer` (1) ↔ (N) `Farm` (Dynamic lazy load)
  - `Farm` (1) ↔ (N) `Crop` (Dynamic lazy load, mapped through `crop_subscriptions`)
  - `Farmer` (1) ↔ (N) `Payment` (Subscription history)
  - `Farmer` (1) ↔ (N) `Alert` (Notification history)

---

## 7. External Integrations

1. **Safaricom M-Pesa API**:
   - OAuth access token flow.
   - STK Push (Lipa Na M-Pesa Online) API.
   - Callback endpoints validating payments.
2. **Africa's Talking API**:
   - SMS gateway for OTPs and county advisories.
   - USSD callback processing engine.
3. **Open-Meteo API**:
   - 7-day weather forecast fallback.
4. **NASA POWER API**:
   - Long-term historical weather and rainfall datasets.

---

## 8. Key Patterns

- **Application Factory Pattern**: `create_app()` initialized with config environments.
- **Subscription Feature Gating**: `@subscription_required(plan_level)` decorator blocks access for non-subscribing farmers (basic or pro features).
- **Graceful API Fallbacks**: OpenWeatherMap faults degrade to Open-Meteo, then to synthetic mock data, ensuring high uptime.
- **Geospatial Point Builder**: Static method `Farm.build_point(lat, lon)` generates WKT strings for database inserts.
