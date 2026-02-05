# SmartCart - Production E-Commerce Platform

> **A complete, production-ready e-commerce application with Node.js backend, Angular frontend, MongoDB database, and Paymob payment integration.**

---

## 🎯 Project Overview

SmartCart is a **full-stack e-commerce platform** designed for real-world deployment. It features a secure REST API backend, a modern Angular frontend, integrated Egyptian payment processing via Paymob, comprehensive logging, and extensive automated testing.

### Architecture

```
SmartCart/
├── backend/          # Node.js/Express REST API (Port 5000)
├── frontend/         # Angular 20 SSR Application (Port 4200)
└── tests/            # Comprehensive test suite (pytest)
```

---

## ✨ Core Features

### 🔐 Authentication & Authorization
- **JWT-based authentication** with bcrypt password hashing
- **Role-based access control (RBAC)**: `customer`, `admin`, `owner`
- **Password reset** with crypto tokens and expiration
- **Email validation** with regex patterns
- **Protected routes** with middleware enforcement

### 👤 User Management
- User profiles with multiple shipping addresses
- Mobile number storage for payment integration
- Owner-only user administration (role assignment, user deletion)
- Secure password storage (never exposed in responses)

### 🛍️ Product Catalog
- **Full CRUD operations** for products and categories
- **SEO-friendly slugs** auto-generated from names
- **SKU management** with uniqueness enforcement
- **Soft delete** functionality (products never truly deleted)
- **Image gallery support** (array of image URLs)
- **Stock tracking** with automatic updates
- **Featured products** flagging
- **Analytics tracking**: views and purchases count
- **Category relationships** with MongoDB ObjectId references

### 🛒 Shopping Cart
- **Per-user cart** management (one cart per customer)
- **Real-time stock validation**
- **Price locking** (prices saved when item added to cart)
- **Automatic subtotal calculation**
- **Item quantity management** (add, update, remove)

### 📦 Order Processing
- **Sequential order numbers** (e.g., SC-000001, SC-000002)
- **Transactional order creation** (stock reduction + cart clearing)
- **Order status tracking**: Pending → Paid → Shipped → Delivered → Cancelled
- **Admin order management** (view all orders, update status)
- **Cost price tracking** for profit analysis (owner-only)
- **Complete shipping address storage**

### 💳 Payment Integration (Paymob)
- **Three payment methods**:
  - **Card**: Iframe integration with auto-redirect
  - **Mobile Wallet**: Direct payment via phone number
  - **Fawry**: Bill reference generation for cash payment
- **Secure webhook validation** using HMAC signatures
- **Auth token caching** for performance
- **Automatic payment status updates** via webhooks
- **Complete transaction logging**

### ⭐ Product Reviews
- **User reviews** with rating (1-5 stars), title, and comment
- **One review per user per product** constraint
- **Automatic rating calculation** using MongoDB aggregation
- **Product rating/reviewCount auto-update** via Mongoose middleware

### 🛡️ Security
- **Helmet** for secure HTTP headers
- **Rate limiting** in production (100 requests per 15 minutes)
- **Payload size limiting** (10KB max)
- **Password hashing** with bcrypt (8 salt rounds)
- **HMAC webhook verification** for payment security
- **JWT expiration** (configurable, default 7 days)

### 📊 Logging & Monitoring
- **Winston logger** with file and console transports
- **Morgan HTTP logging** integrated with Winston
- **Colored console output** for development
- **Rotating log files**:
  - `logs/error.log` - Error-level logs only
  - `logs/combined.log` - All logs
  - `logs/ml_service.log` - ML service (if deployed)
- **Request/response logging** with timestamps

### 📚 API Documentation
- **Swagger/OpenAPI** auto-generated docs at `/api-docs`
- **Complete endpoint documentation** with request/response schemas
- **Interactive testing** via Swagger UI
- **Authentication examples** included

### 🧪 Testing
- **Functional tests** (11 test files):
  - `test_auth.py` - Registration, login, profile
  - `test_products.py` - Product CRUD operations
  - `test_categories.py` - Category management
  - `test_cart.py` - Cart operations
  - `test_orders.py` - Order creation and management
  - `test_reviews.py` - Review system
  - `test_payments.py` - Paymob integration
  - `test_admin_products.py` - Admin product operations
  - `test_admin_users.py` - User management (owner)
  - `test_admin_financials.py` - Cost/profit analytics
