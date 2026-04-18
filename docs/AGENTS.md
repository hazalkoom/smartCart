# AI Agent Guide - SmartCart

This file gives coding agents a fast map of the current repository.

## Quick facts

| Property            | Value                                                |
| ------------------- | ---------------------------------------------------- |
| Project             | SmartCart                                            |
| Backend             | Node.js, Express 5, Mongoose, MongoDB, Redis, BullMQ |
| Frontend            | Angular 21 SSR with NgModules                        |
| Tests               | Jest, Pytest, Locust                                 |
| API prefix          | /api/v1                                              |
| Auth roles          | customer, admin, owner                               |
| Payment integration | Paymob                                               |

## Repository map

```text
smartcart/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── constants/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── workers/
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
- Error envelope behavior: backend/src/middleware/errorMiddleware.js

### Frontend

- Root module and providers: frontend/src/app/app-module.ts
- Main routes: frontend/src/app/app-routing-module.ts
- SSR server module: frontend/src/app/app.module.server.ts
- Shared services and interfaces: frontend/src/app/core/
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
- /api/v1/notifications
- /api/v1/countries
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

Keep business rules in services. Keep controllers thin.

### Frontend pattern

```text
app-routing-module.ts -> features/* components
core/services/* -> API calls
core/interfaces/* -> canonical types
core/guards/* -> route access
core/interceptors/* -> request and error handling
```

## Verified commands

### Backend unit tests

```powershell
cd backend
npm test
```

Latest observed result: 17 suites, 99 tests passing.

### Frontend build

```powershell
cd frontend
npm run build
```

Latest observed result: build passing.

### Python API-level suites

```powershell
.\env\Scripts\Activate.ps1
pytest tests\functional tests\security -q
```

Latest observed result: 156 tests passing.

## Security automation

- CI workflow: .github/workflows/ci.yml
- Trivy workflow: .github/workflows/trivy.yml
- CodeQL workflow: .github/workflows/codeql.yml

## Known caveats

- Paymob redirect helper is hardcoded to http://localhost:4200/payment-callback.
- Order creation currently derives paymentMethod internally and validates shippingAddress.
- Notification persistence is implemented and exposed under /api/v1/notifications.
- Country normalization uses canonical country constants and /api/v1/countries.
