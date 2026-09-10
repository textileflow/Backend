# Embroidery ERP - Authentication API

Production-ready Authentication Microservice / API foundation for the Embroidery ERP Software. Built with Node.js, Express.js, MongoDB, Mongoose, JWT, and bcrypt.

---

## 📋 Features

- **User Management**: Registration, Authentication, & Profile retrieval.
- **Security**: Password hashing with `bcryptjs`, JWT token authorization, `helmet` header security, `cors` cross-origin sharing, and request payload size limits.
- **Validation**: Strict request payload validation powered by `express-validator`.
- **Role-Based Access Control (RBAC)**: Extensible role middleware supporting `admin`, `manager`, and `staff` roles for future ERP module authorization.
- **Centralized Error Handling**: Standardized JSON response format for operational errors, validation errors, and DB exceptions.
- **Automated Testing**: 100% route coverage via Jest, Supertest, and MongoMemoryServer.

---

## 📁 Project Structure

```
src/
├── config/
│   └── db.js                    # Database connection
├── controllers/
│   └── Auth/
│       └── auth.js              # Auth controller handlers
├── middleware/
│   ├── Auth/
│   │   └── auth.js              # Auth & Role middleware guards
│   └── Common/
│       ├── error.js             # 404 & Centralized error handler
│       └── validate.js          # Request validation error handler
├── models/
│   └── Auth/
│       └── auth.js              # User Mongoose model
├── routes/
│   └── Auth/
│       └── auth.js              # Auth routes (/api/auth)
├── services/
│   └── Auth/
│       └── auth.js              # Auth service logic
├── utils/
│   ├── Auth/
│   │   ├── generateToken.js     # JWT token generator
│   │   └── validators.js        # Auth express-validator schemas
│   └── Common/
│       ├── apiResponse.js       # Success response utility
│       └── customError.js       # Custom error class
├── app.js                       # Express app configuration
└── server.js                    # Server startup script
tests/
└── auth.test.js                 # Automated API test suite
```

---

## ⚙️ Environment Variables Setup

1. Copy the example environment file `.env.example` to create `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure the environment variables inside `.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/embroidery_erp
   JWT_SECRET=super_secret_jwt_key_for_embroidery_erp_2026
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   ```

---

## 🛢️ MongoDB Setup

- Ensure MongoDB is installed locally and running on default port `27017` OR obtain a cloud MongoDB connection string (MongoDB Atlas).
- Update `MONGODB_URI` in `.env` accordingly.

---

## 🚀 Installation & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Start Production Server
```bash
npm start
```

### 4. Run Automated Test Suite
```bash
npm test
```

---

## 🔌 API Endpoints Summary

| Method | Endpoint             | Access    | Description                                      |
| :----- | :------------------- | :-------- | :----------------------------------------------- |
| `GET`  | `/api/health`        | Public    | Health check endpoint                            |
| `POST` | `/api/auth/register` | Public    | Register a new user and receive JWT token        |
| `POST` | `/api/auth/login`    | Public    | Authenticate user credentials and receive JWT    |
| `GET`  | `/api/auth/me`       | Protected | Retrieve authenticated user profile              |
| `POST` | `/api/auth/logout`   | Public    | Logout response endpoint                         |

---

## 🔑 How to Send Authorization Token

For protected endpoints (`/api/auth/me`), include the JWT token returned upon registration or login in the `Authorization` HTTP header:

```http
Authorization: Bearer <your_jwt_token_here>
```

---

## 📝 Example Requests & Responses

### 1. Register User (`POST /api/auth/register`)

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@embroideryerp.com",
  "password": "securepassword123",
  "role": "manager"
}
```

**Success Response (`201 Created`):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@embroideryerp.com",
    "role": "manager",
    "isActive": true,
    "createdAt": "2026-09-10T06:30:00.000Z",
    "updatedAt": "2026-09-10T06:30:00.000Z",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (`400 Bad Request` - Duplicate Email):**
```json
{
  "success": false,
  "message": "Email address is already registered"
}
```

---

### 2. Login User (`POST /api/auth/login`)

**Request Body:**
```json
{
  "email": "jane@embroideryerp.com",
  "password": "securepassword123"
}
```

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@embroideryerp.com",
    "role": "manager",
    "isActive": true,
    "createdAt": "2026-09-10T06:30:00.000Z",
    "updatedAt": "2026-09-10T06:30:00.000Z",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (`401 Unauthorized` - Wrong Password):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 3. Get User Profile by ID (`GET /api/auth/profile/:id` or `GET /api/auth/profile`)

**Request Headers:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**URL Example:**
- `GET http://localhost:5000/api/auth/profile/1`
- `GET http://localhost:5000/api/auth/profile`

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@embroideryerp.com",
    "role": "manager",
    "isActive": true,
    "createdAt": "2026-09-10T06:30:00.000Z",
    "updatedAt": "2026-09-10T06:30:00.000Z"
  }
}
```

**Error Response (`404 Not Found` - User ID non-existent):**
```json
{
  "success": false,
  "message": "User not found"
}
```

**Error Response (`401 Unauthorized` - Missing Token):**
```json
{
  "success": false,
  "message": "Access denied. Authorization token required."
}
```

---

### 4. Logout User (`POST /api/auth/logout`)

**Request Headers:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Error Response (`401 Unauthorized` - Token missing/invalid):**
```json
{
  "success": false,
  "message": "Access denied. Authorization token required."
}
```

---

## 🛡️ Role-Based Access Control Example

The `authorizeRoles` middleware can be used to protect future ERP routes:

```javascript
const authorizeRoles = require('../middleware/roleMiddleware');
const protect = require('../middleware/authMiddleware');

// Only admin can access
router.get('/admin/dashboard', protect, authorizeRoles('admin'), controller.adminOnly);

// Admin and manager can access
router.get('/production/summary', protect, authorizeRoles('admin', 'manager'), controller.prodSummary);
```
