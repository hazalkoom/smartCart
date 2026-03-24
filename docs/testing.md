# Testing

SmartCart uses separate test layers for backend logic, API-level behavior, and load scenarios.

## Test layers

- Jest backend unit tests under backend/tests/unit/
- Pytest functional tests under tests/functional/
- Pytest security tests under tests/security/
- Locust performance scripts under tests/performance/

## Verified during this documentation refresh

### Backend unit tests

Command run:

```powershell
cd backend
npm test
```

Observed result:

- 15 suites passed
- 87 tests passed

### Frontend build verification

Command run:

```powershell
cd frontend
npm run build
```

Observed result:

- production build completed successfully
- warnings were emitted for bundle and stylesheet budgets
- CommonJS optimization warnings were emitted for socket-related dependencies

## Not re-run during this refresh

- tests/functional
- tests/security
- tests/performance

## How to run the main suites

### Backend unit tests

From backend/:

```powershell
npm test
```

### Backend coverage

From backend/:

```powershell
npm run test:coverage
```

### Functional and security suites

From repository root with the backend running:

```powershell
.\env\Scripts\Activate.ps1
pytest tests\functional tests\security -v
```

### Performance scripts

From repository root with the Python environment active:

```powershell
locust -f tests/performance/locustfile.py
```

## Coverage focus by layer

### Jest

Covers:

- auth service
- cart controller
- cart service
- cart worker
- category service
- order controller
- order service
- paymob service
- product service
- queue setup and Redis client infra behavior
- review service
- user service
- webhook controller
- user model behavior

### Pytest

Covers:

- customer account and storefront flows
- admin and owner workflows
- payment and webhook behavior
- security regressions such as RBAC enforcement and hardening checks

## Current testing gaps

- no frontend E2E browser tests are present
- Python suites were not re-executed during this documentation refresh
- performance scripts exist but are not part of the default verification loop
