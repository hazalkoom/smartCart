# Product Requirements Document (PRD)
# SmartCart E-Commerce Platform

**Version**: 1.0  
**Last Updated**: February 2026  
**Status**: Production-Ready

---

## 1. Executive Summary

### 1.1 Product Vision
SmartCart is a production-grade e-commerce platform designed to serve as a complete operational backbone for online retail businesses. The system prioritizes security, scalability, and real-world payment integration with Egyptian payment gateways.

### 1.2 Target Users
- **Primary**: Small to medium-sized online retailers in Egypt
- **Secondary**: Customers purchasing products online
- **Tertiary**: Business owners and administrators managing inventory and orders

### 1.3 Core Value Proposition
- Zero-to-deployment e-commerce solution
- Egyptian payment gateway integration (Paymob)
- Multi-role management system (customer, admin, owner)
- Production-ready security and logging
- Comprehensive automated testing

---

## 2. System Architecture

### 2.1 Technology Stack

**Backend**
- Runtime: Node.js 18+
- Framework: Express 5
- Database: MongoDB (Atlas)
- ORM: Mongoose
- Authentication: JWT + bcryptjs
- Payment: Paymob API
- Logging: Winston + Morgan
- Documentation: Swagger/OpenAPI

**Frontend**
- Framework: Angular 20
- Language: TypeScript
- Styling: Tailwind CSS
- Rendering: Server-Side Rendering (SSR)

**Testing**
- Framework: pytest
- Coverage: Functional, Performance, Security

### 2.2 System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                         │
│  (Angular 20 SSR - Port 4200)                          │
│  - Customer Portal                                      │
│  - Admin Dashboard                                      │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/HTTPS
┌────────────────────▼────────────────────────────────────┐
│                REST API Layer                           │
│  (Express 5 - Port 5000)                               │
│  - 50+ Endpoints                                        │
│  - JWT Authentication                                   │
│  - Role-Based Authorization                             │
│  - Request Validation                                   │
│  - Winston Logging                                      │
└────┬─────────────────┬────────────────────┬─────────────┘
     │                 │                    │
     │                 │                    │
