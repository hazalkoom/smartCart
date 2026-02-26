# Features

This document describes SmartCart’s **user-facing capabilities** and **operator workflows**. It is grounded in the backend implementation (`backend/src/*`) and the automated system/security test suites (`tests/functional`, `tests/security`).

For endpoint-level detail, see [`docs/api.md`](api.md).

## Personas

- **Customer**: shops, checks out, reviews.
- **Admin**: manages catalog and order fulfillment.
- **Owner**: top-level operator; can manage users/roles.

## Customer capabilities

### Account access

Customers can:

- Create an account (register)
- Sign in (login)
- Retrieve their profile
- Update basic profile details
- Initiate password reset and set a new password
- Add/remove products in a personal wishlist
- Save and delete shipping addresses for faster checkout

Constraints / edge cases:

- Passwords are hashed and never returned.
- Password reset tokens are generated server-side; **email delivery is not evidenced** in this repo (tokens are returned for testing).
- Saved addresses are user-scoped and include alias/street/city/postalCode/country (plus optional default flag).

### Browse catalog

Customers can:

- View categories (for navigation)
- View products (listing)
- Filter/search products (keyword, category, stock status)
- Open a product details view by slug

Constraints / edge cases:

- Products can be **soft-deleted**; soft-deleted products are excluded from standard queries.

### Cart workflow

Customers can:

- Create and maintain a shopping cart
- Add products to cart
- Increase/decrease quantities
- Remove items
- Clear the cart

Constraints / edge cases:

- **Stock is validated** on add and quantity updates.
- **Price is locked** when an item is added to cart; later product price changes do not retroactively change cart line item prices.
- The backend maintains a server-side cart `subtotal` and recalculates it after modifications.

### Checkout & order lifecycle

Customers can:

- Create an order from the current cart
- View their order history
- View details for an individual order

Constraints / edge cases:

- Order creation is transactional: inventory decrement and cart clearing occur atomically.
- Access control: customers can only view their own orders.

### Payments (Paymob)

Customers can initiate payment for an order using:

- **Card** (returns an iframe URL)
- **Wallet** (returns a redirect URL)
- **Fawry** (returns a bill reference code)

Constraints / edge cases:

- Paymob integration requires environment variables (see [`docs/setup.md`](setup.md)).
- Mobile wallet payments may require the customer to have a mobile number in their profile.
- Webhook authenticity is validated using HMAC.

### Reviews

Customers can:

- List reviews for a product
- Create a review for a product
- Update their own review
- Delete their own review

Constraints / edge cases:

- A customer can submit **only one review per product** (enforced by a unique index).
- Product `rating` and `reviewCount` are recalculated after review create/update/delete.

## Admin capabilities

### Catalog operations

Admins can:

- Create, update, delete categories
- Create and update products
- View product listing like customers

Constraints / edge cases:

- Product deletion is **owner-only** and implemented as soft delete.

### Order operations

Admins can:

- View all orders
- Update order status for fulfillment

Constraints / edge cases:

- Order status transitions are validated (e.g., shipping requires paid status).
- Cancelling an order restocks inventory.

## Owner capabilities

### Everything an admin can do

Owner includes all admin capabilities.

### User management (owner-only)

Owners can:

- List users (paginated)
- View an individual user
- Update a user’s role
- Delete a user

Constraints / edge cases:

- Safeguards prevent deleting the owner account.
- Safeguards prevent the owner deleting themselves.

## What is not claimed here

- A separate Python ML microservice is **not implemented** in this repository.
- The Angular frontend builds and compiles successfully; SSR safety, route guards, error handling, and console hygiene were applied during the codebase hardening audit. However, automated E2E UI tests (Cypress/Playwright) are not present.

## Cross-cutting hardening (applied during audit)

The following improvements span all personas:

- **Security headers** (helmet), CORS origin whitelist, rate limiting in production.
- **Input validation** at the route level with ReDoS-safe regex patterns.
- **HMAC timing-safe comparison** on Paymob webhook callbacks.
- **Env var validation** on startup with fail-fast.
- **Graceful shutdown** on SIGTERM/SIGINT.
- **Frontend SSR guards** preventing Node.js crashes from browser-only APIs.
- **Error interceptor** for consistent 401/403/5xx handling on the client.

See [`docs/security.md`](security.md) for full security controls and [`docs/changelog.md`](changelog.md) for the complete audit trail.
