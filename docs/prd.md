# Product Requirements Document (PRD)
## SmartCart (inferred from implementation)

**Document purpose**: This PRD defines SmartCart as a product based strictly on what is implemented and verified in this repository. Where the implementation is ambiguous or absent, this PRD calls it out explicitly as an **assumption**, **constraint**, or **open question**.

**Authoritative sources**:
- Backend source: `backend/src/*`
- Backend unit tests: `backend/tests/unit/*`
- System/security tests: `tests/functional/*`, `tests/security/*`
- API conventions: [`docs/api.md`](api.md)
- Delivery status: [`docs/status.md`](status.md)

---
## 1) Executive summary
SmartCart is a full-stack e-commerce platform built around a production-grade backend API. It supports a multi-role model (customer/admin/owner), core commerce workflows (catalog -> cart -> checkout -> orders), customer wishlist and saved addresses, product reviews, and Paymob payment initiation with webhook verification.

The system is designed to be:
- **Secure by default** (RBAC, JWT, hardened middleware, validated inputs)
- **Operationally predictable** (centralized error handling and logging)
- **Testable** (unit + system + security test suites)

The backend is verified by automated tests; the frontend exists but is not verified end-to-end in this documentation pass.

---
## 2) Product vision

### 2.1 Vision statement
Provide a reliable and secure commerce backend and a corresponding web frontend foundation that can power a small-to-medium online store with modern operational controls.

### 2.2 Product principles
- **Security is a feature**: do not ship admin capabilities without explicit RBAC.
- **Data integrity over convenience**: checkout must be transactional (stock + cart + order).
- **Predictable APIs**: stable error semantics and versioned base path.
- **Test-backed delivery**: key workflows must have automated coverage.

---
## 3) Target users & personas

### P1: Customer
**Goal**: purchase products with confidence.
- Browse catalog
- Manage cart
- Checkout and track orders
- Review products

**Constraints**:
- Can only access their own cart and orders.

### P2: Admin (store operator)
**Goal**: run day-to-day store operations.
- Maintain catalog (categories/products)
- Fulfill orders via status transitions

**Constraints**:
- Cannot perform owner-only user management.

### P3: Owner (business owner)
**Goal**: full administrative control with safety rails.
- All admin capabilities
- Manage users and roles

**Constraints**:
- Safeguards prevent deleting the owner account or self-deletion.

---
## 4) User journeys & workflows

This section expresses the product as real workflows rather than endpoints.

### J1: Customer registration and sign-in
1. Customer registers with email/password/name.
2. Customer logs in.
3. Customer can fetch profile.
4. Customer can manage wishlist items and saved shipping addresses.

Success criteria:
- Customer receives a JWT token.
- Protected endpoints require the token.

### J2: Catalog discovery
1. Customer lists categories.
2. Customer lists products (supports search/filter/pagination).
3. Customer opens product details by slug.

Success criteria:
- Results exclude soft-deleted products.
- Filtering behaves consistently.

### J3: Add to cart and manage cart
1. Customer adds a product to cart with quantity.
2. Customer adjusts quantities.
3. Customer removes items / clears cart.

Constraints:
- Stock is validated.
- Price is locked at add-to-cart time.

### J4: Checkout and order creation
1. Customer provides shipping address.
2. Customer creates order from cart.
3. System reduces stock and clears cart atomically.

Constraints:
- Requires MongoDB transactions.

### J5: Payment initiation (Paymob)
1. Customer initiates payment for an order.
2. System returns action information:
  - card: iframe URL
  - wallet: redirect URL
  - fawry: bill reference
3. Paymob webhooks call backend; authenticity validated via HMAC.

Constraints:
- Env vars required for Paymob integration.
- Wallet payments may require a mobile number.

### J6: Post-purchase review
1. Customer creates a review for a product.
2. Product rating and review count update.
3. Customer can update/delete own review.

Constraints:
- One review per user per product.

### J7: Admin operations
1. Admin creates/updates categories.
2. Admin creates/updates products.
3. Admin views all orders and updates statuses.

Constraints:
- Owner-only product deletion.
- Status transitions enforced.