┌────▼─────┐  ┌───────▼────────┐  ┌────────▼──────────┐
│ MongoDB  │  │ Paymob Gateway │  │ Log Files         │
│ Atlas    │  │ (Payment API)  │  │ (Winston)         │
└──────────┘  └────────────────┘  └───────────────────┘
```

---

## 3. Data Models

### 3.1 User Model

**Purpose**: Store user accounts with authentication and profile data

**Fields**:
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| email | String | Yes | Unique, lowercase, validated regex |
| password | String | Yes | Min 6 chars, bcrypt hashed, hidden |
| role | String | Yes | Enum: customer, admin, owner |
| firstName | String | Yes | - |
| lastName | String | Yes | - |
| mobileNumber | String | No | Required for wallet payments |
| addresses | Array | No | Embedded address documents |
| resetPasswordToken | String | No | Crypto hash for password reset |
| resetPasswordExpire | Date | No | Token expiration (10 minutes) |

**Indexes**: email (unique)

**Security**:
- Password auto-hashed before save
- Password field hidden from queries (`select: false`)
- Methods: `matchPassword()` for login, `getResetPasswordToken()` for reset

---

### 3.2 Product Model

**Purpose**: Store product catalog with inventory and analytics

**Fields**:
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| name | String | Yes | Max 100 chars |
| slug | String | Auto | Unique, lowercase, auto-generated |
| description | String | Yes | Max 2000 chars |
| price | Number | Yes | Min 0 (selling price) |
| costPrice | Number | Yes | Hidden, for profit calculation |
| sku | String | Yes | Unique, uppercase |
| stock | Number | Yes | Min 0 |
| categoryId | ObjectId | Yes | References Category |
| images | Array[String] | No | Image URLs |
| featured | Boolean | No | Default: false |
| isDeleted | Boolean | No | Soft delete flag, hidden |
| rating | Number | No | Default: 0, auto-calculated |
| reviewCount | Number | No | Default: 0, auto-calculated |
| views | Number | No | Analytics counter |
| purchases | Number | No | Analytics counter |

**Indexes**: slug (unique), categoryId, sku (unique)

**Business Rules**:
- Slug auto-generated from name on save
- Soft delete: `isDeleted: true` instead of actual deletion
- `find` queries automatically exclude deleted products
- Cost price hidden from public API

---

### 3.3 Category Model

**Purpose**: Organize products into hierarchical categories

**Fields**:
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| name | String | Yes | Unique, max 50 chars |
| slug | String | Auto | Unique, lowercase |
| description | String | No | Max 500 chars |
| imageUrl | String | No | Category banner image |

**Indexes**: name (unique), slug (unique)

---

### 3.4 Cart Model

**Purpose**: Store shopping cart items per user

**Fields**:
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| userId | ObjectId | Yes | Unique, references User |
| items | Array | Yes | Array of cart items |
| items.productId | ObjectId | Yes | References Product |
| items.quantity | Number | Yes | Min 1 |
| items.price | Number | Yes | Price locked when added |
| subtotal | Number | Yes | Auto-calculated |

**Indexes**: userId (unique)

**Business Rules**:
- One cart per user
- Price locked when item added (not affected by price changes)
- Stock validation on every add/update operation
- Subtotal recalculated on every modification

---

### 3.5 Order Model

**Purpose**: Store completed orders with payment and shipping data

**Fields**:
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| userId | ObjectId | Yes | References User |
| orderNumber | String | Yes | Unique, format: SC-000001 |
| items | Array | Yes | Order items snapshot |
| items.productId | ObjectId | Yes | References Product |
| items.name | String | Yes | Product name snapshot |
| items.quantity | Number | Yes | - |
| items.price | Number | Yes | Price at purchase |
| items.cost | Number | Yes | Cost at purchase (hidden) |
| items.image | String | No | Product image snapshot |
| shippingAddress | Object | Yes | Embedded document |
| shippingAddress.street | String | Yes | - |
| shippingAddress.city | String | Yes | - |
| shippingAddress.state | String | No | - |
| shippingAddress.zip | String | No | - |
| shippingAddress.country | String | Yes | - |
| subtotal | Number | Yes | Sum of items |
| tax | Number | Yes | Default: 0 |
| shipping | Number | Yes | Default: 0 |
| total | Number | Yes | Subtotal + tax + shipping |
| status | String | Yes | See status enum below |
| paymentMethod | String | Yes | card, wallet, fawry, cash |
| paymentResult | Object | No | Paymob transaction data |
| isPaid | Boolean | Yes | Default: false |
| paidAt | Date | No | Payment timestamp |
| shippedAt | Date | No | Shipping timestamp |
| deliveredAt | Date | No | Delivery timestamp |

**Indexes**: userId, orderNumber (unique)

**Status Enum**: `Pending` → `Paid` → `Shipped` → `Delivered` (or `Cancelled`)

**Business Rules**:
- Order created from cart in atomic transaction
- Stock reduced and cart cleared in same transaction
- Order number auto-incremented (SC-000001, SC-000002...)
- Cost prices captured for owner profit analysis
- Product snapshots stored (name, price, image) - not references

---

### 3.6 Review Model

**Purpose**: Store product reviews and ratings

**Fields**:
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| productId | ObjectId | Yes | References Product |
| userId | ObjectId | Yes | References User |
| rating | Number | Yes | Min: 1, Max: 5 |
| title | String | Yes | Max 100 chars |
| comment | String | Yes | - |

**Indexes**: 
- Compound unique: (productId, userId) - prevents duplicate reviews

**Business Rules**:
- One review per user per product
- Product rating/reviewCount auto-updated via MongoDB aggregation
- Rating rounded to 1 decimal place
- Post-save and post-delete hooks trigger rating recalculation

---

## 4. API Specifications

### 4.1 Authentication Endpoints

**Base Path**: `/api/v1/auth`

#### POST /register
**Purpose**: Create new user account

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response** (201):
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "customer"
  }
}
```

**Validation**:
- Email: valid format, unique
- Password: min 6 characters
- First/Last name: required

---

#### POST /login
**Purpose**: Authenticate user

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": { ... }
}
```

**Errors**:
- 401: Invalid credentials
- 400: Missing email or password

---

#### GET /me
**Purpose**: Get current user profile

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "customer",
    "addresses": [...]
  }
}
```

---

### 4.2 Product Endpoints

**Base Path**: `/api/v1/products`

#### GET /
**Purpose**: List products with filters and pagination

**Query Parameters**:
- `keyword`: Search in name/description
- `category`: Filter by category ID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response** (200):
```json
{
  "success": true,
  "count": 42,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42
  },
  "data": [
    {
      "_id": "...",
      "name": "Product Name",
      "slug": "product-name",
      "price": 99.99,
      "stock": 50,
      "images": ["url1", "url2"],
      "rating": 4.5,
      "reviewCount": 12,
      "categoryId": "..."
    }
  ]
}
```

---

#### GET /:slug
**Purpose**: Get single product by slug

