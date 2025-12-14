# Stock Control ERP - Multi-Tenant SaaS

A complete ERP system with multi-tenant support built with NestJS and Next.js.

## ⚡ Quick Start

```bash
# Run the setup script
./quick-start.sh

# Or manually:
cd erp-backend
docker compose up -d postgres
npm install
npm run migration:run
npm run seed

# In another terminal:
cd erp-frontend
npm install
npm run dev
```

## 🔐 Default Credentials

- **Email:** `admin@example.com`
- **Password:** `admin123`

## 📚 Full Documentation

See [SETUP.md](./SETUP.md) for detailed setup instructions.

## 🏗️ Architecture

### Multi-Tenancy Model
- **Shared Database**: All tenants in one PostgreSQL database
- **Row-Level Isolation**: Every table has a `tenantId` column
- **Header-Based Routing**: `X-Tenant-ID` header identifies the tenant

### Tech Stack

**Backend:**
- NestJS 11
- TypeORM
- PostgreSQL 15
- JWT Authentication
- Multi-tenant middleware

**Frontend:**
- Next.js 16 (App Router)
- TypeScript
- TailwindCSS v4
- Shadcn UI
- React Query
- Zustand (state management)

## 📦 Modules

### Completed ✅
- ✅ Authentication & Authorization
- ✅ Tenant Management
- ✅ Products (CRUD)
- ✅ Categories (CRUD)
- ✅ Stock Management (In/Out operations)
- ✅ Cash Register (Open/Close sessions)
- ✅ Financial Entries (Income/Expense tracking)
- ✅ Sales History
- ✅ POS (Point of Sale)

### To-Do 📋
- ⏸️ Reports & Analytics
- ⏸️ User Management UI
- ⏸️ Tenant Administration Panel

## 🚀 URLs

- **Backend API:** http://localhost:3000/api
- **Frontend:** http://localhost:3001
- **Database:** postgresql://postgres:postgres@localhost:5432/erp_saas

## 🔧 Development

### Backend
```bash
cd erp-backend
npm run start:dev  # Starts on port 3000
```

### Frontend
```bash
cd erp-frontend
npm run dev        # Starts on port 3001
```

### Database
```bash
cd erp-backend
docker compose up -d postgres
```

## 📝 How Multi-Tenancy Works

1. **User logs in** with email/password
2. **Backend returns** user object with `tenantId`
3. **Frontend stores** `tenantId` in localStorage
4. **All API requests** include `X-Tenant-ID` header (automatic)
5. **Backend validates** tenant and filters all queries by `tenantId`

## 🐛 Troubleshooting

### "X-Tenant-ID header is required"
- **Solution:** Clear browser localStorage and login again

### Database connection error
```bash
cd erp-backend
docker compose restart postgres
docker compose logs postgres
```

### Cannot access frontend pages
1. Check if backend is running on port 3000
2. Check browser console for errors
3. Verify `tenantId` is stored in localStorage
4. Try logging out and logging in again

## 📄 License

MIT
