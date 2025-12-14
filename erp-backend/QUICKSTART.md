# Quick Start Guide

## 1. Prerequisites Check

Ensure you have:
- Node.js v18+ installed
- PostgreSQL v14+ installed and running
- npm or yarn

## 2. Database Setup

```bash
# Create the database
createdb erp_saas

# Or using psql
psql -U postgres
CREATE DATABASE erp_saas;
\q
```

## 3. Project Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# Update DB_USERNAME, DB_PASSWORD, etc.
```

## 4. Build and Migrate

```bash
# Build the project
npm run build

# Run migrations (creates tables)
npm run migration:run

# Seed initial data (creates tenant + admin user)
npm run seed
```

**⚠️ Important**: Copy the Tenant ID from the seed output. You'll need it for all API requests!

Example output:
```
✅ Created default tenant
✅ Created admin user
   Email: admin@example.com
   Password: admin123

🎉 Seeding completed successfully!

📋 Tenant ID: 123e4567-e89b-12d3-a456-426614174000
   Use this ID in the X-Tenant-ID header
```

## 5. Start the Server

```bash
# Development mode (with hot reload)
npm run start:dev
```

Server will start at: `http://localhost:3000/api`

## 6. Test the API

### Login Request
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <YOUR_TENANT_ID>" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### Response
```json
{
  "user": {
    "id": "user-uuid",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin",
    "tenantId": "tenant-uuid"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get All Users (Protected Route)
```bash
curl -X GET http://localhost:3000/api/users \
  -H "X-Tenant-ID: <YOUR_TENANT_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

## Common Issues

### "X-Tenant-ID header is required"
- Make sure you include the `X-Tenant-ID` header in every request
- Use the Tenant ID from the seed command output

### Database connection errors
- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `.env` file
- Ensure database `erp_saas` exists

### Migration errors
- Always build before running migrations: `npm run build`
- Check if migration files exist in `dist/migrations/`

## Next Steps

Now you're ready to:
1. Create more users via `/api/auth/register`
2. Implement Products module
3. Add Stock/Inventory features
4. Build POS functionality

For detailed API documentation, see [README.md](./README.md)