### J8: Owner user management
1. Owner lists users (paginated).
2. Owner updates roles.
3. Owner deletes a user.

Constraints:
- Owner cannot delete themselves.
- Owner account is protected.

---
## 5) Functional requirements (grouped and numbered)

### 5.1 Identity, authentication, and authorization
- **FR-IA-1**: Users can register with email, password, first name, and last name.
- **FR-IA-2**: Users can log in using email/password.
- **FR-IA-3**: The system issues a JWT token on successful authentication.
- **FR-IA-4**: Protected endpoints require `Authorization: Bearer <token>`.
- **FR-IA-5**: The system supports roles: `customer`, `admin`, `owner`.
- **FR-IA-6**: The system enforces RBAC for privileged endpoints.
- **FR-IA-7**: Users can fetch their own profile.
- **FR-IA-8**: Users can update first and last name in their profile.
- **FR-IA-9**: Users can initiate forgot-password and reset-password flows.
- **FR-IA-10**: Authenticated users can toggle products in their wishlist.
- **FR-IA-11**: Authenticated users can list wishlist products.
- **FR-IA-12**: Authenticated users can add saved addresses.
- **FR-IA-13**: Authenticated users can delete saved addresses.

Notes:
- Email delivery for password reset is **not** evidenced in this repo.

### 5.2 Catalog
- **FR-CAT-1**: Users can list categories.
- **FR-CAT-2**: Users can retrieve a category by slug.
- **FR-CAT-3**: Admin/owner can create categories.
- **FR-CAT-4**: Admin/owner can update categories.
- **FR-CAT-5**: Admin/owner can delete categories.
- **FR-PROD-1**: Users can list products.
- **FR-PROD-2**: Product listing supports search/filter/pagination (as implemented).
- **FR-PROD-3**: Users can retrieve product details by slug.
- **FR-PROD-4**: Admin/owner can create products.
- **FR-PROD-5**: Admin/owner can update products.
- **FR-PROD-6**: Owner can soft-delete products.

### 5.3 Cart
- **FR-CART-1**: Customers can retrieve their cart.
- **FR-CART-2**: Customers can add items to cart.
- **FR-CART-3**: Customers can update item quantities.
- **FR-CART-4**: Customers can remove items.
- **FR-CART-5**: Customers can clear their cart.
- **FR-CART-6**: System validates stock for cart operations.
- **FR-CART-7**: System locks item price at the time of add-to-cart.
- **FR-CART-8**: System maintains a server-side subtotal.

### 5.4 Orders
- **FR-ORD-1**: Customers can create orders from their cart.
- **FR-ORD-2**: Order creation is atomic: stock decrement + cart clearing.
- **FR-ORD-3**: Customers can list their orders.
- **FR-ORD-4**: Customers can view order details for their own orders.
- **FR-ORD-5**: Admin/owner can list all orders.
- **FR-ORD-6**: Admin/owner can update order status.
- **FR-ORD-7**: Status transitions are validated (no skipping steps).
- **FR-ORD-8**: Cancelling an order restocks inventory.

### 5.5 Payments (Paymob)
- **FR-PAY-1**: Customers can initiate payment for an order.
- **FR-PAY-2**: Supported methods: `card`, `wallet`, `fawry`.
- **FR-PAY-3**: Card payments return an iframe URL.
- **FR-PAY-4**: Wallet payments return a redirect URL.
- **FR-PAY-5**: Fawry payments return a bill reference.
- **FR-PAY-6**: Webhook endpoint validates authenticity using HMAC secret.

### 5.6 Reviews
- **FR-REV-1**: Users can list reviews for a product.
- **FR-REV-2**: Customers can create a review.
- **FR-REV-3**: A user can submit at most one review per product.
- **FR-REV-4**: Users can update their own reviews.
- **FR-REV-5**: Users can delete their own reviews; admins/owners can delete reviews.
- **FR-REV-6**: Product rating and review count are recalculated after review changes.

### 5.7 Owner-only user management
- **FR-OWN-1**: Owner can list users (paginated).
- **FR-OWN-2**: Owner can view a user.
- **FR-OWN-3**: Owner can update user profile fields and role (with safeguards).
- **FR-OWN-4**: Owner can delete users.
- **FR-OWN-5**: System prevents deleting/changing the owner account.
- **FR-OWN-6**: System prevents the owner from deleting themselves.

