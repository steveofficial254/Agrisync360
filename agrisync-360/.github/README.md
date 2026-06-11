# AgriSync 360 CI/CD Pipeline

This document describes the GitHub Actions CI/CD pipeline for AgriSync 360.

## Overview

The CI/CD pipeline consists of two main workflows:

1. **CI Pipeline** (`.github/workflows/tests.yml`) - Runs on every push and pull request to `main` and `develop` branches
2. **Deployment Pipeline** (`.github/workflows/deploy.yml`) - Runs on push to `main` branch

## CI Pipeline Jobs

### 1. Backend Tests (`backend-tests`)
- **Runs on**: Ubuntu Latest
- **Services**: PostgreSQL 15, Redis 7
- **Steps**:
  - Checkout code
  - Set up Python 3.10
  - Install Python dependencies
  - Wait for PostgreSQL to be ready
  - Run database migrations
  - Run pytest with coverage
  - Upload coverage to Codecov
  - Upload test results and coverage reports
  - Fail if coverage is below 70%

### 2. Backend Linting (`backend-lint`)
- **Runs on**: Ubuntu Latest
- **Steps**:
  - Checkout code
  - Set up Python 3.10
  - Install dependencies and linting tools
  - Run flake8 linter
  - Check code format with black
  - Check import order with isort
  - Run pylint

### 3. Frontend Tests (`frontend-tests`)
- **Runs on**: Ubuntu Latest
- **Steps**:
  - Checkout code
  - Set up Node.js 18
  - Install dependencies (including Vitest and testing libraries)
  - Run frontend tests with coverage
  - Build frontend
  - Upload build artifact

### 4. Frontend Linting (`frontend-lint`)
- **Runs on**: Ubuntu Latest
- **Steps**:
  - Checkout code
  - Set up Node.js 18
  - Install dependencies
  - Run ESLint

### 5. Security Checks (`security`)
- **Runs on**: Ubuntu Latest
- **Steps**:
  - Checkout code
  - Run Trivy vulnerability scanner
  - Upload results to GitHub Security tab
  - Check Python dependencies with safety

### 6. Docker Build (`docker-build`)
- **Runs on**: Ubuntu Latest
- **Dependencies**: backend-tests, frontend-tests
- **Steps**:
  - Checkout code
  - Set up Docker Buildx
  - Build Docker image for backend
  - Build Docker image for frontend

### 7. Dependency Check (`dependency-check`)
- **Runs on**: Ubuntu Latest
- **Steps**:
  - Checkout code
  - Check for outdated Python dependencies with pip-audit
  - Check for outdated Node dependencies with npm outdated

### 8. Status Check (`status-check`)
- **Runs on**: Ubuntu Latest
- **Dependencies**: All previous jobs
- **Runs**: Always (even if previous jobs fail)
- **Steps**:
  - Check overall status of critical jobs
  - Send Slack notification on success
  - Send Slack notification on failure

## Deployment Pipeline

### Deploy Job (`deploy`)
- **Runs on**: Ubuntu Latest
- **Triggers**: Push to `main` branch (excluding docs and README changes)
- **Steps**:
  - Checkout code
  - Set up Docker Buildx
  - Log in to GitHub Container Registry
  - Build and push backend image
  - Build and push frontend image
  - Trigger deployment to DigitalOcean App Platform
  - Send deployment notification to Slack

## Required Secrets

Configure the following secrets in your GitHub repository settings:

### For CI Pipeline:
- `SLACK_WEBHOOK_URL` - Slack webhook URL for notifications (optional)

### For Deployment Pipeline:
- `DIGITALOCEAN_TOKEN` - DigitalOcean API token
- `DIGITALOCEAN_APP_ID` - DigitalOcean App Platform application ID
- `SLACK_WEBHOOK_URL` - Slack webhook URL for notifications (optional)

## Environment Variables

The following environment variables are configured in the CI pipeline:

```yaml
PYTHON_VERSION: '3.10'
NODE_VERSION: '18'
POSTGRES_DB: agrisync_test_db
POSTGRES_USER: agrisync_user
POSTGRES_PASSWORD: agrisync_pass
POSTGRES_HOST: localhost
POSTGRES_PORT: 5432
```

## Test Coverage

- **Backend**: Minimum 70% coverage required
- **Frontend**: All tests must pass

## Docker Images

Images are built and tagged as:
- Backend: `ghcr.io/<repo>/backend:latest` and `ghcr.io/<repo>/backend:<sha>`
- Frontend: `ghcr.io/<repo>/frontend:latest` and `ghcr.io/<repo>/frontend:<sha>`

## Notifications

Slack notifications are sent for:
- CI pipeline success/failure
- Deployment success/failure

Notifications include:
- Branch name
- Commit SHA
- Author
- Link to workflow run (for failures)
- Deployment URL (for successful deployments)

## Local Testing

To test the CI pipeline locally:

### Backend:
```bash
cd backend
python -m pytest tests/test_backend.py -v --cov=app
```

### Frontend:
```bash
cd frontend
npm test
```

### Docker Build:
```bash
docker build -t agrisync360:latest ./backend
docker build -t agrisync360-web:latest ./frontend
```

## Troubleshooting

### Backend Tests Fail
- Check PostgreSQL connection
- Verify database migrations ran successfully
- Review test logs in GitHub Actions

### Frontend Tests Fail
- Ensure all dependencies are installed
- Check Vitest configuration
- Review test logs in GitHub Actions

### Docker Build Fails
- Verify Dockerfile syntax
- Check for missing dependencies
- Review build logs in GitHub Actions

### Deployment Fails
- Verify DigitalOcean credentials
- Check App Platform application status
- Review deployment logs in DigitalOcean dashboard

## Contributing

When contributing to AgriSync 360:

1. Create a feature branch from `develop`
2. Make your changes
3. Ensure all tests pass locally
4. Push to your fork and create a pull request
5. The CI pipeline will run automatically
6. Address any failing tests or linting issues
7. Once approved, merge to `develop`
8. Deployments to production happen from `main`

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vitest Documentation](https://vitest.dev/)
- [Pytest Documentation](https://docs.pytest.org/)
- [DigitalOcean App Platform](https://docs.digitalocean.com/products/app-platform/)
