# Contributing to AgriSync 360

Thank you for your interest in contributing to AgriSync 360! This guide will help you get started.

## Quick Start for Developers

### 1. Clone the Repository

```bash
git clone https://github.com/Steveofficial254/agrisync-360.git
cd agrisync-360
```

### 2. Setup Pre-commit Hooks

```bash
pip install pre-commit
pre-commit install
```

This will automatically:
- Format code with black
- Sort imports with isort
- Run linting with flake8
- Check for large files
- Detect private keys
- Validate JSON/YAML files

### 3. Create a Feature Branch

```bash
git checkout -b feature/my-feature
```

Use descriptive branch names:
- `feature/add-weather-alerts`
- `fix/login-bug`
- `docs/update-readme`
- `refactor-api-endpoints`

### 4. Make Your Changes

#### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
python run.py
```

#### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### 5. Run Tests

#### Backend Tests
```bash
cd backend
pytest tests/test_backend.py -v --cov=app
```

#### Frontend Tests
```bash
cd frontend
npm test
```

### 6. Commit Your Changes

Pre-commit hooks will run automatically:

```bash
git add .
git commit -m "feat: add new feature"
```

If hooks fail, fix the issues and try again:
```bash
# Auto-fix formatting
black .
isort .

# Fix linting errors manually
# Then commit again
git add .
git commit -m "feat: add new feature"
```

### 7. Push to GitHub

```bash
git push origin feature/my-feature
```

### 8. Create a Pull Request

1. Go to GitHub and create a pull request
2. Fill in the PR template
3. Link related issues
4. Request review from maintainers

### 9. CI/CD Pipeline

GitHub Actions will automatically:
- ✅ Run all tests
- ✅ Check code quality (flake8, pylint, black, isort)
- ✅ Run security scans (Trivy, Safety)
- ✅ Build Docker images
- ✅ Check dependencies for vulnerabilities
- ✅ Upload coverage to Codecov
- ✅ Send Slack notifications

### 10. Merge Process

Once approved and tests pass:
1. Merge to `develop` → all tests must pass
2. Then to `main` → deployment triggered

## Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples
```
feat(auth): add OTP verification
fix(weather): handle API timeout errors
docs(readme): update installation instructions
test(backend): add user registration tests
```

## Code Style

### Python
- Follow PEP 8
- Use black for formatting
- Use isort for import sorting
- Maximum line length: 100 characters

### JavaScript/React
- Follow ESLint rules
- Use Prettier for formatting
- Use functional components with hooks
- Follow React best practices

## Testing

### Backend
- Write tests for all new features
- Aim for >70% code coverage
- Use pytest fixtures for setup
- Mock external dependencies

### Frontend
- Write tests for components
- Test user interactions
- Mock API calls
- Test error handling

## Documentation

- Update README.md for user-facing changes
- Update inline code comments for complex logic
- Add docstrings to Python functions
- Document API endpoints in code

## Code Review Guidelines

### For Reviewers
- Check for code quality and style
- Verify tests are adequate
- Ensure documentation is updated
- Check for security issues
- Verify the change solves the intended problem

### For Authors
- Respond to review comments promptly
- Make requested changes
- Explain your reasoning if you disagree
- Keep PRs focused and small

## Reporting Issues

When reporting bugs:
1. Use the issue template
2. Provide steps to reproduce
3. Include error messages
4. Specify your environment (OS, Python/Node version)
5. Add screenshots if applicable

## Feature Requests

When requesting features:
1. Describe the use case
2. Explain why it's needed
3. Suggest a possible implementation
4. Consider if it fits the project scope

## Getting Help

- Check the [Troubleshooting Guide](.github/TROUBLESHOOTING.md)
- Read the [Deployment Guide](DEPLOYMENT.md)
- Check existing issues and discussions
- Ask questions in GitHub Discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to AgriSync 360! 🌾
