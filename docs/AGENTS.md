# AI Agent Guide - SmartCart

This file is for coding agents that need a fast, reliable map of the current repository.

## Quick facts

| Property | Value |
| --- | --- |
| Project | SmartCart |
| Backend | Node.js, Express 5, Mongoose, MongoDB |
| Frontend | Angular 21 SSR with NgModules |
| Tests | Jest, Pytest, Locust |
| API prefix | /api/v1 |
| Auth roles | customer, admin, owner |
| Payment integration | Paymob |

## Repository map

```text
smartcart/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── tests/unit/
├── frontend/
│   ├── src/
│   │   ├── main.ts
│   │   ├── main.server.ts
│   │   ├── server.ts
│   │   ├── environments/
│   │   └── app/
│   │       ├── app-module.ts
│   │       ├── app-routing-module.ts
│   │       ├── app.module.server.ts
│   │       ├── app.routes.server.ts
│   │       ├── core/
│   │       └── features/
│   └── angular.json
├── tests/
│   ├── functional/
│   ├── security/
│   └── performance/
└── docs/
```

## Where to look first

### Backend

- Route definitions: backend/src/routes/
- HTTP orchestration: backend/src/controllers/
- Business logic: backend/src/services/
- Persistence rules: backend/src/models/
- Startup and middleware order: backend/src/server.js
- Validation rules: backend/src/middleware/validationMiddleware.js
- Centralized error handling: backend/src/middleware/errorMiddleware.js

### Frontend

- Root module and providers: frontend/src/app/app-module.ts
- Main routes: frontend/src/app/app-routing-module.ts
- SSR server module: frontend/src/app/app.module.server.ts
- Shared auth, cart, product, order, review services: frontend/src/app/core/services/
- Guards: frontend/src/app/core/guards/
- Interceptors: frontend/src/app/core/interceptors/
- Reusable interfaces: frontend/src/app/core/interfaces/
- Page components: frontend/src/app/features/

## Current route map

### Backend route groups

- /api/v1/auth
- /api/v1/categories
- /api/v1/products
- /api/v1/cart
- /api/v1/orders
- /api/v1/reviews
- /api/v1/webhook
- /api/v1/users
- /api/v1/health

### Frontend routes

- /
- /products
- /products/:slug
- /cart
- /checkout
- /login
- /register
- /about
- /help-center
- /wishlist
- /account
- /categories
- /orders/:id
- /payment-callback
- /gift-finder
- /admin

Admin children:

- /admin
- /admin/orders
- /admin/users
- /admin/products
- /admin/categories

## Patterns worth knowing

### Backend pattern

```text
Route -> Controller -> Service -> Model
```

Keep business rules in services. Controllers should remain thin.

### Frontend pattern

```text
app-routing-module.ts -> features/* components
core/services/* -> API calls
core/interfaces/* -> canonical TS types
core/guards/* -> route access
core/interceptors/* -> request and error handling
```

## Verified commands

### Backend unit tests

```powershell
cd backend
npm test
```

Latest observed backend result in this refresh: 15 suites, 87 tests passing.

### Frontend production build

```powershell
cd frontend
npm run build
```

### Python API-level suites

```powershell
.\env\Scripts\Activate.ps1
pytest tests\functional tests\security -v
```

## Known code-level caveats

- Order creation currently validates shippingAddress only and sets paymentMethod internally.
- The Paymob redirect helper is hardcoded to http://localhost:4200/payment-callback.
- The frontend uses app-module.ts and app-routing-module.ts, not a standalone app.routes.ts client router.
