# API

This document provides a table-first reference for SmartCart REST endpoints.

## Base Info

| Item           | Value                            |
| -------------- | -------------------------------- |
| Base path      | `/api/v1`                        |
| Local base URL | `http://localhost:5000/api/v1`   |
| Auth           | `Authorization: Bearer <token>`  |
| Swagger UI     | `http://localhost:5000/api-docs` |

## Conventions

| Topic            | Details                                                                                |
| ---------------- | -------------------------------------------------------------------------------------- |
| Content type     | JSON request/response                                                                  |
| Success envelope | `{ "success": true, "data": ... }` (may include `message`, `count`, pagination fields) |
| Error envelope   | `{ "success": false, "error": { "code", "message" } }`                                 |
| Validation       | Route-level validation via `express-validator`                                         |
| Roles            | `customer`, `admin`, `owner`                                                           |

## Health

| Method | Path      | Auth   | Description            |
| ------ | --------- | ------ | ---------------------- |
| GET    | `/health` | Public | Backend liveness check |

## Auth & Profile

| Method | Path                          | Auth      | Description                  |
| ------ | ----------------------------- | --------- | ---------------------------- |
| POST   | `/auth/register`              | Public    | Register a new user          |
| POST   | `/auth/login`                 | Public    | Login and receive JWT        |
| GET    | `/auth/me`                    | Protected | Get current user profile     |
| PUT    | `/auth/updatedetails`         | Protected | Update first/last name       |
| POST   | `/auth/forgot-password`       | Public    | Request password reset token |
| POST   | `/auth/reset-password/:token` | Public    | Reset password with token    |

## Wishlist (New)

| Method | Path             | Auth      | Description                                  |
| ------ | ---------------- | --------- | -------------------------------------------- |
| POST   | `/auth/wishlist` | Protected | Toggle product in wishlist (`{ productId }`) |
| GET    | `/auth/wishlist` | Protected | List current user wishlist                   |

## Saved Addresses (New)

| Method | Path                  | Auth      | Description                                                                                  |
| ------ | --------------------- | --------- | -------------------------------------------------------------------------------------------- |
| POST   | `/auth/addresses`     | Protected | Add user shipping address (`alias`, `street`, `city`, `postalCode`, `country`, `isDefault?`) |
| DELETE | `/auth/addresses/:id` | Protected | Delete one saved address by address ID                                                       |

## Categories

| Method | Path                | Auth        | Description          |
| ------ | ------------------- | ----------- | -------------------- |
| GET    | `/categories`       | Public      | List categories      |
| GET    | `/categories/:slug` | Public      | Get category by slug |
| POST   | `/categories`       | Admin/Owner | Create category      |
| PUT    | `/categories/:id`   | Admin/Owner | Update category      |
| DELETE | `/categories/:id`   | Admin/Owner | Delete category      |

## Products

| Method | Path              | Auth        | Description                                                                    |
| ------ | ----------------- | ----------- | ------------------------------------------------------------------------------ |
| GET    | `/products`       | Public      | List products (supports `keyword`, `category`, `stockStatus`, `page`, `limit`) |
| GET    | `/products/:slug` | Public      | Get product by slug                                                            |
| POST   | `/products`       | Admin/Owner | Create product                                                                 |
| PUT    | `/products/:id`   | Admin/Owner | Update product                                                                 |
| DELETE | `/products/:id`   | Owner       | Soft delete product                                                            |

## Cart

| Method | Path                  | Auth      | Description               |
| ------ | --------------------- | --------- | ------------------------- |
| GET    | `/cart`               | Protected | Get current user cart     |
| POST   | `/cart/items`         | Protected | Add item to cart          |
| PUT    | `/cart/items/:itemId` | Protected | Update cart item quantity |
| DELETE | `/cart/items/:itemId` | Protected | Remove cart item          |
| DELETE | `/cart`               | Protected | Clear cart                |

## Orders

| Method | Path                 | Auth        | Description                                |
| ------ | -------------------- | ----------- | ------------------------------------------ |
| POST   | `/orders`            | Protected   | Create order from cart                     |
| GET    | `/orders/my`         | Protected   | Get current user orders                    |
| GET    | `/orders/:id`        | Protected   | Get order by ID (own order or admin/owner) |
| GET    | `/orders`            | Admin/Owner | Get all orders                             |
| PATCH  | `/orders/:id/status` | Admin/Owner | Update order status                        |
| POST   | `/orders/:id/pay`    | Protected   | Start Paymob payment for order             |

## Reviews

| Method | Path           | Auth                 | Description                             |
| ------ | -------------- | -------------------- | --------------------------------------- |
| GET    | `/reviews`     | Public               | List reviews (typically by `productId`) |
| POST   | `/reviews`     | Customer             | Create review                           |
| PATCH  | `/reviews/:id` | Customer/Admin       | Update review                           |
| DELETE | `/reviews/:id` | Customer/Admin/Owner | Delete review                           |

## Users (Admin/Owner Management)

| Method | Path         | Auth        | Description                                      |
| ------ | ------------ | ----------- | ------------------------------------------------ |
| GET    | `/users`     | Admin/Owner | List users (supports `page`, `limit`)            |
| GET    | `/users/:id` | Admin/Owner | Get user by ID                                   |
| PUT    | `/users/:id` | Owner       | Update user (role/details with owner safeguards) |
| DELETE | `/users/:id` | Owner       | Delete user (owner safeguards)                   |

## Notes

| Topic            | Details                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| Password reset   | Token flow exists; email delivery is not implemented in-repo (token exposed in non-production/testing flows). |
| Order integrity  | Checkout uses transaction flow and strict status transitions; cancellation restocks inventory.                |
| Product deletion | Implemented as soft delete to preserve historical consistency.                                                |
