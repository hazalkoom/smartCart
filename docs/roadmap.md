# Roadmap

Roadmap is organized by horizon and reflects current implementation status.

## Completed recently

- Notification persistence API and reconnect hydration flow.
- Canonical countries endpoint and frontend country hydration service.
- CI hardening for backend, frontend, and Python suites.
- Security workflows added and active:
  - CodeQL (JS/TS + Python)
  - Trivy vulnerability SARIF upload
  - Trivy SBOM artifact generation
- Dependency risk remediation for axios, path-to-regexp, and lodash.
- Documentation baseline refresh across README and docs pages.

## Near-term priorities (next 1-2 sprints)

### Payments and callback hardening

- Move payment callback base URL to environment configuration.
- Add explicit tests for callback URL composition and redirect behavior.

### Security and dependency hygiene

- Continue triaging medium findings from npm audit reports.
- Add dependency update cadence with lockfile review checklist.

### Notification UX and reliability

- Add notification pagination and retention policy.
- Add server-side filters by type/status/read date.

### Test depth

- Add targeted tests for countries normalization edge cases.
- Increase webhook negative-case coverage and replay resistance tests.

## Mid-term priorities (quarter)

### Observability

- Introduce structured metrics for checkout, payment, and webhook success rates.
- Add central request correlation IDs in logs.

### Performance and scalability

- Add load-test gates for cart/checkout critical endpoints.
- Evaluate Redis/Mongo tuning under sustained checkout concurrency.

### Admin productivity

- Expand admin analytics views (sales snapshots, conversion trends).
- Add richer order timeline audit visualization in admin UI.

## Longer-term opportunities

- Promotion and coupon engine.
- Multi-currency support and localization.
- Inventory reservation expiration policies per product category.
- Event-driven architecture split for payments and notifications.

## Exit criteria for roadmap items

Each roadmap item is considered complete when:

- Code merged and documented.
- Relevant tests added or updated.
- CI green in main branch.
- Security impact reviewed for changed surfaces.
