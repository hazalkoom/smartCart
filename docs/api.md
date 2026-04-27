# API

SmartCart backend API reference.

## Base information

| Item | Value |
| --- | --- |
| Base path | /api/v1 |
| Local base URL | http://localhost:5000/api/v1 |
| Auth header | Authorization: Bearer <token> |
| Swagger UI | http://localhost:5000/api-docs (non-production) |

## Response conventions

- Success responses usually follow:
  - { success: true, data: ... }
  - Optional fields: message, count, page, pages, total
- Error responses follow:
  - { success: false, error: { code, message } }
- Validation errors return HTTP 400 and error.code = VALIDATION_ERROR.

## Roles

- customer
- admin
- owner

## Health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /health | Public | API liveness check |

## Auth and profile

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | /auth/register | Public | Register a customer |
| POST | /auth/login | Public | Login and get token |
| POST | /auth/forgot-password | Public | Start reset flow |
| POST | /auth/reset-password/:token | Public | Reset password |
| GET | /auth/me | Protected | Current user profile |
| PUT | /auth/updatedetails | Protected | Update profile fields |

## Wishlist

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | /auth/wishlist | Protected | Toggle wishlist product |
| GET | /auth/wishlist | Protected | List wishlist products |

## Saved addresses

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | /auth/addresses | Protected | Add saved address |
| DELETE | /auth/addresses/:id | Protected | Delete saved address |

## Countries

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /countries | Public | List canonical country options |

Notes:

- Response includes full name/code list from backend constants.
- Country inputs in order/address flows support normalization (for example, EG -> Egypt).

## Categories

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /categories | Public | List categories |
| GET | /categories/:slug | Public | Category by slug |
| POST | /categories | Admin or Owner | Create category |
| PUT | /categories/:id | Admin or Owner | Update category |
| DELETE | /categories/:id | Admin or Owner | Delete category |

## Products

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /products | Public | List products with filters |
| GET | /products/:slug | Public | Product by slug (or valid ObjectId) |
| POST | /products | Admin or Owner | Create product |
| PUT | /products/:id | Admin or Owner | Update product |
| DELETE | /products/:id | Owner | Soft-delete product |

Supported product query params:

- keyword
- category (single ID or comma-separated IDs)
- minPrice, maxPrice
- minRating
- stockStatus (in, out, low)
- sort (price_asc, price_desc, top_rated, newest)
- page, limit

## Cart

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /cart | Protected | Get current user cart |
| DELETE | /cart | Protected | Clear cart |
| POST | /cart/items | Protected | Add item |
| PUT | /cart/items/:itemId | Protected | Update item quantity |
| DELETE | /cart/items/:itemId | Protected | Remove item |

Notes:

- Overselling prevention returns HTTP 409 with error.code = INSUFFICIENT_STOCK.

## Orders

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | /orders | Protected | Create order from cart |
| GET | /orders/my | Protected | Get current user orders |
| GET | /orders/:id | Protected | Get order by ID (owner/admin or order owner) |
| GET | /orders | Admin or Owner | Get all orders |
| PATCH | /orders/:id/status | Admin or Owner | Update status |
| POST | /orders/:id/pay | Protected | Initiate payment |

Order creation payload shape:

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

Order notes:

- paymentMethod is set internally during order creation.
- Current flow initializes order with card paymentMethod, then payment is initiated through /orders/:id/pay.
- Valid status values: Pending, Paid, Shipped, Delivered, Cancelled.

## Notifications

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /notifications | Protected | List my notifications |
| PATCH | /notifications/:id/read | Protected | Mark one as read |
| PATCH | /notifications/read-all | Protected | Mark all as read |
| DELETE | /notifications | Protected | Clear all my notifications |

Notes:

- Notification types include payment-success, admin-order-paid, and order-status-changed.
- Realtime events are also emitted over Socket.IO.

## Reviews

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /reviews | Public | List reviews (optionally by productId) |
| POST | /reviews | Customer | Create review |
| PATCH | /reviews/:id | Customer/Admin | Update review |
| DELETE | /reviews/:id | Customer/Admin/Owner | Delete review |

## Users

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /users | Admin or Owner | List users |
| POST | /users | Owner | Create non-owner user |
| GET | /users/:id | Admin or Owner | Get user by ID |
| PUT | /users/:id | Owner | Update user |
| DELETE | /users/:id | Owner | Delete user |

## Webhooks

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | /webhook/paymob | Public | Paymob webhook receiver |
| GET | /webhook/paymob/redirect | Public | Redirect back to frontend callback |

Webhook notes:

- Webhook processing validates Paymob HMAC.
- Idempotency guards prevent duplicate paid updates.
- Redirect helper currently points to localhost callback URL.
