# Authentication System Setup Guide

## Overview
This guide explains how to set up and use the secure authentication system with JWT tokens, password hashing, and role-based access control (RBAC).

---

## Installation

### 1. Install Required Dependencies

```bash
npm install bcrypt jsonwebtoken dotenv
```

### 2. Environment Variables

Create a `.env` file in the server root directory with the following variables:

```env
# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Database
MONGODB_URI=mongodb://localhost:27017/hrms

# Server
PORT=5000
NODE_ENV=development
```

> **⚠️ Important**: In production, use strong, random secrets. Generate them using:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## File Structure

```
server/
├── src/
│   ├── controllers/
│   │   └── AuthController.js       # Authentication logic
│   ├── middleware/
│   │   └── authMiddleware.js       # JWT verification & RBAC
│   ├── models/
│   │   └── User.js                 # User schema (updated)
│   ├── routes/
│   │   └── AuthRouter.js           # Authentication routes
│   └── utils/
│       └── passwordUtil.js         # Password hashing utilities
└── index.js                        # Main server file
```

---

## Setup Instructions

### Step 1: Update Main Server File

In `server/index.js`, add the authentication routes:

```javascript
const express = require('express');
const authRouter = require('./src/routes/AuthRouter');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);

// Other routes...
```

### Step 2: Hash Passwords When Creating Users

When creating a new user, always hash the password:

```javascript
const { hashPassword } = require('./src/utils/passwordUtil');

// When creating a user
const hashedPassword = await hashPassword(plainTextPassword);
const user = await User.create({
  email: 'user@example.com',
  password: hashedPassword,
  roleId: 'role-id',
});
```

### Step 3: Use Authentication Middleware

For protected routes, use the authentication middleware:

```javascript
const { verifyAccessToken, requireRole } = require('./src/middleware/authMiddleware');

// Protect route with authentication
router.get('/profile', verifyAccessToken, (req, res) => {
  // req.user contains { id, roleId }
});

// Protect route with role-based access
router.delete('/users/:id', 
  verifyAccessToken, 
  requireRole('Admin'), 
  deleteUserHandler
);
```

---

## API Endpoints

### 1. Login
**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "roleId": "role-id",
      "roleName": "Employee",
      "employeeId": "EMP001",
      "isActive": true
    }
  }
}
```

**Response** (Error - 401):
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 2. Refresh Access Token
**Endpoint**: `POST /api/auth/refresh`

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "message": "Access token refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Verify Token
**Endpoint**: `GET /api/auth/verify`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (Success - 200):
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "userId": "user-id",
    "roleId": "role-id",
    "roleName": "Employee",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "isActive": true
    }
  }
}
```

---

### 4. Logout
**Endpoint**: `POST /api/auth/logout`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (Success - 200):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 5. Get Current User Info
**Endpoint**: `GET /api/auth/me`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "roleId": "role-id",
    "roleName": "Employee",
    "employeeId": "EMP001",
    "isActive": true,
    "lastLogin": "2026-03-06T10:30:00.000Z"
  }
}
```

---

## Features Explained

### 1. JWT Access Token (15 minutes)
- Short-lived token for API access
- Sent in Authorization header: `Bearer <token>`
- Expires in 15 minutes
- Used for request authentication

### 2. Refresh Token (7 days)
- Long-lived token stored in database
- Used to get new access tokens
- Expires in 7 days
- Provides seamless user experience

### 3. Password Hashing (bcrypt)
- Passwords are hashed with salt rounds (10)
- Never stored in plain text
- One-way encryption for security
- Verified during login

### 4. Role-Based Access Control (RBAC)
- Control access by user roles (Admin, Manager, Employee)
- Use middleware: `requireRole('Admin', 'Manager')`
- Role information included in JWT token
- Database lookup for permission validation

---

## Usage Examples

### Example 1: Admin-Only Route
```javascript
const { verifyAccessToken, requireRole } = require('./src/middleware/authMiddleware');

router.delete('/users/:id',
  verifyAccessToken,
  requireRole('Admin'),
  (req, res) => {
    // Only admins can delete users
  }
);
```

### Example 2: Manager or Admin Route
```javascript
router.put('/attendance/approve',
  verifyAccessToken,
  requireRole('Admin', 'Manager'),
  (req, res) => {
    // Admin or Manager can approve attendance
  }
);
```

### Example 3: Get Current User in Route
```javascript
router.get('/profile',
  verifyAccessToken,
  async (req, res) => {
    const userId = req.user.id;
    const user = await User.findOne({ id: userId });
    res.json(user);
  }
);
```

---

## Security Best Practices

1. **Environment Variables**: Never hardcode secrets in code
2. **HTTPS**: Always use HTTPS in production
3. **Token Expiry**: Keep access tokens short-lived (15 min)
4. **Refresh Token**: Store only in database with HTTPS-only cookies
5. **CORS**: Configure CORS properly to prevent unauthorized access
6. **Password Requirements**: Enforce strong password policies
7. **Rate Limiting**: Implement rate limiting on login endpoint
8. **Audit Logs**: Log authentication events for security monitoring

---

## Troubleshooting

### "Invalid token" error
- Check if token has expired (access tokens last 15 min)
- Verify token format: `Authorization: Bearer <token>`
- Use refresh endpoint to get new access token

### "Access denied" error
- User's role doesn't have permission
- Check role permissions in RBAC middleware
- Verify user.roleId matches allowed roles

### "Refresh token has expired"
- Refresh tokens last 7 days
- User must login again
- Database cleanup of expired tokens recommended

---

## Next Steps

1. **Add Rate Limiting**: Prevent brute force attacks on login
2. **Email Verification**: Send verification emails on signup
3. **Two-Factor Authentication**: Add 2FA for enhanced security
4. **Password Reset**: Implement secure password reset flow
5. **Audit Logging**: Track all authentication events
6. **Token Blacklist**: Invalidate tokens before expiry if needed
