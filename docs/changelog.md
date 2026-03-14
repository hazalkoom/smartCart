# Changelog

All notable changes to this project are listed here.

## 2026-03-14

### Documentation

- Synced API docs with implemented endpoints, including owner-only `POST /users`.
- Synced product query documentation with implemented filters and sorting.
- Corrected order creation contract docs to match current backend behavior.
- Updated frontend architecture docs to the actual NgModule routing structure.
- Updated setup, status, testing, and security docs to match current code and verification output.

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
- Category update flow supports partial updates.
- Order cancellation restocking wrapped in transaction flow.
- Order controller error status behavior standardized.
- Product retrieval not-found behavior corrected.
- Review service/controller response shape made consistent.
- Removed duplicate protect middleware usage in routes.

### Frontend improvements

- Subscription cleanup added across core feature components to prevent leaks.
- Production environment file and Angular file replacement wiring added.
- Error interceptor behavior improved for network, auth, and server-error flows.
- Category interface usage unified in core interfaces/services and admin features.
- SSR guards added to browser-only code paths.
- Console cleanup performed across components.
- Service-level retry and error handling improved in product, order, and user services.
- Auth guard protection expanded for sensitive routes.
- Redundant cart fetch removed from header flow.

### Tests

- Added/expanded webhook controller unit tests for HMAC and idempotency flows.
- Expanded cart service unit tests (add/get/update/remove/clear paths).
- Expanded product service unit tests (SKU/category/image validations).
- Added payment double-attempt regression test in Python suite.
- Corrected always-passing product delete functional assertion.
- Fixed duplicate review assertion pattern in tests.
- Added Python test data isolation helper flow.

### Reported verification at that time

- Jest unit tests: 10 suites, 60 tests passed.
- Angular build: successful with budget warnings.
- Pytest functional/security: passing in the hardening report.
