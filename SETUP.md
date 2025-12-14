# Stock Control ERP - Setup Guide

## Multi-Tenant Architecture

This system uses a **shared database with tenant isolation** model. Each request must include the tenant ID in the `X-Tenant-ID` header.

## Backend Setup

### 1. Start the Database

```bash
cd erp-backend
docker compose up -d
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Database Migrations

```bash
npm run migration:run
```

### 4. Seed Initial Data

This creates a default tenant and admin user:

```bash
npm run seed
```

**Output will show:**
- Tenant ID (UUID) - Save this for reference
- Admin credentials:
  - Email: `admin@example.com`
  - Password: `admin123`

### 5. Start the Backend

```bash
npm run start:dev
```

Backend will run on: `http://localhost:3000`

## Frontend Setup

### 1. Install Dependencies

```bash
cd erp-frontend
npm install
```

### 2. Configure Environment

Create/edit `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

**Note:** No `NEXT_PUBLIC_TENANT_ID` needed! The tenant ID is automatically extracted from the user after login.

### 3. Start the Frontend

```bash
npm run dev
```

Frontend will run on: `http://localhost:3001`

## First Login

1. Navigate to `http://localhost:3001/login`
2. Login with:
   - Email: `admin@example.com`
   - Password: `admin123`
3. The tenant ID is automatically stored from your user profile

## How Multi-Tenancy Works

1. **Login**: User logs in with email/password
2. **User Object**: Backend returns user with `tenantId` field
3. **Storage**: Frontend stores `tenantId` in localStorage
4. **All Requests**: `X-Tenant-ID` header is automatically added by Axios interceptor
5. **Backend Validation**: Middleware validates tenant and attaches to request
6. **Data Isolation**: All queries are filtered by `tenantId`

## Creating Additional Tenants

### Option 1: Via API (Recommended)

```bash
curl -X POST http://localhost:3000/api/tenant \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <existing-tenant-id>" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "name": "New Company",
    "slug": "new-company"
  }'
```

### Option 2: Via Database

```sql
INSERT INTO tenant (id, name, slug, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'New Company',
  'new-company',
  true,
  NOW(),
  NOW()
);
```

Then create a user for that tenant:

```sql
INSERT INTO "user" (id, email, password, name, role, "isActive", "tenantId", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@newcompany.com',
  '$2b$10$...',  -- Hash with bcrypt
  'Admin User',
  'ADMIN',
  true,
  '<new-tenant-id>',
  NOW(),
  NOW()
);
```

## Troubleshooting

### "X-Tenant-ID header is required"

**Cause:** No tenant ID stored in localStorage

**Solution:**
1. Clear browser localStorage
2. Login again
3. Check browser DevTools > Application > Local Storage for `tenant_id`

### Cannot connect to database

**Cause:** PostgreSQL not running

**Solution:**
```bash
cd erp-backend
docker compose up -d
docker compose ps  # Verify containers are running
```

### 401 Unauthorized errors

**Cause:** Token expired or invalid

**Solution:**
1. Logout and login again
2. Check if backend is running
3. Verify user exists in database

## Database Credentials (Docker)

- Host: `localhost`
- Port: `5432`
- Database: `erp_db`
- Username: `postgres`
- Password: `postgres`

## API Documentation

Once backend is running, Swagger docs available at:
`http://localhost:3000/api/docs`
