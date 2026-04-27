# Product Requirements Document (PRD)

## Product

SmartCart: full-stack ecommerce platform for product discovery, cart, checkout, payment, and order lifecycle management with admin operations.

## Objectives

- Provide a complete customer shopping journey from browse to paid order.
- Provide admin/owner tools for catalog and order operations.
- Maintain inventory integrity under concurrent traffic.
- Keep payment and status events visible through notifications.
- Maintain an automated quality and security baseline in CI.

## Personas

- Customer: browses products, purchases items, tracks orders.
- Admin: manages orders, categories, and products.
- Owner: all admin capabilities plus privileged user management.

## Core user journeys

### Customer journey

1. Register or login.
2. Browse categories and products.
3. Add products to cart and adjust quantities.
4. Place order with shipping details.
5. Initiate payment.
6. Receive payment/status notifications.
7. Review order history.

### Admin journey

1. Login with admin role.
2. Manage products and categories.
3. Monitor all orders.
4. Update order statuses.

### Owner journey

1. Login with owner role.
2. Perform admin journey tasks.
3. Manage user accounts (create/update/delete non-owner users).

## Functional requirements

### FR-1 Auth and access control

- JWT auth required for protected endpoints.
- RBAC roles: customer, admin, owner.
- Guarded frontend routes must align with backend authorization.

### FR-2 Catalog and product discovery

- Category and product listing endpoints.
- Product search/filter/sort/pagination support.
- Product detail by slug.

### FR-3 Cart and stock safety

- Per-user cart state persisted in backend.
- Add/update/remove/clear cart operations.
- Reject checkout paths that exceed available stock.

### FR-4 Order lifecycle

- Transactional order creation from cart.
- Status transitions with validation rules.
- Cancellation path should restore stock.

### FR-5 Payments

- Integrate Paymob payment initiation.
- Process webhook callbacks with HMAC validation.
- Ensure idempotent paid-state update.

### FR-6 Notifications

- Persist notifications in database.
- Emit realtime notifications through Socket.IO.
- Provide read-state and clear APIs.

### FR-7 Country normalization

- Serve canonical countries from backend.
- Normalize code/name variants for incoming addresses.

### FR-8 Testing and CI

- Backend unit tests and frontend build checks in CI.
- API-level Python functional and security tests.
- Security scanning workflows for code and dependencies.

## Non-functional requirements

### NFR-1 Reliability

- Graceful shutdown for server and data resources.
- Health endpoint and startup env validation.

### NFR-2 Security

- Helmet and CORS baseline.
- Production rate limiting under /api.
- Secret and dependency scanning in workflows.

### NFR-3 Performance

- Pagination for product/order listing flows.
- Redis-assisted lock bookkeeping for stock-sensitive operations.

### NFR-4 Maintainability

- Clear layered backend architecture.
- Service-centric business logic.
- Updated documentation as implementation changes.

## Out of scope (current)

- Multi-vendor marketplace model.
- Promotions/discount engine.
- Native mobile clients.
- Full internationalization and localization.

## Success criteria

- End-to-end checkout and payment works for default test path.
- Admin can manage catalog and order statuses.
- Notification persistence and realtime delivery both operate.
- CI passes backend/frontend/python checks.
- Security workflows run and produce artifacts/reports.

## Current release status

- Implemented: auth, catalog, cart, order, payment, notifications, countries, admin panels, test automation.
- Known follow-ups: production redirect configuration for payment callback, ongoing medium-risk dependency triage.