**Response** (200):
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Product Name",
    "slug": "product-name",
    "description": "...",
    "price": 99.99,
    "stock": 50,
    "sku": "PROD-001",
    "images": [...],
    "rating": 4.5,
    "reviewCount": 12,
    "categoryId": { "name": "Category", "slug": "category" }
  }
}
```

**Errors**:
- 404: Product not found

---

#### POST /
**Purpose**: Create new product (admin/owner only)

**Headers**: `Authorization: Bearer <token>`

**Required Role**: `admin` or `owner`

**Request Body**:
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "costPrice": 50.00,
  "sku": "PROD-001",
  "stock": 100,
  "categoryId": "...",
  "images": ["url1"],
  "featured": false
}
```

**Response** (201):
```json
{
  "success": true,
  "data": { ... }
}
```

**Validation**:
- SKU must be unique
- Price ≥ 0
- Stock ≥ 0
- Category must exist

---

### 4.3 Cart Endpoints

**Base Path**: `/api/v1/cart`

#### GET /
**Purpose**: Get user's cart

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "userId": "...",
    "items": [
      {
        "productId": { "name": "Product", "slug": "...", "images": [...] },
        "quantity": 2,
        "price": 99.99
      }
    ],
    "subtotal": 199.98
  }
}
```

---

#### POST /
**Purpose**: Add item to cart

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "productId": "...",
  "quantity": 2
}
```

**Response** (200):
```json
{
  "success": true,
  "data": { ... }
}
```

**Business Rules**:
- Creates cart if doesn't exist
- Validates stock availability
- Locks current price
- Merges quantity if product already in cart

**Errors**:
- 400: Insufficient stock
- 404: Product not found

---

### 4.4 Order Endpoints

**Base Path**: `/api/v1/orders`

#### POST /
**Purpose**: Create order from cart

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Cairo",
    "state": "Cairo",
    "zip": "12345",
    "country": "Egypt"
  },
  "paymentMethod": "cash"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "orderNumber": "SC-000042",
    "items": [...],
    "total": 199.98,
    "status": "Pending",
    "isPaid": false
  }
}
```

**Business Logic** (Atomic Transaction):
1. Validate cart not empty
2. Validate stock for all items
3. Create order with snapshot of cart items
4. Reduce stock for each product
5. Clear cart
6. Commit or rollback all changes

**Errors**:
- 400: Cart is empty
- 400: Insufficient stock

---

#### POST /:id/pay
**Purpose**: Initiate payment via Paymob

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "paymentMethod": "card",  // or "wallet", "fawry"
  "mobileNumber": "01012345678"  // required for wallet
}
```

**Response** (200) - Card:
```json
{
  "success": true,
  "iframeUrl": "https://accept.paymob.com/api/acceptance/iframes/..."
}
```

**Response** (200) - Wallet:
```json
{
  "success": true,
  "redirectUrl": "https://..."
}
```

**Response** (200) - Fawry:
```json
{
  "success": true,
  "billReference": "1234567890",
  "message": "Go to any Fawry machine and pay using this code."
}
```

---

### 4.5 Review Endpoints

**Base Path**: `/api/v1/reviews`

#### GET /product/:productId
**Purpose**: Get all reviews for a product

**Response** (200):
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "...",
      "rating": 5,
      "title": "Great product!",
      "comment": "...",
      "userId": { "firstName": "John", "lastName": "D." },
      "createdAt": "2026-01-15T..."
    }
  ]
}
```

---

#### POST /
**Purpose**: Create review (requires ownership of product via order)

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "productId": "...",
  "rating": 5,
  "title": "Great product!",
  "comment": "Really satisfied with this purchase."
}
```

**Response** (201):
```json
{
  "success": true,
  "data": { ... }
}
```

**Business Rules**:
- One review per user per product
- Product rating auto-updated
- Rating must be 1-5

**Errors**:
- 400: Already reviewed this product
- 404: Product not found

---

### 4.6 Admin/Owner Endpoints

#### GET /api/v1/users (Owner Only)
**Purpose**: List all users for management

**Headers**: `Authorization: Bearer <token>`

**Required Role**: `owner`

**Response** (200):
```json
{
  "success": true,
  "count": 150,
  "data": [ ... ]
}
```

---

#### PATCH /api/v1/orders/:id/status (Admin/Owner)
**Purpose**: Update order status

**Headers**: `Authorization: Bearer <token>`

**Required Role**: `admin` or `owner`

**Request Body**:
```json
{
  "status": "Shipped"
}
```

**Valid Status Transitions**:
- Pending → Paid, Cancelled
- Paid → Shipped, Cancelled
- Shipped → Delivered

---

## 5. Payment Integration (Paymob)

