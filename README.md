# SmartCart - Full-Stack Intelligent E-Commerce Platform

> An intelligent, production-ready e-commerce solution built on a modern, microservice-inspired architecture.

---

## 📖 About This Project

SmartCart is not just another e-commerce website. It's a **full-stack, production-ready application** designed to serve as the complete operational backbone for a real-world online business. The project is built from the ground up with a clean, scalable, and test-driven methodology.

The system is composed of three main components:

1.  **A secure Node.js & Express REST API** that serves as the central backend, handling all business logic, data persistence, and authentication.
2.  **A modern Angular frontend** (planned) that provides two distinct portals: a responsive **Customer Portal** for shopping and a powerful **Admin Portal** for site management.
3.  **A Python & FastAPI microservice** (planned) that provides AI-powered insights, offering product recommendations and sales trend analysis to drive business growth.

This project's primary goal is to demonstrate a mastery of full-stack development, clean architecture, and the integration of multiple complex systems (like payments, cloud storage, and machine learning) into a single, cohesive product. It is being built with a "sellable" mindset, featuring a multi-tiered role system (`customer`, `admin`, `owner`) so a future client can manage their own employees and operations.

---

## ✨ Key Features

This project is planned to be a feature-complete e-commerce solution.

### 🔐 Foundation (Complete)

* **Secure User Authentication:** Complete user registration (`POST /auth/register`) and login (`POST /auth/login`) system.
* **Role-Based Access Control (RBAC):** Secure `protect` (authentication) and `authorize` (permission) middleware is complete. The system understands `customer`, `admin`, and `owner` roles.
* **Advanced Security:** Passwords are fully secured using `bcrypt` hashing. User sessions are managed via JSON Web Tokens (JWT).
* **Test-Driven Development:** A comprehensive Python integration test suite (`tests/test_api_1.py`) is complete for all auth endpoints, ensuring 100% pass rates and preventing future regressions.

### 🛍️ Customer Portal (Planned)

* **Full Product Catalog:** Browse, search, and filter all products.
* **Shopping Cart:** A persistent cart to add/remove/update items.
* **Secure Checkout:** Full integration with **Stripe** for credit card processing.
* **User Dashboard:** View order history, track order status, and manage saved addresses.
* **Reviews & Ratings:** Leave reviews and ratings for purchased products.

### 📊 Admin & Owner Portal (Planned)

* **Analytics Dashboard:** View key metrics like revenue, orders, and top products.
* **Product Management:** Full CRUD (Create, Read, Update, Delete) for all products, including image uploads to **Cloudinary**.
* **Order Management:** View and update order statuses (e.g., "Processing," "Shipped").
* **Category Management:** Organize products into categories.
* **User Management (Owner Only):** The `owner` can create, edit, and assign `admin` roles to employees.

### 🤖 Python ML Service (Planned)

* **AI Recommendations:** A `collaborative-filtering` algorithm will suggest products to users based on their purchase history and the behavior of similar users.
* **Trend Analysis:** A secondary algorithm will analyze recent sales and view data to identify "Trending Products" in real-time.

---

## 🏛️ Architecture & Design Philosophy

This project emphasizes clean, maintainable, and **DRY (Don't Repeat Yourself)** code. The architecture is designed for scalability and separation of concerns.



* **Microservice-Inspired:** The core API (Node.js) and the ML service (Python) are two separate applications that communicate via HTTP, allowing them to be developed, deployed, and scaled independently.
* **Service Layer Pattern:** Controllers are kept "thin" and clean. They only handle the HTTP request and response, while all business logic (database calls, error checking) is delegated to a separate **Service Layer** (e.g., `authService.js`).
* **Centralized Error Handling:** A single `errorMiddleware` catches all errors from anywhere in the application. It formats them into a consistent JSON response, preventing crashes and providing clean, machine-readable error codes.
* **Async Error Wrapper:** A simple `asyncHandler` utility wraps all asynchronous functions. This completely eliminates the need for repetitive `try...catch` blocks in every controller and middleware.
* **Secure by Default:** The `userModel` is designed for security. It automatically hashes passwords *before* saving and automatically hides the hashed password from *all* database queries (`select: false`).

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Backend** | Node.js, Express.js, Mongoose, JWT, bcrypt.js |
| **Frontend** | (Planned) Angular, TypeScript, Tailwind CSS |
| **ML Service** | (Planned) Python, FastAPI, scikit-learn, pandas |
| **Database** | MongoDB Atlas |
| **Integrations**| (Planned) Stripe (Payments), Cloudinary (Storage), Brevo (Email) |
| **Testing** | Python (`requests`), (Planned) Jest |

---

## 🚀 Current Status & Roadmap

### ✅ **Week 1: Auth Foundation (100% Complete)**
* Completed all models, services, controllers, and routes for user registration, login, and profile fetching.
* Built the core `protect` and `authorize` middleware.
* Built a comprehensive Python integration test suite for all auth endpoints.

### ➡️ **Next Up: Week 2 - Product & Category Catalog**
* Build the `categoryModel` and `productModel`.
* Create all API endpoints for full CRUD management of categories and products.
* Implement `slugify` for URL-friendly product links.
* Add new tests to the Python test suite to cover all new product endpoints.

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

### 2. API Tests

1.  In a **new terminal**, navigate to the `tests/` directory:
    ```bash
    cd tests
    ```
2.  Install the `requests` library:
    ```bash
    pip install requests
    ```
3.  Run the test suite (while the backend server is running):
    ```bash
    python test_api_1.py
    ```
