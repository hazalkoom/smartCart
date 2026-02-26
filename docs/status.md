# Status

This document is the **single source of truth** for what is implemented in this repository.

It distinguishes:

- **Finished vs partially implemented vs not implemented**
- **Verified vs unverified** (based on executed tests and runtime checks)

## 1) Verification levels

- **Verified**
  - Backed by passing automated tests and/or a runtime health check performed during this documentation pass.
- **Unverified**
  - Code exists, but it was not validated end-to-end (e.g., frontend UI flows).

## 2) Backend API (Node.js/Express)

### Finished (verified)

- **Authentication & accounts**
  - Register/login/me
  - Forgot/reset password flows
  - Update user details
- **RBAC + JWT authorization**
  - Roles: `customer`, `admin`, `owner`
- **Catalog**
  - Categories CRUD (admin/owner)
  - Products CRUD (admin/owner)
  - Product soft delete (owner-only)
- **Cart**
  - Add/update/remove/clear
  - Stock validation + price locking + subtotal recalculation
- **Orders**
  - Transactional checkout from cart
  - Admin/owner order listing and status updates
  - Strict status flow + cancellation restocking
- **Reviews**
  - Create/update/delete
  - One review per user/product
  - Aggregated rating and review count updates
- **Payments (Paymob)**
  - Payment initiation (card/wallet/Fawry)
  - Webhook HMAC verification
- **API documentation**
  - Swagger UI at `/api-docs`

Evidence:

- Pytest suites passed: `tests/functional`, `tests/security`
- Jest unit suites passed: `backend/tests/unit`
- Backend health check succeeded: `GET /api/v1/health`

### Partially implemented (verified / unverified mix)

- **Email delivery for password reset**
  - Token generation exists.
  - Email sending is not evidenced in this repository (token is returned for testing).

### Not implemented

- **Standalone Python ML microservice**
  - The repo contains Python dependencies and test tooling, but no FastAPI service entrypoint is present.

## 3) Frontend (Angular SSR)

### Verified

- Angular 20 SSR project builds cleanly (`ng build` — 0 errors, 2 pre-existing bundle-budget warnings).
- API base URL is configured to `/api/v1` and local proxy forwards `/api` to `http://localhost:5000`.
- `environment.ts` / `environment.prod.ts` are wired via Angular `fileReplacements`.
- SSR-safe guards (`isPlatformBrowser`) applied to all browser-API-dependent components.
- Route guards (`authGuard`, `adminGuard`, `ownerGuard`) protect restricted routes.
- Error interceptor handles 401/403/5xx with appropriate redirects and dev-only logging.
- All debug `console.log` statements removed; `console.error` gated behind `!environment.production`.

### Not verified

- End-to-end UI workflows (browse → cart → checkout) have not been validated via automated E2E tests.

## 4) Tests and quality

### Verified

- **Pytest**: `138 passed, 2 skipped` (functional + security)
- **Jest**: `10` suites passed, `60` tests passed
- **Angular build**: `ng build` completes with 0 errors

### Available but not executed here

- **Performance tests**: Locust scripts exist under `tests/performance/`.

## 5) Codebase hardening audit

A 42-item hardening audit was completed covering backend security, startup safety, data integrity, frontend lifecycle/SSR, and test quality. See [`docs/changelog.md`](changelog.md) for the full item list and [`docs/security.md`](security.md) for the consolidated security posture.

Highlights:

- HMAC timing-safe comparison for Paymob webhooks
- Environment variable validation on startup with fail-fast
- Graceful shutdown handlers (SIGTERM/SIGINT)
- ReDoS-safe email regex across model + middleware
- Angular SSR `isPlatformBrowser` guards
- Jest coverage grew from 39 → 60 tests (new webhook, cart, product suites)
- Python test isolation via `ensure_test_data()` fixture

## 6) Known constraints and risks

- **Secrets and configuration**
  - `backend/.env` is gitignored; contributors need an out-of-band way to obtain configuration or a non-secret template.
- **MongoDB transactions**
  - Order creation uses MongoDB transactions; MongoDB must support them (usually replica set/cluster).
- **No frontend E2E tests**
  - Cypress/Playwright tests are not present; UI workflows are only manually verified.
