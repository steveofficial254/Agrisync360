# AgriSync 360 — Backend Architecture

> Comprehensive backend documentation generated from full source analysis.
> Flask 3.0 + PostgreSQL/PostGIS + JWT + Celery/Redis + M-Pesa + Africa's Talking

---

## Table of Contents

1. [Core Architecture](#core-architecture)
2. [Models Summary](#models-summary)
3. [Services Summary](#services-summary)
4. [Routes Summary](#routes-summary)
5. [Authentication & Authorization](#authentication--authorization)
6. [Error Handling](#error-handling)
7. [Database & PostGIS](#database--postgis)
8. [External Integrations](#external-integrations)
9. [Key Patterns](#key-patterns)

---

## Core Architecture

### Entry Point — `run.py`
```python
from app import create_app
app = create_app("development")
# Creates all tables, runs on 0.0.0.0:5000
```

### App Factory — `app/__init__.py`
- `create_app(config_name)` → Flask app
- Initializes: `db`, `migrate`, `jwt`, `cors`, `limiter`, `redis_client`, `celery`
- Registers all 22 blueprints from `app.routes.ALL_BLUEPRINTS`
- Defines error handlers: 400, 401, 403, 404, 500
- Defines JWT callbacks: invalid_token, missing_token, expired_token
- Health check: `GET /api/health` — checks DB + Redis

### Extensions — `app/extensions.py`
| Extension | Type | Purpose |
|-----------|------|---------|
| `db` | `SQLAlchemy` | ORM / database |
| `migrate` | `Migrate` | Alembic migrations |
| `jwt` | `JWTManager` | JWT auth |
| `cors` | `CORS` | Cross-origin (supports_credentials) |
| `limiter` | `Limiter` | Rate limiting (by remote_address) |
| `redis_client` | `Redis` | Caching, token blacklist |
| `celery` | `Celery` | Async task queue |

### Configuration — `app/config.py`
| Config | Development | Testing | Production |
|--------|-------------|---------|------------|
| DEBUG | True | — | False |
| TESTING | — | True | — |
| DB | `DATABASE_URL` env | `TEST_DATABASE_URL` / SQLite memory | `DATABASE_URL` env |
| JWT Access | 12 hours | 12 hours | 12 hours |
| JWT Refresh | 30 days | 30 days | 30 days |
| Rate Limit | 1000/hour | 1000/hour | 1000/hour |
| CORS | `FRONTEND_URL` / `localhost:5173` | same | same |

### Utilities

**`app/utils/helpers.py`**
- `normalize_phone(phone)` → `+2547XXXXXXXX`
- `is_valid_kenyan_phone(phone)` → bool (supports `07`, `01` prefixes)
- `is_valid_uuid(value)` → bool

**`app/utils/decorators.py`**
- `role_required(*roles)` — JWT + role check decorator
- `admin_required(fn)` — shortcut for `role_required('admin')`
- `farmer_required(fn)` — shortcut for `role_required('farmer')`
- `agro_dealer_required(fn)` — shortcut for `role_required('agro_dealer')`
- `ngo_required(fn)` — shortcut for `role_required('ngo_partner')`
- `subscription_required(plan_level='basic')` — checks active subscription via `MpesaService.check_subscription_status`

---

## Models Summary

### 1. User (`users`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default uuid4 |
| email | String(255) | unique, nullable, indexed |
| phone | String(20) | unique, NOT NULL, indexed |
| password_hash | String(255) | NOT NULL |
| role | Enum(`farmer`,`admin`,`ngo_partner`,`agro_dealer`,`county_officer`) | default `farmer`, NOT NULL, indexed |
| is_active | Boolean | default True |
| is_verified | Boolean | default False |
| otp_code | String(6) | nullable |
| otp_expires_at | DateTime(tz) | nullable |
| otp_type | Enum(`phone_verification`,`password_reset`) | nullable |
| created_at / updated_at | DateTime(tz) | auto |

**Relationships**: `farmer_profile` → Farmer (one-to-one)
**Methods**: `set_password()`, `check_password()`, `generate_otp()`, `verify_otp()`, `to_dict()`

---

### 2. Farmer (`farmers`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID FK→users | NOT NULL, unique |
| first_name / last_name | String(120) | NOT NULL |
| national_id | String(20) | unique, nullable, indexed |
| county | String(100) | NOT NULL, indexed |
| sub_county / ward / village | String | nullable |
| profile_photo | String(500) | nullable |

**Relationships**: `user`, `farms`, `subscriptions` (→Payment), `alerts`
**Properties**: `full_name`

---

### 3. Farm (`farms`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| farmer_id | UUID FK→farmers | NOT NULL, indexed |
| name | String(200) | NOT NULL |
| location | Geometry("POINT", srid=4326) | NOT NULL (PostGIS) |
| county / sub_county | String | NOT NULL / nullable |
| size_acres | Float | NOT NULL |
| soil_type | Enum(`clay`,`loam`,`sandy`,`silt`,`peat`) | NOT NULL |
| water_source | Enum(`rain`,`irrigation`,`river`,`borehole`,`none`) | NOT NULL |
| elevation_meters | Float | nullable |
| is_primary / is_deleted | Boolean | defaults |

**Methods**: `build_point(lat, lon)` (static), `get_coordinates()`, `to_dict()`

---

### 4. Crop (`crops`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| farm_id | UUID FK→farms | NOT NULL, indexed |
| crop_name | Enum(13 values: `maize`,`beans`,`potatoes`,...`other`) | NOT NULL, indexed |
| variety | String(150) | nullable |
| planting_date | Date | NOT NULL |
| expected_harvest_date | Date | nullable |
| area_planted_acres | Float | NOT NULL |
| growth_stage | Enum(8 values: `land_prep`...`harvested`) | NOT NULL |
| is_active | Boolean | default True |

**Properties**: `days_since_planting`, `days_to_harvest`
**Methods**: `get_current_growth_stage()` (auto-calculates from days)

---

### 5. Payment (`payments`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| farmer_id | UUID FK→farmers | NOT NULL |
| plan | Enum(`basic_monthly`,`pro_monthly`,`basic_annual`,`pro_annual`,`ngo_annual`,`county_annual`) | NOT NULL |
| amount_ksh | Float | NOT NULL |
| mpesa_reference / checkout_request_id / merchant_request_id / mpesa_receipt_number | String | nullable |
| phone_number | String(20) | NOT NULL |
| status | Enum(`pending`,`completed`,`failed`,`cancelled`,`refunded`) | default `pending` |
| payment_date | DateTime(tz) | nullable |
| subscription_start / subscription_end | Date | nullable |

**Properties**: `is_active` (checks completed + end date ≥ today)

---

### 6. SMS (`sms_logs`)
| Column | Type |
|--------|------|
| id | UUID PK |
| farmer_id | UUID FK→farmers (nullable) |
| phone_number | String(20) NOT NULL |
| message | Text NOT NULL |
| message_type | Enum(`otp`,`advisory`,`weather_alert`,`market_alert`,`subscription`,`bulk`,`ussd_response`) |
| status | Enum(`pending`,`sent`,`delivered`,`failed`) |
| at_message_id | String(120) |
| cost | Float |
| sent_at / delivered_at | DateTime(tz) |

---

### 7. Advisory (`advisories`)
| Column | Type |
|--------|------|
| crop_name | Enum (13 crop types) |
| title | String(200) NOT NULL |
| content | Text NOT NULL |
| advisory_type | Enum(`planting`,`nutrition`,`pest_control`,`irrigation`,`harvest`,`general`,`disease_alert`,`weather_alert`) |
| growth_stage | String(50) |
| season | Enum(`long_rains`,`short_rains`,`dry_season`,`all`) |
| counties_applicable | ARRAY(String) |
| is_active | Boolean |
| created_by | UUID FK→users |

---

### 8. Market (`market_prices`)
Columns: `crop_name`, `county`, `market_name`, `price_per_kg`, `unit` (Enum), `price_per_unit`, `demand_level` (Enum), `source`, `recorded_date`

### 9. Weather (`weather_cache`)
Columns: `latitude`, `longitude`, `county`, `forecast_date`, `temperature_max/min`, `precipitation_mm`, `humidity_percent`, `wind_speed_kmh`, `uv_index`, `weather_code`, `weather_description`, `disease_risk_level` (Enum), `frost_risk`, `planting_window`, `fetched_at`, `expires_at`
**Properties**: `is_expired`

### 10. Alert (`alerts`)
Columns: `farmer_id` FK, `alert_type` (Enum: 6 types), `title`, `message`, `severity` (Enum: info/warning/critical), `is_read`, `sent_via_sms`

### 11. AgroDealer (`agro_dealer`)
Columns: `user_id` FK, `business_name`, `business_location`, `county`, `products` (ARRAY), `is_verified`, `monthly_reach`

### 12. ProductRecommendation (`product_recommendation`)
Columns: `agro_dealer_id` FK, `crop_name`, `product_name`, `product_type` (Enum: fertilizer/pesticide/herbicide/seed/equipment), `description`, `price_ksh`, `available`

### 13. NGOProfile (`ngo_profile`)
Columns: `user_id` FK, `organization_name`, `organization_type` (Enum: 6 types), `focus_counties` (ARRAY), `focus_crops` (ARRAY), `total_beneficiaries_target`, `is_verified`, `contract_start/end`

### 14. BulkFarmerRegistration (`bulk_farmer_registration`)
Columns: `ngo_id` FK, `batch_name`, `total_farmers`, `successful/failed_registrations`, `county`, `status` (Enum), `completed_at`

### 15. AIConversation (`ai_conversations`) + AIMessage (`ai_messages`) + AIChat (`ai_chats` legacy)
- **AIConversation**: `user_id` FK→users, `title`, timestamps. Relationship: `messages`
- **AIMessage**: `conversation_id` FK, `role` (user/assistant), `content`
- **AIChat**: Legacy single-exchange model: `user_id`, `message`, `response`

### 16. Greenhouse (`greenhouses`) + GreenhouseReading (`greenhouse_readings`)
- **Greenhouse**: `farmer_id` FK, `name`, `greenhouse_type`, dimensions, `covering_material`, `irrigation_system`, `current_crop`, `planting_date`
- **GreenhouseReading**: `greenhouse_id` FK, `temperature_celsius`, `humidity_percent`, `ph_level`, `ec_level`, `soil_moisture_percent`. `to_dict()` auto-generates alerts for out-of-range values.

### 17. YieldRecord (`yield_records`)
Columns: `farmer_id` FK, `crop_name`, `variety`, `season`, `area_planted_acres`, `quantity_harvested_kg`, `quantity_sold_kg`, `price_per_kg`, `total_revenue_ksh`, cost columns (seed/fertilizer/pesticide/labor), `harvest_date`, `planting_date`, `challenges_faced`, `ai_summary`
**Computed in to_dict()**: `net_profit_ksh`, `roi_percent`, `yield_per_acre`

### 18. CommunityPost + CommunityComment + CommunityLike
- **Post**: `user_id` FK, `title`, `content`, `category`, `crop_tags` (ARRAY). Rels: `comments`, `likes`
- **Comment**: `post_id` FK, `user_id` FK, `content`, `parent_id` (self-referential for nested replies)
- **Like**: `post_id` FK, `user_id` FK

### 19. FarmOperation + InventoryItem + Batch + ComplianceRecord
- **FarmOperation** (`farm_operations`): `farmer_id`, `operation_type`, `operation_date`, `crop_name`, `cost_ksh`, `labor_count`, `duration_hours`
- **InventoryItem** (`inventory_items`): `farmer_id`, `item_name`, `category`, `quantity`, `unit`, `minimum_stock`, `unit_cost_ksh`. Computed: `total_value_ksh`, `is_low_stock`
- **Batch** (`batches`): `farmer_id`, `crop_name`, `variety`, `quantity_kg`, `quality_grade`, `batch_number` (auto-generated), `status`, `sale_price_per_kg`
- **ComplianceRecord** (`compliance_records`): `farmer_id`, `compliance_type`, `certificate_number`, `issuing_body`, `expiry_date`, `status`. Computed: `is_expiring_soon`

### 20. Farm Intelligence (PlantingCalendarEntry, SoilHealthRecord, IrrigationSchedule, PestDiseaseEntry)
- **PlantingCalendarEntry** (`planting_calendar`): `farmer_id`, `crop_name`, `planned_planting_date`, `actual_planting_date`, `status` (Enum: 6 values), `area_acres`, `color`, `reminder_days_before`. Computed: `days_to_plant`
- **SoilHealthRecord** (`soil_health_record`): `farmer_id`, `ph_level`, `nitrogen/phosphorus/potassium_ppm`, `organic_matter_percent`, `soil_texture` (Enum), `water_retention` (Enum), `ai_recommendations`. Property: `ph_status` (acidic/optimal/alkaline)
- **IrrigationSchedule** (`irrigation_schedule`): `farmer_id`, `crop_name`, `irrigation_type` (Enum: 6 types), `water_source` (Enum: 6 types), `scheduled_date`, `duration_minutes`, `water_amount_litres`, `status` (Enum: 4 types), `cost_ksh`
- **PestDiseaseEntry** (`pest_disease_library`): `name`, `local_name`, `scientific_name`, `type` (Enum: pest/disease/weed/deficiency), `affected_crops` (ARRAY), `severity` (Enum), organic/chemical control, `kenya_products` (ARRAY)

### 21. Financial (FinancialTransaction, LoanRecord, InsurancePolicy, SeasonBudget)
- **FinancialTransaction** (`financial_transaction`): `farmer_id`, `transaction_type` (income/expense), `category` (Enum: 16 categories), `amount_ksh`, `transaction_date`, `crop_name`, `payment_method` (Enum)
- **LoanRecord** (`loan_record`): `farmer_id`, `lender_name`, `lender_type` (Enum: 8), `principal_ksh`, `interest_rate_percent`, `due_date`, `amount_repaid_ksh`, `status` (Enum: 4). Properties: `outstanding_ksh`, `repayment_percent`, `is_overdue`
- **InsurancePolicy** (`insurance_policy`): `farmer_id`, `provider_name`, `insurance_type` (Enum: 6), `coverage_amount_ksh`, `premium_ksh`, `end_date`, `status` (Enum: 4). Property: `days_to_expiry`
- **SeasonBudget** (`season_budget`): `farmer_id`, `season_name`, `crop_name`, planned costs (7 categories), `expected_yield_kg`, `expected_price_per_kg`. Properties: `planned_total_cost`, `planned_profit`

### 22. Market Pro (PriceAlert, BuyerDirectory)
- **PriceAlert** (`price_alert`): `farmer_id`, `crop_name`, `target_price_ksh`, `condition` (Enum: above/below/equals), `notify_via` (ARRAY), `is_active`, `triggered_count`
- **BuyerDirectory** (`buyer_directory`): `business_name`, `buyer_type` (Enum: 8 types), `crops_wanted` (ARRAY), `counties_served` (ARRAY), `minimum_quantity_kg`, `is_verified`

---

## Services Summary

### 1. AIService (`app/services/ai_service.py`)
| Method | Parameters | Returns |
|--------|------------|---------|
| `generate_chat_response(message)` | str | str (simulated response) |
| `generate_yield_summary(crop_name, area, quantity)` | str, float, float | str |

### 2. MpesaService (`app/services/mpesa_service.py`)
| Method | Parameters | Returns |
|--------|------------|---------|
| `get_base_url()` | — | str (sandbox/prod URL) |
| `normalize_phone(phone)` | str | str (`2547XXXXXXXX`) |
| `get_access_token()` | — | str (cached in Redis 55min) |
| `generate_password()` | — | (password, timestamp) |
| `stk_push(phone, amount, account_ref, description, farmer_id, plan)` | ... | dict with checkout_request_id |
| `handle_callback(callback_data)` | dict | bool |
| `check_subscription_status(farmer_id)` | UUID | dict {is_active, plan, expires_on, days_remaining} |

### 3. SMSService (`app/services/sms_service.py`)
Uses Africa's Talking API. Methods: `send_otp()`, `send_sms()`, `send_subscription_confirmation()`

### 4. WeatherService (`app/services/weather_service.py`)
Uses Open-Meteo API. Fetches 7-day forecasts, caches in `weather_cache` table.

### 5. AdvisoryService (`app/services/advisory_service.py`)
Generates crop advisories, disease alerts.

### 6. MarketService (`app/services/market_service.py`)
Fetches and manages market price data.

### 7. USSDService (`app/services/ussd_service.py`)
Multi-level USSD menu system for feature-phone farmers.

### 8. ExternalDataService (`app/services/external_data_service.py`)
NASA POWER + Open-Meteo data aggregation.

### 9. GeocodingService (`app/services/geocoding_service.py`)
Geocoding and reverse geocoding for farm locations.

---

## Routes Summary

### Auth (`/api/auth`)
| Method | Path | Auth | Rate Limit | Purpose |
|--------|------|------|------------|---------|
| POST | `/register` | No | 5/min | Register new user |
| POST | `/verify-otp` | No | 5/min | Verify phone OTP |
| POST | `/login` | No | 5/min | Login → JWT tokens |
| POST | `/refresh` | JWT (refresh) | 1000/hr | Refresh access token |
| POST | `/resend-otp` | No | 5/min | Resend OTP |
| POST | `/forgot-password` | No | 5/min | Request password reset OTP |
| POST | `/verify-reset-otp` | No | 5/min | Verify reset OTP → reset_token |
| POST | `/reset-password` | No | 5/min | Set new password with reset_token |
| POST | `/reset-password-otp` | No | 5/min | Direct OTP-based password reset |
| POST | `/logout` | JWT | — | Logout |

### Farmers (`/api/farmers`) — JWT required
- `GET /profile`, `PUT /profile`, `POST /profile`, `GET /dashboard`

### Farms (`/api/farms`) — JWT required
- CRUD operations on farms and crops. PostGIS location handling.

### Weather (`/api/weather`)
- `GET /forecast` — public, requires `lat` + `lon` params

### Advisory (`/api/advisory`)
- `GET /crop/<crop_name>` — public

### Market (`/api/market`)
- `GET /prices` — public, optional `crop` filter

### Payments (`/api/payments`) — JWT required
- `POST /subscribe`, `POST /callback`, `GET /status`, `GET /history`

### SMS (`/api/sms`) — admin only
### USSD (`/api/ussd`) — callback endpoint for USSD gateway
### Admin (`/api/admin`) — admin role required
### Agro Dealer (`/api/agro-dealer`) — agro_dealer role
### NGO (`/api/ngo`) — ngo_partner role
### AI Chat (`/api/ai`) — JWT required
### Community (`/api/community`) — mixed (public reads, JWT writes)
### Greenhouse (`/api/greenhouse`) — JWT required
### Yields (`/api/yields`) — JWT required
### Farm Ops (`/api/farm-ops`, `/api/inventory`, `/api/batches`, `/api/compliance`) — JWT required
### Farm Intelligence (`/api/farm-intelligence`) — JWT required
### Financial (`/api/financial`) — JWT required
### Market Pro (`/api/market-pro`) — JWT required
### WhatsApp (`/api/whatsapp`) — webhook placeholder

---

## Authentication & Authorization

1. **Registration**: Phone + password → `set_password()` (Werkzeug hash) → generate 6-digit OTP → send via SMS
2. **OTP Verification**: Validates code + expiry → issues JWT access + refresh tokens
3. **Login**: Phone + password → `check_password()` → issues JWT tokens (access: 12h, refresh: 30d)
4. **JWT Claims**: `identity` = user UUID, `additional_claims` = `{"role": user.role}`
5. **Role Check**: `role_required(*roles)` decorator verifies JWT then checks `user.role in roles`
6. **Subscription Check**: `subscription_required(plan_level)` checks active payment records
7. **Password Reset**: Forgot → OTP → verify → Redis token (10min TTL) → set new password

---

## Error Handling

All responses use standard envelope:
```json
{
  "success": true/false,
  "data": {...},
  "message": "...",
  "error": "ERROR_CODE"    // only on failure
}
```

HTTP codes used: 200, 201, 400, 401, 402 (subscription), 403, 404, 409, 500

---

## Database & PostGIS

- **PostgreSQL** with **PostGIS** extension for geospatial data
- **GeoAlchemy2** `Geometry("POINT", srid=4326)` for farm locations
- **UUID primary keys** on all tables (PostgreSQL UUID type)
- **ARRAY columns** for multi-value fields (products, counties, crops)
- **Enum columns** for constrained value sets (PostgreSQL native enums)
- **Flask-Migrate** (Alembic) for schema migrations
- **Cascading deletes** on most FK relationships

---

## External Integrations

| Service | Provider | Used For |
|---------|----------|----------|
| M-Pesa STK Push | Safaricom Daraja API | Subscription payments |
| SMS | Africa's Talking | OTP, advisories, alerts |
| Weather | Open-Meteo | 7-day forecasts |
| Climate Data | NASA POWER | Historical climate data |
| AI | (Simulated) | Chat responses, yield summaries |

---

## Key Patterns

1. **App Factory**: `create_app(config_name)` — enables testing config
2. **Blueprint registration**: 22 blueprints, all prefixed `/api/...`
3. **Service layer**: Static methods on service classes, no instances
4. **Decorator-based auth**: `@jwt_required()` + `@role_required()` + `@subscription_required()`
5. **Rate limiting**: Per-endpoint via `@limiter.limit()`
6. **Transaction safety**: `try/except IntegrityError` with `db.session.rollback()`
7. **Dev-mode OTP**: Returns OTP in response body when `FLASK_ENV=development`
8. **Marshmallow schemas**: Input validation for auth routes
9. **Redis caching**: M-Pesa tokens, password reset tokens
10. **Celery tasks**: Background processing (async)
