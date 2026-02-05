# SmartCart
 
SmartCart is a full‑stack e‑commerce platform: a secure REST API for catalog, cart, orders, reviews, and role-based administration—paired with an Angular SSR frontend.
 
## Who it’s for
- **Online retailers** who need an extensible commerce backend (catalog, orders, admin workflows).
- **Customers** who browse products, manage a cart, place orders, and write reviews.
- **Operators** (admin/owner roles) who manage products, categories, and order fulfillment.
 
## Tech stack (high level)
- **Backend**: Node.js + Express + Mongoose (MongoDB)
- **Frontend**: Angular (SSR)
- **Payments**: Paymob integration (initiation + webhook verification)
- **Testing**: Jest (unit) + Pytest (system/security) + Locust (performance scripts)
 
## Get started
- **Setup & prerequisites**: [`docs/setup.md`](docs/setup.md)
- **How to run tests**: [`docs/testing.md`](docs/testing.md)
 
## Documentation index
- **Architecture**: [`docs/architecture.md`](docs/architecture.md)
- **API reference & conventions**: [`docs/api.md`](docs/api.md)
- **Product capabilities (by persona)**: [`docs/features.md`](docs/features.md)
- **Testing strategy & coverage**: [`docs/testing.md`](docs/testing.md)
- **Delivery status (verified vs unverified)**: [`docs/status.md`](docs/status.md)
- **Roadmap**: [`docs/roadmap.md`](docs/roadmap.md)
- **PRD (inferred from implementation)**: [`docs/prd.md`](docs/prd.md)
 
## Project status (honest)
- **Backend API**: implemented and verified via automated tests.
- **Frontend**: present (Angular SSR scaffolding + services) but not fully verified end‑to‑end as part of this documentation pass.
