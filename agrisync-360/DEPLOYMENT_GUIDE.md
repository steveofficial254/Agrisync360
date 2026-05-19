# AgriSync 360 - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- Git

### Step 1: Setup Docker
```bash
# Make setup script executable
chmod +x setup_docker.sh

# Run Docker setup
./setup_docker.sh

# Or install manually:
sudo apt update
sudo apt install docker.io docker-compose
sudo usermod -aG docker $USER
```

### Step 2: Build Frontend
```bash
cd frontend

# Make build script executable
chmod +x build_frontend.sh

# Run frontend build
./build_frontend.sh
```

### Step 3: Start Backend Services
```bash
cd ..

# Start all services
docker-compose up -d postgres redis backend celery_worker celery_beat flower

# Check status
docker-compose ps
```

### Step 4: Start Frontend Development Server
```bash
cd frontend

# Start development server
npm run dev

# Or serve production build
npx serve dist
```

## 📋 Detailed Setup

### Backend Services
```bash
# Start only database services
docker-compose up -d postgres redis

# Start backend with databases
docker-compose up -d postgres redis backend

# Start all services (including Celery)
docker-compose up -d postgres redis backend celery_worker celery_beat flower
```

### Frontend Development
```bash
# Install dependencies
npm install

# Run verification scripts
node build_verification.js
node api_verification.js
node component_verification.js
node final_verification.js

# Build for production
npm run build

# Start development server
npm run dev

# Preview production build
npm run preview
```

## 🔧 Troubleshooting

### Build Issues

#### Tailwind CSS Errors
```
Cannot apply unknown utility class `focus:ring-primary-500`
```
**Solution**: The Tailwind CSS config has been fixed. Remove any @apply directives from CSS files.

#### Docker Compose Not Found
```
Command 'docker-compose' not found
```
**Solution**: Run the Docker setup script:
```bash
./setup_docker.sh
```

#### Port Conflicts
If ports are already in use:
```bash
# Check what's using the ports
sudo netstat -tulpn | grep :5432  # PostgreSQL
sudo netstat -tulpn | grep :6379  # Redis
sudo netstat -tulpn | grep :5000  # Backend
sudo netstat -tulpn | grep :5173  # Frontend

# Kill processes if needed
sudo kill -9 <PID>
```

### API Issues

#### Backend Not Responding
```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend

# Check database connection
docker-compose exec backend python -c "from app import db; print('DB OK')"
```

#### Database Issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres redis
# Wait 30 seconds for databases to start
docker-compose up -d backend
```

### Frontend Issues

#### Build Fails
```bash
# Clear cache
rm -rf node_modules package-lock.json dist
npm install

# Check specific errors
npm run build --verbose
```

#### Development Server Issues
```bash
# Clear Vite cache
npx vite --force

# Check port availability
lsof -i :5173
```

## 🌐 Production Deployment

### Environment Variables
Create `.env` file:
```env
# Backend
FLASK_ENV=production
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://agrisync_user:agrisync_pass@localhost:5432/agrisync_db
REDIS_URL=redis://localhost:6379/0

# Frontend
VITE_API_URL=http://localhost:5000/api
VITE_ENV=production
```

### Production Build
```bash
# Build frontend
cd frontend
npm run build

# The build will be in dist/ folder
# Serve with nginx or any web server
```

### Docker Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Monitoring

### Health Checks
```bash
# Backend health
curl http://localhost:5000/api/health

# Frontend health
curl http://localhost:5173

# Database health
docker-compose exec postgres pg_isready -U agrisync_user -d agrisync_db

# Redis health
docker-compose exec redis redis-cli ping
```

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

## 🔒 Security

### Production Security Checklist
- [ ] Change default passwords
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS in production
- [ ] Set up proper CORS policies
- [ ] Configure firewall rules
- [ ] Enable database backups
- [ ] Set up monitoring and alerting

### SSL Certificates
```bash
# Generate SSL certificate for production
sudo certbot --nginx -d yourdomain.com
```

## 📱 Testing

### Automated Tests
```bash
# Run all verification scripts
cd frontend
node final_verification.js

# Test API endpoints
curl -X GET http://localhost:5000/api/farmers
curl -X POST http://localhost:5000/api/auth/login
```

### Manual Testing Checklist
- [ ] User registration flow
- [ ] Login functionality
- [ ] Dashboard loads correctly
- [ ] Weather data displays
- [ ] Market prices update
- [ ] SMS alerts work
- [ ] Mobile responsive design
- [ ] USSD integration

## 🚀 Deployment Commands

### Quick Deploy
```bash
# Complete deployment
git pull origin main
cd frontend && ./build_frontend.sh
cd .. && docker-compose down
docker-compose up -d
```

### Update Only Frontend
```bash
cd frontend
git pull origin main
./build_frontend.sh
# Restart frontend service
```

### Update Only Backend
```bash
git pull origin main
docker-compose restart backend celery_worker celery_beat
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the logs: `docker-compose logs`
3. Run verification scripts
4. Check environment variables
5. Verify all services are running: `docker-compose ps`

## 🎯 Success Criteria

Deployment is successful when:
- ✅ All Docker services are running
- ✅ Frontend builds without errors
- ✅ Backend API responds correctly
- ✅ Database connections work
- ✅ Users can register and login
- ✅ Dashboard loads with real data
- ✅ Mobile responsive design works
- ✅ SMS alerts function properly
