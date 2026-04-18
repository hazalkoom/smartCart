# Security

This document summarizes current SmartCart security posture, controls, and active workflows.

## Security baseline controls

### Application-layer controls

- Helmet middleware for security headers.
- CORS restricted by configurable origin (CORS_ORIGIN).
- Production-only rate limiter under /api.
- Validation middleware for request payload contracts.
- Centralized error middleware with structured error envelopes.

### Authentication and authorization

- JWT-based authentication for protected routes.
- Role-based access control for customer/admin/owner privileges.
- Owner-only protection for high-risk user management paths.

### Payment integrity

- Paymob webhook HMAC verification before processing.
- Idempotency guard prevents duplicate paid-state updates.
- Payment event handling includes persisted notification generation.

### Inventory safety

- Stock lock accounting prevents overselling races.
- Paid/cancelled transitions trigger lock and stock adjustments.

## CI security automation

### CodeQL

- Workflow: .github/workflows/codeql.yml
- Languages: javascript-typescript, python
- Query suite: security-and-quality
- Trigger: push, pull_request, weekly schedule, manual

### Trivy vulnerability scanning

- Workflow: .github/workflows/trivy.yml
- Scope: filesystem scan for OS and library vulnerabilities
- Severity gate in scan output: HIGH, CRITICAL
- SARIF upload to GitHub Security tab
- Weekly scheduled run plus push/pull_request/manual triggers

### SBOM generation

- Workflow: .github/workflows/trivy.yml (sbom job)
- Output: CycloneDX JSON artifact (trivy-sbom.cdx.json)

## Dependency security status

Recently remediated high-priority dependency risks:

- axios upgraded to ^1.15.0 (backend)
- path-to-regexp pinned via overrides to ^8.4.0
- lodash pinned via overrides to ^4.17.24

Current posture note:

- Major HIGH/CRITICAL risks targeted in recent cycle are remediated.
- Medium findings may remain and should be handled in scheduled triage.

## Operational security guidance

### Secrets and environment variables

- Keep production secrets out of repository and local dev defaults.
- Maintain separate env files per mode (.env, .env.dev, .env.prod).
- Required startup variables include JWT_SECRET, JWT_EXPIRE, and MONGODB_URI.

### Runtime hardening

- Ensure NODE_ENV is set correctly in production.
- Keep Swagger disabled in production (already conditional in server startup).
- Set strict CORS_ORIGIN in production deployment.
- Review rate limiter thresholds according to traffic profile.

### Logging and privacy

- Avoid logging raw tokens and sensitive payload fields.
- Review error logs for possible secret leakage during incident response.

## Known security gaps and follow-ups

- Payment redirect target is currently hardcoded for localhost and should be environment-driven.
- No dedicated CSRF token model because API uses bearer auth; maintain strict CORS and auth boundaries.
- Add periodic dependency refresh policy and automated patch PR cadence.

## Incident response checklist

1. Identify affected routes/services.
2. Disable vulnerable surface with minimal feature impact.
3. Patch and verify with tests.
4. Re-run CI, CodeQL, and Trivy scans.
5. Document impact and mitigation in changelog/status docs.
