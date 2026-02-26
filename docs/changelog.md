# Changelog — SmartCart Hardening Audit

All changes grouped by system. Each item references the original 42-item hardening plan.

---

## Backend Fixes (#1–#19)

### Security

| #   | Fix                         | File(s)                                 | Details                                                                                            |
| --- | --------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | HMAC timing-safe comparison | `webhookController.js`, `paymobHmac.js` | Replaced string `===` with `crypto.timingSafeEqual` on hex buffers to prevent side-channel attacks |
| 2   | Token leak in auth errors   | `authMiddleware.js`                     | Removed raw token from error messages; now returns generic `TOKEN_INVALID`                         |
| 3   | User enumeration prevention | `authMiddleware.js`                     | Changed "User not found" to generic "Not authorized" when token references a deleted user          |
| 4   | ReDoS-safe email regex      | `validationMiddleware.js`               | Replaced vulnerable regex with a linear-time pattern                                               |
| 5   | Debug logging in production | `errorMiddleware.js`                    | Gated `console.error(err.stack)` behind `NODE_ENV !== 'production'`                                |

### Startup & Configuration

| #   | Fix                             | File(s)                                   | Details                                                                                        |
| --- | ------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 6   | Await database connection       | `server.js`, `mongoDataBaseConnection.js` | `connectDB()` is now awaited before `app.listen()`                                             |
| 7   | CORS configuration              | `server.js`                               | Replaced `cors()` (allow-all) with origin whitelist from `CORS_ORIGIN` env var                 |
| 8   | Environment variable validation | `server.js`                               | Validates `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE` on boot; exits with clear error if missing |
| 9   | Graceful shutdown               | `server.js`                               | Added `SIGTERM`/`SIGINT` handlers that close HTTP server and Mongoose connection               |
| 10  | Swagger gating                  | `server.js`                               | `/api-docs` only mounted when `NODE_ENV !== 'production'`                                      |

### Data Integrity & Logic

| #   | Fix                              | File(s)                      | Details                                                                                         |
| --- | -------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------- |
| 11  | Category partial update          | `categoryService.js`         | `updateCategory` now accepts partial payloads instead of requiring all fields                   |
| 12  | Cancellation with transaction    | `orderService.js`            | Order cancellation restocks inventory atomically using a MongoDB transaction                    |
| 13  | Order controller error format    | `orderController.js`         | Standardized thrown errors to include `res.status()` before `throw` for consistent error codes  |
| 14  | getProduct error swallowing      | `productService.js`          | `getProduct` now properly throws 404 instead of returning undefined                             |
| 15  | Review response shape            | `reviewService.js`           | Ensured all review service methods return consistent `{ success, data }` through the controller |
| 16  | Bcrypt rounds from env           | `userModel.js`               | Salt rounds read from `BCRYPT_ROUNDS` env var (default 12) instead of hardcoded                 |
| 17  | Email regex in model             | `userModel.js`               | Replaced fragile regex with a robust pattern matching the validation middleware                 |
| 18  | DB connection string logging     | `mongoDataBaseConnection.js` | Removed `console.log(uri)` that could leak credentials                                          |
| 19  | Remove double protect middleware | Various routes               | Removed duplicate `protect` calls on routes that already had it in the router chain             |

---

## Frontend Fixes (#20–#34)

### Memory Leaks & Lifecycle

| #   | Fix                                     | File(s)               | Details                                                                           |
| --- | --------------------------------------- | --------------------- | --------------------------------------------------------------------------------- |
| 20  | Subscription cleanup — product-list     | `product-list.ts`     | Added `OnDestroy` + `subscriptions[]` array with `unsubscribe()` in `ngOnDestroy` |
| 21  | Subscription cleanup — product-detail   | `product-detail.ts`   | Same pattern                                                                      |
| 22  | Subscription cleanup — payment-callback | `payment-callback.ts` | Same pattern                                                                      |
| 23  | Subscription cleanup — about            | `about.ts`            | Same pattern                                                                      |
| 24  | Subscription cleanup — checkout         | `checkout.ts`         | Same pattern                                                                      |
| 25  | Subscription cleanup — home             | `home.ts`             | Same pattern                                                                      |

