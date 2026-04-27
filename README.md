# Electrofied

Electrofied is a full-stack commerce platform with a Node.js/Express API, an Angular SSR frontend, and automated backend plus Python API/security test coverage.

## Stack

- Backend: Node.js, Express 5, Mongoose, MongoDB, Redis, BullMQ
- Frontend: Angular 21 SSR (NgModules)
- Tests: Jest (backend unit), Pytest (functional/security), Locust (performance scripts)
- Security automation: GitHub CodeQL and Trivy SARIF workflows
- Payments: Paymob (initiation + webhook verification)

## Repository layout

- backend/: API, business services, workers, and unit tests
- frontend/: Angular SSR app with customer/admin features
- tests/: Python functional, security, and performance suites
- docs/: project documentation set

## Current verification snapshot (2026-04-18)

- Backend unit tests: 17 suites, 99 tests passed
- Frontend build: npm run build passed
- Python suites: pytest tests/functional tests/security -q -> 156 passed

## Security snapshot (2026-04-18)

- HIGH/CRITICAL dependency remediation applied for:
  - axios
  - path-to-regexp
  - lodash
- Remaining audit findings are tracked in docs/security.md.

## Quick start

- Project setup: [docs/setup.md](docs/setup.md)
- API reference: [docs/api.md](docs/api.md)
- Architecture: [docs/architecture.md](docs/architecture.md)
- Features: [docs/features.md](docs/features.md)
- Testing: [docs/testing.md](docs/testing.md)
- Security: [docs/security.md](docs/security.md)
- Status: [docs/status.md](docs/status.md)
- Roadmap: [docs/roadmap.md](docs/roadmap.md)
- Changelog: [docs/changelog.md](docs/changelog.md)
- Agent quick map: [docs/AGENTS.md](docs/AGENTS.md)

## Service-level READMEs

- Backend guide: [backend/README.md](backend/README.md)
- Frontend guide: [frontend/README.md](frontend/README.md)
