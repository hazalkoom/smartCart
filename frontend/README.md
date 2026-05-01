# SmartCart Frontend

Angular 21 SSR frontend for SmartCart customer and admin experiences.

## Prerequisites

- Node.js 20+
- npm
- Backend running on http://localhost:5000 for local API integration

## Install

From this directory:

```bash
npm ci
```

## Run in development

```bash
npm start
```

Default local URL: http://localhost:4200

## Build

```bash
npm run build
```

Output path:

- dist/frontend/browser
- dist/frontend/server

## Run unit tests

```bash
npm test
```

## Serve SSR build locally

```bash
npm run build
npm run serve:ssr:frontend
```

## Environment configuration

Development:

- src/environments/environment.ts
	- apiUrl: http://localhost:5000/api/v1
	- socketUrl: http://localhost:5000

Production:

- src/environments/environment.prod.ts
	- apiUrl: https://electrofied-hazalkoom.duckdns.org/api/v1
	- socketUrl: https://electrofied-hazalkoom.duckdns.org

## Notable frontend capabilities

- Customer storefront routes (products, cart, checkout, account, wishlist)
- Email verification flow: verify-email page, account banner with resend button
- Admin lazy module with role guards
- Notification bell with persisted notification hydration
- Country dropdown hydration via backend countries API
- Auth initialization via APP_INITIALIZER

## Deployment note

Vercel is supported through root-level vercel.json in this monorepo.