### Route Security & SSR

| #   | Fix                           | File(s)                                                            | Details                                                                             |
| --- | ----------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| 26  | Created `environment.prod.ts` | `environments/environment.prod.ts`                                 | New file with `production: true, apiUrl: '/api/v1'`                                 |
| 27  | Production file replacements  | `angular.json`                                                     | Added `fileReplacements` block in production build config                           |
| 28  | Enhanced error interceptor    | `error.interceptor.ts`                                             | Now handles status 0 (network), 401, 403, 500+ (dev-only logging)                   |
| 29  | Unified Category interface    | `interfaces/category.ts`, `services/category.ts`, admin components | Removed duplicate interface; single source of truth in `interfaces/`                |
| 30  | SSR guard — checkout          | `checkout.ts`                                                      | `isPlatformBrowser` guard on `window.location.href`                                 |
| 31  | SSR guard — product-detail    | `product-detail.ts`                                                | `isPlatformBrowser` guard on `window.innerWidth/innerHeight`                        |
| 32  | SSR guard — order-detail      | `order-detail.ts`                                                  | Added `PLATFORM_ID` injection + `isPlatformBrowser` guard                           |
| 33  | Console pollution cleanup     | 16 component files                                                 | Removed debug `console.log`; gated `console.error` behind `!environment.production` |
| 34  | Service-level error handling  | `product.ts`, `order.ts`, `user.ts` services                       | Added `retry(1)` on GETs + `catchError` with dev-only logging on all methods        |

### Route Protection

| #   | Fix                        | File(s)         | Details                                                          |
| --- | -------------------------- | --------------- | ---------------------------------------------------------------- |
| —   | Added `authGuard`          | `app.routes.ts` | Protected `/cart`, `/checkout`, `/account`, `/orders/:id` routes |
| —   | Removed double `getCart()` | `header.ts`     | Eliminated redundant cart API call on every navigation           |

---

## Test Quality Improvements (#35–#42)

| #   | Fix                             | File(s)                           | Details                                                                                  |
| --- | ------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------- |
| 35  | Implement double-payment test   | `test_payments.py`                | Replaced `pass` with: admin marks order Paid → user re-attempts pay → asserts 400        |
| 36  | Fix always-passing delete test  | `test_products.py`                | Changed `assert status_code in [200, 404]` to `assert status_code == 404`                |
| 37  | addItemToCart validation tests  | `cartService.test.js`             | 3 new tests: product not found, duplicate exceeds stock, new cart creation               |
| 38  | createProduct unit tests        | `productService.test.js`          | 4 new tests: SKU uniqueness, category validation, image filtering                        |
| 39  | Fix review double-assertion     | `reviewService.test.js`           | Collapsed duplicate `rejects` calls into single `toMatchObject` assertions               |
| 40  | Webhook controller unit tests   | `webhookController.test.js` (new) | 6 tests: HMAC fail, missing body, failed txn, order not found, idempotency, happy path   |
| 41  | Cart service coverage expansion | `cartService.test.js`             | 8 new tests: getCart, updateItemQuantity, removeItem, clearCart                          |
| 42  | Python test isolation           | `test_config.py`                  | Added `ensure_test_data()` — auto-provisions owner, category, product, customer per-file |

---

## Verification Results (Post-Audit)

| Suite                 | Result                                                    |
| --------------------- | --------------------------------------------------------- |
| **Jest unit tests**   | 10 suites, **60 tests passed** (was 39)                   |
| **Angular build**     | Clean build, zero errors (2 pre-existing budget warnings) |
| **Pytest functional** | 138 passed, 2 skipped                                     |
| **Pytest security**   | All passing                                               |