- **Performance tests** (5 files)
- **Security tests** (5 files)
- **Total**: 50+ automated tests

---

## 🏗️ Technical Architecture

### Backend (Node.js/Express)

```
backend/src/
├── models/           # Mongoose schemas (6 models)
│   ├── userModel.js        # User authentication & profiles
│   ├── productModel.js     # Products with analytics
│   ├── categoryModel.js    # Product categories
│   ├── orderModel.js       # Orders with payment data
│   ├── cartModel.js        # Shopping carts
│   └── reviewModel.js      # Product reviews
│
├── controllers/      # Request handlers (8 controllers)
│   ├── authController.js
│   ├── productController.js
│   ├── categoryController.js
│   ├── orderController.js
│   ├── cartController.js
│   ├── reviewController.js
│   ├── userController.js
│   └── webhookController.js
│
├── services/         # Business logic layer (8 services)
│   ├── authService.js
│   ├── productService.js
│   ├── categoryService.js
│   ├── orderService.js
│   ├── cartService.js
│   ├── reviewService.js
│   ├── userService.js
│   └── paymobService.js     # Payment gateway integration
│
├── routes/           # API endpoints (8 route files)
│   ├── authRoutes.js        # POST /api/v1/auth/register, /login, /me
│   ├── productRoutes.js     # GET|POST /api/v1/products, GET /:slug, PUT|DELETE /:id
│   ├── categoryRoutes.js    # Full CRUD /api/v1/categories
│   ├── orderRoutes.js       # POST /api/v1/orders, GET /my, /:id/pay, /:id/status
│   ├── cartRoutes.js        # GET|POST|DELETE /api/v1/cart
│   ├── reviewRoutes.js      # GET|POST /api/v1/reviews, PUT|DELETE /:id
│   ├── userRoutes.js        # GET|PUT|DELETE /api/v1/users (owner only)
│   └── webhookRoutes.js     # POST /webhook/paymob (public endpoint)
│
├── middleware/       # Request processing
│   ├── authMiddleware.js      # protect() + authorize(roles)
│   ├── validationMiddleware.js # express-validator rules
│   └── errorMiddleware.js   # Centralized error handler
│
├── utils/            # Helper functions (6 utilities)
│   ├── asyncHandler.js       # Async error wrapper
│   ├── generateToken.js      # JWT token creation
│   ├── logger.js             # Winston configuration
│   ├── orderNumberUtil.js    # SC-XXXXXX generator
│   ├── paymobClient.js       # Axios instance for Paymob
│   └── paymobHmac.js         # HMAC signature verification
│
├── config/
│   ├── mongoDataBaseConnection.js  # MongoDB Atlas connection
│   └── swagger.js            # Swagger/OpenAPI config
│
└── server.js         # Express app initialization
```

### Frontend (Angular 20)

```
frontend/src/app/
├── core/                 # Singleton services & components
│   ├── components/
│   │   ├── header/       # Navigation bar
│   │   ├── footer/       # Site footer
│   │   ├── product-card/ # Reusable product display
│   │   └── ... (5 more components)
│   │
│   ├── services/
│   │   └── cart-animation.service.ts  # Cart UI animations
│   │
│   ├── guards/           # Route protection
│   ├── interceptors/     # HTTP interceptors (2 files)
│   └── interfaces/       # TypeScript interfaces (5 files)
│
├── features/             # Feature modules (10 pages)
│   ├── home/             # Landing page
│   ├── product-list/     # Product catalog
│   ├── product-detail/   # Single product view
│   ├── cart/             # Shopping cart
│   ├── checkout/         # Order checkout
│   ├── login/            # User login
│   ├── register/         # User registration
│   ├── account/          # User profile
│   ├── category/         # Category browsing
│   └── order-detail/     # Order view
│
├── app-routing-module.ts # Route configuration
└── app-module.ts         # App module (Angular modules)
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and npm
- **MongoDB Atlas** account (or local MongoDB instance)
- **Python 3.8+** (for running tests)
- **Paymob merchant account** (for payment features)

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file** in `backend/` directory:
   ```env
   NODE_ENV=development
   PORT=5000
   
   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smartcart
   
   # Authentication
   JWT_SECRET=your-super-secret-random-string-min-32-chars
   JWT_EXPIRE=7d
   
   # Paymob Payment Gateway
   PAYMOB_API_KEY=your_paymob_api_key
   PAYMOB_INTEGRATION_ID_CARD=your_card_integration_id
   PAYMOB_INTEGRATION_ID_WALLET=your_wallet_integration_id
   PAYMOB_INTEGRATION_ID_FAWRY=your_fawry_integration_id
   PAYMOB_IFRAME_ID=your_iframe_id
   PAYMOB_HMAC_SECRET=your_hmac_secret
   ```

4. **Run the server**:
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:5000`

