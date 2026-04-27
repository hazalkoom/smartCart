# Architecture

This document reflects the current SmartCart implementation.

## System overview

SmartCart has three primary layers:

- backend/: API and business logic
- frontend/: Angular SSR client
- tests/: API-level functional, security, and performance suites

Supporting infrastructure:

- Redis for stock-locking and worker queues
- BullMQ worker for cart-expiration tasks
- Docker Compose files for local dev and production-like runtime

## Backend architecture

Backend flow:

```text
Route -> Controller -> Service -> Model
```

Key backend modules:

- backend/src/server.js: startup, middleware, route mounts, sockets, graceful shutdown
- backend/src/routes/: endpoint grouping
- backend/src/controllers/: HTTP orchestration
- backend/src/services/: business workflows
- backend/src/models/: persistence schemas
- backend/src/middleware/: auth/validation/error handling
- backend/src/workers/: background jobs

### Runtime behavior

- Startup validates required environment variables.
- MongoDB connection is awaited before listening.
- Global middleware: morgan, helmet, cors, express.json.
- Production-only rate limiting is applied under /api.
- Swagger is mounted only in non-production mode.
- Graceful shutdown closes HTTP, MongoDB, Redis, and BullMQ resources.

### Route groups

- /api/v1/auth
- /api/v1/categories
- /api/v1/products
- /api/v1/cart
- /api/v1/orders
- /api/v1/reviews
- /api/v1/webhook
- /api/v1/users
- /api/v1/notifications
- /api/v1/countries
- /api/v1/health

## Key backend domains

### Auth and profile

- JWT authentication and RBAC (customer/admin/owner)
- Profile, wishlist, and address management

### Catalog

- Categories and products with filtering and pagination
- Product soft deletion by owner

### Cart and inventory locking

- User cart with subtotal recalculation
- Overselling protection and lock accounting
- Cart expiration worker releases locks and emits notifications

### Orders and payments

- Transactional order creation from cart
- Status transition rules with cancellation restocking
- Paymob payment initiation and webhook verification

### Notifications

- Notification model persisted in MongoDB
- User/admin notification persistence services
- REST retrieval and read-state APIs
- Socket.IO event emission to user/admin rooms

### Countries

- Canonical country constants in backend
- Input normalization helper (codes to names)
- Public countries endpoint for frontend hydration

## Frontend architecture

Frontend is an Angular 21 SSR app using NgModules.

Key files:

- frontend/src/app/app-module.ts
- frontend/src/app/app-routing-module.ts
- frontend/src/app/app.module.server.ts
- frontend/src/app/core/
- frontend/src/app/features/

### Routing and guards

Main routes include customer flows and lazy admin module.

Guard model:

- authGuard: authenticated customer routes
- guestGuard: login/register gate
- AdminGuard: admin area
- OwnerGuard: owner-only admin users screen

### State and integration patterns

- AuthService with APP_INITIALIZER-based hydration
- AuthInterceptor and ErrorInterceptor for request/error behavior
- NotificationService with persisted hydration + realtime merge
- CountryService hydrates countries from backend with fallback constants
- SocketService manages user/admin room subscriptions

## Data flow examples

### Checkout and payment

1. Customer mutates cart through API.
2. Order is created transactionally from cart.
3. Customer initiates payment with /orders/:id/pay.
4. Paymob webhook updates order state and notification records.
5. Frontend receives realtime events and can rehydrate from /notifications.

### Notification lifecycle

1. Domain event occurs (payment success, status change, cart expiration).
2. Backend persists notification document(s).
3. Backend emits Socket.IO event.
4. Frontend appends realtime event and reloads persisted list on reconnect.

### Country data lifecycle

1. Frontend bootstraps static country fallback.
2. CountryService requests /api/v1/countries.
3. Checkout/account dropdowns hydrate from backend response.
4. Backend validates and normalizes incoming country values.

## Operational constraints

- MongoDB transaction support is required for order integrity.
- Paymob redirect helper endpoint is currently hardcoded to localhost callback.
- CI ignores docs-only changes by default through path filters.
