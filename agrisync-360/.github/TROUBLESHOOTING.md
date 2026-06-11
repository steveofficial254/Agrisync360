# CI/CD Troubleshooting Guide

This guide covers common issues and their solutions for the AgriSync 360 CI/CD pipeline.

## PostgreSQL Connection Timeout

### Problem
Tests fail with PostgreSQL connection timeout errors.

### Solution
The workflow now includes a robust PostgreSQL wait step. If you still encounter issues:

```yaml
- name: ⏳ Wait for PostgreSQL
  run: |
    until PGPASSWORD=${{ env.POSTGRES_PASSWORD }} \
      psql -h localhost -U ${{ env.POSTGRES_USER }} -d ${{ env.POSTGRES_DB }} -c "SELECT 1" > /dev/null 2>&1; do
      echo "Waiting for PostgreSQL..."
      sleep 2
    done
  timeout-minutes: 3
```

### Additional Checks
- Verify PostgreSQL service is healthy in the workflow logs
- Check that database credentials are correct
- Ensure the database is not locked by another process

## Tests Timeout

### Problem
Backend tests timeout after the default 10-minute limit.

### Solution
The backend-tests job now has a 30-minute timeout:

```yaml
backend-tests:
  name: 🐍 Backend Tests
  runs-on: ubuntu-latest
  timeout-minutes: 30
```

### For Individual Tests
Increase the pytest timeout in the test command:

```bash
pytest tests/test_backend.py --timeout=60
```

## Coverage Report Fails to Generate

### Problem
Coverage report is not generated or uploaded to Codecov.

### Solution
Ensure coverage is generated in XML format:

```bash
pytest --cov=app --cov-report=xml --cov-report=term-missing
```

### Check Coverage Configuration
Verify `.coveragerc` exists in the backend directory:

```ini
[run]
source = app
omit =
    */tests/*
    */venv/*
    */__pycache__/*
```

## Docker Build Fails

### Problem
Docker build fails with "context not found" or "file not found" errors.

### Solution
Ensure the Dockerfile path is correct:

```yaml
- name: 🐳 Build image
  uses: docker/build-push-action@v4
  with:
    context: ./backend          # ← Correct path
    file: ./backend/Dockerfile  # ← Full path required
```

### Common Issues
- Check that Dockerfile exists in the specified directory
- Verify .dockerignore is not excluding required files
- Ensure all COPY commands in Dockerfile use correct paths

## Slack Notification Not Sent

### Problem
Slack notifications are not being sent on CI/CD events.

### Solution
Test the webhook URL manually:

```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"test"}' \
  YOUR_WEBHOOK_URL
```

### Checklist
- Verify `SLACK_WEBHOOK_URL` secret is set in GitHub
- Check the webhook URL is valid and not expired
- Ensure the Slack channel allows incoming webhooks
- Check workflow logs for Slack API errors

## Pre-commit Hooks Fail

### Problem
Pre-commit hooks fail locally, preventing commits.

### Solution
Run hooks manually to see detailed errors:

```bash
pre-commit run --all-files --verbose
```

### Common Issues
- **Black formatting**: Run `black .` to auto-format
- **isort**: Run `isort .` to fix imports
- **flake8**: Fix linting errors manually
- **Large files**: Remove or .gitignore large files
- **Private keys**: Ensure no private keys are committed

## Frontend Tests Fail

### Problem
Frontend tests fail with module not found or JSX parsing errors.

### Solution
Ensure Vitest is configured correctly:

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js']
  }
})
```

### Check Dependencies
Verify all testing dependencies are installed:

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
```

## Security Scan Failures

### Problem
Trivy or Safety scans find vulnerabilities.

### Solution
- Review the vulnerability report
- Update affected packages to latest secure versions
- If vulnerability is in a transitive dependency, consider updating the parent package
- For false positives, document the reason in a security advisory

## Deployment Fails

### Problem
Deployment to DigitalOcean fails.

### Solution
Check the following:
- DigitalOcean token is valid and has proper permissions
- App ID is correct
- Container registry images are built and pushed
- App Platform app is in a healthy state

### Manual Deployment Trigger
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DIGITALOCEAN_TOKEN" \
  https://api.digitalocean.com/v2/apps/$DIGITALOCEAN_APP_ID/deployments \
  -d '{"force_build": true}'
```

## Cache Issues

### Problem
Dependencies are not cached properly, causing slow builds.

### Solution
The workflow uses pip and npm caching. If issues persist:

```yaml
- name: 🐍 Set up Python
  uses: actions/setup-python@v4
  with:
    python-version: ${{ env.PYTHON_VERSION }}
    cache: 'pip'  # ← Ensures pip caching
```

### Clear Cache Manually
Go to GitHub → Actions → Caches → Delete caches

## Rate Limiting

### Problem
API rate limits cause workflow failures.

### Solution
- Use GitHub tokens with appropriate permissions
- Implement exponential backoff in API calls
- Cache API responses when possible
- Consider using GitHub's built-in caching

## Workflow Not Triggering

### Problem
Workflow doesn't trigger on push or PR.

### Solution
Check the workflow trigger configuration:

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

### Verify
- Branch names match the trigger configuration
- Workflow file is in `.github/workflows/`
- YAML syntax is valid (no indentation errors)

## Getting Help

### Check Workflow Logs
1. Go to GitHub → Actions
2. Click on the failed workflow run
3. Click on the failed job
4. Review the logs for error messages

### Monitor CI Locally
```bash
chmod +x .github/scripts/monitor-ci.sh
.github/scripts/monitor-ci.sh main
```

### GitHub Support
- GitHub Actions Documentation: https://docs.github.com/en/actions
- GitHub Community Forum: https://github.community/c/actions-and-workflows

### Project-Specific Help
- Open an issue on GitHub: https://github.com/Steveofficial254/agrisync-360/issues
- Check existing issues for similar problems
- Review the deployment guide: DEPLOYMENT.md
