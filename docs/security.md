# Security

This document describes the security controls that are present in the current SmartCart codebase.

## Authentication

- Protected API routes expect Authorization: Bearer <token>.
- JWTs are signed with JWT_SECRET and use JWT_EXPIRE from environment variables.
- Passwords are hashed in a Mongoose pre-save hook using bcryptjs.
- The current implementation uses bcrypt.genSalt(10) in the model hook.

## Authorization

Roles defined in the user model are:

- customer
- admin
- owner

Backend route protection is composed from:

- protect: validates the token and loads req.user
- authorize(...roles): restricts access by role

Important safeguards in the code:

- non-owner users cannot be promoted to owner through normal user updates
- owners cannot create another owner account through POST /users
- owners cannot delete themselves
- owner accounts cannot be deleted

## Input validation

- express-validator is used on product, cart, order, review, and payment routes
- invalid payloads return 400 with aggregated validation messages
- product and category validation includes ObjectId checks where required
- order creation currently validates shippingAddress.street, shippingAddress.city, and shippingAddress.country
- wallet payments validate Egyptian mobile number format when mobileNumber is provided

## API hardening

- Helmet is enabled globally.
- CORS is enabled with origin set from CORS_ORIGIN or defaulting to http://localhost:4200.
- express.json is configured with a 50kb payload limit.
- express-rate-limit is enabled only when NODE_ENV is production.
- Swagger UI is disabled in production.

## Payment security

- Paymob webhook processing is publicly reachable but protected by HMAC verification logic.
- Already-paid orders are not re-processed.
- payOrder blocks payment attempts for orders that are already paid.
- wallet payments require a mobile number from the request or saved user profile.

## Data protection and logging

- MongoDB connection credentials are not logged.
- Startup fails fast if JWT_SECRET, JWT_EXPIRE, or MONGODB_URI is missing.
- The backend still contains a few direct console.error or console.log calls in payment and webhook error paths, so console output is not fully centralized.
- The frontend error interceptor only logs network and 5xx errors in development mode.

## Frontend security behavior

- AuthInterceptor injects the bearer token into outgoing HTTP requests.
- authGuard protects customer routes such as cart, checkout, account, wishlist, and order detail.
- guestGuard keeps authenticated users away from login and register.
- AdminGuard protects the admin area.
- OwnerGuard protects the admin users route.
- ErrorInterceptor only logs a user out on some token-related 401 cases. It does not redirect all 403 responses.
- Browser-only code paths are guarded with isPlatformBrowser where needed for SSR safety.

## Known limitations

- The Paymob redirect endpoint is hardcoded to http://localhost:4200/payment-callback.
- No CSRF mitigation is implemented because auth is bearer-token based, not cookie-based.
- No dependency-scanning or SAST pipeline is defined in this repository.
- Python security tests exist, but they were not re-run during this documentation refresh.
