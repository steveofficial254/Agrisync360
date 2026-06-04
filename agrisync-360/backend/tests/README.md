# AgriSync 360 Backend Tests

This directory contains pytest-based integration tests for the AgriSync 360 backend API.

## Test Files

- **test_backend.py**: Main pytest test file with comprehensive coverage of all backend endpoints
- **conftest.py**: Pytest fixtures for Flask app, database sessions, and authentication headers
- **pytest.ini**: Pytest configuration

## Quick Start

### Run all pytest tests:
```bash
cd /home/stevemburu/Development/Agrisync360/agrisync-360/backend
python -m pytest tests/test_backend.py -v
```

### Run specific test class:
```bash
python -m pytest tests/test_backend.py::TestAuthentication -v
```

### Run specific test:
```bash
python -m pytest tests/test_backend.py::TestAuthentication::test_register_new_farmer -v
```

### Run with coverage report:
```bash
python -m pytest tests/test_backend.py --cov=app --cov-report=html
```

## Test Coverage

The test_backend.py file covers all backend endpoints including:
- ✅ Authentication (register, OTP verification, login, logout, password reset)
- ✅ Role-Based Access Control (farmer, agro_dealer, ngo_partner, admin)
- ✅ Farmer Profiles (create, read, update)
- ✅ Farms & Crops (CRUD operations, GPS coordinates, growth stages)
- ✅ Weather Service (7-day forecast, disease risk, Redis caching)
- ✅ Crop Advisory (maize, beans, planting calendar)
- ✅ Market Intelligence (prices, history, profitability calculator)
- ✅ Payments & Subscriptions (plans, dev bypass, M-Pesa callback)
- ✅ AI Chat (conversational context)
- ✅ Greenhouse & Sensors (readings, alerts)
- ✅ Yield Records (logging, profit calculation)
- ✅ Farm Operations (scheduling, tracking)
- ✅ USSD Integration (menu navigation, 182-char limit)
- ✅ Agro-Dealer Portal (profile, products, broadcasts)
- ✅ NGO Dashboard (profile, bulk registration, broadcasts)
- ✅ Admin Dashboard (stats, users, alerts)
- ✅ SMS & WhatsApp (logs, sending, webhooks)

## Key Features

- **Flask Test Client**: Tests use Flask's built-in test client (no running server required)
- **Transaction Rollback**: Each test uses a transactional database session that rolls back after completion
- **Mock OTP**: Development mode returns OTP in response, avoiding SMS dependency
- **Unique Test Data**: Each test uses UUID-based unique phone numbers to avoid conflicts
- **Role-based Testing**: Comprehensive testing of all 4 user roles
- **Access Control**: Verifies users cannot access endpoints outside their permissions

## Dependencies

All dependencies are already installed via `requirements.txt`:
- Flask==3.0.3
- pytest==8.2.2
- pytest-flask==1.3.0
- Flask-JWT-Extended==4.6.0
- psycopg2-binary==2.9.9
- redis==4.6.0

## Database Configuration

Tests use the development database (`agrisync_db`) with transactional rollback to ensure no dirty data persists. The `db_session` fixture in `conftest.py` handles this automatically.

## Authentication Fixtures

The test suite provides fixtures for all user roles:
- `auth_header`: Farmer authentication header
- `admin_auth_header`: Admin authentication header
- `dealer_auth_header`: Agro-dealer authentication header
- `ngo_auth_header`: NGO partner authentication header

Each fixture creates a unique test user with a verified account and returns a JWT Authorization header.

## Developer Bypass Payment

The test suite includes tests for `/api/payments/activate-dev` endpoint, which allows testing subscription features without external payment gateway dependencies.

## Troubleshooting

### Database connection error:
Ensure PostgreSQL is running and the database exists:
```bash
sudo systemctl status postgresql
psql -U agrisync_user -d agrisync_db
```

### Redis connection error:
Ensure Redis is running:
```bash
sudo systemctl status redis
redis-cli ping
```

### Missing database tables:
Run the table creation script:
```bash
cd /home/stevemburu/Development/Agrisync360/agrisync-360/backend
python create_tables.py
```
