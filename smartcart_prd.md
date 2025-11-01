# SmartCart - Streamlined E-Commerce Platform

> **Full-Stack E-Commerce with AI-Powered Insights**
>
> Node.js/Express + Angular + Python ML + MongoDB

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Schema](#3-database-schema)
4. [Design Patterns](#4-design-patterns)
5. [Tech Stack](#5-tech-stack)
6. [API Overview](#6-api-overview)
7. [Feature Breakdown](#7-feature-breakdown)
8. [Python ML Services](#8-python-ml-services)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Deployment Guide](#10-deployment-guide)

---

## 1. Project Overview

### 1.1 Vision

A production-ready e-commerce platform with two portals (Customer + Admin) featuring Python-powered recommendations and basic analytics.

### 1.2 Core Objectives

- ✅ RESTful API backend (Node.js + Express)
- ✅ Angular frontend (responsive UI)
- ✅ Python ML microservice (basic recommendations)
- ✅ MongoDB for data storage
- ✅ Stripe payment integration
- ✅ 100% free tier deployment

### 1.3 Key Features

**Customer Portal**: Browse products, cart, checkout, order tracking, reviews

**Admin Portal**: Product management, order management, basic analytics, AI recommendations

**ML Features**: Product recommendations, sales trends

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│           CLIENT LAYER (Angular)                │
│                                                 │
│  ┌──────────────┐        ┌──────────────┐      │
│  │   Customer   │        │    Admin     │      │
│  │    Portal    │        │   Portal     │      │
│  └──────────────┘        └──────────────┘      │
│         │                        │             │
│         └────────────┬───────────┘             │
│                  HTTP/REST                      │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│        API GATEWAY (Node.js + Express)          │
│                                                 │
│  Routes: /auth, /products, /cart, /orders      │
│  Middleware: JWT, RBAC, Validation              │
└─────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
┌─────────────────┐          ┌─────────────────┐
│ Business Logic  │          │  Python ML API  │
│  (Services)     │◄─────────│  (FastAPI)      │
│                 │   HTTP   │                 │
│ - Auth          │          │ - Recommend     │
│ - Products      │          │ - Trends        │
│ - Orders        │          │                 │
└─────────────────┘          └─────────────────┘
        │                              │
        ▼                              ▼
┌─────────────────────────────────────────────────┐
│              DATA LAYER                         │
│                                                 │
│  ┌────────┐  ┌────────┐  ┌────────┐           │
│  │MongoDB │  │Cloudin.│  │ Stripe │           │
│  │ Atlas  │  │  ary   │  │        │           │
│  └────────┘  └────────┘  └────────┘           │
└─────────────────────────────────────────────────┘
```

### 2.2 Communication Flow

**Normal Request:**

```
Frontend → API Gateway → Service Layer → MongoDB → Response
```

**ML Prediction:**

```
Frontend → API Gateway → Python ML Service → Response
```

### 2.3 Folder Structure

```
smartcart/
├── backend/              # Node.js API
│   ├── src/
│   │   ├── config/       # DB, env configs
│   │   ├── models/       # Mongoose models
│   │   ├── routes/       # API routes
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth, validation
│   │   └── utils/        # Helpers
│   ├── .env
│   └── package.json
│
├── ml-service/           # Python ML
│   ├── app/
│   │   ├── routes/       # FastAPI endpoints
│   │   ├── services/     # ML algorithms
│   │   └── utils/        # Helpers
│   ├── models/          # Saved .pkl files
│   ├── requirements.txt
│   └── main.py
│
└── frontend/            # Angular
    ├── src/
    │   └── app/
    │       ├── core/     # Services, guards
    │       ├── shared/   # Shared components
    │       └── features/
    │           ├── customer/
    │           └── admin/
    ├── angular.json
    └── package.json
```

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────┐
│                         USERS                           │
├─────────────────────────────────────────────────────────┤
│ _id          : ObjectId (PK)                            │
│ email        : String (unique, indexed)                 │
│ password     : String (hashed)                          │
│ role         : String (customer/admin/owner)            │
│ firstName    : String                                   │
│ lastName     : String                                   │
│ phone        : String                                   │
│ addresses    : [{street, city, state, zip, country}]    │
│ createdAt    : Date                                     │
│ updatedAt    : Date                                     │
└─────────────────────────────────────────────────────────┘
         │                           │
         │                           │
         │                           │
         ▼                           ▼
┌──────────────────┐      ┌────────────────────────────┐
│      CARTS       │      │        ORDERS              │
├──────────────────┤      ├────────────────────────────┤
│ _id    : ObjId   │      │ _id          : ObjectId    │
│ userId : ObjId ──┘      │ orderNumber  : String      │
│ items  : [{      │      │ userId       : ObjectId ───┘
│   productId ─────┼──┐   │ items        : [{          │
│   quantity       │  │   │   productId  : ObjectId ───┐
│   price          │  │   │   name       : String      │
│ }]               │  │   │   quantity   : Number      │
│ subtotal: Number │  │   │   price      : Number      │
│ updatedAt: Date  │  │   │ }]                         │
└──────────────────┘  │   │ subtotal     : Number      │
                      │   │ tax          : Number      │
                      │   │ shipping     : Number      │
                      │   │ total        : Number      │
                      │   │ status       : String      │
                      │   │ paymentId    : String      │
                      │   │ shippingAddr : Object      │
                      │   │ createdAt    : Date        │
                      │   └────────────────────────────┘
                      │
                      │   ┌────────────────────────────┐
                      │   │        REVIEWS             │
                      │   ├────────────────────────────┤
                      │   │ _id       : ObjectId       │
                      └───│ productId : ObjectId ──┐   │
                          │ userId    : ObjectId   │   │
                          │ rating    : Number     │   │
                          │ title     : String     │   │
                          │ comment   : String     │   │
                          │ createdAt : Date       │   │
                          └────────────────────────┼───┘
                                                   │
                                                   │
                      ┌────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                       PRODUCTS                          │
├─────────────────────────────────────────────────────────┤
│ _id          : ObjectId (PK)                            │
│ name         : String (indexed)                         │
│ slug         : String (unique, indexed)                 │
│ description  : String                                   │
│ categoryId   : ObjectId (FK) ───────┐                   │
│ price        : Number               │                   │
│ sku          : String (unique)      │                   │
│ stock        : Number               │                   │
│ images       : [String]             │                   │
│ featured     : Boolean              │                   │
│ rating       : Number (avg)         │                   │
│ reviewCount  : Number               │                   │
│ views        : Number               │                   │
│ purchases    : Number               │                   │
│ createdAt    : Date                 │                   │
│ updatedAt    : Date                 │                   │
└─────────────────────────────────────┼───────────────────┘
                                      │
                                      │
                                      ▼
                      ┌─────────────────────────────────┐
                      │        CATEGORIES               │
                      ├─────────────────────────────────┤
                      │ _id         : ObjectId (PK)     │
                      │ name        : String            │
                      │ slug        : String (unique)   │
                      │ description : String            │
                      │ imageUrl    : String            │
                      │ createdAt   : Date              │
                      └─────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    ANALYTICS_DAILY                      │
├─────────────────────────────────────────────────────────┤
│ _id          : ObjectId (PK)                            │
│ date         : Date (unique, indexed)                   │
│ revenue      : Number                                   │
│ orders       : Number                                   │
│ topProducts  : [{productId, sales, revenue}]           │
│ createdAt    : Date                                     │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Relationships Summary

```
User (1) ─────► (N) Orders
User (1) ─────► (1) Cart
Category (1) ──► (N) Products
Product (1) ───► (N) Reviews
Product (N) ◄──► (N) Cart Items
```

### 3.3 Key Indexes

```javascript
// Users
users.createIndex({ email: 1 }, { unique: true });

// Products
products.createIndex({ slug: 1 }, { unique: true });
products.createIndex({ categoryId: 1 });
products.createIndex({ name: "text", description: "text" });

// Orders
orders.createIndex({ userId: 1, createdAt: -1 });
orders.createIndex({ orderNumber: 1 }, { unique: true });

// Categories
categories.createIndex({ slug: 1 }, { unique: true });

// Reviews
reviews.createIndex({ productId: 1, createdAt: -1 });

// Analytics
analytics_daily.createIndex({ date: 1 }, { unique: true });
```

---

## 4. Design Patterns

### 4.1 Backend Design Patterns

**1. Repository Pattern**

```
Purpose: Separate data access from business logic

Flow:
Controller → Service → Repository → Model → Database

Example:
ProductController.getAll()
  → ProductService.getAllProducts()
    → ProductRepository.findAll()
      → Product.find()

Benefits:
- Clean separation of concerns
- Easy to test (mock repositories)
- Reusable data access logic
- Can swap databases easily
```

**2. Service Layer Pattern**

```
Purpose: Encapsulate business logic

Structure:
- AuthService (login, register, token management)
- ProductService (CRUD + business rules)
- OrderService (order processing, calculations)
- PaymentService (Stripe integration)

Benefits:
- Controllers stay thin
- Business logic is reusable
- Easy to test
```

**3. Middleware Chain Pattern**

```
Purpose: Sequential request processing

Flow:
Request → Auth → RBAC → Validation → Controller → Response

Example:
// Admin or Owner can create products
router.post('/products',
  authenticate,          // Verify JWT
  authorize('admin', 'owner'), // UPDATED: Both roles can access
  validateProduct,       // Check input
  productController.create
)

// Only Owner can manage other users
router.get('/admin/users',
  authenticate,
  authorize('owner'),    // NEW: Only owner can access
  userController.getAllUsers
)
```

**4. Factory Pattern**

```
Purpose: Create objects without specifying exact class

Used for:
- Response formatting (success/error)
- Email templates
- Notification types

Example:
ResponseFactory.success(data)
ResponseFactory.error(code, message)
```

**5. Strategy Pattern**

```
Purpose: Define family of algorithms, make them interchangeable

Used for:
- Payment methods (Stripe, PayPal)
- Shipping calculators (Standard, Express)

Example:
class ShippingStrategy {
  calculate(order) { /* override */ }
}

class StandardShipping extends ShippingStrategy {
  calculate(order) { return 5.99; }
}
```

### 4.2 Frontend Design Patterns

**1. Module Pattern**

```
Purpose: Organize code by features

Structure:
- CustomerModule (lazy-loaded)
- AdminModule (lazy-loaded)
- SharedModule (eagerly-loaded)

Benefits:
- Better performance (lazy loading)
- Clear code organization
- Easy to maintain
```

**2. Service Pattern**

```
Purpose: Centralized business logic

Services:
- ProductService (API calls)
- CartService (state management)
- AuthService (authentication)
- StorageService (localStorage wrapper)

Singleton pattern (providedIn: 'root')
```

**3. Guard Pattern**

```
Purpose: Control navigation

Guards:
- AuthGuard (must be logged in)
- RoleGuard (must have role)
- UnsavedChangesGuard (prevent accidental navigation)

Example:
{
  path: 'admin',
  canActivate: [AuthGuard, RoleGuard],
  data: { role: 'admin' }
}
```

**4. Observer Pattern**

```
Purpose: React to data changes

Using RxJS:
- Observables for HTTP requests
- Subjects for event communication
- BehaviorSubject for state

Example:
cartService.items$.subscribe(items => {
  // Update UI when cart changes
})
```

**5. Facade Pattern**

```
Purpose: Simplify complex subsystems

Example:
CheckoutFacade combines:
- CartService
- OrderService
- PaymentService
- EmailService

checkoutFacade.processCheckout(data)
  // Handles all checkout steps internally
```

### 4.3 Python ML Design Patterns

**1. Strategy Pattern**

```
Purpose: Switch between recommendation algorithms

Strategies:
- CollaborativeFiltering
- ContentBasedFiltering
- PopularityBased

Example:
class RecommendationStrategy:
    def recommend(self, user_id): pass

class CollaborativeFiltering(RecommendationStrategy):
    def recommend(self, user_id):
        # Implementation
```

**2. Singleton Pattern**

```
Purpose: Single instance of model loader

Example:
class ModelLoader:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.load_models()
        return cls._instance

Benefits:
- Load models once at startup
- Memory efficient
- Shared across all requests
```

**3. Template Method Pattern**

```
Purpose: Define algorithm skeleton

Example:
class BaseMLModel:
    def predict(self, data):
        self.preprocess(data)
        result = self.run_model(data)
        return self.postprocess(result)

    def preprocess(self, data): pass  # Override
    def run_model(self, data): pass   # Override
    def postprocess(self, result): pass  # Override
```

### 4.4 Communication Patterns

**1. API Gateway Pattern**

```
All client requests → Single entry point (Express API) → Route to services
```

**2. Microservice Pattern**

```
Node.js API ◄──► Python ML Service
(Loosely coupled, independently deployable)
```

**3. Repository Pattern (Data Access)**

```
Consistent interface for all database operations
```

---

## 5. Tech Stack

### 5.1 Backend (Node.js)

```yaml
Core:
  - Node.js: 20+ LTS
  - Express.js: 4.18+
  - MongoDB: 7+ with Mongoose 8+

Authentication & Security:
  - jsonwebtoken: JWT auth
  - bcryptjs: Password hashing
  - helmet: Security headers
  - cors: CORS configuration
  - express-rate-limit: Rate limiting

File Upload & Storage:
  - multer: File upload
  - cloudinary: Cloud storage

Payment:
  - stripe: Payment processing

Email:
  - nodemailer: Email service

Validation:
  - express-validator: Input validation
```

### 5.2 Python ML Service

```yaml
Framework:
  - FastAPI: 0.104+
  - uvicorn: ASGI server
  - pydantic: Data validation

ML Libraries:
  - pandas: Data manipulation
  - numpy: Numerical computing
  - scikit-learn: ML algorithms
  - joblib: Model persistence

Utilities:
  - python-dotenv: Environment vars
  - requests: HTTP client
```

### 5.3 Frontend (Angular)

```yaml
Framework:
  - Angular: 17+
  - TypeScript: 5+

UI & Styling:
  - Tailwind CSS: Utility-first CSS
  - Angular Material: UI components
  - Lucide Icons: Icon library

HTTP & State:
  - HttpClient: API calls
  - RxJS: Reactive programming
  - Services: State management

Utilities:
  - date-fns: Date formatting
  - ngx-toastr: Notifications
  - Angular Forms: Form handling
```

### 5.4 Deployment (Free Tier)

```yaml
Backend API:
  - Railway.app or Render.com

ML Service:
  - Railway.app or Render.com

Frontend:
  - Vercel or Netlify

Database:
  - MongoDB Atlas M0 (512MB free)

Storage:
  - Cloudinary (25GB free)

Email:
  - Brevo (300 emails/day free)
```

---

## 6. API Overview

### 6.1 Base URL

```
Dev:  http://localhost:5000/api/v1
Prod: https://smartcart-api.railway.app/api/v1
```

### 6.2 Authentication Endpoints

```
POST   /auth/register              # Register new user
POST   /auth/login                 # Login user
GET    /auth/me                    # Get current user
POST   /auth/forgot-password       # Request password reset
POST   /auth/reset-password/:token # Reset password
```

### 6.2.1 Admin Management Endpoints (Owner Only)

GET /admin/users # Get all users (Owner)
POST /admin/users # Create a new user (Owner)
GET /admin/users/:id # Get user details (Owner)
PUT /admin/users/:id # Update user (role, info) (Owner)
DELETE /admin/users/:id # Delete user (Owner)

### 6.3 Product Endpoints

```
GET    /products                   # List products (public)
GET    /products/:slug             # Get product details
POST   /products                   # Create product (Admin)
PUT    /products/:id               # Update product (Admin)
DELETE /products/:id               # Delete product (Admin)
GET    /products/featured          # Get featured products
POST   /products/:id/upload-images # Upload images (Admin)
```

### 6.4 Category Endpoints

```
GET    /categories                 # List all categories
GET    /categories/:slug           # Get category details
POST   /categories                 # Create category (Admin)
PUT    /categories/:id             # Update category (Admin)
DELETE /categories/:id             # Delete category (Admin)
```

### 6.5 Cart Endpoints

```
GET    /cart                       # Get user cart
POST   /cart/items                 # Add to cart
PUT    /cart/items/:itemId         # Update quantity
DELETE /cart/items/:itemId         # Remove item
DELETE /cart                       # Clear cart
```

### 6.6 Order Endpoints

```
POST   /orders                     # Create order
GET    /orders                     # List user orders
GET    /orders/:id                 # Get order details
PATCH  /orders/:id/status          # Update status (Admin)
```

### 6.7 Review Endpoints

```
POST   /reviews                    # Create review
GET    /reviews/product/:productId # Get product reviews
PUT    /reviews/:id                # Update review
DELETE /reviews/:id                # Delete review
```

### 6.8 Payment Endpoints

```
POST   /payments/create-intent     # Create Stripe payment intent
POST   /payments/webhook           # Stripe webhook handler
```

### 6.9 Analytics Endpoints (Admin)

```
GET    /analytics/dashboard        # Overview stats
GET    /analytics/revenue          # Revenue data
GET    /analytics/products         # Product performance
GET    /analytics/orders           # Order statistics
```

### 6.10 ML Endpoints (Python Service)

```
GET    /ml/recommend/:userId       # Product recommendations
GET    /ml/trending                # Trending products
POST   /ml/train                   # Retrain models (Admin)
```

### 6.11 Response Format

```json
Success Response:
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}

Error Response:
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}

Paginated Response:
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}


```

---

## 7. Feature Breakdown

### 7.1 Customer Portal Features

```yaml
Home Page:
  - Hero section with featured products
  - Category grid
  - Trending products
  - New arrivals

Product Browsing:
  - Grid view with pagination
  - Filters (category, price range)
  - Search functionality
  - Sort options (price, rating, newest)

Product Detail:
  - Image gallery
  - Product information
  - Add to cart button
  - Reviews section
  - Related products (AI)

Shopping Cart:
  - Items list with thumbnails
  - Quantity adjustment
  - Remove items
  - Price summary
  - Proceed to checkout

Checkout:
  - Shipping address form
  - Payment with Stripe
  - Order summary
  - Place order button

User Account:
  - Profile management
  - Order history
  - Order tracking
  - Address book

Reviews:
  - Write review for purchased products
  - View own reviews
  - Edit/delete reviews
```

### 7.2 Admin Portal Features

```yaml
Dashboard:
  - Key metrics (revenue, orders, customers)
  - Revenue chart (last 30 days)
  - Recent orders
  - Low stock alerts

User Management (Owner Only):
  - User list table (searchable, filterable)
  - Add new user form (create customer or admin)
  - Edit user (change name, email, phone)
  - Change user role (customer <-> admin <-> owner)
  - Delete user

Product Management:
  - Product list table (sortable, filterable)
  - Add new product form
  - Edit product
  - Delete product
  - Upload multiple images
  - Manage stock

Category Management:
  - Category list
  - Add/edit/delete categories
  - Upload category image

Order Management:
  - Order list with filters
  - Order details view
  - Update order status
  - View customer info

Analytics:
  - Revenue analytics
  - Top-selling products
  - Sales by category
  - Order statistics

AI Insights:
  - Product recommendations performance
  - Trending products
```

---

## 8. Python ML Services

### 8.1 ML Features Overview

```yaml
1. Product Recommendations:
  - Collaborative filtering (user-based)
  - Show 10 recommended products per user

2. Trending Products:
  - Based on recent views and purchases
  - Updated daily
```

### 8.2 Recommendation Algorithm

```python
Algorithm: User-Based Collaborative Filtering

Steps:
1. Get user's purchase history
2. Find similar users (cosine similarity)
3. Get products liked by similar users
4. Rank by similarity score
5. Return top 10 products

Libraries:
- pandas: Data manipulation
- scikit-learn: cosine_similarity
- joblib: Model persistence
```

### 8.3 Trending Products Algorithm

```python
Algorithm: Weighted Score

Formula:
score = (views * 0.3) + (purchases * 0.7)

Steps:
1. Get last 7 days of product activity
2. Calculate score for each product
3. Rank by score
4. Return top 20 products

Updates: Daily via cron job
```

### 8.4 FastAPI Endpoints

```python
# main.py structure

from fastapi import FastAPI
from app.routes import recommendations, trends

app = FastAPI(title="SmartCart ML API")

app.include_router(recommendations.router)
app.include_router(trends.router)

@app.get("/")
def health_check():
    return {"status": "healthy"}
```

### 8.5 Model Training

```python
# Training happens:
1. Initial: When service starts (load from data)
2. Updates: Weekly via scheduled job
3. Manual: Admin can trigger retraining

Training data:
- Users collection (purchase history)
- Products collection (features)
- Orders collection (interactions)
```

### 8.6 Communication with Node.js

```javascript
// In Node.js service
const axios = require("axios");

async function getRecommendations(userId) {
  try {
    const response = await axios.get(
      `${process.env.ML_SERVICE_URL}/ml/recommend/${userId}`
    );
    return response.data;
  } catch (error) {
    console.error("ML Service error:", error);
    // Fallback: return popular products
    return await Product.find().sort("-purchases").limit(10);
  }
}
```

---

## 9. Implementation Roadmap

### 9.1 Timeline (8 Weeks)

```yaml
Week 1: Backend Foundation
  Tasks:
    - Setup Node.js + Express project
    - Configure MongoDB Atlas
    - Create User model
    - Implement JWT authentication
    - Auth endpoints (register, login)
  Deliverable: Working authentication system

Week 2: Product Catalog Backend
  Tasks:
    - Create Category & Product models
    - Setup Cloudinary
    - Product CRUD endpoints
    - Category CRUD endpoints
    - Image upload functionality
    - Search & filter logic
  Deliverable: Complete product API

Week 3: Cart & Orders Backend
  Tasks:
    - Create Cart model
    - Cart endpoints
    - Create Order model
    - Order endpoints
    - Setup Stripe
    - Payment endpoints
  Deliverable: Complete checkout flow API

Week 4: Frontend Setup & Customer Portal
  Tasks:
    - Setup Angular project
    - Configure Tailwind CSS
    - Auth pages (login, register)
    - Home page
    - Product list page
    - Product detail page
    - Cart page
  Deliverable: Customer can browse products

Week 5: Checkout & Orders Frontend
  Tasks:
    - Checkout page
    - Stripe integration
    - Order confirmation
    - My Orders page
    - Order detail page
  Deliverable: Complete customer flow

Week 6: Admin Portal
  Tasks:
    - Admin layout
    - Dashboard page
    - Product management page
    - Category management page
    - Order management page
    - **User management page (Owner only)**
    - **Implement admin user CRUD endpoints (Owner only)**
    - Basic analytics page
  Deliverable: Admin can manage products & orders. Owner can manage users.

Week 7: Python ML Service
  Tasks:
    - Setup FastAPI project
    - Implement recommendation algorithm
    - Implement trending products
    - Connect to MongoDB for data
    - Integrate with Node.js API
  Deliverable: Working ML recommendations

Week 8: Polish & Deploy
  Tasks:
    - Testing & bug fixes
    - UI improvements
    - Performance optimization
    - Deploy backend (Railway)
    - Deploy ML service (Railway)
    - Deploy frontend (Vercel)
    - Final testing
  Deliverable: Live production system
```

### 9.2 MVP (Minimum Viable Product) - Week 6

```yaml
Customer Features: ✓ Browse products
  ✓ Search & filter
  ✓ Add to cart
  ✓ Checkout with Stripe
  ✓ View orders

Admin Features: ✓ Manage products
  ✓ Manage categories
  ✓ Manage orders
  ✓ View basic analytics
```

### 9.3 Daily Development Tasks

```yaml
Week 1 (Backend Foundation):
  Day 1: Project setup, MongoDB connection
  Day 2: User model, password hashing
  Day 3: JWT implementation
  Day 4: Register endpoint
  Day 5: Login endpoint, middleware
  Day 6: Testing with Postman
  Day 7: Documentation

Week 2 (Product Catalog):
  Day 1: Category & Product models
  Day 2: Cloudinary setup, image upload
  Day 3: Product CRUD endpoints
  Day 4: Category CRUD endpoints
  Day 5: Search & filter logic
  Day 6: Testing
  Day 7: Documentation

Week 3 (Cart & Orders):
  Day 1: Cart model & endpoints
  Day 2: Order model
  Day 3: Order creation logic
  Day 4: Stripe setup
  Day 5: Payment endpoints
  Day 6: Order status updates
  Day 7: Testing & documentation

Week 4 (Frontend Customer Portal):
  Day 1: Angular setup, Tailwind config
  Day 2: Auth pages & service
  Day 3: Home page
  Day 4: Product list page
  Day 5: Product detail page
  Day 6: Cart page
  Day 7: Routing & guards

Week 5 (Checkout & Orders):
  Day 1: Checkout page layout
  Day 2: Stripe Elements integration
  Day 3: Order service
  Day 4: Order confirmation page
  Day 5: My Orders page
  Day 6: Order tracking
  Day 7: Testing

Week 6 (Admin Portal):
  Day 1: Admin layout & routing
  Day 2: Dashboard page
  Day 3: Product management table
  Day 4: Add/Edit product form
  Day 5: Category management
  Day 6: Order management
  Day 7: Basic analytics

Week 7 (Python ML):
  Day 1: FastAPI setup
  Day 2: MongoDB connection
  Day 3: Recommendation algorithm
  Day 4: Trending algorithm
  Day 5: API endpoints
  Day 6: Connect to Node.js
  Day 7: Testing

Week 8 (Deploy):
  Day 1-2: Bug fixes
  Day 3: UI improvements
  Day 4: Deploy backend
  Day 5: Deploy ML service
  Day 6: Deploy frontend
  Day 7: Final testing
```

---

## 10. Deployment Guide

### 10.1 Prerequisites

```yaml
Required Accounts (All Free):
  - MongoDB Atlas
  - Cloudinary
  - Stripe
  - Railway or Render
  - Vercel
  - Brevo (email)
  - GitHub
```

### 10.2 MongoDB Atlas Setup

```bash
1. Go to mongodb.com/cloud/atlas
2. Create account
3. Create M0 Free Cluster
   - Provider: AWS
   - Region: Closest to you
4. Database Access → Add User
   - Username: smartcart_user
   - Password: Generate secure password
5. Network Access → Add IP
   - IP: 0.0.0.0/0 (allow from anywhere)
6. Connect → Get connection string
   - Format: mongodb+srv://user:pass@cluster.mongodb.net/smartcart
7. Save to .env file
```

### 10.3 Cloudinary Setup

```bash
1. Go to cloudinary.com
2. Sign up (free tier: 25GB storage)
3. Dashboard → Account Details
4. Copy:
   - Cloud Name
   - API Key
   - API Secret
5. Add to backend .env:
   CLOUDINARY_CLOUD_NAME=xxx
   CLOUDINARY_API_KEY=xxx
   CLOUDINARY_API_SECRET=xxx
```

### 10.4 Stripe Setup

```bash
1. Go to stripe.com
2. Create account
3. Developers → API Keys
4. Copy test keys:
   - Publishable key (pk_test_...)
   - Secret key (sk_test_...)
5. Add to .env:
   Backend: STRIPE_SECRET_KEY=sk_test_xxx
   Frontend: STRIPE_PUBLISHABLE_KEY=pk_test_xxx
6. After deployment, setup webhook:
   - Webhooks → Add endpoint
   - URL: https://your-api.railway.app/api/v1/payments/webhook
   - Events: payment_intent.succeeded
```

### 10.5 Backend Deployment (Railway)

```bash
Step 1: Prepare Backend
-----------------------
cd backend
# Ensure package.json has start script
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}

Step 2: Push to GitHub
---------------------
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/smartcart-backend.git
git push -u origin main

Step 3: Deploy on Railway
-------------------------
1. Go to railway.app
2. Sign in with GitHub
3. New Project → Deploy from GitHub
4. Select smartcart-backend repo
5. Railway auto-detects Node.js

Step 4: Add Environment Variables
---------------------------------
Railway Dashboard → Variables:
- NODE_ENV=production
- MONGODB_URI=mongodb+srv://...
- JWT_SECRET=your-secret-key
- CLOUDINARY_CLOUD_NAME=xxx
- CLOUDINARY_API_KEY=xxx
- CLOUDINARY_API_SECRET=xxx
- STRIPE_SECRET_KEY=sk_live_xxx
- STRIPE_WEBHOOK_SECRET=whsec_xxx
- ML_SERVICE_URL=https://smartcart-ml.railway.app
- FRONTEND_URL=https://smartcart.vercel.app

Step 5: Deploy
--------------
Railway will auto-deploy on push
Get URL: https://smartcart-api.up.railway.app

Step 6: Test
-----------
curl https://smartcart-api.up.railway.app/api/v1/health
```

### 10.6 Python ML Service Deployment (Railway)

```bash
Step 1: Prepare ML Service
--------------------------
cd ml-service

# Create Procfile (tells Railway how to start)
echo "web: uvicorn main:app --host 0.0.0.0 --port \$PORT" > Procfile

# Ensure requirements.txt exists
pip freeze > requirements.txt

Step 2: Push to GitHub
---------------------
git init
git add .
git commit -m "Initial ML service"
git remote add origin https://github.com/yourusername/smartcart-ml.git
git push -u origin main

Step 3: Deploy on Railway
-------------------------
1. New Project → Deploy from GitHub
2. Select smartcart-ml repo
3. Railway auto-detects Python

Step 4: Add Environment Variables
---------------------------------
- PORT=8000
- MONGODB_URI=mongodb+srv://... (if needed)

Step 5: Deploy & Test
--------------------
Get URL: https://smartcart-ml.up.railway.app
Test: curl https://smartcart-ml.up.railway.app/

Step 6: Update Backend ENV
---------------------------
Go back to backend Railway project
Update: ML_SERVICE_URL=https://smartcart-ml.up.railway.app
```

### 10.7 Frontend Deployment (Vercel)

```bash
Step 1: Update Environment File
-------------------------------
cd frontend/src/environments

# environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://smartcart-api.up.railway.app/api/v1',
  stripePublishableKey: 'pk_live_xxx'
};

Step 2: Test Build Locally
--------------------------
npm run build --configuration production
# Check dist folder

Step 3: Push to GitHub
---------------------
git init
git add .
git commit -m "Initial frontend"
git remote add origin https://github.com/yourusername/smartcart-frontend.git
git push -u origin main

Step 4: Deploy on Vercel
------------------------
1. Go to vercel.com
2. Sign in with GitHub
3. New Project → Import smartcart-frontend
4. Framework Preset: Angular
5. Build Command: npm run build -- --configuration production
6. Output Directory: dist/smartcart-frontend/browser
7. Deploy

Step 5: Get URL
--------------
Vercel provides: https://smartcart.vercel.app

Step 6: Update Backend CORS
---------------------------
In backend, update FRONTEND_URL in Railway:
FRONTEND_URL=https://smartcart.vercel.app
```

### 10.8 Email Service Setup (Brevo)

```bash
1. Go to brevo.com (formerly Sendinblue)
2. Sign up (free: 300 emails/day)
3. SMTP & API → Get SMTP credentials
4. Add to backend .env:
   EMAIL_HOST=smtp-relay.brevo.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@example.com
   EMAIL_PASS=your-smtp-key
   EMAIL_FROM=noreply@smartcart.com
```

### 10.9 Environment Variables Summary

```bash
# Backend (.env)
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/smartcart
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=smtp-key
EMAIL_FROM=noreply@smartcart.com
ML_SERVICE_URL=https://smartcart-ml.railway.app
FRONTEND_URL=https://smartcart.vercel.app

# Python ML Service (.env)
PORT=8000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/smartcart

# Frontend (environment.prod.ts)
production: true
apiUrl: 'https://smartcart-api.up.railway.app/api/v1'
stripePublishableKey: 'pk_live_xxx'
```

### 10.10 Post-Deployment Checklist

```yaml
✓ Backend API is accessible
✓ ML Service is accessible
✓ Frontend loads correctly
✓ User registration works
✓ Login works
✓ Products display
✓ Images load from Cloudinary
✓ Add to cart works
✓ Stripe checkout works (test mode first)
✓ Orders are created
✓ Emails are sent
✓ Admin dashboard accessible
✓ ML recommendations work
✓ HTTPS is enabled on all services
```

### 10.11 Testing Production

```bash
# Test API Health
curl https://smartcart-api.up.railway.app/api/v1/health

# Test ML Service
curl https://smartcart-ml.up.railway.app/

# Test Frontend
Open browser: https://smartcart.vercel.app

# Test Registration
POST https://smartcart-api.up.railway.app/api/v1/auth/register
{
  "email": "test@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}

# Test Login
POST https://smartcart-api.up.railway.app/api/v1/auth/login
{
  "email": "test@example.com",
  "password": "password123"
}

# Test Products
GET https://smartcart-api.up.railway.app/api/v1/products

# Test Stripe (use test card)
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
```

### 10.12 Troubleshooting

```yaml
Issue: CORS errors in browser
Solution:
  - Check FRONTEND_URL in backend env
  - Ensure cors middleware is configured
  - Check browser console for exact error

Issue: MongoDB connection timeout
Solution:
  - Check MongoDB Atlas IP whitelist (0.0.0.0/0)
  - Verify connection string format
  - Check username/password

Issue: Images not uploading
Solution:
  - Verify Cloudinary credentials
  - Check file size limits (Railway: 500MB max)
  - Test Cloudinary separately

Issue: Stripe payments fail
Solution:
  - Use test card: 4242 4242 4242 4242
  - Check Stripe secret key
  - Verify webhook endpoint is correct
  - Check Stripe dashboard logs

Issue: ML Service not responding
Solution:
  - Check ML_SERVICE_URL in backend env
  - Verify Python service is running (Railway logs)
  - Test ML endpoint directly

Issue: Railway deploys but crashes
Solution:
  - Check Railway logs for errors
  - Verify start script in package.json
  - Check all required env variables are set
  - Ensure dependencies are in package.json

Issue: Vercel build fails
Solution:
  - Check build command is correct
  - Verify output directory path
  - Check for TypeScript errors
  - Review Vercel build logs
```

---

## 11. Success Criteria & Portfolio Value

### 11.1 Technical Requirements Checklist

```yaml
Backend: ✓ 30+ API endpoints
  ✓ JWT authentication
  ✓ Role-based access control (customer/admin/owner)
  ✓ MongoDB with 6 collections
  ✓ Stripe payment integration
  ✓ Email notifications
  ✓ Image upload to Cloudinary
  ✓ Error handling & validation
  ✓ Security (helmet, rate limiting)

Python ML Service: ✓ 2 ML algorithms (recommendations, trending)
  ✓ FastAPI REST API
  ✓ Model training capability
  ✓ Integration with Node.js

Frontend: ✓ 2 separate portals (Customer, Admin)
  ✓ 15+ pages/components
  ✓ Responsive design (mobile-friendly)
  ✓ State management with services
  ✓ Form validation
  ✓ Route guards
  ✓ HTTP interceptors

Deployment: ✓ Backend deployed (Railway)
  ✓ ML service deployed (Railway)
  ✓ Frontend deployed (Vercel)
  ✓ Database in cloud (MongoDB Atlas)
  ✓ HTTPS enabled
  ✓ Environment variables configured
  ✓ 100% free tier
```

### 11.2 Feature Completeness

```yaml
Core Features: ✓ User authentication (register, login)
  ✓ Product browsing with search & filters
  ✓ Shopping cart
  ✓ Checkout with Stripe
  ✓ Order management
  ✓ Product reviews
  ✓ Admin product management
  ✓ Admin order management
  ✓ Basic analytics dashboard
  ✓ AI product recommendations
  ✓ Email notifications

User Experience: ✓ Fast page loads
  ✓ Mobile responsive
  ✓ Intuitive navigation
  ✓ Error messages
  ✓ Loading indicators
  ✓ Toast notifications
```

### 11.3 Portfolio Highlights

**What Makes This Project Stand Out:**

1. **Full-Stack Expertise**

   - Backend: Node.js/Express with clean architecture
   - Frontend: Modern Angular with Tailwind CSS
   - Database: MongoDB with proper schema design
   - ML: Python FastAPI microservice

2. **Real-World Features**

   - Payment processing (Stripe)
   - Email notifications
   - Image uploads to cloud
   - User authentication & authorization
   - AI-powered recommendations

3. **Production-Ready**

   - Deployed and live on internet
   - Environment-based configuration
   - Security best practices
   - Error handling
   - Scalable architecture

4. **Design Patterns**

   - Repository Pattern
   - Service Layer Pattern
   - Middleware Chain
   - Factory Pattern
   - Strategy Pattern (ML)

5. **Modern Tech Stack**
   - Latest versions of frameworks
   - Cloud-native (MongoDB Atlas, Cloudinary)
   - Microservices architecture
   - RESTful API design

**Resume Bullet Points:**

```
• Developed full-stack e-commerce platform using Node.js, Express, Angular,
  and Python, serving 100+ products with AI-powered recommendations

• Implemented microservices architecture with Node.js REST API and Python
  FastAPI ML service, handling 1000+ API requests

• Integrated Stripe payment processing and Cloudinary image storage,
  achieving 99.9% uptime on free-tier infrastructure

• Built collaborative filtering recommendation system using scikit-learn,
  increasing user engagement by providing personalized product suggestions

• Designed MongoDB schema with 6 collections and proper indexing, optimizing
  query performance for product catalog of 100+ items

• Implemented JWT authentication and role-based access control for customer
  and admin portals with secure password hashing

• Deployed production-ready application using Railway (backend), Vercel
  (frontend), and MongoDB Atlas, demonstrating DevOps skills
```

---

## 12. Future Enhancements

### 12.1 Phase 2 Features (Post-MVP)

```yaml
Customer Experience:
  - Product wishlists/favorites
  - Product comparison tool
  - Advanced filters (brand, rating, etc.)
  - Customer reviews with photos
  - Q&A section on products
  - Live chat support

Admin Enhancements:
  - Bulk product import (CSV)
  - Advanced analytics (cohort analysis)
  - Export reports (PDF/Excel)
  - Email marketing campaigns
  - Inventory alerts
  - Discount/coupon management

Technical Improvements:
  - Redis caching for hot data
  - Elasticsearch for advanced search
  - WebSocket for real-time updates
  - Progressive Web App (PWA)
  - Automated testing (unit + e2e)
  - Performance monitoring (Sentry)

ML Enhancements:
  - Content-based recommendations
  - Customer segmentation
  - Price optimization
  - Demand forecasting
  - Review sentiment analysis
```

### 12.2 Phase 3 Features (Advanced)

```yaml
- Multi-vendor marketplace
- Mobile app (React Native)
- Social media integration
- Multi-currency support
- Multi-language (i18n)
- Subscription products
- Advanced inventory management
- Warehouse management
- Affiliate program
- API for third-party integrations
```

---

## 13. Learning Resources

### 13.1 Documentation

```yaml
Backend:
  - Node.js: https://nodejs.org/docs
  - Express: https://expressjs.com
  - MongoDB: https://docs.mongodb.com
  - Mongoose: https://mongoosejs.com

Frontend:
  - Angular: https://angular.io/docs
  - TypeScript: https://typescriptlang.org/docs
  - Tailwind CSS: https://tailwindcss.com/docs

Python:
  - FastAPI: https://fastapi.tiangolo.com
  - scikit-learn: https://scikit-learn.org/stable
  - pandas: https://pandas.pydata.org/docs

Services:
  - Stripe: https://stripe.com/docs
  - Cloudinary: https://cloudinary.com/documentation
```

### 13.2 Video Tutorials

```yaml
Node.js & Express:
  - Traversy Media (YouTube)
  - The Net Ninja (YouTube)
  - Academind (YouTube)

Angular:
  - Angular University (YouTube)
  - Fireship.io (YouTube)
  - Codevolution (YouTube)

Python & ML:
  - Kaggle Learn
  - Python Engineer (YouTube)
  - Tech with Tim (YouTube)

Full-Stack:
  - freeCodeCamp
  - Programming with Mosh
  - Web Dev Simplified
```

---

## 14. Project Estimation

### 14.1 Time Breakdown

```yaml
Backend Development: 24 hours
  - Setup & auth: 8 hours
  - Product catalog: 8 hours
  - Cart & orders: 8 hours

Frontend Development: 24 hours
  - Setup & customer portal: 16 hours
  - Admin portal: 8 hours

ML Service: 8 hours
  - FastAPI setup: 2 hours
  - Algorithms: 4 hours
  - Integration: 2 hours

Deployment & Testing: 8 hours
  - Deploy all services: 4 hours
  - Testing & fixes: 4 hours

Total: 64 hours (8 weeks @ 8 hours/week)
```

### 14.2 Complexity Assessment

```yaml
For Junior Full-Stack Developer:

Easy Parts:
  - Basic CRUD operations
  - Frontend components
  - Simple API endpoints
  - Database models

Medium Difficulty:
  - JWT authentication
  - Stripe integration
  - Image upload
  - Admin dashboard
  - Responsive design

Challenging Parts:
  - ML algorithms (but using libraries)
  - Deployment setup
  - Environment configuration
  - Error handling across stack

Overall: Medium difficulty, achievable in 8 weeks
```

---

## 15. Additional Notes

### 15.1 Development Tips

```yaml
Start Simple:
  - Get basic features working first
  - Add complexity gradually
  - Test as you go

Use Git:
  - Commit frequently
  - Use meaningful commit messages
  - Create branches for features

Ask for Help:
  - Stack Overflow
  - GitHub Issues
  - Discord communities
  - ChatGPT for debugging

Documentation:
  - Comment complex code
  - Update README as you build
  - Document API endpoints
  - Create user guide
```

### 15.2 Common Pitfalls to Avoid

```yaml
Backend: ✗ Storing passwords in plain text
  ✗ Not validating user input
  ✗ Exposing sensitive data in responses
  ✗ Missing error handling
  ✗ Not using environment variables

Frontend: ✗ Not handling loading states
  ✗ Missing error messages
  ✗ Poor mobile responsiveness
  ✗ Storing sensitive data in localStorage
  ✗ Not unsubscribing from Observables

General: ✗ Committing .env files to Git
  ✗ Using production keys in development
  ✗ Not testing before deploying
  ✗ Ignoring console errors
  ✗ Not backing up database
```

### 15.3 Performance Best Practices

```yaml
Backend: ✓ Use database indexes
  ✓ Paginate large result sets
  ✓ Compress responses (gzip)
  ✓ Use select() to limit fields
  ✓ Implement caching where appropriate

Frontend: ✓ Lazy load modules
  ✓ Optimize images (use Cloudinary transforms)
  ✓ Use trackBy in *ngFor
  ✓ Unsubscribe from Observables
  ✓ Use OnPush change detection strategy

Database: ✓ Create proper indexes
  ✓ Use lean() for read-only queries
  ✓ Limit() query results
  ✓ Use aggregation for complex queries
```

---

## 16. Final Checklist

### 16.1 Before You Start

```yaml
✓ Node.js installed (v20+)
✓ Python installed (v3.10+)
✓ MongoDB Atlas account created
✓ Stripe account created
✓ Cloudinary account created
✓ GitHub account ready
✓ Code editor (VS Code recommended)
✓ Postman installed (for API testing)
✓ Git installed
```

### 16.2 Development Phase

```yaml
✓ Backend running locally (http://localhost:5000)
✓ ML service running locally (http://localhost:8000)
✓ Frontend running locally (http://localhost:4200)
✓ All env variables configured
✓ Database seeded with sample data
✓ All features tested locally
✓ Code committed to GitHub
```

### 16.3 Deployment Phase

```yaml
✓ Backend deployed on Railway
✓ ML service deployed on Railway
✓ Frontend deployed on Vercel
✓ All environment variables set in production
✓ Stripe webhook configured
✓ Domain configured (if custom domain)
✓ HTTPS working on all services
✓ Production testing completed
```

### 16.4 Portfolio Presentation

```yaml
✓ Live demo URL ready
✓ GitHub repos are public
✓ README files are complete
✓ Screenshots/GIFs of features
✓ Architecture diagram
✓ API documentation
✓ Test credentials provided
✓ Portfolio website updated
```

---

## End of Document

**Project Summary:**

- **Scope**: Full-stack e-commerce platform with AI recommendations
- **Timeline**: 8 weeks (64 hours)
- **Difficulty**: Medium (suitable for junior full-stack developer)
- **Tech Stack**: Node.js, Express, Angular, Python, MongoDB
- **Deployment**: 100% free tier (Railway, Vercel, MongoDB Atlas)
- **Portfolio Value**: ⭐⭐⭐⭐⭐ (Highly impressive)

**Key Selling Points:**

- Production-ready application deployed on internet
- Full-stack development (backend, frontend, database, ML)
- Real-world features (payments, emails, file uploads)
- Modern architecture with microservices
- AI/ML integration
- Clean code with design patterns

**Good luck with your project! 🚀**
