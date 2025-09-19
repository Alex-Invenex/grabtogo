# GrabtoGo API Documentation

## Overview

The GrabtoGo API is a RESTful service that powers the GrabtoGo marketplace platform. It provides endpoints for user management, vendor operations, product catalog, order processing, and payment handling.

## Base URL

- **Production**: `https://api.grabtogo.in`
- **Staging**: `https://staging-api.grabtogo.in`
- **Development**: `http://localhost:3001`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting Started

1. Register a new account
2. Login to receive JWT token
3. Include token in subsequent requests

## Rate Limiting

- **General**: 100 requests per 15 minutes per IP
- **Authentication**: 5 login attempts per 15 minutes
- **Payments**: 10 order creations per minute
- **Search**: 50 requests per minute

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful",
  "timestamp": "2024-01-20T10:30:00Z",
  "requestId": "req_123456789"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      // Error details
    }
  },
  "timestamp": "2024-01-20T10:30:00Z",
  "requestId": "req_123456789"
}
```

## Endpoints

### Authentication

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "clerkId": "clerk_user_123",
  "role": "CUSTOMER" // or "VENDOR"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "role": "CUSTOMER"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET /api/auth/me
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "role": "CUSTOMER",
      "profile": {
        // User profile data
      }
    }
  }
}
```

### Vendors

#### GET /api/vendors
Get list of vendors with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `location` (string): Filter by location
- `businessType` (string): Filter by business type
- `isVerified` (boolean): Filter by verification status

**Response:**
```json
{
  "success": true,
  "data": {
    "vendors": [
      {
        "id": "vendor_123",
        "businessName": "Amazing Restaurant",
        "businessType": "Restaurant",
        "location": "Mumbai, Maharashtra",
        "isVerified": true,
        "rating": 4.5,
        "subscriptionPlan": "PREMIUM"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

#### GET /api/vendors/:id
Get vendor details by ID.

#### POST /api/vendors/profile
Create or update vendor profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "businessName": "Amazing Restaurant",
  "businessType": "Restaurant",
  "address": "123 Food Street, Mumbai",
  "phone": "+91-9876543210",
  "description": "Best food in town"
}
```

#### GET /api/vendors/analytics
Get vendor analytics (vendor only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `period` (string): Time period (7d, 30d, 90d, 1y)

### Products

#### GET /api/products
Get products with filtering and pagination.

**Query Parameters:**
- `vendorId` (string): Filter by vendor
- `category` (string): Filter by category
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `search` (string): Search term
- `page` (number): Page number
- `limit` (number): Items per page
- `sortBy` (string): Sort field (price, name, createdAt)
- `sortOrder` (string): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "product_123",
        "name": "Delicious Burger",
        "description": "Tasty burger with fresh ingredients",
        "price": 299,
        "category": "Food",
        "images": ["image1.jpg", "image2.jpg"],
        "vendor": {
          "id": "vendor_123",
          "businessName": "Amazing Restaurant"
        },
        "isActive": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

#### GET /api/products/:id
Get product details by ID.

#### POST /api/products
Create new product (vendor only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "New Product",
  "description": "Product description",
  "price": 499,
  "category": "Electronics",
  "images": ["image1.jpg"]
}
```

#### PUT /api/products/:id
Update product (vendor only).

#### DELETE /api/products/:id
Delete product (vendor only).

### Orders

#### GET /api/orders
Get user orders with pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (string): Filter by order status
- `page` (number): Page number
- `limit` (number): Items per page

#### GET /api/orders/:id
Get order details by ID.

#### POST /api/orders
Create new order.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "vendorId": "vendor_123",
  "items": [
    {
      "productId": "product_123",
      "quantity": 2,
      "price": 299
    }
  ],
  "totalAmount": 598,
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001"
  }
}
```

#### PUT /api/orders/:id/status
Update order status (vendor only).

### Payments

#### POST /api/payments/create-order
Create Razorpay order for payment.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "orderId": "order_123",
  "amount": 59800 // Amount in paise
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "razorpayOrder": {
      "id": "order_razorpay_123",
      "amount": 59800,
      "currency": "INR",
      "status": "created"
    },
    "order": {
      "id": "order_123",
      "status": "PENDING"
    }
  }
}
```

#### POST /api/payments/verify
Verify payment after successful payment.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "razorpay_order_id": "order_razorpay_123",
  "razorpay_payment_id": "pay_razorpay_123",
  "razorpay_signature": "signature_hash"
}
```

