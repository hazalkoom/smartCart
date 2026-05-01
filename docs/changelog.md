# Changelog

All notable documentation-relevant and platform-level changes are recorded here.

## 2026-05-01

### Email verification — full-stack implementation

- Backend: register now generates a 1-hour JWT verification token and queues a verification email via BullMQ/Redis.
- Backend: added `POST /auth/verify-email/:token` (public) and `POST /auth/resend-verification` (protected) endpoints.
- Backend: added `requireEmailVerification` middleware gating profile updates and address management.
- Backend: login and register responses now include `isEmailVerified` flag.
- Frontend: added `isEmailVerified` to User interface.
- Frontend: added `verifyEmail()` and `resendVerification()` methods to AuthService.
- Frontend: created `VerifyEmailComponent` with loading, success, and error states at `/verify-email/:token`.
- Frontend: added email verification warning banner with resend button on Account page.
- Frontend: register now shows a success message about the verification email before redirecting.
- Docs: updated api.md, features.md, changelog.md, frontend README, and backend README.

## 2026-04-18

### Documentation refresh

- Updated all docs pages to match current implementation and verification results.
- Added backend/README.md with backend-specific setup and runtime guidance.
- Replaced frontend boilerplate README with project-specific frontend guide.
- Synced route inventory across docs to include:
  - /api/v1/notifications
  - /api/v1/countries

### Product behavior documented

- Documented notification persistence, retrieval, and read/clear APIs.
- Documented realtime notification emission and frontend reconnect hydration behavior.
- Documented canonical country source and normalization behavior.
- Clarified Python autostart backend fixture behavior and CI override flag.

### Security and dependency updates documented

- Documented CodeQL and Trivy workflows as active security automation.
- Documented HIGH/CRITICAL dependency remediation for:
  - axios
  - path-to-regexp
  - lodash
- Added notes on remaining non-targeted audit findings.

### Verification snapshot documented

- Backend unit tests: 17 suites, 99 tests passed.
- Frontend build: passed.
- Python functional + security suites: 156 passed.

## 2026-03-24

### Documentation

- Refreshed README, setup, status, architecture, API, features, security, testing, and AGENTS docs to match then-current code.
- Updated frontend version references from Angular 20 to Angular 21.
- Added Docker compose coverage for backend, frontend, redis, and ngrok runtime setup.
- Clarified MongoDB transactional requirements and hardening notes for checkout and cancellation.

### Verification

- Backend unit tests: 15 suites passed, 87 tests passed.
- Frontend production build: successful with budget and CommonJS warnings.

## 2026-03-14

### Documentation

- Synced API docs with implemented endpoints, including owner-only POST /users.
- Synced product query documentation with implemented filters and sorting.
- Corrected order creation contract docs to match backend behavior.
- Updated frontend architecture docs to NgModule routing structure.

### Verification

- Backend unit tests: 10 suites passed, 67 tests passed.
- Frontend production build: successful with budget warnings.

## 2026-02-26

### Backend hardening and fixes

- HMAC timing-safe comparison added for Paymob webhook verification.
- Token leak removed from auth error paths.
- User-enumeration responses tightened in auth middleware.
- ReDoS-safe email validation pattern applied in validation and model layers.
- Production debug/error logging behavior tightened.
- Database connection is awaited before server listen.
- CORS switched from allow-all to configured origin handling.
- Startup environment validation added for critical variables.
- Graceful shutdown handlers added for server and database connections.
- Swagger exposure gated to non-production mode.

### Frontend improvements

- Subscription cleanup added across feature components.
- Production environment file and Angular file replacement wiring added.
- Error interceptor behavior improved for network/auth/server-error flows.
- Auth guard coverage expanded for sensitive routes.

### Tests

- Expanded webhook/cart/product service unit tests.
- Added payment double-attempt regression in Python suite.
- Corrected flaky or weak assertions in Python tests.
