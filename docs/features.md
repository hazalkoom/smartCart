# Features

This document summarizes the user-facing and operator-facing behavior that exists in the current SmartCart codebase.

## Customer capabilities

### Account and profile

Customers can:

- register and log in
- retrieve their current profile
- update first and last name
- request a password reset and submit a new password
- add and remove wishlist items
- add and remove saved addresses

Current constraints:

- profile updates only expose firstName and lastName in the frontend service
- password reset returns resetToken and resetUrl only outside production

### Catalog and discovery

Customers can:

- browse categories
- browse product listings with filters and sorting
- open product detail pages by slug
- browse themed content pages such as about, help center, and gift finder

Implemented product filtering supports:

- keyword
- category, including comma-separated category IDs
- minPrice and maxPrice
- minRating
- stockStatus
- sort
- page and limit

### Cart and checkout

Customers can:

- add products to a cart
- update item quantities
- remove cart items
- clear the cart
- create an order from the current cart
- open a protected order-detail route for a specific order

Current behavior:

- cart state is also cached in browser localStorage by the frontend service
- order creation only requires shippingAddress at request time
- the backend currently persists card as the initial order paymentMethod before explicit Paymob payment initiation
- backend checkout and cancellation paths use MongoDB transactions for stock consistency

### Payments

Customers can initiate Paymob payment for an unpaid order using:

- card
- wallet
- fawry

Current constraints:

- wallet payments require a mobile number in the request or on the saved user profile
- Paymob redirects are sent to the frontend payment-callback route

### Reviews

Customers can:

- fetch reviews for a product
- create one review per product
- update their own review
- delete their own review

## Admin capabilities

Admins can:

- access the admin area
- view the admin dashboard
- manage products
- manage categories
- view and update orders
- list users

Current constraints:

- admins cannot delete products
- admins cannot access the owner-only user-management route actions that mutate owner-level user data

## Owner capabilities

Owners inherit admin capabilities and can also:

- create users through POST /users
- update users through PUT /users/:id
- delete users through DELETE /users/:id
- access the protected /admin/users screen
- soft-delete products

Owner safeguards in the backend prevent:

- creating another owner account
- assigning owner through normal user updates
- changing the current owner's role away from owner
- deleting the current owner or self-deleting

## Frontend-specific improvements currently present

- route guards for guest, auth, admin, and owner flows
- SSR server module and browser hydration support
- auth and error interceptors for centralized HTTP handling
- APP_INITIALIZER-driven auth hydration to sync initial navbar/auth state
- admin route persistence in the browser through RoutePersistenceService
- dedicated feature routes for wishlist, account, help center, gift finder, and payment callback

## What is not implemented here

- a separate machine-learning or recommendation service
- automated frontend E2E coverage with Playwright or Cypress
- configurable payment callback redirect target beyond the current hardcoded localhost redirect route
