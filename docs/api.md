# API
 
 This document describes SmartCart’s REST API surface and conventions, based on the backend implementation under `backend/src/` and the system/security test suite in `tests/`.
 
 ## 1) Base URL and versioning
 - **API base path**: `/api/v1`
 - **Local default base URL (tests)**: `http://localhost:5000/api/v1`
 
 ### Versioning strategy (implemented)
 - Versioning is **path-based** (`/api/v1`).
 - Breaking changes should be introduced via a new version prefix (e.g., `/api/v2`) to preserve existing clients.
 
 ## 2) API documentation (Swagger)
 - Swagger UI is served at: `http://localhost:5000/api-docs`
 - OpenAPI is generated from route files (`backend/src/config/swagger.js` reads `backend/src/routes/*.js`).
 
 ## 3) Authentication model
 
 ### 3.1 JWT bearer tokens (implemented)
 - Protected endpoints require:
 
 ```http
 Authorization: Bearer <token>
 ```
 
 - Tokens are signed using `JWT_SECRET`.
 
 ### 3.2 Roles and authorization (implemented)
 The platform enforces role-based access control (RBAC) with these roles:
 - `customer`
 - `admin`
 - `owner`
 
 Authorization is enforced by middleware:
 - `protect` (JWT authentication)
 - `authorize(...roles)` (role allowlist)
 
 #### Role rules (summary)
 - **Customer**: can access their own cart, orders, profile, and create reviews.
 - **Admin**: can manage categories/products and update order statuses.
 - **Owner**: includes all admin capabilities plus user management.
 
 ## 4) Request/response conventions
 
 ### 4.1 Content type
 - Requests and responses use JSON.
 - JSON body size is limited (configured as `10kb`).
 
 ### 4.2 Success envelope (implemented)
 Many endpoints return a success envelope:
 
 ```json
 {
   "success": true,
   "data": { "...": "..." }
 }
 ```
 
 Some endpoints may include additional fields (`message`, `count`, pagination metadata), depending on the route.
 
 ### 4.3 Error envelope (implemented)
 From `backend/src/middleware/errorMiddleware.js`:
 
 ```json
 {
   "success": false,
   "error": {
     "code": "ERROR_CODE",
     "message": "Human-readable message"
   }
 }
 ```
 
 #### Error code semantics
 Error codes are stable identifiers intended for clients to branch on.
 Examples observed in the error handler include:
 - `VALIDATION_ERROR`
 - `DUPLICATE_FIELD`
 - `INVALID_CREDENTIALS`
 - `TOKEN_MISSING`, `TOKEN_INVALID`
 - `FORBIDDEN`
 - `NOT_FOUND`
 - `INSUFFICIENT_STOCK`
 - `CART_EMPTY`
 
 ### 4.4 Validation (implemented)
 - Request validation is applied at the **route level** via `express-validator`.
 - Validation failures return `400` with a `VALIDATION_ERROR`-style code.
 
 ## 5) Pagination and filtering conventions
 
 ### 5.1 Pagination (implemented where present)
 - Product listing supports `page` and `limit`.
 - Owner user listing supports `page` and `limit`.
 
 The exact response envelope may include page metadata (see the corresponding service implementation).
 
 ### 5.2 Filtering (implemented where present)
 **Products** supports:
 - `keyword`: case-insensitive search on name and SKU
 - `category`: filter by category id
 - `stockStatus`: `low` (stock < 10 and > 0) or `out` (stock = 0)
 
 ## 6) Endpoints
 
 ### 6.1 Health
 - `GET /health`
   - Purpose: liveness check
   - Auth: public
 
 ### 6.2 Auth (`/auth`)
 - `POST /auth/register`
 - `POST /auth/login`
 - `GET /auth/me` (protected)
 - `PUT /auth/updatedetails` (protected)
 - `POST /auth/forgot-password`
 - `POST /auth/reset-password/:token`
 
 Notes:
 - Password reset token generation exists; email delivery is not evidenced in this repo (token is returned in response for testing).
 
 ### 6.3 Categories (`/categories`)
 - `GET /categories` (public)
 - `GET /categories/:slug` (public)
 - `POST /categories` (admin/owner)
 - `PUT /categories/:id` (admin/owner)
 - `DELETE /categories/:id` (admin/owner)
 
 ### 6.4 Products (`/products`)
 - `GET /products` (public)
 - `GET /products/:slug` (public)
 - `POST /products` (admin/owner)
 - `PUT /products/:id` (admin/owner)
 - `DELETE /products/:id` (owner) — soft delete
 
 Notes:
 - Deletion is implemented as a **soft delete** (`isDeleted=true`) and uniqueness constraints are preserved by mutating `sku` and `slug`.
 
 ### 6.5 Cart (`/cart`) (protected)
 - `GET /cart`
 - `POST /cart/items`
 - `PUT /cart/items/:itemId`
 - `DELETE /cart/items/:itemId`
 - `DELETE /cart` (clear cart)
 
 Notes:
 - Cart operations enforce stock checks and maintain a server-side subtotal.
 - Item price is locked at the time it is added to the cart.
 
 ### 6.6 Orders (`/orders`) (protected)
 - `POST /orders` (create from cart)
 - `GET /orders/my`
 - `GET /orders/:id` (customer can access own; admin/owner can access any)
 - `GET /orders` (admin/owner)
 - `PATCH /orders/:id/status` (admin/owner)
 - `POST /orders/:id/pay` (initiate Paymob payment)
 
 Notes:
 - Order creation uses a MongoDB transaction.
 - Status transitions are enforced (e.g., cannot ship an unpaid order).
 - Cancellation restocks inventory.
 
 ### 6.7 Reviews (`/reviews`)
 - `GET /reviews` (public; expects `productId` query parameter)
 - `POST /reviews` (customer)
 - `PATCH /reviews/:id` (customer/admin)
 - `DELETE /reviews/:id` (customer/admin/owner)
 
 Notes:
 - One review per user per product is enforced by a unique index.
 - Product rating and review count are recalculated via aggregation hooks.
 
 ### 6.8 Users (`/users`) (owner-only)
 - `GET /users` (pagination supported)
 - `GET /users/:id`
 - `PUT /users/:id` (update role)
 - `DELETE /users/:id`
 
 Safeguards (implemented):
 - Prevent changing/deleting the owner account.
 - Prevent the owner deleting themselves.
 
 ## 7) Implemented vs assumed
 - Implemented endpoints and behaviors above are backed by backend source and the test suite.
 - Production deployment concerns (TLS termination, domain routing, WAF/CDN, secret management) are **assumed external** and not implemented as infra code in this repository.
