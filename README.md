# SmartCart - Full-Stack Intelligent E-Commerce Platform

> An intelligent, production-ready e-commerce solution built on a modern, microservice-inspired architecture.

---

## 📖 About This Project

SmartCart is not just another e-commerce website. It's a **full-stack, production-ready application** designed to serve as the complete operational backbone for a real-world online business. The project is built from the ground up with a clean, scalable, and test-driven methodology.

The system is composed of three main components:

1.  **A secure Node.js & Express REST API** that serves as the central backend, handling all business logic, data persistence, and authentication.
2.  **A modern Angular frontend** that provides two distinct portals: a responsive **Customer Portal** for shopping and a powerful **Admin Portal** for site management.
3.  **A Python & FastAPI microservice** (planned) that provides AI-powered insights, offering product recommendations and sales trend analysis to drive business growth.

This project's primary goal is to demonstrate a mastery of full-stack development, clean architecture, and the integration of multiple complex systems (like payments, cloud storage, and machine learning) into a single, cohesive product. It is being built with a "sellable" mindset, featuring a multi-tiered role system (`customer`, `admin`, `owner`) so a future client can manage their own employees and operations.

---

## ✨ Key Features

This project is planned to be a feature-complete e-commerce solution.

### 🔐 Foundation (Backend Complete)

* **Secure User Authentication:** Complete user registration (`POST /auth/register`) and login (`POST /auth/login`) system.
* **Role-Based Access Control (RBAC):** Secure `protect` (authentication) and `authorize` (permission) middleware is complete. The system understands `customer`, `admin`, and `owner` roles.
* **Hardened API Security:** The server is protected with `helmet` for secure headers, `express-json` payload limiting (10kb) to prevent DoS attacks, and production-only `express-rate-limit` to stop brute-force attacks.
* **Advanced Password Security:** Passwords are fully secured using `bcrypt` hashing, and the hash is never exposed in API query responses.

### 🛍️ Customer Portal (Frontend In Progress)

* ✅ **Shopping Cart (Backend Complete):** Full, secured API for adding, updating, removing, and viewing cart items. The service layer handles all stock-checking, price-locking, and subtotal calculations.
* ✅ **Order Logic (Backend Complete):** Service layer creates orders, processes stock reduction within transactions, and clears the cart.
* **Angular Application (Skeleton Complete):** The frontend is fully scaffolded with Angular 17+ and Tailwind CSS.
* **Responsive Design:** Migrated a professional "Book Store" static template into reusable Angular components (`<app-header>`, `<app-footer>`, `<app-product-card>`).
* **Pages Implemented (Static):** Home, Product List, Product Detail, Cart, Checkout, Login, Register, and Account pages are routed and rendered.

### 📊 Admin & Owner Portal (In Progress)

* ✅ **Category Management (Backend Complete):** Full, secured CRUD endpoints for creating, reading, updating, and deleting categories. Includes automatic `slug` generation for SEO-friendly URLs.
* ✅ **Product Management (Backend Complete):** Full, secured CRUD endpoints for creating, reading, updating, and deleting products.
* ✅ **Order Management (Backend Complete):** API endpoints for admins to view all orders and update statuses (e.g., "Processing," "Shipped").
* **User Management (Owner Only) (Planned):** The `owner` can create, edit, and assign `admin` roles to employees.

### 🤖 Python ML Service (Planned)

* **AI Recommendations:** A `collaborative-filtering` algorithm will suggest products to users based on their purchase history and the behavior of similar users.
* **Trend Analysis:** A secondary algorithm will analyze recent sales and view data to identify "Trending Products" in real-time.

---

## 🏛️ Architecture & Design Philosophy

