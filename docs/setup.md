# Setup

This document describes local setup, Docker setup, and verification commands for SmartCart.

## Prerequisites

- Node.js 20+
- npm 10+
- Python 3.10+
- MongoDB 6+ (replica set required for transactions)
- Redis 7+
- Docker Desktop (optional, recommended)

## Repository bootstrap

From repository root:

```powershell
npm install
```

Install backend dependencies:

```powershell
cd backend
npm install
```

Install frontend dependencies:

```powershell
cd frontend
npm install
```

Install Python test dependencies:

```powershell
cd ..
.\env\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Environment configuration

### Backend env files

Create or update these files:

- backend/.env
- backend/.env.dev
- backend/.env.prod (if using prod compose)

Minimum required startup variables:

- JWT_SECRET
- JWT_EXPIRE
- MONGODB_URI

Common full-stack variables:

- PORT
- NODE_ENV
- CORS_ORIGIN
- REDIS_URL
- PAYMOB_API_KEY
- PAYMOB_INTEGRATION_ID_CARD
- PAYMOB_INTEGRATION_ID_WALLET
- PAYMOB_INTEGRATION_ID_FAWRY
- PAYMOB_HMAC_SECRET
- PAYMOB_IFRAME_ID

### Frontend environment files

Angular environment files are in:

- frontend/src/environments/environment.ts
- frontend/src/environments/environment.prod.ts

## Running locally (host processes)

Start backend:

```powershell
cd backend
npm run dev
```

Start frontend:

```powershell
cd frontend
npm start
```

Default local URLs:

- Frontend: http://localhost:4200
- Backend API: http://localhost:5000/api/v1
- Swagger (non-production): http://localhost:5000/api-docs

## Running with Docker

### Dev stack

From repository root:

```powershell
npm run dev:up
```

Stop:

```powershell
npm run dev:down
```

### Prod-like backend stack

From repository root:

```powershell
npm run prod:up
```

Stop:

```powershell
npm run prod:down
```

### Full compose stack (includes frontend + ngrok)

```powershell
docker compose up --build -d
docker compose down
```

## Verification commands

### Backend unit tests

```powershell
cd backend
npm test
```

### Frontend build

```powershell
cd frontend
npm run build
```

### Python functional + security tests

```powershell
cd ..
.\env\Scripts\Activate.ps1
pytest tests\functional tests\security -q
```

Note:

- Local pytest defaults to backend autostart fixture.
- To disable autostart, set PYTEST_AUTOSTART_BACKEND=0 and run backend manually.

## Troubleshooting

### Mongo transaction errors

- Ensure Mongo runs as a replica set (required for transactional order flow).

### Redis connection errors

- Verify Redis is running and REDIS_URL points to reachable host.

### CORS/auth issues

- Confirm CORS_ORIGIN and frontend backendBaseUrl values match your mode.

### Payment webhook/HMAC issues

- Verify PAYMOB_HMAC_SECRET and integration IDs are set for your environment.