5. **View API Documentation**:
   Open browser to `http://localhost:5000/api-docs`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   ng serve
   ```

   The app will be available at `http://localhost:4200`

### Running Tests

1. **Install Python dependencies** (from project root):
   ```bash
   pip install pytest pytest-ordering requests
   ```

2. **Ensure backend is running** on port 5000

3. **Run all tests**:
   ```bash
   pytest tests/functional/ -v
   ```

4. **Run specific test file**:
   ```bash
   pytest tests/functional/test_products.py -v
   ```

---

## 📡 API Endpoints

### Authentication (`/api/v1/auth`)
```
POST   /register          # Create new user account
POST   /login             # Login with email/password
GET    /me                # Get current user profile (protected)
POST   /forgot-password   # Request password reset token
PUT    /reset-password    # Reset password with token
```

### Products (`/api/v1/products`)
```
GET    /                  # Get all products (filters: keyword, category, page, limit)
GET    /:slug             # Get single product by slug
POST   /                  # Create product (admin/owner only)
PUT    /:id               # Update product (admin/owner only)
DELETE /:id               # Delete product (owner only)
```

### Categories (`/api/v1/categories`)
```
GET    /                  # Get all categories
GET    /:slug             # Get single category by slug
POST   /                  # Create category (admin/owner only)
PUT    /:id               # Update category (admin/owner only)
DELETE /:id               # Delete category (owner only)
```

### Cart (`/api/v1/cart`)
```
GET    /                  # Get user's cart (protected)
POST   /                  # Add item to cart (protected)
PUT    /:productId        # Update item quantity (protected)
DELETE /:productId        # Remove item from cart (protected)
DELETE /                  # Clear entire cart (protected)
```

### Orders (`/api/v1/orders`)
```
POST   /                  # Create order from cart (protected)
GET    /my                # Get user's orders (protected)
GET    /:id               # Get single order (protected)
GET    /                  # Get all orders (admin/owner only)
PATCH  /:id/status        # Update order status (admin/owner only)
POST   /:id/pay           # Initiate payment (protected)
```

### Reviews (`/api/v1/reviews`)
```
GET    /product/:productId    # Get all reviews for product
POST   /                      # Create review (protected)
PUT    /:id                   # Update own review (protected)
DELETE /:id                   # Delete own review (protected)
```

### Users (`/api/v1/users`) - Owner Only
```
GET    /                  # Get all users (owner only)
GET    /:id               # Get user by ID (owner only)
PUT    /:id               # Update user role (owner only)
DELETE /:id               # Delete user (owner only)
```

### Webhooks (`/webhook`)
```
POST   /paymob            # Paymob payment webhook (public, HMAC-secured)
```

