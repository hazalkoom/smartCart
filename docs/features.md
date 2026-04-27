# Features

SmartCart feature inventory, grouped by user area.

## Customer-facing features

### Authentication and profile

- Register and login with JWT authentication.
- Password reset flow.
- Profile update endpoint.
- Saved address management.

### Catalog and discovery

- Category listing and category detail.
- Product listing with filtering and sorting.
- Product details by slug.
- Gift Finder route and UI flow.

### Cart and checkout

- Add/update/remove cart items.
- Cart subtotal and quantity management.
- Overselling protection with stock checks.
- Checkout order creation from cart.

### Payments

- Paymob payment initiation endpoint.
- Card, wallet, and fawry payment method integration.
- Webhook-based payment confirmation.

### Orders

- Customer order history endpoint.
- Customer order details with ownership checks.
- Payment callback route in frontend.

### Reviews

- Create review (customer).
- Update/delete review with ownership/admin guards.
- Product review listing.

### Wishlist

- Add/remove wishlist products.
- Fetch wishlist items.

### Notifications

- Realtime notification delivery via Socket.IO.
- Persistent notification storage in backend.
- API support for list, mark-read, mark-all-read, clear-all.
- Frontend reconnect hydration to avoid missed events.

### Countries support

- Canonical country list served from backend endpoint.
- Frontend country hydration service with fallback constants.
- Backend normalization helper for country code/name inputs.

## Admin and owner features

### Admin dashboard access

- Protected admin route module.
- Role guards for admin and owner sections.

### Order operations

- Fetch all orders (admin/owner).
- Update order status with transition checks.
- Status changes emit persisted + realtime notifications.

### Product and category management

- Create, update, and delete categories (admin/owner).
- Create and update products (admin/owner).
- Owner-only soft-delete for products.

### User management

- List and read users (admin/owner).
- Owner-only create, update, and delete users.

## Platform and operational features

### Background processing

- BullMQ worker for cart-expiration handling.
- Redis lock bookkeeping and release paths.

### API quality and safety

- Structured error envelope via middleware.
- Validation middleware for request contracts.
- Helmet and CORS middleware baseline.
- Production-only API rate limiter.

### API docs

- Swagger UI available in non-production mode.

### Observability and health

- Request logging with morgan + logger stream.
- Health endpoint under /api/v1/health.

### Security automation

- CI workflow for backend/frontend/python checks.
- Trivy scan workflow (vuln + config + secrets) with SARIF and SBOM artifacts.
- CodeQL workflow for JavaScript analysis.

## Current known limitations

- Paymob redirect helper currently hardcodes localhost frontend callback URL.
- No dedicated audit trail store for admin state transitions beyond notifications/logs.
- Some security medium findings may remain and should be triaged iteratively.
