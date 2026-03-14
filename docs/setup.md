# Setup

This guide covers the current local setup for the backend, frontend, and test tooling.

## Prerequisites

- Node.js 20 or compatible
- npm
- Python 3.10 or compatible
- MongoDB with transaction support for checkout flows

## Install dependencies

### Backend

From backend/:

```powershell
npm ci
```

### Frontend

From frontend/:

```powershell
npm ci
```

### Python test environment

The repository already includes a local virtual environment directory at env/, but you can also use your own environment if preferred.

## Backend environment variables

Create backend/.env with at least:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://... or mongodb+srv://...
JWT_SECRET=your-secret
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:4200
PAYMOB_API_KEY=...
PAYMOB_INTEGRATION_ID_CARD=...
PAYMOB_INTEGRATION_ID_WALLET=...
PAYMOB_INTEGRATION_ID_FAWRY=...
PAYMOB_IFRAME_ID=...
PAYMOB_HMAC_SECRET=...
```

Notes:

- The backend exits on startup if JWT_SECRET, JWT_EXPIRE, or MONGODB_URI is missing.
- The current code does not consume BCRYPT_ROUNDS even if you define it.
- CORS defaults to http://localhost:4200 when CORS_ORIGIN is not set.

## MongoDB requirement

Order creation and cancellation use MongoDB transactions through mongoose.startSession(). Use a replica set or managed MongoDB deployment that supports transactions.

## Run the backend

From backend/:

```powershell
npm run dev
```

Useful local endpoints:

- API health: http://localhost:5000/api/v1/health
- Swagger UI: http://localhost:5000/api-docs when NODE_ENV is not production

## Run the frontend

From frontend/:

```powershell
npm start -- --proxy-config proxy.conf.json
```

The frontend uses /api/v1 as its base API URL. The dev proxy forwards /api requests to http://localhost:5000.

## Run backend unit tests

From backend/:

```powershell
npm test
```

## Run Python functional and security tests

From the repository root:

```powershell
.\env\Scripts\Activate.ps1
pytest tests\functional tests\security -v
```

These suites expect a live backend to be running.

## Run the frontend production build

From frontend/:

```powershell
npm run build
```

Current build status:

- build succeeds
- budget warnings are present for the main bundle, two component stylesheets, and inline Google Fonts CSS

## Current local-payment note

The Paymob redirect helper route sends users to http://localhost:4200/payment-callback. If you run the frontend on a different origin, that route will need code changes.