---
## 6) Non-functional requirements

### 6.1 Security
- **NFR-SEC-1**: Passwords are hashed and never returned.
- **NFR-SEC-2**: RBAC is enforced on privileged endpoints.
- **NFR-SEC-3**: Input validation is applied at route boundaries.
- **NFR-SEC-4**: Webhook authenticity is validated via HMAC.
- **NFR-SEC-5**: API avoids leaking internal stack traces in responses (centralized error handling).

### 6.2 Reliability
- **NFR-REL-1**: Checkout operations maintain data integrity (transactional flow).
- **NFR-REL-2**: Error responses use a stable envelope and error codes.

### 6.3 Performance
- **NFR-PERF-1**: The system provides a foundation for performance testing (Locust scripts exist).

Constraints:
- Concrete latency SLOs are not defined in this repository.

### 6.4 Scalability
- **NFR-SCALE-1**: Backend API should remain stateless with horizontal scaling potential (JWT-based auth).

Constraint:
- No container/orchestration manifests are included in this repo.

### 6.5 Observability
- **NFR-OBS-1**: Requests are logged via Morgan/Winston.
- **NFR-OBS-2**: Most API errors are handled centrally; some payment and webhook paths still log directly.

---
## 7) Data & domain model overview

SmartCart uses MongoDB via Mongoose.

Key entities (as implemented):
- **User**
  - `email`, `password` (hashed), `role`, name fields
  - optional `mobileNumber`
  - password reset token fields
- **Category**
  - `name`, `slug`, `description`
- **Product**
  - `name`, `slug`, `description`, `price`, `costPrice` (hidden by default)
  - `sku` (unique), `stock`, `categoryId`
  - `featured`, `images`, soft-delete flag
  - rating aggregates: `rating`, `reviewCount`
- **Cart**
  - `userId`, `items[]` (product, quantity, locked price), `subtotal`
- **Order**
  - `userId`, `orderNumber`, `items[]` (includes `cost` snapshot)
  - `shippingAddress`, totals, status timestamps
  - payment tracking fields
- **Review**
  - unique index on (`productId`, `userId`)
  - triggers aggregate updates for product ratings

---
## 8) Assumptions & constraints
- **Secrets management** is external to this repository.
- **Email delivery** is not implemented for password reset (token returned for testing).
- **MongoDB transactions** require a topology that supports them.
- **Frontend verification** is not included in this documentation pass.

---
## 9) Out of scope (as of this repo)
- Standalone ML microservice (FastAPI) is not present.
- Image upload/storage integrations are not evidenced.
- End-to-end frontend test coverage is not present.

---
## 10) Risks & open questions

### Risks
- **Operational config drift**: missing `.env.example` increases onboarding risk.
- **Transaction dependency**: checkout depends on MongoDB transaction support.
- **Payment correctness**: payment flows are high-risk and require careful idempotency and replay handling.

### Open questions (non-blocking)
- What is the intended production deployment model (single VM, container, managed platform)?
- What is the expected frontend completion level and timeline?
- Are email notifications required for password reset and order confirmations?

---
## 11) Success metrics / KPIs
The repository does not define KPIs; the following are recommended product-grade metrics:
- **Checkout conversion rate**: cart → order created
- **Payment success rate**: initiated → paid
- **Order fulfillment lead time**: paid → shipped → delivered
- **API reliability**: error rate by endpoint and error code
- **Security**: zero critical auth/RBAC regressions (gated by security tests)

---
## 12) Future phases & extensibility

This section does not add new commitments; it frames extensibility aligned to the existing architecture.

- **Phase A: Production hardening**
  - Formalize env templates, operational readiness checks, and logging retention.
- **Phase B: Frontend end-to-end confidence**
  - Complete and verify UI workflows; add UI e2e tests.
- **Phase C: Payment maturity**
  - Strengthen idempotency and operational tooling for payment flows.
- **Phase D: Optional services**
  - Add separate services (e.g., ML) only with stable contracts and isolated deployment.
