# Setup

This guide is written to make onboarding **deterministic**: if you follow the steps in order, you should be able to start the backend and run the automated tests.

## 1) Prerequisites
- **Node.js + npm**
  - CI uses Node 20.
- **Python**
  - CI uses Python 3.10.
- **MongoDB** reachable from your machine
  - Must support transactions for order checkout (see below).

## 2) Clone and install dependencies

### 2.1 Backend dependencies
From `backend/`:

```powershell
npm ci
```

Notes:
- `npm ci` installs exactly what is pinned in `backend/package-lock.json`.
- If you see missing-module errors at runtime, `node_modules` is likely incomplete and should be reinstalled.

### 2.2 Frontend dependencies (optional for backend/API work)
From `frontend/`:

```powershell
npm ci
```

## 3) Configure environment variables

### 3.1 Backend `.env`
The backend loads configuration from `backend/.env` (the file is intentionally **gitignored**).

Minimum required to boot the API:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://... OR mongodb://...
JWT_SECRET=... 
JWT_EXPIRE=7d
```

Required for Paymob payment initiation and webhook verification:

```env
PAYMOB_API_KEY=...
PAYMOB_INTEGRATION_ID_CARD=...
PAYMOB_INTEGRATION_ID_WALLET=...
PAYMOB_INTEGRATION_ID_FAWRY=...
PAYMOB_IFRAME_ID=...
PAYMOB_HMAC_SECRET=...
```

What breaks if missing:
- Missing `MONGODB_URI`: server will fail to connect to the database.
- Missing `JWT_SECRET`: protected endpoints cannot validate tokens.
- Missing Paymob variables: payment initiation endpoints and webhook verification will fail.

### 3.2 MongoDB transaction requirement
Order checkout uses `mongoose.startSession()` and a transaction.

Constraint:
- MongoDB transactions typically require a **replica set** (or a managed cluster that supports transactions).
- If MongoDB does not support transactions, checkout/order creation may fail or behave unexpectedly.

## 4) Run the backend API
From `backend/`:

```powershell
npm run dev
```

Health check:

```text
GET http://localhost:5000/api/v1/health
```

Swagger UI:

```text
http://localhost:5000/api-docs
```

## 5) Run the automated tests

The Python system/security tests run against a live backend.

### 5.1 Activate the repo’s Python virtual environment
From the repo root:

```powershell
.\env\Scripts\Activate.ps1
```

### 5.2 Run pytest suites
From the repo root (with backend running):

```powershell
pytest tests\functional tests\security -v
```

### 5.3 Run backend unit tests
From `backend/`:

```powershell
npm test
```

## 6) Frontend development (optional)

The frontend uses a dev proxy so the browser can call the backend without CORS complexity.

From `frontend/`:

```powershell
npm start -- --proxy-config proxy.conf.json
```

Proxy behavior:
- Requests to `/api/*` are forwarded to `http://localhost:5000`.

## 7) Common failure modes (and how to diagnose)

- **“Cannot find module …” when starting backend**
  - Likely a partial install.
  - Fix: remove `backend/node_modules` and rerun `npm ci`.
- **Backend boots but `/api/v1/health` fails**
  - Check `PORT` and ensure the process is listening.
- **Database connection errors**
  - Validate `MONGODB_URI` and network access.
- **Order creation errors related to transactions**
  - Ensure MongoDB supports transactions (replica set/cluster).