This project emphasizes clean, maintainable, and **DRY (Don't Repeat Yourself)** code. The architecture is designed for scalability and separation of concerns.


* **Microservice-Inspired:** The core API (Node.js) and the ML service (Python) are two separate applications that communicate via HTTP, allowing them to be developed, deployed, and scaled independently.
* **Service Layer Pattern:** Controllers are kept "thin" and clean. They only handle the HTTP request and response, while all business logic (database calls, error checking) is delegated to a separate **Service Layer** (e.g., `authService.js`, `categoryService.js`, `productService.js`, `cartService.js`, `orderService.js`).
* **Centralized Error Handling:** A single `errorMiddleware` catches all errors from anywhere in the application. It formats them into a consistent JSON response (as defined in PRD 6.11), preventing crashes and providing clean, machine-readable error codes.
* **Route-Level Validation:** Incoming request bodies are validated *at the route level* using `express-validator`. This stops bad data at the "front door" before it ever reaches the controllers or services.
* **Component-Based Frontend:** The Angular app follows a strict modular structure (`core/`, `features/`, `shared/`). The static HTML template was "chopped" into reusable components to ensure maintainability and DRY principles on the frontend.
* **Secure by Default:** The `userModel` is designed for security. It automatically hashes passwords *before* saving and automatically hides the hashed password from *all* database queries (`select: false`).
* **Transactional Logic:** Critical operations, like creating an order, use `mongoose.startSession()` to ensure that multiple database changes (like *decreasing stock* and *clearing the cart*) either **all succeed** or **all fail** together, preventing data corruption.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Backend** | Node.js, Express.js, Mongoose, JWT, bcrypt.js, `helmet`, `express-rate-limit`, `express-validator`, `slugify` |
| **Frontend** | Angular 17+, TypeScript, Tailwind CSS, Bootstrap 5 (CSS Only) |
| **ML Service** | (Planned) Python, FastAPI, scikit-learn, pandas |
| **Database** | MongoDB Atlas |
| **Integrations**| (Planned) Stripe (Payments), Cloudinary (Storage), Brevo (Email) |
| **Testing** | Python, `pytest`, `pytest-ordering`, `requests` |

---

## 🚀 Current Status & Roadmap

### ✅ **Week 1: Auth Foundation (100% Complete)**

* Completed all models, services, controllers, and routes for user registration, login, and profile fetching.
* Built the core `protect` and `authorize` middleware.

### ✅ **Week 2: Product & Category Catalog (100% Complete)**

* Built `categoryModel` and `productModel` with relationships, `slug` generation, and database indexing.
* Created all 10+ CRUD endpoints for both categories and products.
* Secured all admin endpoints with `authorize('admin', 'owner')`.
* Implemented separate `express-validator` rules for creating and updating products (`productValidationRules`, `productUpdateValidationRules`).

### ✅ **Week 3: Cart & Order Logic (100% Complete)**

* **Cart:** Built the complete `cartModel`, `cartService`, `cartController`, and `cartRoutes`. The service logic handles all stock checking, subtotal calculations, and item management.
* **Order:** Built the `orderModel`, `orderService`, `orderController`, and `orderRoutes`. The service logic correctly handles stock reduction, cart clearing, and transactional database updates.
* **Validation:** Added robust validation for shipping addresses and order status updates.

### ✅ **Week 4: Frontend Setup (100% Complete)**

* **Project Setup:** Initialized Angular project with SSR (Server-Side Rendering) enabled for SEO.
* **Styling:** Integrated Tailwind CSS and configured it to work alongside the "Booksaw" template styles.
* **Scaffolding:** Created the folder structure (`core`, `features`, `shared`) and generated all page components (`Home`, `ProductList`, `Cart`, `Checkout`, `Auth`).
* **Routing:** Configured `app-routing.module.ts` to handle navigation between all pages.
* **Migration:** Successfully migrated the static HTML template into Angular components, replacing the default shell with a professional e-commerce layout.

### ✅ **Automated Testing (100% Passing)**

* Upgraded test suite to a scalable `pytest` framework with `pytest-ordering`.
* **`test_auth.py`:** Full suite for public authentication flow.
* **`test_categories.py`:** Full suite for all category endpoints.
* **`test_products.py`:** Full suite for all product endpoints.
* **`test_cart.py`:** Full suite for all cart logic.
* **`test_orders.py`:** Full suite for the complete checkout flow (Customer + Admin actions).
* **Total Tests: 52** (and 100% passing).

### ➡️ **Next Up: Week 5 - Frontend Integration**

* Create Angular Services (`AuthService`, `ProductService`) to connect to the backend API.
* Implement real authentication (Login/Register forms).
* Make the product grid dynamic (fetching data from `GET /products`).
* Connect the Cart UI to the Cart API.

---

## 🏃 How to Run

### 1. Backend Server

1.  Navigate to the `backend/` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `backend` folder and add your variables:
    ```
    NODE_ENV=development
    PORT=5000
    MONGODB_URI=your_mongodb_atlas_connection_string
    JWT_SECRET=your-super-secret-jwt-key
    JWT_EXPIRE=7d
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```
    The API will be live at `http://localhost:5000`.

### 2. Frontend Client

1.  Navigate to the `frontend/` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the Angular development server:
    ```bash
    ng serve
    ```
    The application will be live at `http://localhost:4200`.

### 3. API Tests

The test suite requires a **one-time setup** of a permanent admin user.

**One-Time Setup:**
1.  Run the backend server (`npm run dev`).
2.  Run the auth tests to create a user: `pytest tests/test_auth.py`.
3.  Go to your **MongoDB Atlas** database -> `users` collection.
4.  Find the new user (e.g., `test-user-17..._@example.com`).
5.  Edit the document:
    * Change `email` to **`owner@test.com`**.
    * Change `role` to **`owner`**.
6.  Save the user. This is now your permanent test admin.

**Running the Full Test Suite:**
1.  In a **new terminal**, navigate to the **project root** directory (the one containing `backend/` and `tests/`):
    ```bash
    cd .. 
    ```
2.  Install Python dependencies:
    ```bash
    pip install pytest pytest-ordering requests
    ```
3.  Run the test suite (while the backend server is running):
    ```bash
    pytest
    ```