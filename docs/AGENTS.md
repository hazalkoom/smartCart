# AI Agent Guide — SmartCart Codebase Navigation

> **Purpose**: This file is written specifically for AI coding agents (Copilot, Cursor, Codeium, etc.) to help them understand the project structure, locate files quickly, and make safe changes. It is not intended for human onboarding — see `setup.md` and `architecture.md` for that.

---

## Quick Facts

| Property | Value |
|---|---|
| **Project** | SmartCart — full-stack e-commerce platform |
| **Backend** | Node.js 20 + Express 4 + Mongoose (MongoDB) |
| **Frontend** | Angular 20 with SSR (Server-Side Rendering) |
| **Test suites** | Jest (backend unit), Pytest (functional + security), Locust (perf) |
| **Monorepo** | Single repo, three independent systems: `backend/`, `frontend/`, `tests/` |
| **API prefix** | `/api/v1` |
| **Auth model** | JWT Bearer tokens, 3 roles: `customer`, `admin`, `owner` |
| **Payment** | Paymob (card / wallet / Fawry) with HMAC webhook verification |
| **DB** | MongoDB with Mongoose ODM; transactions used for checkout |

---

## Directory Map (what lives where)

```
smartcart/
├── backend/                          # Express API server
│   ├── src/
│   │   ├── server.js                 # Entry point — boots Express, connects DB
│   │   ├── config/
│   │   │   ├── mongoDataBaseConnection.js  # Mongoose connect (awaited)
│   │   │   └── swagger.js            # Swagger/OpenAPI config
│   │   ├── controllers/              # Thin HTTP layer (req/res)
│   │   │   ├── authController.js
│   │   │   ├── cartController.js
│   │   │   ├── categoryController.js
│   │   │   ├── orderController.js    # includes payOrder handler
│   │   │   ├── productController.js
│   │   │   ├── reviewController.js
│   │   │   ├── userController.js
│   │   │   └── webhookController.js  # Paymob webhook + HMAC check
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     # protect (JWT) + authorize (RBAC)
│   │   │   ├── errorMiddleware.js    # centralized error handler
│   │   │   └── validationMiddleware.js # express-validator runner
│   │   ├── models/                   # Mongoose schemas
│   │   │   ├── cartModel.js
│   │   │   ├── categoryModel.js
│   │   │   ├── orderModel.js
│   │   │   ├── productModel.js       # soft-delete via isDeleted flag
│   │   │   ├── reviewModel.js        # calcAverageRatings static method
│   │   │   └── userModel.js          # pre-save bcrypt hook
│   │   ├── routes/                   # Express Router definitions
│   │   │   ├── authRoutes.js
│   │   │   ├── cartRoutes.js
│   │   │   ├── categoryRoutes.js
│   │   │   ├── orderRoutes.js
│   │   │   ├── productRoutes.js
│   │   │   ├── reviewRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   └── webhookRoutes.js
│   │   ├── services/                 # Business logic layer
│   │   │   ├── authService.js        # register, login, forgot/reset password
│   │   │   ├── cartService.js        # CRUD + stock validation + recalculate
│   │   │   ├── categoryService.js    # CRUD + slug generation
│   │   │   ├── orderService.js       # transactional checkout + status flow
│   │   │   ├── paymobService.js      # Paymob API integration
│   │   │   ├── productService.js     # CRUD + soft delete + filtering
│   │   │   ├── reviewService.js      # CRUD + rating aggregation
│   │   │   └── userService.js        # admin user management
│   │   └── utils/
│   │       ├── asyncHandler.js       # async error wrapper
│   │       ├── generateToken.js      # JWT sign helper
│   │       ├── logger.js             # Winston logger
│   │       ├── orderNumberUtil.js    # ORD-{timestamp} generator
│   │       ├── paymobClient.js       # Axios client for Paymob API
│   │       └── paymobHmac.js         # HMAC-SHA512 verification (timing-safe)
│   ├── tests/unit/                   # Jest unit tests
│   │   ├── authService.test.js
│   │   ├── cartService.test.js       # 16 tests: add/get/update/remove/clear
│   │   ├── categoryService.test.js
│   │   ├── orderService.test.js
│   │   ├── paymobService.test.js
│   │   ├── productService.test.js    # includes createProduct SKU/category tests
│   │   ├── reviewService.test.js
│   │   ├── userService.test.js
│   │   ├── webhookController.test.js # HMAC + idempotency + order mutation
│   │   └── models/
│   │       └── userModel.test.js     # bcrypt hashing tests
│   ├── jest.config.js
│   └── package.json
│
├── frontend/                         # Angular 20 SSR app
│   ├── src/
│   │   ├── main.ts                   # Browser bootstrap
│   │   ├── main.server.ts            # SSR bootstrap
│   │   ├── server.ts                 # Express SSR server
│   │   ├── index.html
│   │   ├── styles.css                # Global styles (Tailwind + Bootstrap)
│   │   ├── environments/
│   │   │   ├── environment.ts        # dev config (apiUrl: '/api/v1')
│   │   │   └── environment.prod.ts   # prod config (production: true)
│   │   └── app/
│   │       ├── app.ts                # Root component
│   │       ├── app.routes.ts         # Route definitions + lazy loading
│   │       ├── core/                 # Singleton services, guards, interceptors
│   │       │   ├── components/       # header, footer, cart-animation
│   │       │   ├── guards/           # auth.guard, admin.guard, owner.guard
│   │       │   ├── interceptors/     # auth.interceptor, error.interceptor
│   │       │   ├── interfaces/       # TypeScript interfaces (cart, category, order, product, user)
│   │       │   └── services/         # HTTP services (auth, cart, category, order, product, user)
│   │       └── features/             # Page-level components (lazy-loaded)
│   │           ├── home/
│   │           ├── login/
│   │           ├── register/
│   │           ├── product-list/
│   │           ├── product-detail/
│   │           ├── category/
│   │           ├── cart/
│   │           ├── checkout/
│   │           ├── order-detail/
│   │           ├── account/
│   │           ├── payment-callback/
│   │           ├── about/
│   │           ├── help-center/
│   │           ├── admin/            # Admin route entry (lazy module)
│   │           ├── admin-layout/
│   │           ├── admin-dashboard/
│   │           ├── admin-products/
│   │           ├── admin-categories/
│   │           ├── admin-orders/
│   │           └── admin-users/
│   ├── angular.json                  # Build config + fileReplacements for prod
│   ├── proxy.conf.json               # Dev proxy: /api → localhost:5000
│   ├── tailwind.config.js
│   └── package.json
│
├── tests/                            # Python test suites (run against live backend)
│   ├── test_config.py                # BASE_URL, shared_data, ensure_test_data()
│   ├── functional/                   # Business workflow tests
│   │   ├── test_auth.py
│   │   ├── test_categories.py
│   │   ├── test_products.py
│   │   ├── test_cart.py
│   │   ├── test_orders.py
│   │   ├── test_payments.py
│   │   └── test_reviews.py
│   ├── security/                     # Hardening + attack tests
│   │   ├── test_security.py
│   │   ├── test_hardening.py
│   │   ├── test_advanced.py
│   │   └── test_webhook.py
│   └── performance/                  # Locust load test scripts
│       ├── locustfile.py
│       ├── locust_master.py
│       └── locust_checkout.py
│
├── docs/                             # Project documentation
│   ├── AGENTS.md        ← YOU ARE HERE
│   ├── api.md           # REST API reference
│   ├── architecture.md  # System design + domain breakdown
│   ├── changelog.md     # Hardening audit log (42 items)
│   ├── features.md      # User-facing capabilities by persona
│   ├── prd.md           # Product requirements document
│   ├── roadmap.md       # Phased next steps
│   ├── security.md      # Security controls + hardening details
│   ├── setup.md         # Dev environment setup guide
│   ├── status.md        # Implementation status + verification results
│   └── testing.md       # Test strategy + how to run
│
├── template/             # Admin dashboard HTML template (reference only)
├── requirements.txt      # Python deps for test suites
└── package.json          # Root package (scripts for dev orchestration)
```

