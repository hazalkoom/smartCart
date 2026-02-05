# Testing

SmartCart uses a layered testing strategy to keep feedback fast while still validating production-like behavior.

For setup prerequisites, see [`docs/setup.md`](setup.md).

## 1) Testing strategy (testing pyramid)

- **Unit tests (fast, isolated)**
  - Validate service logic and model behavior without requiring a running HTTP server.
- **System tests (end-to-end over HTTP)**
  - Treat the backend as a black-box API and validate real workflows.
- **Security tests (end-to-end over HTTP)**
  - Validate hardening and common attack classes (auth bypass, injection patterns, webhook integrity, etc.).
- **Performance tests (scenario-based load)**
  - Locust scripts exist for load simulations; they are not part of the default CI execution path in this repo.

This structure is intentional:
- unit tests catch regressions quickly
- system tests protect API contracts and business workflows
- security tests prevent accidental regression in critical controls

## 2) What’s covered

### Backend unit tests (Jest)
- Location: `backend/tests/unit/`
- Command: run from `backend/`
  - `npm test`
- Config: `backend/jest.config.js`

Coverage focus:
- services (auth/cart/order/payments/reviews/users/products/categories)
- model behavior (e.g., password hashing)

### System + security tests (Pytest)
- Location:
  - `tests/functional/`
  - `tests/security/`
- These tests run against a **live backend** and validate:
  - customer workflows: register/login, catalog, cart, checkout, orders, reviews
  - admin/owner workflows: catalog management, order status changes, user management
  - security properties: RBAC enforcement, injection defenses, webhook HMAC validation, hardening headers

### Performance tests (Locust)
- Location: `tests/performance/`
- Intended for load and scenario tests (e.g., checkout flows).

## 3) What’s not covered (explicit)
- **Frontend end-to-end UI tests** are not present.
- **Production deployment validation** (infra manifests, runtime SLO enforcement) is not present.
- Performance scripts exist but are not automatically executed as part of the standard test run.

## 4) How to run tests (verified)

### 4.1 Start the backend
From `backend/`:

```powershell
npm run dev
```

Confirm the backend is up:

```text
GET http://localhost:5000/api/v1/health
```

### 4.2 Run system + security tests
From repo root:

```powershell
.\env\Scripts\Activate.ps1
pytest tests\functional tests\security -v
```

### 4.3 Run backend unit tests
From `backend/`:

```powershell
npm test
```

## 5) Verified results (latest documented run)
- Pytest: **138 passed, 2 skipped**
- Jest: **9** suites passed, **39** tests passed

## 6) Extending tests safely

### Adding a new endpoint
- Add/extend unit tests in `backend/tests/unit/` to cover service-level rules.
- Add/extend system tests in `tests/functional/` to cover the HTTP contract.
- If the endpoint affects authorization, add/extend tests in `tests/security/`.

### Avoiding flaky tests
- Prefer asserting on stable response fields (`success`, `data` shape, `error.code`).
- Avoid relying on ordering unless the API explicitly sorts.
- Keep tests isolated by creating their own users/products where appropriate.

## 7) Environment and dependencies
- Pytest uses a fixed base URL: `http://localhost:5000/api/v1` (see `tests/test_config.py`).
- Order creation uses MongoDB transactions; MongoDB must support transactions for full checkout coverage.
