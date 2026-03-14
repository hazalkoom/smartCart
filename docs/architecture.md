# Architecture

This document describes the current SmartCart implementation in this repository.

## System overview

SmartCart consists of three major systems:

- backend/: the authoritative commerce API and business logic
- frontend/: the Angular SSR client application
- tests/: API-level functional, security, and performance suites

## Backend architecture

The backend uses a conventional service-layer flow:

```text
Route -> Controller -> Service -> Model
```

Main backend structure:

- backend/src/server.js: process bootstrap, middleware registration, route mounting, health route, startup, and shutdown handling
- backend/src/routes/: HTTP route definitions
- backend/src/controllers/: request and response orchestration
- backend/src/services/: business rules and multi-model workflows
- backend/src/models/: Mongoose schemas and persistence rules
- backend/src/middleware/: auth, validation, and centralized error handling
- backend/src/utils/: async wrapper, token generation, logging, HMAC helpers, and Paymob client utilities

### Important backend runtime behavior

- Environment validation happens during startup for JWT_SECRET, JWT_EXPIRE, and MONGODB_URI.
- MongoDB is connected before the server starts listening.
- Helmet and CORS are applied globally.
- express.json uses a 50kb request-body limit.
- Production mode enables rate limiting under /api.
- Swagger is mounted only outside production.
- Graceful shutdown disconnects Mongoose on SIGTERM and SIGINT.

## Backend domains

### Auth and profile

- JWT-based login and registration
- Password reset token flow
- User profile retrieval and first or last name updates
- Wishlist and saved-address management for authenticated users

### Catalog

- Categories are slug-addressable
- Products support filtering, sorting, pagination, ratings, and soft deletion

### Cart

- One server-side cart per user
- Locked price snapshots inside cart items
- Subtotal recalculation after every mutation

### Orders and payments

- Order creation reads the cart, snapshots item cost, decrements stock, and clears the cart in a MongoDB transaction
- Order status transitions are constrained
- Cancellation restocks inventory transactionally
- Paymob payment initiation is separate from order creation
- Webhook handling updates payment state after HMAC validation

### Reviews

- One review per product and customer
- Product rating and reviewCount are recomputed after review changes

### User administration

- Admin and owner can list users
- Owner can create, update, and delete non-owner users

## Frontend architecture

The frontend is an Angular 20 SSR app using NgModules rather than standalone route configuration.

Key files:

- frontend/src/main.ts: browser bootstrap
- frontend/src/main.server.ts: server bootstrap entry
- frontend/src/app/app-module.ts: root NgModule, declarations, hydration, and HTTP interceptor registration
- frontend/src/app/app-routing-module.ts: primary route definitions
- frontend/src/app/app.module.server.ts: SSR server module
- frontend/src/app/core/: guards, interceptors, interfaces, reusable services, and shared UI components
- frontend/src/app/features/: page-level and admin feature components

### Frontend navigation model

Primary routes include:

- /, /products, /products/:slug
- /cart, /checkout, /account, /wishlist, /orders/:id
- /about, /help-center, /categories, /gift-finder, /payment-callback
- /admin with child routes for dashboard, orders, users, products, and categories

Route protection is implemented with:

- authGuard for authenticated customer routes
- guestGuard for login and register
- AdminGuard for the admin area
- OwnerGuard for /admin/users

### Frontend state and integration patterns

- AuthService stores the JWT in localStorage when running in the browser.
- AuthInterceptor adds the bearer token to outgoing requests.
- ErrorInterceptor handles network failures, token-related 401 flows, and server-error logging in development.
- CartService mirrors cart state into localStorage and exposes a reactive cartCount$ stream.
- RoutePersistenceService restores the last visited admin route in the browser.

## Data flow examples

### Product browsing

1. The frontend product service calls GET /api/v1/products with filters.
2. The backend product service runs an aggregation pipeline with category lookup, pagination, and sorting.
3. The frontend renders paged product cards and product detail views.

### Checkout and payment

1. CartService mutates the server-side cart.
2. OrderService creates an order from the cart by posting shippingAddress.
3. OrderService then initiates payment separately through POST /orders/:id/pay.
4. Paymob calls the webhook endpoint.
5. The frontend payment callback route reads redirected query parameters from Paymob.

## Current constraints

- MongoDB transactions are required for checkout and cancellation integrity.
- The Paymob redirect route is currently hardcoded to a localhost frontend callback URL.
- The frontend has no E2E browser test suite in this repository.
