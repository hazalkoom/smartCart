# SmartCart

SmartCart is a full-stack e-commerce application with a Node.js and Express API, an Angular SSR frontend, and layered automated tests.

## Current stack

- Backend: Node.js, Express 5, Mongoose, MongoDB
- Frontend: Angular 21 SSR with NgModule-based routing
- Infrastructure: Docker Compose with backend, frontend, Redis, and ngrok services
- Payments: Paymob payment initiation plus webhook handling
- Tests: Jest for backend unit tests, Pytest for API-level functional and security suites, Locust scripts for load testing

## Project layout

- backend/: API server, controllers, services, models, and Jest tests
- frontend/: Angular SSR application, guards, interceptors, admin area, and HTTP services
- tests/: Python functional, security, and performance suites
- docs/: project reference docs

## Quick start

- Setup: [docs/setup.md](docs/setup.md)
- API reference: [docs/api.md](docs/api.md)
- Architecture: [docs/architecture.md](docs/architecture.md)
- Testing: [docs/testing.md](docs/testing.md)
- Security: [docs/security.md](docs/security.md)
- Status: [docs/status.md](docs/status.md)
- Agent navigation: [docs/AGENTS.md](docs/AGENTS.md)
- Audit log: [docs/changelog.md](docs/changelog.md)

## Current verification snapshot

- Backend unit tests: 15 suites, 87 tests passing
- Frontend production build: passes, with bundle and CSS budget warnings
- Frontend build also reports CommonJS optimization warnings for socket dependencies
- Python functional and security suites: present in repo, not re-run during this documentation refresh

## Notes

- Swagger UI is mounted at /api-docs only when the backend is not running in production mode.
- The frontend uses /api/v1 as its API base path and relies on Angular guards and HTTP interceptors for auth-aware navigation.
- Order create and cancel flows use MongoDB transactions, so MongoDB replica set or managed cluster support is required.
