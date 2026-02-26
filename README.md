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
- [`docs/setup.md`](docs/setup.md): onboarding guide, prerequisites, environment variables, local run steps.
- [`docs/architecture.md`](docs/architecture.md): system design, backend domain boundaries, runtime and data flow.
- [`docs/api.md`](docs/api.md): endpoint groups, auth rules, request/response conventions.
- [`docs/features.md`](docs/features.md): user/admin/owner capabilities and business behavior.
- [`docs/testing.md`](docs/testing.md): testing strategy, suite layout, execution commands, coverage summary.
- [`docs/security.md`](docs/security.md): security controls and hardening posture (auth, RBAC, HMAC, headers, SSR safety).
- [`docs/status.md`](docs/status.md): current verified state, constraints, and known risks.
- [`docs/changelog.md`](docs/changelog.md): complete 42-item hardening audit log and outcomes.
- [`docs/AGENTS.md`](docs/AGENTS.md): AI agent navigation map for faster codebase analysis and file discovery.
- [`docs/prd.md`](docs/prd.md): product requirements and expected platform behavior.
- [`docs/roadmap.md`](docs/roadmap.md): planned milestones and future enhancements.
 
## Project status (honest)
- **Backend API**: implemented and verified via automated tests.
- **Frontend**: Angular SSR build is verified; automated E2E UI tests are not yet present.
