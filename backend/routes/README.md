# Bakery API

A RESTful API for a bakery management system built with Node.js, Express.js, and MySQL.

## Features

- User authentication and authorization (JWT)
- Product management (CRUD operations)
- Category management
- Order management
- User management (Admin only)
- Role-based access control

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **CORS**: Enabled for cross-origin requests

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mx_bakery
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=bakery_db
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

4. Set up the database:
- Create a MySQL database named `bakery_db`
- Run the SQL scripts to create tables (users, products, categories, orders)

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'customer') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Categories Table
```sql
CREATE TABLE categories (
  category_id INT PRIMARY KEY AUTO_INCREMENT,
  category_name VARCHAR(255) NOT NULL,
  description TEXT
);
```

### Products Table
```sql
CREATE TABLE products (
  product_id INT PRIMARY KEY AUTO_INCREMENT,
  product_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL,
  category_id INT,
  FOREIGN KEY (category_id) REFERENCES categories(category_id)
);
```

### Orders Table
```sql
CREATE TABLE orders (
  order_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'processing', 'shipped', 'delivered') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Users (Admin Only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (Admin only)
- `PUT /api/categories/:id` - Update category (Admin only)
- `DELETE /api/categories/:id` - Delete category (Admin only)

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

### Orders
- `GET /api/orders` - Get user orders (or all orders for admin)
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order (Admin only)
- `DELETE /api/orders/:id` - Delete order (Admin only)

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Request/Response Examples

### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "customer"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "role": "customer"
  }
}
```

### Get Products
```bash
GET /api/products
Authorization: Bearer <token>
```

Response:
```json
[
  {
    "product_id": 1,
    "product_name": "Chocolate Cake",
    "price": 25.99,
    "stock": 10,
    "category_name": "Cakes"
  }
]
```

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

Error responses include a message field with details.

## Project Structure

```
backend/
├── config/
│   └── db.js                 # Database configuration
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── userController.js     # User management
│   ├── categoryController.js # Category management
│   ├── productController.js  # Product management
│   └── orderController.js    # Order management
├── middlewares/
│   └── authMiddleware.js     # JWT authentication middleware
├── routes/
│   ├── authRoutes.js         # Auth routes
│   ├── userRoutes.js         # User routes
│   ├── categoryRoutes.js     # Category routes
│   ├── productRoutes.js      # Product routes
│   └── orderRoutes.js        # Order routes
├── .env                      # Environment variables
├── .gitignore               # Git ignore file
└── server.js                # Main server file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License.