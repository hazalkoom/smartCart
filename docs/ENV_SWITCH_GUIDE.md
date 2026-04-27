# Environment Switch Guide

This guide explains how to run SmartCart in local, Docker dev, and Docker production-like modes.

## Modes at a glance

| Mode | How to run | Backend env source | Notes |
| --- | --- | --- | --- |
| Local host processes | npm start / npm run dev | backend/.env | Runs backend/frontend directly on host |
| Docker dev | npm run dev:up | backend/.env.dev | Backend + Redis in containers |
| Docker prod-like | npm run prod:up | backend/.env.prod | Backend container only by default |
| Full stack compose | docker compose up --build -d | backend/.env | Includes backend, frontend, redis, ngrok |

## Files used by mode

### Backend env files

- backend/.env
  - Used for host-local backend runs and base compose stack.
- backend/.env.dev
  - Used by docker-compose.dev.yml.
- backend/.env.prod
  - Expected by docker-compose.prod.yml.
  - Create this file if it does not exist in your local checkout.

### Frontend environment files

- frontend/src/environments/environment.ts
- frontend/src/environments/environment.prod.ts

Angular build configuration selects environment files at build time.

## Required backend variables

Minimum variables required for backend startup:

- JWT_SECRET
- JWT_EXPIRE
- MONGODB_URI

Commonly required for full feature support:

- PORT
- NODE_ENV
- CORS_ORIGIN
- REDIS_URL
- PAYMOB_API_KEY
- PAYMOB_INTEGRATION_ID_CARD
- PAYMOB_INTEGRATION_ID_WALLET
- PAYMOB_INTEGRATION_ID_FAWRY
- PAYMOB_IFRAME_ID
- PAYMOB_HMAC_SECRET

## Recommended workflow

### 1) Local development without Docker

Backend:

```powershell
cd backend
npm install
npm run dev
```

Frontend:

```powershell
cd frontend
npm install
npm start
```

### 2) Docker development mode

From repository root:

```powershell
npm run dev:up
```

Stop:

```powershell
npm run dev:down
```

### 3) Production-like backend mode

From repository root:

```powershell
npm run prod:up
```

Stop:

```powershell
npm run prod:down
```

## Verifying active mode

Backend health check:

```powershell
curl http://localhost:5000/api/v1/health
```

Frontend check:

```powershell
curl http://localhost:4200
```

## Switching safely

- Do not reuse production secrets in local files.
- Keep each mode file isolated (.env vs .env.dev vs .env.prod).
- Restart services after env changes.
- For Docker mode changes, run down then up to reapply env files.

## Testing note

Python tests have an autostart fixture by default.

- Local default: PYTEST_AUTOSTART_BACKEND=1 (autostarts backend if needed)
- CI override: PYTEST_AUTOSTART_BACKEND=0 (CI starts backend explicitly)