### 5.1 Payment Flow

**Card Payment**:
1. User selects "Pay with Card"
2. Backend calls Paymob API:
   - Get auth token (cached)
   - Register order
   - Get payment key
3. Backend returns iframe URL
4. Frontend redirects to Paymob iframe
5. User enters card details
6. Paymob processes payment
7. Webhook updates order status
8. User redirected to success page

**Wallet Payment**:
1. User selects "Pay with Wallet" + enters mobile
2. Backend initiates wallet payment
3. Backend returns redirect URL
4. User redirected to wallet app
5. User approves payment
6. Webhook updates order status

**Fawry Payment**:
1. User selects "Pay with Fawry"
2. Backend generates bill reference code
3. User receives code
4. User goes to Fawry kiosk to pay
5. Webhook updates order status

### 5.2 Webhook Security

**Endpoint**: `POST /webhook/paymob`

**Security**: HMAC signature validation

**Validation Process**:
1. Extract HMAC from query parameter
2. Reconstruct signature from transaction data
3. Compare with provided HMAC
4. Only process if signatures match

**Verified Fields**:
- amount_cents
- created_at
- currency
- error_occured
- has_parent_transaction
- id
- integration_id
- is_3d_secure
- is_auth
- is_capture
- is_refunded
- is_standalone_payment
- is_voided
- order (id)
- owner
- pending
- source_data_pan
- source_data_sub_type
- source_data_type
- success

---

## 6. Security Requirements

### 6.1 Authentication & Authorization

**Password Security**:
- Hashing: bcrypt with 8 salt rounds
- Min length: 6 characters
- Never exposed in responses
- Separate field for password reset tokens

**JWT Tokens**:
- Signed with secret key (min 32 chars)
- Expiration: 7 days (configurable)
- Included in all protected routes
- Format: `Authorization: Bearer <token>`

**Role-Based Access**:
- Three roles: customer, admin, owner
- Middleware: `protect()` + `authorize(roles)`
- Owner has all permissions
- Admin can manage products/orders but not users
- Customer can only access own data

---

### 6.2 API Security

**Helmet**: Security headers
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

**Rate Limiting** (Production Only):
- Window: 15 minutes
- Max requests: 100
- Scope: Per IP address

**Input Validation**:
- All inputs validated at route level
- express-validator middleware
- Sanitization of user input
- Type checking

**Payload Limiting**:
- Max request body size: 10 KB
- Prevents DoS attacks

---

### 6.3 Data Security

**Sensitive Data Protection**:
- Cost prices hidden from public API
- Passwords never returned
- Payment tokens never stored
- HMAC verification for webhooks

**Soft Deletes**:
- Products marked as deleted, not removed
- Maintains order history integrity
- Admin can recover deleted items

---

## 7. Logging & Monitoring

### 7.1 Winston Logger Configuration

**Log Levels**: error, warn, info, http, debug

**Transports**:
1. **Console** (Development):
   - Colorized output
   - Simple format
   - All levels

2. **File - error.log**:
   - Error level only
   - JSON format
   - Persistent storage

3. **File - combined.log**:
   - All levels
   - JSON format
   - Persistent storage

### 7.2 Morgan HTTP Logging

**Format**: Combined (Apache style)

**Integration**: Streams to Winston logger

**Logged Data**:
- Remote address
- Request method
- URL
- HTTP version
- Status code
- Response size
- User agent
- Response time

### 7.3 Error Logging

**Centralized Error Handler**:
```javascript
logger.error(`${err.message} - ${req.originalUrl} - ${req.method} - ${req.IP}`, {
  stack: err.stack
});
```

**Logged Fields**:
- Error message
- Request URL
- HTTP method
- Client IP
- Stack trace

---

## 8. Testing Requirements

### 8.1 Test Coverage

**Functional Tests** (11 files):
- `test_auth.py`: Registration, login, profile, password reset
- `test_products.py`: Product CRUD, search, filtering
- `test_categories.py`: Category management
- `test_cart.py`: Add, update, remove items, stock validation
- `test_orders.py`: Order creation, status updates, user orders
- `test_reviews.py`: Create, update, delete reviews, rating calculation
- `test_payments.py`: Paymob integration, webhook processing
- `test_admin_products.py`: Admin product operations
- `test_admin_users.py`: User management (owner)
- `test_admin_financials.py`: Cost/profit analytics

**Performance Tests** (5 files):
- Response time benchmarks
- Concurrent user handling
- Database query optimization
- API endpoint stress tests

**Security Tests** (5 files):
- Authentication bypass attempts
- Authorization enforcement
- SQL injection prevention
- XSS prevention
- CSRF protection