### Health & Docs
```
GET    /api/v1/health     # API health check
GET    /api-docs          # Swagger documentation interface
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Node.js, Express 5, Mongoose, JWT, bcryptjs |
| **Database** | MongoDB Atlas |
| **Frontend** | Angular 20, TypeScript, Tailwind CSS |
| **Payment** | Paymob (Card, Wallet, Fawry) |
| **Logging** | Winston, Morgan |
| **Security** | Helmet, express-rate-limit, bcrypt |
| **Validation** | express-validator |
| **Documentation** | Swagger/OpenAPI, swagger-ui-express |
| **Testing** | pytest, pytest-ordering, requests |
| **Development** | Nodemon, Angular CLI |

---

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Backend server port | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `JWT_EXPIRE` | JWT expiration period (e.g., 7d) | Yes |
| `PAYMOB_API_KEY` | Paymob API key | For payments |
| `PAYMOB_INTEGRATION_ID_CARD` | Card payment integration ID | For card payments |
| `PAYMOB_INTEGRATION_ID_WALLET` | Wallet integration ID | For wallet payments |
| `PAYMOB_INTEGRATION_ID_FAWRY` | Fawry integration ID | For Fawry payments |
| `PAYMOB_IFRAME_ID` | Iframe ID for card payments | For card payments |
| `PAYMOB_HMAC_SECRET` | HMAC secret for webhook security | For webhooks |

---

## 🔒 Security Features

1. **Password Security**
   - Bcrypt hashing with 8 salt rounds
   - Passwords never returned in API responses (`select: false`)
   - Password reset with crypto tokens and 10-minute expiration

2. **Authentication Security**
   - JWT-based stateless authentication
   - Protected routes with middleware
   - Role-based authorization

3. **API Security**
   - Helmet for HTTP header security
   - Rate limiting in production (100 req/15min)
   - Request payload limiting (10KB)
   - CORS configuration

4. **Payment Security**
   - HMAC signature verification for webhooks
   - Secure token-based payment flow
   - No credit card data stored

5. **Data Security**
   - Soft delete for products (never truly removed)
   - Cost prices hidden from public API
   - User addresses securely stored

---

## 📊 Database Schema

### Key Models

**User**
- Email, password (hashed), role, firstName, lastName, mobileNumber
- Addresses array (street, city, state, zip, country)
- resetPasswordToken, resetPasswordExpire

**Product**
- name, slug, description, price, costPrice (hidden)
- SKU (unique), stock, categoryId (ref)
- images array, featured flag
- rating, reviewCount, views, purchases
- isDeleted (soft delete)

**Category**
- name, slug, description, imageUrl

**Order**
- userId (ref), orderNumber (unique, SC-XXXXXX)
- items array (productId, name, quantity, price, cost, image)
- shippingAddress (embedded document)
- subtotal, tax, shipping, total
- status, paymentMethod, paymentResult, isPaid, paidAt
- timestamps: shippedAt, deliveredAt

**Cart**
- userId (ref, unique)
- items array (productId, quantity, price)
- subtotal

**Review**
- productId (ref), userId (ref)
- rating (1-5), title, comment
- Unique constraint: one review per user per product

---

## 🎯 Project Status

### ✅ Completed Features
- Complete backend API with 50+ endpoints
- Full authentication and authorization system
- Product catalog with SEO-friendly slugs
- Shopping cart with stock validation
- Order processing with transactional updates
- Paymob payment integration (3 methods)
- Product review and rating system
- User management (owner controls)
- Winston logging infrastructure
- Swagger API documentation
- 50+ automated tests (functional, performance, security)

### 🚧 In Progress
- Frontend-backend integration
- Angular service layer implementation
- State management setup
- Payment UI components

### 📅 Roadmap
- Image upload to cloud storage (Cloudinary)
- Email notifications (order confirmation, password reset)
- Admin dashboard analytics
- Product recommendation engine (ML service)
- Inventory alerts
- Sales reporting

---

## 📄 License

This project is private and proprietary.

---

## 👨‍💻 Developer Notes

### Code Organization Principles
1. **Service Layer Pattern**: Controllers are thin; business logic lives in services
2. **Centralized Error Handling**: All errors flow through `errorMiddleware`
3. **Route-Level Validation**: Input validated at route definition with `express-validator`
4. **Swagger Documentation Separation**: All API docs stored at bottom of route files for clean code
5. **Modular Frontend**: Component-based architecture with clear core/features separation

### Testing Best Practices
- Tests use `pytest-ordering` for sequential execution
- Tests require a permanent owner user (`owner@test.com`) in database
- Backend must be running before executing tests
- Tests clean up after themselves (except seed data)

### Payment Integration Notes
- Paymob requires Egyptian business registration
- Test credentials available in Paymob dashboard
- Webhook endpoint must be publicly accessible (use ngrok for local dev)
- Card payments use iframe; wallet/fawry use redirects

---

**Built with ❤️ for real-world e-commerce**