---

## Key Patterns to Know

### Backend: Service Layer Pattern
```
Route → Controller → Service → Model (Mongoose)
```
- **Routes** define paths + attach middleware (auth, validation).
- **Controllers** are thin: extract params, call service, send response.
- **Services** contain all business logic. This is where to look for bugs or add features.
- **Models** define schemas, indexes, hooks (e.g., pre-save bcrypt).

### Frontend: Angular Feature Module Pattern
```
app.routes.ts → features/{name}/{name}.ts (component)
                core/services/{name}.ts (HTTP calls)
                core/interfaces/{name}.ts (TypeScript types)
```
- Each feature folder has `{name}.ts` (component), `{name}.html` (template), `{name}.css` (styles).
- Services are in `core/services/` — each wraps `HttpClient` for one API domain.
- Interfaces are in `core/interfaces/` — canonical TypeScript types.
- Guards are in `core/guards/` — route protection.
- Interceptors are in `core/interceptors/` — auth token injection + error handling.

### Error Handling Chain
- **Backend**: `asyncHandler` catches thrown errors → `errorMiddleware.js` formats response.
- **Frontend**: `error.interceptor.ts` catches HTTP errors globally → component-level handlers for UI.

### SSR Safety Rule
Any code accessing `window`, `document`, or `localStorage` MUST be guarded with:
```typescript
import { isPlatformBrowser } from '@angular/common';
if (isPlatformBrowser(this.platformId)) { /* browser-only code */ }
```