#### POST /api/payments/refund
Process refund (admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "paymentId": "payment_123",
  "amount": 29900, // Partial or full refund
  "reason": "Product defective"
}
```

### Offers

#### GET /api/offers
Get active offers with filtering.

**Query Parameters:**
- `vendorId` (string): Filter by vendor
- `category` (string): Filter by category
- `location` (string): Filter by location

#### GET /api/offers/:id
Get offer details by ID.

#### POST /api/offers
Create new offer (vendor only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "20% Off Everything!",
  "description": "Limited time offer on all products",
  "discountPercentage": 20,
  "validFrom": "2024-01-20T00:00:00Z",
  "validUntil": "2024-01-27T23:59:59Z",
  "applicableProducts": ["product_123", "product_456"],
  "isActive": true
}
```

### Search

#### GET /api/search/vendors
Search vendors by name, location, or business type.

**Query Parameters:**
- `q` (string): Search query
- `location` (string): Location filter
- `businessType` (string): Business type filter

#### GET /api/search/products
Search products by name, description, or category.

**Query Parameters:**
- `q` (string): Search query
- `category` (string): Category filter
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price

### Admin (Admin Only)

#### GET /api/admin/dashboard
Get admin dashboard statistics.

#### GET /api/admin/vendors/pending
Get vendors pending approval.

#### POST /api/admin/vendors/:id/approve
Approve vendor verification.

#### POST /api/admin/vendors/:id/reject
Reject vendor verification.

#### GET /api/admin/reports/revenue
Get revenue reports.

#### GET /api/admin/reports/vendors
Get vendor performance reports.

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid input data |
| `AUTHENTICATION_ERROR` | Invalid or missing token |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `CONFLICT_ERROR` | Resource conflict (duplicate) |
| `RATE_LIMIT_ERROR` | Too many requests |
| `EXTERNAL_SERVICE_ERROR` | Third-party service error |
| `DATABASE_ERROR` | Database operation failed |
| `INTERNAL_ERROR` | Internal server error |

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error
- `502` - Bad Gateway
- `503` - Service Unavailable

## Webhooks

### Razorpay Payment Webhook

**Endpoint:** `POST /api/webhooks/razorpay`

**Headers:**
- `X-Razorpay-Signature`: Webhook signature

**Event Types:**
- `payment.captured` - Payment successful
- `payment.failed` - Payment failed
- `order.paid` - Order fully paid

### Example Usage

```javascript
// Register user
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    clerkId: 'clerk_123',
    role: 'CUSTOMER'
  })
});

const { data } = await registerResponse.json();
const token = data.token;

// Get vendors
const vendorsResponse = await fetch('/api/vendors?location=Mumbai', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const vendors = await vendorsResponse.json();
```

## SDK

We provide official SDKs for easy integration:

- **JavaScript/TypeScript**: `@grabtogo/api-client`
- **React Native**: `@grabtogo/react-native-sdk`

```bash
npm install @grabtogo/api-client
```

```javascript
import { GrabtoGoAPI } from '@grabtogo/api-client';

const api = new GrabtoGoAPI({
  baseURL: 'https://api.grabtogo.in',
  apiKey: 'your-api-key'
});

// Get vendors
const vendors = await api.vendors.list({
  location: 'Mumbai',
  page: 1
});
```

## Support

For API support and questions:

- **Email**: api-support@grabtogo.in
- **Documentation**: https://docs.grabtogo.in
- **Status Page**: https://status.grabtogo.in
- **GitHub Issues**: https://github.com/grabtogo/api/issues

## Changelog

### v1.0.0 (2024-01-20)
- Initial API release
- User authentication and management
- Vendor and product management
- Order processing
- Payment integration with Razorpay
- Search functionality
- Admin panel APIs