### 8.2 Test Infrastructure

**Framework**: pytest with pytest-ordering

**Execution**: Sequential (tests depend on previous state)

**Requirements**:
- Backend running on port 5000
- Test database (can be same as dev)
- Owner user: `owner@test.com` with role `owner`

**Command**:
```bash
pytest tests/functional/ -v
```

---

## 9. Deployment Requirements

### 9.1 Environment Variables

**Required**:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<32+ character random string>
JWT_EXPIRE=7d
```

**Payment** (Optional for testing):
```env
PAYMOB_API_KEY=...
PAYMOB_INTEGRATION_ID_CARD=...
PAYMOB_INTEGRATION_ID_WALLET=...
PAYMOB_INTEGRATION_ID_FAWRY=...
PAYMOB_IFRAME_ID=...
PAYMOB_HMAC_SECRET=...
```

### 9.2 Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Generate strong JWT_SECRET (32+ chars)
- [ ] Configure MongoDB Atlas with IP whitelist
- [ ] Set up Paymob production credentials
- [ ] Configure public webhook endpoint
- [ ] Enable HTTPS/TLS
- [ ] Set up log rotation
- [ ] Configure CORS for frontend domain
- [ ] Set up backup strategy for MongoDB
- [ ] Monitor error logs daily

---

## 10. Future Enhancements

### 10.1 Planned Features

**Phase 2**:
- Email notifications (order confirmation, password reset)
- Image upload to Cloudinary
- Advanced search with Elasticsearch
- Inventory low stock alerts
- Sales dashboard for owner

**Phase 3**:
- Machine Learning recommendation engine
- Multi-currency support
- Multi-language support (i18n)
- Abandoned cart recovery emails
- Customer wishlist

**Phase 4**:
- Mobile apps (iOS/Android)
- Vendor/marketplace mode (multi-seller)
- Advanced analytics and reporting
- Customer loyalty program
- Subscription products

---

## 11. API Error Codes

### 11.1 Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "statusCode": 400
  }
}
```

### 11.2 Error Code Reference

| HTTP Code | Error Code | Description |
|-----------|------------|-------------|
| 400 | VALIDATION_ERROR | Invalid input data |
| 400 | DUPLICATE_FIELD | Unique constraint violation (email, SKU) |
| 400 | INSUFFICIENT_STOCK | Product out of stock |
| 400 | EMPTY_CART | Cannot create order from empty cart |
| 401 | UNAUTHORIZED | Missing or invalid JWT token |
| 401 | INVALID_CREDENTIALS | Wrong email/password |
| 403 | FORBIDDEN | Insufficient permissions for action |
| 404 | NOT_FOUND | Resource not found |
| 404 | PRODUCT_NOT_FOUND | Product does not exist |
| 404 | ORDER_NOT_FOUND | Order does not exist |
| 500 | SERVER_ERROR | Internal server error |
| 500 | DATABASE_ERROR | Database operation failed |

---

## 12. Performance Requirements

### 12.1 Response Time Targets

| Endpoint Type | Target Response Time |
|---------------|---------------------|
| Authentication | < 200ms |
| Product List | < 300ms |
| Product Detail | < 150ms |
| Cart Operations | < 200ms |
| Order Creation | < 500ms (includes transaction) |
| Payment Initiation | < 800ms (external API call) |

### 12.2 Scalability Targets

- **Concurrent Users**: 1000+ simultaneous users
- **Database**: MongoDB Atlas auto-scaling
- **API Rate Limit**: 100 requests/15 minutes per IP (production)
- **Max Payload**: 10KB per request

---

## 13. Accessibility & Compliance

### 13.1 Data Privacy
- User passwords hashed (never stored plain text)
- Cost prices hidden from customers
- Payment tokens not persisted
- User data deletion on account closure

### 13.2 Egyptian Market Compliance
- Prices in EGP
- Paymob payment gateway (Egyptian regulatory compliance)
- Arabic language support (planned)
- Local tax calculations (planned)

---

## 14. Conclusion

SmartCart is a production-ready e-commerce platform designed with security, scalability, and real-world deployment in mind. The system prioritizes:

1. **Security**: RBAC, JWT, bcrypt, HMAC verification, rate limiting
2. **Reliability**: Transactional order processing, comprehensive error handling
3. **Maintainability**: Service layer pattern, centralized logging, Swagger docs
4. **Testability**: 50+ automated tests covering functional, performance, and security
5. **Real-world Integration**: Paymob payment gateway with card/wallet/Fawry support

The platform is ready for deployment as a turnkey e-commerce solution for Egyptian online retailers.

---

**Document End**
