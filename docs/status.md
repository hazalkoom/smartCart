# Status

This document summarizes the current implementation state based on repository inspection and targeted verification performed during this documentation refresh.

## Verified in this refresh

### Backend

- Backend unit test suite passes.
- Result: 15 suites, 87 tests passing.
- Health route exists at GET /api/v1/health.
- API route groups mounted in server.js: auth, categories, products, cart, orders, reviews, webhook, users.

### Frontend

- Angular production build passes.
- The frontend is an Angular 21 SSR app using app-module.ts and app-routing-module.ts.
- Route guards exist for guest, auth, admin, and owner flows.
- Auth and error interceptors are registered through the root NgModule.

### Build warnings currently present

- initial bundle budget exceeded
- product-detail.css component-style budget exceeded
- product-list.css component-style budget exceeded
- src/assets/admin/css/templatemo-daynight-style.css budget exceeded
- CommonJS optimization warnings for debug and xmlhttprequest-ssl from socket dependencies

## Implemented backend capabilities

- authentication, login, profile, and password reset flow
- wishlist and saved-address endpoints
- categories CRUD
- products CRUD with soft delete
- cart CRUD with stock-aware mutations
- transactional order creation and controlled status transitions
- Paymob payment initiation and webhook handling
- reviews CRUD
- user listing for admin and owner, plus owner-only create, update, and delete actions

## Implemented frontend capabilities

- storefront routes for home, products, product detail, cart, checkout, account, wishlist, categories, order detail, payment callback, about, help center, and gift finder
- lazy-loaded admin area with dashboard, orders, users, products, and categories screens
- localStorage-backed auth token handling
- localStorage-assisted cart caching and admin route persistence

## Not verified in this refresh

- Python functional tests under tests/functional
- Python security tests under tests/security
- frontend end-to-end browser workflows
- production deployment behavior outside local build and unit-test execution

## Known mismatches or constraints in the current code

- order creation docs previously claimed paymentMethod was required, but the backend currently only validates shippingAddress and sets paymentMethod internally
- the Paymob redirect endpoint currently points to a hardcoded localhost frontend URL
- the user model currently hashes passwords with bcrypt salt rounds fixed at 10
- Docker compose frontend host validation relies on NG_ALLOWED_HOSTS values for Angular dev-server behavior
