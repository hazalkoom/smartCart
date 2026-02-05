# Roadmap

This roadmap is based on what is implemented and verified in this repository today, and what is explicitly unverified or absent.

It is organized in phases to support production hardening, feature completeness, and long-term extensibility.

## Phase 0 (short-term): Reliability and developer experience hardening

1. **Ship a reproducible configuration template**
    - Add a `backend/.env.example` (no secrets) that lists required variables.
    - Rationale: onboarding currently depends on out-of-band env var sharing.

2. **Standardize root-level scripts (optional but high leverage)**
    - Add root scripts to orchestrate common tasks (start backend, run tests).
    - Rationale: reduces friction and prevents inconsistent local workflows.

3. **Clarify MongoDB transaction requirements**
    - Make replica set/cluster requirement explicit in setup docs and runtime checks.
    - Rationale: order checkout uses transactions and will fail on unsupported MongoDB topologies.

4. **Operational logging hygiene**
    - Ensure log directory management is predictable (rotation/retention policy).
    - Rationale: prevents disk growth in long-running environments.

## Phase 1 (mid-term): Frontend completeness and contract confidence

1. **Verify frontend build and runtime**
    - Run and document `frontend` build/test steps.
    - Rationale: frontend is present but not verified end-to-end in this documentation pass.

2. **Complete core UI workflows against the API**
    - Browse → product detail → cart → checkout → order confirmation
    - Auth flows (register/login/profile)
    - Rationale: the backend is production-grade; the frontend should become a reliable client.

3. **Add frontend end-to-end tests**
    - Use a browser-driven framework (e.g., Playwright/Cypress).
    - Rationale: protects end-to-end workflows the same way pytest protects API workflows.

## Phase 2 (mid/long-term): Payments and security maturity

1. **Payment flow hardening**
    - Improve idempotency and error handling around payment initiation/webhooks.
    - Rationale: payment flows are high-risk; correctness and replay safety are critical.

2. **Security posture automation**
    - Keep security tests as a gate.
    - Consider adding dependency scanning and SAST.
    - Rationale: preserve strong security baseline as the codebase evolves.

## Phase 3 (long-term): Scale, extensibility, and product expansion

1. **Performance baselines and capacity planning**
    - Execute and tune the existing Locust scenarios.
    - Rationale: performance scripts exist but are not part of default verification.

2. **Domain growth (only if product needs it)**
    - Extend the platform based on real requirements (e.g., advanced analytics, richer fulfillment).
    - Rationale: avoid speculative complexity; build on the already-solid backend core.

3. **Optional: ML service**
    - If recommendations/trends are desired, implement a separate FastAPI service with a stable HTTP contract.
    - Rationale: currently not present; should be isolated to preserve backend simplicity.