### Console Logging Rule
All `console.error` calls in component error handlers are gated:
```typescript
if (!environment.production) console.error('...', err);
```
Pure debug `console.log` calls have been removed entirely.

---

## Common Tasks — Where to Look

| Task | Primary File(s) |
|---|---|
| Add a new API endpoint | `backend/src/routes/`, `backend/src/controllers/`, `backend/src/services/` |
| Add validation to an endpoint | `backend/src/routes/{domain}Routes.js` (express-validator) |
| Add a new Mongoose model | `backend/src/models/` |
| Fix a business logic bug | `backend/src/services/{domain}Service.js` |
| Add/fix auth or RBAC | `backend/src/middleware/authMiddleware.js` |
| Fix error response format | `backend/src/middleware/errorMiddleware.js` |
| Add a new Angular page | `frontend/src/app/features/{name}/`, register in `app.routes.ts` |
| Add a new API service call | `frontend/src/app/core/services/{domain}.ts` |
| Add a TypeScript interface | `frontend/src/app/core/interfaces/{domain}.ts` |
| Add a route guard | `frontend/src/app/core/guards/` |
| Add a Jest unit test | `backend/tests/unit/{service}.test.js` |
| Add a Python functional test | `tests/functional/test_{domain}.py` |
| Add a security test | `tests/security/test_{name}.py` |
| Change environment config | `frontend/src/environments/environment.ts` (dev) / `environment.prod.ts` (prod) |
| Change Angular build config | `frontend/angular.json` |

---

## Search Shortcuts

When looking for specific functionality, these grep patterns work well:

| Looking for | Grep pattern | Scope |
|---|---|---|
| A route definition | `router\.(get\|post\|put\|patch\|delete)` | `backend/src/routes/` |
| A middleware usage | `protect\|authorize` | `backend/src/routes/` |
| A Mongoose schema | `new Schema\|mongoose\.model` | `backend/src/models/` |
| An error throw | `throw new Error\|res\.status` | `backend/src/` |
| Environment usage | `environment\.` | `frontend/src/` |
| SSR guard | `isPlatformBrowser` | `frontend/src/` |
| Component subscription cleanup | `ngOnDestroy\|unsubscribe` | `frontend/src/` |
| Shared test state | `shared_data` | `tests/` |

