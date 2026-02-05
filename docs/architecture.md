# Architecture
 
 This document describes SmartCart’s architecture as implemented in this repository. It is written to be a practical reference for contributors and operators.
 
 ## 1) System context
 SmartCart is a commerce platform providing:
 - **A REST API** (Node.js/Express) for authentication, catalog, cart, orders, reviews, user administration, and Paymob payment flows.
 - **A web frontend** (Angular SSR) intended to consume the API.
 - **A test harness** that validates behavior over HTTP (pytest) and at the service/model level (Jest).
 
 ### Primary personas (for architectural reasoning)
 - **Customer**: shops, checks out, reviews products.
 - **Admin**: manages catalog and order fulfillment.
 - **Owner**: top-level operator; can also manage users and roles.
 
 ## 2) Repository structure and separations
 SmartCart is organized as three main “systems” in one repo:
 
 - **Backend** (`backend/`)
   - Authoritative business logic and data access.
 - **Frontend** (`frontend/`)
   - Angular SSR UI (not fully verified end-to-end in this documentation pass).
 - **Tests** (`tests/`)
   - External/system tests that treat the backend as a black box HTTP service.
 
 This separation is important:
 - backend changes must preserve **API contracts** and **security boundaries**
 - frontend changes should be treated as a client of the API
 - system tests are a contract suite for the API
 
 ## 3) Logical architecture (backend domains)
 The backend uses a **Service Layer** pattern:
 - **Routes** (`backend/src/routes/*`) define HTTP paths + attach middleware.
 - **Controllers** (`backend/src/controllers/*`) are thin orchestration for request/response.
 - **Services** (`backend/src/services/*`) hold domain logic and cross-model orchestration.
 - **Models** (`backend/src/models/*`) define persistence schema (Mongoose).
 
 ### Domains and responsibilities
 - **Identity & Access**
   - Users, JWT auth, roles (`customer`/`admin`/`owner`)
   - Password hashing + reset token flow
 - **Catalog**
   - Categories (slug-based reads)
   - Products (listing, filtering, soft delete)
 - **Cart**
   - One cart per user, line items, subtotal
   - Stock validation; price locking when added to cart
 - **Orders**
   - Transactional checkout from cart
   - Inventory decrement + cart clearing
   - Strict order status transitions; cancellation restocks
 - **Reviews**
   - One review per user/product
   - Aggregated product rating and review count
 - **Payments (Paymob)**
   - Payment initiation for card/wallet/Fawry
   - Webhook verification via HMAC
 - **Owner operations**
   - User listing (pagination)
   - Role changes + deletion safeguards
 
 ## 4) Runtime architecture (processes and data flows)
 
 ### 4.1 Processes
 In a typical development runtime:
 - **Backend API process**
   - Entry point: `backend/src/server.js`
 - **Frontend dev server / SSR server**
   - Entry point: Angular CLI (see `frontend/angular.json`)
 - **MongoDB**
   - External dependency configured via `MONGODB_URI`
 
 ### 4.2 Request flow (API)
 1. Client calls `http://<host>:<port>/api/v1/...`
 2. Router applies middleware:
    - `helmet`, JSON body size limit
    - `protect` (JWT) and `authorize` (RBAC) where required
    - `express-validator` rules + `validate`
 3. Controller invokes a domain service
 4. Service reads/writes MongoDB via Mongoose models
 5. Errors propagate to a centralized error handler returning a stable JSON envelope
 
 ### 4.3 Order checkout flow (transactional)
 Implemented in `backend/src/services/orderService.js`:
 - Reads cart
 - Validates stock
 - Builds an order snapshot (including item cost for owner analytics)
 - Bulk-updates product inventory
 - Creates order
 - Deletes cart
 - Uses `mongoose.startSession()` and a transaction with retry on transient errors
 
 ## 5) Trust boundaries and security boundaries
 
 ### 5.1 Boundary: public internet → API
 - **Trust boundary**: all inputs are untrusted.
 - Controls:
   - Request validation (route-level)
   - Payload limit (`10kb`)
   - Security headers (`helmet`)
   - Rate limiting in production mode (`express-rate-limit`)
 
 ### 5.2 Boundary: authenticated user → privileged actions
 - **Authentication**: JWT via `Authorization: Bearer <token>`.
 - **Authorization**: role checks via `authorize('admin', 'owner')` etc.
 - Owner-only routes (e.g., `/api/v1/users`) enforce `authorize('owner')` for all operations.
 
 ### 5.3 Boundary: external payment provider → webhook
 - Webhook endpoints under `/webhook/*` are expected to be called by Paymob.
 - Authenticity is validated via HMAC secret.
 - Assumption: a secure secret distribution mechanism exists outside this repo (because `.env` is gitignored).
 
 ## 6) Deployment and environment assumptions
 - Backend configuration is provided via environment variables (loaded from `backend/.env` in development).
 - MongoDB must support transactions for the checkout flow.
   - Constraint: MongoDB transactions typically require a **replica set** configuration.
 - CORS:
   - The backend uses `cors` dependency. Concrete allowed origins configuration is not described in these docs because it is not shown in the inspected runtime entrypoint.
 
 ## 7) Observability and operations
 - HTTP request logging via `morgan` streamed to a Winston logger.
 - Centralized error handler logs error context and returns stable error envelopes.
 
 ## 8) Verified behavior (this repo)
 The following were verified during this documentation pass:
 - Backend can start and respond to `/api/v1/health`.
 - Pytest system/security suites passed (`138 passed, 2 skipped`).
 - Jest unit tests passed (`9` suites, `39` tests).
 
 ## 9) Open questions (documented, not guessed)
 - **Frontend E2E verification**: frontend exists, but UI-to-API flows were not validated end-to-end in this pass.
 - **Deployment topology**: no production deployment manifests (Docker Compose/Kubernetes/Terraform) were validated here.
