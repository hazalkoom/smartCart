# LLM Handoff Report — Backend & Tests (SmartCart)

This report is an implementation-focused handoff for LLM agents that will extend SmartCart backend features and test coverage.

## 1) Scope and intent

- Scope covered in this report:
  - `backend/` (Node.js API, unit tests, utilities, scripts)
  - `tests/` (Python functional, security, performance suites)
- Goal:
  - Give a complete map of where to add features and where to add/adjust tests.

## 2) Runtime and stack summary

| Area                  | Stack                        | Notes                                |
| --------------------- | ---------------------------- | ------------------------------------ |
| Backend API           | Node.js + Express + Mongoose | Entry: `backend/src/server.js`       |
| Auth                  | JWT Bearer                   | Roles: `customer`, `admin`, `owner`  |
| API docs              | Swagger                      | Route annotations + `/api-docs`      |
| Backend unit tests    | Jest                         | `backend/tests/unit/**/*.test.js`    |
| System/security tests | Pytest                       | `tests/functional`, `tests/security` |
| Performance tests     | Locust                       | `tests/performance`                  |

## 3) Backend architecture flow

```
Route -> Controller -> Service -> Model
```

- `backend/src/routes`: API paths + middleware chains.
- `backend/src/controllers`: HTTP orchestration.
- `backend/src/services`: business logic, cross-model workflows.
- `backend/src/models`: Mongoose schemas, hooks, indexes.
- `backend/src/middleware`: auth, validation, error handling.
- `backend/src/utils`: helpers (JWT, logger, Paymob HMAC, etc.).

## 4) Suggested extension points

### 4.1 Add a new backend feature

1. Add validation rules in `backend/src/middleware/validationMiddleware.js`.
2. Add/extend route in `backend/src/routes/*.js`.
3. Implement controller method in `backend/src/controllers/*.js`.
4. Implement business logic in `backend/src/services/*.js`.
5. Add/extend schema/index/hook in `backend/src/models/*.js` if needed.
6. Add Swagger JSDoc in route file.
7. Add Jest unit tests under `backend/tests/unit/`.
8. Add Python functional/security tests under `tests/functional` or `tests/security`.

### 4.2 Add test coverage

- API workflow tests: `tests/functional/`.
- Security regression tests: `tests/security/`.
- Pure backend logic tests: `backend/tests/unit/`.
- Load/scenario tests: `tests/performance/`.

## 5) Commands used by contributors

### Backend

```powershell
cd backend
npm ci
npm run dev
npm test
npm run test:coverage
```

### Python tests

```powershell
# From repo root
.\env\Scripts\Activate.ps1
pytest tests\functional tests\security -v
```

### Performance

```powershell
# From repo root (venv active)
locust -f tests/performance/locustfile.py
```

## 6) Full folder structure (backend + tests)

```
backend/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    utils/
  tests/
    unit/
      mocks/
      models/
  coverage/

tests/
  functional/
  security/
  performance/
    data/
```

## 7) Complete tracked file manifest (backend + tests)

> Source of truth for this list: `git ls-files backend tests`.