---

## Important Conventions

1. **Error response shape** (backend):
   ```json
   { "success": false, "error": { "code": "ERROR_CODE", "message": "..." } }
   ```

2. **Success response shape** (backend):
   ```json
   { "success": true, "data": { ... } }
   ```

3. **Product deletion is soft** — sets `isDeleted: true` and renames `sku`/`slug` to avoid index collisions.

4. **Order status flow** — strict: `Pending → Paid → Shipped → Delivered`. Cancellation allowed from `Pending` only; cancellation restocks inventory.

5. **Cart price locking** — item price is captured when added to cart; product price changes don't retroactively affect cart.

6. **One review per user per product** — enforced by a compound unique index.

7. **HMAC webhook verification** — uses timing-safe comparison (`crypto.timingSafeEqual`).

8. **JWT tokens** — signed with `JWT_SECRET`, expire per `JWT_EXPIRE`. Token is in `Authorization: Bearer <token>` header.

9. **Angular services use `retry(1)` on GET requests** — transient failures are retried once before propagating to the component.

10. **Frontend `environment.ts` is swapped for `environment.prod.ts` in production builds** — via `fileReplacements` in `angular.json`.

---

## Test Data & Isolation

- **Jest tests** mock all Mongoose models — no DB required.
- **Python tests** run against a live backend at `http://localhost:5000/api/v1`.
- **`test_config.py`** has an `ensure_test_data()` function that auto-provisions owner token, category, product, and customer — enabling individual test files to run in isolation.
- **Test execution order** is controlled via `@pytest.mark.run(order=N)` decorators.

---

## Files Modified in the Hardening Audit (42-Item Plan)

The complete changelog of all 42 items is in [`docs/changelog.md`](changelog.md). Key files touched:

### Backend (Fixes #1–#19)
- `server.js` — env validation, graceful shutdown, await DB, CORS, Swagger gating
- `authMiddleware.js` — removed token leak in error messages, generic user-not-found error
- `errorMiddleware.js` — removed debug logging in production
- `webhookController.js` — timing-safe HMAC comparison
- `validationMiddleware.js` — ReDoS-safe email regex
- `orderController.js` — consistent error format
- `orderService.js` — cancellation with transaction
- `categoryService.js` — partial update support
- `productService.js` — fixed error swallowing in getProduct
- `reviewService.js` — fixed response shape
- `userModel.js` — bcrypt rounds from env, email regex fix
- `mongoDataBaseConnection.js` — removed connection string from logs

### Frontend (Fixes #20–#34)
- 6 components: memory leak fixes (subscription cleanup)
- `app.routes.ts` — authGuard on cart/checkout/account/orders
- `header.ts` — removed double `getCart()` call
- `checkout.ts`, `product-detail.ts`, `order-detail.ts` — SSR guards (`isPlatformBrowser`)
- `error.interceptor.ts` — handles 0/401/403/500+ status codes
- `environment.prod.ts` — created (was missing)
- `angular.json` — added `fileReplacements` for production
- `category.ts` (interface) — unified, removed duplicate from service
- 16 component files — console.log/error cleanup (gated behind `!environment.production`)
- 3 services (`product.ts`, `order.ts`, `user.ts`) — added `retry(1)` + `catchError`

### Tests (Fixes #35–#42)
- `test_payments.py` — implemented double-payment test
- `test_products.py` — fixed always-passing delete assertion
- `cartService.test.js` — added 11 new tests (validation + getCart/remove/clear)
- `productService.test.js` — added 4 createProduct tests
- `reviewService.test.js` — fixed double-assertion anti-pattern
- `webhookController.test.js` — new file (6 tests: HMAC, idempotency, mutation)
- `test_config.py` — added `ensure_test_data()` isolation fixture
