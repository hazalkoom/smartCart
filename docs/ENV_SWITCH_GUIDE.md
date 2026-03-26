# SmartCart Environment Switch Guide (Dev <-> Prod)

This guide gives a safe, repeatable process to run SmartCart locally in development and on AWS EC2 in production without manually editing IPs, URLs, or source code.

## Goals

- One command to run local development stack
- One command to run production stack
- Zero manual source edits when switching environments
- Secrets never committed to git
- Explicit env files and compose files per environment

## Current Pain Points (Observed)

- Runtime behavior depends on mixed settings from one `.env` file.
- Docker Compose currently uses a single stack for dev concerns.
- Backend startup imports worker/Redis modules before environment load in `server.js` import order, increasing config drift risk.
- Some backend routes/services still hardcode localhost URLs, causing environment mismatch.

This guide focuses on switching workflow first. App-level code hardening can be applied afterward.

## Proposed File Structure

Create these files:

- `backend/.env.dev`
- `backend/.env.prod`
- `.env.compose.dev`
- `.env.compose.prod`
- `docker-compose.dev.yml`
- `docker-compose.prod.yml`

Keep existing:

- `docker-compose.yml` (optional; can become a thin base file)
- `backend/.env` (optional fallback only; not recommended for switching)

## Environment Variables Strategy

### 1) Backend env files

Use separate backend env files for app runtime:

- `backend/.env.dev`:
  - `NODE_ENV=development`
  - `PORT=5000`
  - `MONGODB_URI=<dev mongo uri>`
  - `REDIS_URL=redis://redis:6379`
  - `CORS_ORIGIN=http://localhost:4200`
  - Dev Paymob/webhook values as needed

- `backend/.env.prod`:
  - `NODE_ENV=production`
  - `PORT=5000`
  - `MONGODB_URI=<prod mongo uri>`
  - `REDIS_URL=<upstash or elasticache url>`
  - `CORS_ORIGIN=https://your-frontend-domain`
  - Production Paymob values

### 2) Compose env files

Use compose env files for container-level toggles:

- `.env.compose.dev`
  - image tags, hostnames, optional debug flags

- `.env.compose.prod`
  - image tags, domain values, non-secret deployment toggles

Do not place secrets in compose env files if they may be shared widely.

## Docker Compose Profiles

## `docker-compose.dev.yml`

Purpose: fast local iteration.

Key rules:

- Build backend from `backend/Dockerfile.dev`
- Mount source with volumes for live reload
- Run local Redis service in compose
- Use `env_file: ./backend/.env.dev`
- Expose `5000`, `4200`, and optionally `4040` (ngrok)

## `docker-compose.prod.yml`

Purpose: deterministic production runtime.

Key rules:

- Build backend from `backend/Dockerfile` or pull immutable image tag
- No source-code bind mounts
- `restart: always`
- Healthchecks for backend/redis
- Use `env_file: ./backend/.env.prod`
- Do not publish Redis publicly unless required
- Frontend should be served via reverse proxy/CDN (or dedicated container)

## Package Scripts (Root)

Add these scripts in root `package.json`:

```json
{
  "scripts": {
    "dev:up": "docker compose --env-file .env.compose.dev -f docker-compose.dev.yml up --build -d",
    "dev:down": "docker compose --env-file .env.compose.dev -f docker-compose.dev.yml down",
    "dev:logs": "docker compose --env-file .env.compose.dev -f docker-compose.dev.yml logs -f",
    "prod:up": "docker compose --env-file .env.compose.prod -f docker-compose.prod.yml up -d --build",
    "prod:down": "docker compose --env-file .env.compose.prod -f docker-compose.prod.yml down",
    "prod:logs": "docker compose --env-file .env.compose.prod -f docker-compose.prod.yml logs -f"
  }
}
```

If you prefer backend-only commands, add the same style scripts in `backend/package.json` with paths adjusted.

## Step-by-Step: Switch Dev -> Prod

1. Stop dev stack:
   - `npm run dev:down`

2. Verify production env file values:
   - `backend/.env.prod`
   - Confirm `CORS_ORIGIN`, `MONGODB_URI`, `REDIS_URL`, Paymob secrets

3. Start production stack:
   - `npm run prod:up`

4. Validate services:
   - `npm run prod:logs`
   - Backend health: `GET /api/v1/health`

5. Smoke tests:
   - Auth login
   - Product list/details
   - Cart add/remove
   - Admin dashboard access
   - Webhook endpoint reachability

6. Security check before traffic:
   - Ensure no plaintext secrets in logs
   - Ensure Redis not exposed publicly
   - Ensure Swagger disabled in prod routes

## Step-by-Step: Switch Prod -> Dev

1. Stop prod stack:
   - `npm run prod:down`

2. Verify dev env file values:
   - `backend/.env.dev`
   - `CORS_ORIGIN=http://localhost:4200`
   - local/dev `MONGODB_URI` and `REDIS_URL`

3. Start dev stack:
   - `npm run dev:up`

4. Validate hot reload:
   - modify a backend file
   - verify nodemon reloads

5. Validate frontend-backend integration:
   - product list loads
   - login/logout
   - profile dropdown and admin pages

## AWS EC2 Deployment Notes

- Open only required security group ports:
  - `22` (restricted SSH)
  - `80/443` (public web)
  - Backend port only if directly exposed (prefer reverse proxy)
- Keep Redis private (localhost/VPC only)
- Use SSM Parameter Store or Secrets Manager for production secrets when possible
- Pin image tags and avoid `latest` in production

## Operational Safety Checklist

- [ ] `.env.dev` and `.env.prod` are separate
- [ ] No secrets in git
- [ ] Dev and prod compose files are separate
- [ ] Backend runs with `NODE_ENV=production` in prod
- [ ] Redis is private in prod
- [ ] Healthchecks enabled
- [ ] Logs monitored
- [ ] Backup strategy documented

## Suggested Next Hardening Pass (After Workflow Is In Place)

1. Fix backend startup order so env is loaded before modules that initialize Redis/workers.
2. Remove hardcoded localhost redirects and derive frontend URL from env.
3. Add explicit Redis reconnect strategy and startup fail-fast behavior per environment.
4. Run container as non-root in production image.
5. Add CI checks for secret scanning and env validation.

---

If you want, the next step can be generating the actual `docker-compose.dev.yml`, `docker-compose.prod.yml`, and script updates in `package.json` as a direct patch set.
