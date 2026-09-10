# Embroidery ERP - Backend API

Production-ready Backend API microservice architecture for Embroidery ERP Software. Built with Node.js, Express.js, MongoDB, Mongoose, JWT, and bcrypt.

---

## 📋 Implemented Modules

1. **Authentication API**: User registration with numeric auto-incrementing IDs, login, profile retrieval by ID, JWT authorization, protected logout, role-based access control (`admin`, `manager`, `staff`).
2. **Category Master Module**: Full CRUD for product categories with unique constraint and deletion protection.
3. **Sub Category Master Module**: Full CRUD for sub-categories referenced to Categories with compound uniqueness (`categoryId` + `name`) and deletion protection.
4. **Trader / Job Work Customer Module**: Master data module for job work customers with file upload reference support, category-subcategory relationship validation, search & filtering.

---

## 📁 Project Structure

```
src/
├── config/
│   └── db.js                    # Database connection setup
├── controllers/
│   ├── Auth/
│   │   └── auth.js              # Auth controller handlers
│   ├── Category/
│   │   └── category.js          # Category controller handlers
│   ├── SubCategory/
│   │   └── subCategory.js       # SubCategory controller handlers
│   └── Trader/
│       └── trader.js            # Trader controller handlers
├── middleware/
│   ├── Auth/
│   │   └── auth.js              # Auth & Role middleware guards
│   └── Common/
│       ├── error.js             # 404 & Centralized error handler
│       └── validate.js          # Request validation error handler
├── models/
│   ├── Auth/
│   │   └── auth.js              # User Mongoose model (Numeric custom userId)
│   ├── Category/
│   │   └── category.js          # Category Mongoose model
│   ├── SubCategory/
│   │   └── subCategory.js       # SubCategory Mongoose model
│   └── Trader/
│       └── trader.js            # Trader Mongoose model
├── routes/
│   ├── Auth/
│   │   └── auth.js              # Auth routes (/api/auth)
│   ├── Category/
│   │   └── category.js          # Category routes (/api/categories)
│   ├── SubCategory/
│   │   └── subCategory.js       # SubCategory routes (/api/subcategories)
│   └── Trader/
│       └── trader.js            # Trader routes (/api/traders)
├── services/
│   ├── Auth/
│   │   └── auth.js              # Auth business logic service
│   ├── Category/
│   │   └── category.js          # Category business logic service
│   ├── SubCategory/
│   │   └── subCategory.js       # SubCategory business logic service
│   └── Trader/
│       └── trader.js            # Trader business logic service
├── utils/
│   ├── Auth/
│   │   ├── generateToken.js     # JWT token generator
│   │   └── validators.js        # Auth validators
│   ├── Category/
│   │   └── validators.js        # Category validators
│   ├── SubCategory/
│   │   └── validators.js        # SubCategory validators
│   ├── Trader/
│   │   └── validators.js        # Trader validators
│   └── Common/
│       ├── apiResponse.js       # Success response helper
│       └── customError.js       # Custom operational error class
├── app.js                       # Express app configuration
└── server.js                    # Server startup script
tests/
├── auth.test.js                 # Auth integration tests (13 tests)
├── category.test.js             # Category integration tests (6 tests)
├── subCategory.test.js          # SubCategory integration tests (6 tests)
└── trader.test.js               # Trader integration tests (6 tests)
```

---

## 🔌 API Endpoints Summary

### Authentication APIs (`/api/auth`)
| Method | Endpoint             | Access    | Description                                      |
| :----- | :------------------- | :-------- | :----------------------------------------------- |
| `POST` | `/api/auth/register` | Public    | Register user with numeric ID & JWT token        |
| `POST` | `/api/auth/login`    | Public    | Login user & return JWT token                    |
| `GET`  | `/api/auth/profile`  | Protected | Retrieve logged-in user profile                  |
| `GET`  | `/api/auth/profile/:id`| Protected| Retrieve user profile by numeric ID              |
| `POST` | `/api/auth/logout`   | Protected | Invalidate/logout active token session           |

### Category APIs (`/api/categories`)
| Method   | Endpoint               | Access                   | Description                                     |
| :------- | :--------------------- | :----------------------- | :---------------------------------------------- |
| `POST`   | `/api/categories`      | Admin, Manager           | Create a new category                           |
| `GET`    | `/api/categories`      | Admin, Manager, Staff    | Get all categories                              |
| `GET`    | `/api/categories/:id`  | Admin, Manager, Staff    | Get single category by ID                       |
| `PUT`    | `/api/categories/:id`  | Admin, Manager           | Update category                                 |
| `DELETE` | `/api/categories/:id`  | Admin, Manager           | Delete category (protected against in-use items)|

### Sub Category APIs (`/api/subcategories`)
| Method   | Endpoint                             | Access                | Description                                        |
| :------- | :----------------------------------- | :-------------------- | :------------------------------------------------- |
| `POST`   | `/api/subcategories`                 | Admin, Manager        | Create a new sub-category                          |
| `GET`    | `/api/subcategories`                 | Admin, Manager, Staff | Get all sub-categories                             |
| `GET`    | `/api/subcategories/:id`             | Admin, Manager, Staff | Get single sub-category                            |
| `GET`    | `/api/subcategories/category/:catId` | Admin, Manager, Staff | Get all sub-categories for a specific category     |
| `PUT`    | `/api/subcategories/:id`             | Admin, Manager        | Update sub-category                                |
| `DELETE` | `/api/subcategories/:id`             | Admin, Manager        | Delete sub-category (protected against in-use items)|

### Trader / Job Work Customer APIs (`/api/traders`)
| Method   | Endpoint            | Access                | Description                                        |
| :------- | :------------------ | :-------------------- | :------------------------------------------------- |
| `POST`   | `/api/traders`      | Admin, Manager        | Create a new trader/customer                       |
| `GET`    | `/api/traders`      | Admin, Manager, Staff | Get all traders (support search, categoryId filter)|
| `GET`    | `/api/traders/:id`  | Admin, Manager, Staff | Get single trader by ID                            |
| `PUT`    | `/api/traders/:id`  | Admin, Manager        | Update trader                                      |
| `DELETE` | `/api/traders/:id`  | Admin, Manager        | Delete trader                                      |

---

## 🔗 Category → Sub Category → Trader Relationship Model

```mermaid
graph TD
    A["Category (e.g. Garment Trader)"] -->|"1 to Many"| B["Sub Category (e.g. Ladies Wear)"]
    B -->|"1 to Many"| C["Trader / Job Work Customer (e.g. ABC Garments)"]
```

1. **Category**: High-level business classification (e.g., *Garment Trader*, *Saree Manufacturer*).
2. **Sub Category**: Belongs to 1 specific Category (e.g., *Ladies Wear*, *Kids Wear*).
3. **Trader (Job Work Customer)**: Must reference both a **Category** and a **Sub Category**.
   - **Enforced Business Rule**: The selected `subCategoryId` MUST belong to the selected `categoryId`. If mismatched, the request is rejected with `400 Bad Request`.
