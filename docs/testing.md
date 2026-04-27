# Testing

Testing strategy and commands for SmartCart.

## Test layers

### 1) Backend unit tests (Jest)

Location:

- backend/tests/unit/

Run:

```powershell
cd backend
npm test
```

Optional:

```powershell
npm run test:watch
npm run test:coverage
```

Coverage artifacts (when enabled):

- backend/coverage/lcov-report/index.html

### 2) Frontend checks

Primary reliability gate currently used in CI:

```powershell
cd frontend
npm run build
```

Optional unit test command:

```powershell
npm test
```

### 3) Python API-level tests (functional + security)

Locations:

- tests/functional/
- tests/security/

Run:

```powershell
.\env\Scripts\Activate.ps1
pytest tests\functional tests\security -q
```

Useful variants:

```powershell
pytest tests\functional tests\security -vv -ra --maxfail=1
pytest tests\functional tests\security --durations=20
```

## Backend autostart behavior for pytest

The Python harness includes backend autostart by default.

- Default local behavior: PYTEST_AUTOSTART_BACKEND=1
- CI behavior: PYTEST_AUTOSTART_BACKEND=0 (backend started explicitly in workflow)

When autostart is disabled, start backend manually before running pytest.

## Current verified results

Latest verified snapshot:

- Backend Jest: 17 suites, 99 tests passing.
- Frontend build: passing.
- Python functional + security: 156 tests passing.

## CI testing pipeline

Workflow:

- .github/workflows/ci.yml

Job sequence:

1. unit-tests (backend Jest)
2. frontend-build
3. system-tests (pytest functional + security)

System-tests job specifics:

- Starts Redis service in workflow.
- Boots MongoDB replica set for transaction support.
- Seeds backend database.
- Starts backend server and waits for /api/v1/health.
- Executes pytest suites.

## Debugging failing tests

### Backend unit failures

- Re-run single suite with Jest pattern matching.
- Check Redis/Mongo assumptions in test setup mocks.

### Python suite failures

- Confirm API health endpoint is reachable.
- Verify test environment variables match expected defaults.
- Inspect backend/server.log in CI failure output.

### Payment/webhook tests

- Validate HMAC secret and payload shape assumptions.
- Verify idempotency behavior when replaying webhook calls.

## Recommended test cadence

- Before pushing feature work:
  - backend npm test
  - frontend npm run build
- Before merging critical backend changes:
  - pytest functional + security suites
- Weekly:
  - review flaky test trends and slowest test durations
