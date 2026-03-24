# API

This document reflects the current SmartCart backend routes under /api/v1.

## Base info

| Item | Value |
| --- | --- |
| Base path | /api/v1 |
| Local API URL | http://localhost:5000/api/v1 |
| Auth | Authorization: Bearer <token> |
| Swagger UI | http://localhost:5000/api-docs when NODE_ENV is not production |

## Response conventions

| Topic | Details |
| --- | --- |
| Success envelope | Usually { success: true, data: ... } with optional message, count, total, page, pages |
| Error envelope | Centralized error handler returns { success: false, error: { code, message } } |
| Validation failures | 400 with joined validation messages |
| Roles in code | customer, admin, owner |

## Health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /health | Public | Liveness check, returns { success: true, message: 'API is healthy' } |

## Auth and profile

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | /auth/register | Public | Register a new customer account and return JWT payload |
| POST | /auth/login | Public | Log in and return JWT payload |
| POST | /auth/forgot-password | Public | Start password reset flow. Always returns a generic success message |
| POST | /auth/reset-password/:token | Public | Reset password using the raw reset token |
| GET | /auth/me | Protected | Get the current user profile |
| PUT | /auth/updatedetails | Protected | Update firstName and lastName for the current user |

## Wishlist

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | /auth/wishlist | Protected | Toggle a product in the current user's wishlist. Body: { productId } |
| GET | /auth/wishlist | Protected | Get the populated wishlist for the current user |

## Saved addresses

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | /auth/addresses | Protected | Add a saved address. Body supports alias, street, city, postalCode, country, isDefault |
| DELETE | /auth/addresses/:id | Protected | Remove one saved address by embedded address ID |

## Categories

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /categories | Public | List all categories |
| GET | /categories/:slug | Public | Get one category by slug |
| POST | /categories | Admin or Owner | Create a category |
| PUT | /categories/:id | Admin or Owner | Update a category |
| DELETE | /categories/:id | Admin or Owner | Delete a category |

Category updates are partial in practice because the backend service applies only the fields supplied.

## Products

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /products | Public | List products with filtering, sorting, and pagination |
| GET | /products/:slug | Public | Get one product by slug. The controller also accepts a valid product ObjectId at the same path |
| POST | /products | Admin or Owner | Create a product |
| PUT | /products/:id | Admin or Owner | Update a product |
| DELETE | /products/:id | Owner | Soft-delete a product |

Supported product query params:

| Query param | Meaning |
| --- | --- |
| keyword | Case-insensitive match against name and SKU |
| category | One category ID or a comma-separated list of category IDs |
| minPrice | Minimum price |
| maxPrice | Maximum price |
| minRating | Minimum average rating |
| stockStatus | in, out, or low |
| sort | price_asc, price_desc, top_rated, newest |
| page | Page number, default 1 |
| limit | Page size, default 10 |

## Cart

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /cart | Protected | Get the current user's cart |
| DELETE | /cart | Protected | Clear the current user's cart |
| POST | /cart/items | Protected | Add an item. Body: { productId, quantity } |
| PUT | /cart/items/:itemId | Protected | Update quantity for one cart item |
| DELETE | /cart/items/:itemId | Protected | Remove one cart item |

## Orders

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | /orders | Protected | Create an order from the current cart |
| GET | /orders/my | Protected | Get the logged-in user's orders |
| GET | /orders/:id | Protected | Get one order if the user owns it or has admin or owner role |
| GET | /orders | Admin or Owner | Get all orders |
| PATCH | /orders/:id/status | Admin or Owner | Update order status |
| POST | /orders/:id/pay | Protected | Initiate Paymob payment for an unpaid order |

Current order creation payload:

```json
{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Cairo",
    "state": "Cairo",
    "zip": "11511",
    "country": "Egypt"
  }
}
```

Notes:

- paymentMethod is not required when creating the order. The backend currently stores card as the initial paymentMethod and handles actual Paymob payment initiation through /orders/:id/pay.
- Wallet payment requests require paymentMethod: wallet and either a provided mobileNumber or a mobile number already saved on the user.

## Reviews

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /reviews | Public | List reviews, typically filtered by productId |
| POST | /reviews | Customer | Create a review |
| PATCH | /reviews/:id | Customer, Admin | Update a review |
| DELETE | /reviews/:id | Customer, Admin, Owner | Delete a review |

Note:

- The current middleware allows `customer` and a legacy `user` alias on review write routes.

Review query params:

| Query param | Meaning |
| --- | --- |
| productId | Product whose reviews should be returned |

## Users

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /users | Admin or Owner | List users with pagination and optional role filtering |
| POST | /users | Owner | Create a non-owner user |
| GET | /users/:id | Admin or Owner | Get one user by ID |
| PUT | /users/:id | Owner | Update user fields and role with owner safeguards |
| DELETE | /users/:id | Owner | Delete a user with owner safeguards |

Supported user query params:

| Query param | Meaning |
| --- | --- |
| page | Page number, default 1 |
| limit | Page size, default 10 |
| role | One role or a comma-separated list of roles |

## Webhooks

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | /webhook/paymob | Public | Process Paymob webhook with HMAC validation |
| GET | /webhook/paymob/redirect | Public | Redirect the browser back to the frontend payment callback route |

The redirect endpoint currently forwards users to http://localhost:4200/payment-callback with the original Paymob query string.

## Runtime hardening notes

- Environment validation fails startup if JWT_SECRET, JWT_EXPIRE, or MONGODB_URI is missing.
- Production mode enables rate limiting under /api.
- express.json request payload limit is 50kb.