```text
backend/.gitignore
backend/coverage/clover.xml
backend/coverage/coverage-final.json
backend/coverage/lcov-report/base.css
backend/coverage/lcov-report/block-navigation.js
backend/coverage/lcov-report/favicon.png
backend/coverage/lcov-report/index.html
backend/coverage/lcov-report/models/index.html
backend/coverage/lcov-report/models/orderModel.js.html
backend/coverage/lcov-report/models/userModel.js.html
backend/coverage/lcov-report/prettify.css
backend/coverage/lcov-report/prettify.js
backend/coverage/lcov-report/services/authService.js.html
backend/coverage/lcov-report/services/cartService.js.html
backend/coverage/lcov-report/services/categoryService.js.html
backend/coverage/lcov-report/services/index.html
backend/coverage/lcov-report/services/orderService.js.html
backend/coverage/lcov-report/services/paymobService.js.html
backend/coverage/lcov-report/services/productService.js.html
backend/coverage/lcov-report/services/reviewService.js.html
backend/coverage/lcov-report/services/userService.js.html
backend/coverage/lcov-report/sort-arrow-sprite.png
backend/coverage/lcov-report/sorter.js
backend/coverage/lcov.info
backend/jest.config.js
backend/package-lock.json
backend/package.json
backend/reset_db_hard.js
backend/restock.js
backend/seeder.js
backend/src/config/mongoDataBaseConnection.js
backend/src/config/swagger.js
backend/src/controllers/authController.js
backend/src/controllers/cartController.js
backend/src/controllers/categoryController.js
backend/src/controllers/orderController.js
backend/src/controllers/productController.js
backend/src/controllers/reviewController.js
backend/src/controllers/userController.js
backend/src/controllers/webhookController.js
backend/src/middleware/authMiddleware.js
backend/src/middleware/errorMiddleware.js
backend/src/middleware/validationMiddleware.js
backend/src/models/cartModel.js
backend/src/models/categoryModel.js
backend/src/models/orderModel.js
backend/src/models/productModel.js
backend/src/models/reviewModel.js
backend/src/models/userModel.js
backend/src/routes/authRoutes.js
backend/src/routes/cartRoutes.js
backend/src/routes/categoryRoutes.js
backend/src/routes/orderRoutes.js
backend/src/routes/productRoutes.js
backend/src/routes/reviewRoutes.js
backend/src/routes/userRoutes.js
backend/src/routes/webhookRoutes.js
backend/src/server.js
backend/src/services/authService.js
backend/src/services/cartService.js
backend/src/services/categoryService.js
backend/src/services/orderService.js
backend/src/services/paymobService.js
backend/src/services/productService.js
backend/src/services/reviewService.js
backend/src/services/userService.js
backend/src/utils/asyncHandler.js
backend/src/utils/generateToken.js
backend/src/utils/logger.js
backend/src/utils/orderNumberUtil.js
backend/src/utils/paymobClient.js
backend/src/utils/paymobHmac.js
backend/tests/unit/authService.test.js
backend/tests/unit/cartService.test.js
backend/tests/unit/categoryService.test.js
backend/tests/unit/mocks/dbMocks.js
backend/tests/unit/models/userModel.test.js
backend/tests/unit/orderService.test.js
backend/tests/unit/paymobService.test.js
backend/tests/unit/productService.test.js
backend/tests/unit/reviewService.test.js
backend/tests/unit/userService.test.js
backend/tests/unit/webhookController.test.js
tests/__init__.py
tests/functional/__init__.py
tests/functional/test_admin_financials.py
tests/functional/test_admin_products.py
tests/functional/test_admin_users.py
tests/functional/test_auth.py
tests/functional/test_cart.py
tests/functional/test_categories.py
tests/functional/test_orders.py
tests/functional/test_payments.py
tests/functional/test_products.py
tests/functional/test_reviews.py
tests/performance/data/users.csv
tests/performance/generate_users.py
tests/performance/locust_checkout.py
tests/performance/locust_master.py
tests/performance/locustfile.py
tests/security/__init__.py
tests/security/test_advanced.py
tests/security/test_hardening.py
tests/security/test_security.py
tests/security/test_webhook.py
tests/test_config.py
```

## 8) Critical files LLM should inspect first

1. `backend/src/server.js` — middleware order, route mounting, env checks, startup/shutdown behavior.
2. `backend/src/middleware/errorMiddleware.js` — API error shape and status mapping.
3. `backend/src/middleware/validationMiddleware.js` — validation contracts for payloads.
4. `backend/src/routes/*.js` — endpoint contracts + Swagger docs.
5. `backend/src/services/*.js` — real business rules.
6. `backend/src/models/*.js` — persistence schema and hooks.
7. `backend/tests/unit/*.test.js` — expected service/controller behavior.
8. `tests/test_config.py` + `tests/functional/*.py` + `tests/security/*.py` — end-to-end and security expectations.

## 9) Notes for safe upgrades

- Preserve existing JSON envelope shape (`success`, `data`, `error`) unless versioning API.
- Add route validation first, then service logic, then tests.
- Update Swagger JSDoc whenever adding/changing routes.
- Extend both unit tests and functional/security tests for new behavior.
- Keep RBAC (`protect`, `authorize`) and data-integrity rules intact.

---

If the next LLM task is to implement a feature, start by identifying target domain route/controller/service/model, then add tests in this order: backend unit -> Python functional -> Python security (if applicable).
