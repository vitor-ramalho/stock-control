# API Testing Examples

## Prerequisites
- Replace `<TENANT_ID>` with your actual tenant ID from seed output
- Replace `<JWT_TOKEN>` with the token received from login

## 1. Authentication

### Register New User
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json
X-Tenant-ID: <TENANT_ID>

{
  "email": "john@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### Login
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json
X-Tenant-ID: <TENANT_ID>

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin",
    "tenantId": "uuid"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 2. User Management

### Get All Users
```http
GET http://localhost:3000/api/users
X-Tenant-ID: <TENANT_ID>
Authorization: Bearer <JWT_TOKEN>
```

### Get Single User
```http
GET http://localhost:3000/api/users/<USER_ID>
X-Tenant-ID: <TENANT_ID>
Authorization: Bearer <JWT_TOKEN>
```

### Update User
```http
PATCH http://localhost:3000/api/users/<USER_ID>
Content-Type: application/json
X-Tenant-ID: <TENANT_ID>
Authorization: Bearer <JWT_TOKEN>

{
  "name": "John Updated",
  "role": "manager"
}
```

### Delete User
```http
DELETE http://localhost:3000/api/users/<USER_ID>
X-Tenant-ID: <TENANT_ID>
Authorization: Bearer <JWT_TOKEN>
```

## 3. Tenant Management

### Create Tenant
```http
POST http://localhost:3000/api/tenants
Content-Type: application/json
X-Tenant-ID: <TENANT_ID>
Authorization: Bearer <JWT_TOKEN>

{
  "name": "My Company",
  "slug": "my-company"
}
```

### Get All Tenants
```http
GET http://localhost:3000/api/tenants
X-Tenant-ID: <TENANT_ID>
Authorization: Bearer <JWT_TOKEN>
```

### Get Single Tenant
```http
GET http://localhost:3000/api/tenants/<TENANT_ID>
X-Tenant-ID: <TENANT_ID>
Authorization: Bearer <JWT_TOKEN>
```

### Update Tenant
```http
PATCH http://localhost:3000/api/tenants/<TENANT_ID>
Content-Type: application/json
X-Tenant-ID: <TENANT_ID>
Authorization: Bearer <JWT_TOKEN>

{
  "name": "Updated Company Name",
  "isActive": true
}
```

## cURL Examples

### Login with cURL
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <TENANT_ID>" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### Get Users with cURL
```bash
curl -X GET http://localhost:3000/api/users \
  -H "X-Tenant-ID: <TENANT_ID>" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Create User with cURL
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <TENANT_ID>" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "name": "New User"
  }'
```

## Postman Collection

Import this JSON to Postman:

```json
{
  "info": {
    "name": "ERP Backend API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000/api"
    },
    {
      "key": "tenant_id",
      "value": "YOUR_TENANT_ID"
    },
    {
      "key": "jwt_token",
      "value": "YOUR_JWT_TOKEN"
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "X-Tenant-ID",
                "value": "{{tenant_id}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@example.com\",\n  \"password\": \"admin123\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{base_url}}/auth/login",
              "host": ["{{base_url}}"],
              "path": ["auth", "login"]
            }
          }
        },
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "X-Tenant-ID",
                "value": "{{tenant_id}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"user@example.com\",\n  \"password\": \"password123\",\n  \"name\": \"Test User\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{base_url}}/auth/register",
              "host": ["{{base_url}}"],
              "path": ["auth", "register"]
            }
          }
        }
      ]
    },
    {
      "name": "Users",
      "item": [
        {
          "name": "Get All Users",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "X-Tenant-ID",
                "value": "{{tenant_id}}"
              },
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/users",
              "host": ["{{base_url}}"],
              "path": ["users"]
            }
          }
        }
      ]
    }
  ]
}
```

## Testing with VS Code REST Client

Install the "REST Client" extension and create a file `api-tests.http`:

```http
### Variables
@base_url = http://localhost:3000/api
@tenant_id = YOUR_TENANT_ID
@jwt_token = YOUR_JWT_TOKEN

### Login
POST {{base_url}}/auth/login
Content-Type: application/json
X-Tenant-ID: {{tenant_id}}

{
  "email": "admin@example.com",
  "password": "admin123"
}

### Get All Users
GET {{base_url}}/users
X-Tenant-ID: {{tenant_id}}
Authorization: Bearer {{jwt_token}}

### Register New User
POST {{base_url}}/auth/register
Content-Type: application/json
X-Tenant-ID: {{tenant_id}}

{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User"
}
```

## Error Responses

### 400 - Bad Request
```json
{
  "statusCode": 400,
  "message": "X-Tenant-ID header is required",
  "error": "Bad Request"
}
```

### 401 - Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### 409 - Conflict
```json
{
  "statusCode": 409,
  "message": "User with this email already exists in this tenant",
  "error": "Conflict"
}
```

## Notes

1. Always include `X-Tenant-ID` header in every request
2. For protected routes, include `Authorization: Bearer <token>`
3. The JWT token expires in 7 days by default
4. All endpoints are prefixed with `/api`
