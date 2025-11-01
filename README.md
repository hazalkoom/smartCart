# SmartCart - E-Commerce Platform

> A full-stack e-commerce platform with a clean, scalable, and test-driven backend.

---

## 🚀 Current Status: Week 1 - Auth Foundation Complete

* ✅ **Core API:** Secure user registration (`POST /auth/register`), login (`POST /auth/login`), and profile fetching (`GET /auth/me`).
* ✅ **Security:** Implemented JWT generation, `bcrypt` password hashing, and a robust `protect` (authentication) and `authorize` (role-based) middleware system.
* ✅ **Testing:** A full Python integration test suite (`tests/test_api_1.py`) is complete and passing for all auth endpoints, ensuring code quality and preventing future regressions.

---

## ✨ Key Architectural Features

This project emphasizes clean, maintainable, and **DRY (Don't Repeat Yourself)** code from day one.

* **Service Layer Pattern:** Controllers are kept "thin" and clean. They only handle the HTTP request and response, while all business logic (database calls, error checking) is delegated to a separate **Service Layer** (e.g., `authService.js`).
* **Centralized Error Handling:** A single `errorMiddleware` catches all errors from anywhere in the application. It formats them into a consistent JSON response (as defined in PRD 6.11), preventing crashes and providing clean error codes.
* **Async Error Wrapper:** A simple `asyncHandler` utility wraps all asynchronous functions. This completely eliminates the need for repetitive `try...catch` blocks in every controller and middleware.
* **Secure by Default:** The `userModel` is designed for security. It automatically hashes passwords *before* saving and automatically hides the hashed password from *all* database queries (`select: false`).

---

## 🛠️ Tech Stack (Current)

| Area | Technology |
| :--- | :--- |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose |
| **Security** | JSON Web Tokens (JWT), bcrypt.js |
| **API Testing**| Python, `requests` |

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

---

## 🗓️ Next Steps

* **Week 2:** Begin development of the Product and Category catalog API.
