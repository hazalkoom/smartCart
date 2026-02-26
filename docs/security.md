# Security

This document describes SmartCart's security controls, hardening measures, and the threat surface that was addressed during the codebase audit. It is intended for developers, security reviewers, and anyone evaluating the platform's security posture.

---

## 1) Authentication

### JWT Bearer Tokens

- All protected endpoints require `Authorization: Bearer <token>`.
- Tokens are signed with `JWT_SECRET` (env var) and expire per `JWT_EXPIRE`.
- Token generation uses `jsonwebtoken.sign()` with the user ID as payload.

### Password Storage

- Passwords are hashed using **bcrypt** with configurable salt rounds (`BCRYPT_ROUNDS` env var, default 12).
- The `pre('save')` Mongoose hook hashes passwords automatically.
- Passwords are **never returned** in API responses (excluded via `select: false`).

### Password Reset Flow

- `POST /auth/forgot-password` generates a random reset token, hashes it with SHA-256, and stores it with an expiry.
- `POST /auth/reset-password/:token` accepts the raw token, hashes it, and matches against the stored hash.
- Token comparison is safe against timing attacks because the lookup is by hash (DB query), not string comparison.

---

## 2) Authorization (RBAC)

### Role Hierarchy

| Role       | Capabilities                                                          |
| ---------- | --------------------------------------------------------------------- |
| `customer` | Browse, cart, checkout, orders (own), reviews                         |
| `admin`    | All customer capabilities + catalog management + order status updates |
| `owner`    | All admin capabilities + user management + product deletion           |

### Middleware Chain

1. `protect` — verifies JWT, attaches `req.user`
2. `authorize(...roles)` — checks `req.user.role` against allowed list

### Safeguards

- Owner cannot delete themselves.
- Owner account cannot have its role changed.
- Deleted/nonexistent users referenced by valid JWTs get a generic "Not authorized" error (prevents user enumeration).

---

## 3) Input Validation

### Express-Validator Rules

- Applied at the **route level** before controllers execute.
- Covers required fields, type checks, length limits, and format validation.

### Email Regex (ReDoS-Safe)

- The validation middleware uses a linear-time email regex pattern.
- The user model's regex was updated to match, preventing catastrophic backtracking.

### Payload Size Limit

- JSON body parsing is limited to `10kb` via `express.json({ limit: '10kb' })`.

---

## 4) API Security Headers

### Helmet

- `helmet()` middleware sets security headers including:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options`
  - `Strict-Transport-Security` (when behind TLS)
  - `X-XSS-Protection`
  - Content-Security-Policy defaults

### CORS

- Origin whitelist configured via `CORS_ORIGIN` environment variable.
- No longer using `cors()` with allow-all defaults.

### Rate Limiting

- `express-rate-limit` is enabled in production mode.

---

## 5) Payment Security (Paymob)

### HMAC Webhook Verification

- Paymob sends a webhook with an `hmac` query parameter.
- The backend reconstructs the HMAC by concatenating specific fields from the transaction object in a defined order, then computing SHA-512 with the shared secret.
- **Timing-safe comparison**: Uses `crypto.timingSafeEqual()` on Buffer objects to prevent side-channel timing attacks.
- Invalid HMAC returns 403; valid but failed transactions return 200 (to stop Paymob retries) without mutating the order.

### Idempotency

- The webhook handler checks `order.isPaid` before updating.
- Already-paid orders are acknowledged (200) but not re-processed.
- Order mutation uses `findOneAndUpdate` with `$set` for atomicity.

### Double-Payment Prevention

- The `payOrder` controller checks `order.isPaid` before initiating payment.
- If the order is already paid, it returns 400 "Order is already paid".

---

## 6) Data Protection

### Sensitive Data in Logs

- MongoDB connection strings are **not logged** (removed from `mongoDataBaseConnection.js`).
- JWT tokens are **not included** in error messages.
- `console.error` with request/error details is gated behind `NODE_ENV !== 'production'`.
- Stack traces are only returned to clients in development mode.

### Swagger UI

- API documentation (`/api-docs`) is only mounted when `NODE_ENV !== 'production'`.

### Frontend Console Hygiene

- All debug `console.log` statements removed from production code.
- Error-handler `console.error` calls gated behind `!environment.production`.
- `environment.prod.ts` with `production: true` is swapped in at build time via `fileReplacements`.

---

## 7) Infrastructure Security

### Environment Variable Validation

- On startup, the server validates that required env vars (`MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE`) are present.
- Missing vars cause the process to exit with a clear error message rather than failing cryptically at runtime.

### Graceful Shutdown

- `SIGTERM` and `SIGINT` handlers close the HTTP server and Mongoose connection cleanly.
- Prevents orphaned connections and data corruption during deployments.

### MongoDB Transactions

- Order creation uses Mongoose transactions with automatic retry on transient errors.
- Ensures inventory decrement + order creation + cart clearing are atomic.

---

## 8) Frontend Security

### Route Guards

- Protected routes (`/cart`, `/checkout`, `/account`, `/orders/:id`) require authentication via `authGuard`.
- Admin routes require `adminGuard`; owner routes require `ownerGuard`.

### Auth Interceptor

- Automatically attaches `Authorization: Bearer <token>` to all outgoing HTTP requests.

### Error Interceptor

- **401**: Clears stored token, redirects to login.
- **403**: Redirects to home.
- **500+**: Logs in dev only.
- **0 (network error)**: Logs in dev only — no redirect.

### SSR Safety

- Components that access `window`, `document`, or `localStorage` use `isPlatformBrowser()` guards.
- Prevents Node.js crashes during server-side rendering.

---

## 9) Security Test Coverage

### Automated Security Tests (`tests/security/`)

- `test_security.py` — RBAC enforcement, token tampering, injection attempts
- `test_hardening.py` — security headers, payload limits, rate limiting
- `test_advanced.py` — advanced attack patterns
- `test_webhook.py` — HMAC bypass attempts, replay attacks

### Unit Tests for Security-Critical Code

- `webhookController.test.js` — HMAC verification, idempotency, order mutation atomicity
- `authService.test.js` — password hashing, token generation, credential validation
- `userModel.test.js` — bcrypt pre-save hook behavior

---

## 10) Known Limitations

1. **No CSRF protection** — the API is token-based (not cookie-based), so CSRF is not applicable for API consumers. If cookies are ever used for auth, CSRF tokens must be added.
2. **No dependency scanning** — no automated SAST or SCA pipeline. Consider adding `npm audit` and Snyk/Dependabot.
3. **No WAF/CDN** — assumed to be handled at the infrastructure level (not in this repo).
4. **Rate limiting is production-only** — dev environments are not rate-limited.
5. **Email delivery is not implemented** — password reset tokens are returned in the response for testing. In production, these must be sent via email only.
