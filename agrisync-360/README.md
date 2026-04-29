# AgriSync 360

Production-ready agri-tech platform for Kenyan smallholder farmers.

## Stack
- Backend: Flask, SQLAlchemy, Celery, Redis, PostgreSQL/PostGIS
- Frontend: React, Vite, TailwindCSS, PWA
- Integrations: M-Pesa Daraja, Africa's Talking, Open-Meteo, NASA POWER

## Quick Start
1. Copy env: `cp backend/.env.example backend/.env`
2. Start infra: `docker-compose up --build`
3. Backend runs on `http://localhost:5000`
4. Frontend runs on `http://localhost:5173`
