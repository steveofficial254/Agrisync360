# AgriSync 360

[![CI/CD Pipeline](https://github.com/Steveofficial254/agrisync-360/actions/workflows/tests.yml/badge.svg)](https://github.com/Steveofficial254/agrisync-360/actions)
[![Code Coverage](https://codecov.io/gh/Steveofficial254/agrisync-360/branch/main/graph/badge.svg)](https://codecov.io/gh/Steveofficial254/agrisync-360)
[![Python 3.10](https://img.shields.io/badge/python-3.10-blue)](https://www.python.org/downloads/)
[![Node 18](https://img.shields.io/badge/node-18-green)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Production-ready agri-tech platform for Kenyan smallholder farmers.

## Stack
- **Backend**: Flask, SQLAlchemy, Celery, Redis, PostgreSQL/PostGIS
- **Frontend**: React, Vite, TailwindCSS, PWA
- **Integrations**: M-Pesa Daraja, Africa's Talking, Open-Meteo, NASA POWER

## Quick Start
1. Copy env: `cp backend/.env.example backend/.env`
2. Start infra: `docker-compose up --build`
3. Backend runs on `http://localhost:5000`
4. Frontend runs on `http://localhost:5173`

## Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Testing

### Backend Tests
```bash
cd backend
pytest tests/test_backend.py -v --cov=app
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Docker

### Build Images
```bash
docker build -t agrisync360-backend ./backend
docker build -t agrisync360-frontend ./frontend
```

### Run with Docker Compose
```bash
docker-compose up --build
```

## CI/CD

This project uses GitHub Actions for CI/CD. See [`.github/README.md`](.github/README.md) for detailed documentation.

### Pre-commit Hooks
```bash
pip install pre-commit
pre-commit install
pre-commit run --all-files
```

## License

MIT
