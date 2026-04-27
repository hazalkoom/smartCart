# SmartCart Backend

Express 5 API for SmartCart commerce, payments, notifications, and admin operations.

## Prerequisites

- Node.js 20+
- npm
- MongoDB (transaction-capable topology)
- Redis

## Install

From this directory:

```bash
npm ci
```

## Environment

Create backend/.env with at least:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smartCart
JWT_SECRET=replace_me
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:4200
REDIS_URL=redis://127.0.0.1:6379
PAYMOB_API_KEY=replace_me
PAYMOB_INTEGRATION_ID_CARD=replace_me
PAYMOB_INTEGRATION_ID_WALLET=replace_me
PAYMOB_INTEGRATION_ID_FAWRY=replace_me
PAYMOB_IFRAME_ID=replace_me
PAYMOB_HMAC_SECRET=replace_me
```

## Run

Development:

```bash
npm run dev
```

Production-like:

```bash
npm start
```

## Test

Unit tests:

```bash
npm test
```

Coverage:

```bash
npm run test:coverage
```

## Current route groups

- /api/v1/auth
- /api/v1/categories
- /api/v1/products
- /api/v1/cart
- /api/v1/orders
- /api/v1/reviews
- /api/v1/webhook
- /api/v1/users
- /api/v1/notifications
- /api/v1/countries
- /api/v1/health

## Notes

- Swagger UI is available at /api-docs outside production mode.
- Checkout and cancellation flows rely on MongoDB transactions.
- WebSocket notifications are room-based (user rooms and admin_room).
