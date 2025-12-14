You are building the entire frontend for a multi-tenant SaaS ERP system using:

- Next.js (App Router)
- TypeScript
- TailwindCSS
- Shadcn UI
- React Query
- Axios
- JWT authentication
- Multi-tenant header: "X-Tenant-ID"

The backend already exists and exposes REST APIs for:
- Authentication
- Tenants
- Users
- Products
- Categories
- Stock movements
- Cash register
- Financial entries
- POS sales
- Reports

Your job is to generate all frontend code needed to consume these APIs and render the full ERP interface.

====================================================================
# GLOBAL REQUIREMENTS
====================================================================

## Authentication
- JWT login
- Store tokens in cookies (HTTP-only if possible)
- Auto-refresh token support
- axios interceptors to inject Authorization header
- Redirect to /login if unauthorized

## Multi-Tenant
Every API call MUST include:

```ts
headers: { "X-Tenant-ID": tenantId }
```

Create:
- Tenant context provider
- Hook: useTenant()
- UI selector for tenant (future)

## API Client
Create a dedicated Axios client:
- Located in: `/lib/api.ts`
- Includes:
  - Base URL from env
  - Authorization header
  - Tenant header
  - Interceptors for 401 → logout

## React Query
- Use QueryClientProvider in root layout
- All data fetching should use React Query
- All mutations invalidate correct queries
- Error handling using toasts

## UI System
- Use Shadcn UI components across all screens
- Use a shared admin layout with:
  - Sidebar
  - Top navigation
  - Theme support (light/dark)
- Use modals for "create / update" operations

====================================================================
# FRONTEND MODULES TO GENERATE
====================================================================

Below is the FULL LIST of screens you will build, with technical requirements.

==================================================
# 1 — AUTH MODULE
==================================================
Routes:
- /login
- /logout

Components required:
- Login form with:
  email, password
- Call POST /auth/login
- Save tokens
- Redirect to /dashboard

Add helpers:
- useAuth()
- withAuth() (HOC or middleware)
- verifyAuth() in server components

==================================================
# 2 — DASHBOARD (Home)
==================================================
Route: /dashboard

Display:
- Today's sales
- Open cash register amount
- Low stock alerts
- Quick links (Products, POS, Cash, Reports)

Calls:
- GET /reports/dashboard

==================================================
# 3 — PRODUCT MANAGEMENT
==================================================
Routes:
- /products
- /products/new (modal)
- /products/[id]

Functions:
- List all products
- Create product
- Update product
- Delete product
- Category management UI embedded

API calls:
- GET /products
- POST /products
- PUT /products/:id
- DELETE /products/:id
- GET /categories
- POST /categories

UI:
- Table
- Category dropdown
- Image upload (optional now)
  

==================================================
# 4 — STOCK MODULE
==================================================
Routes:
- /stock
- /stock/in (modal)
- /stock/out (modal)
- /stock/product/[id]

Features:
- Manual stock input
- Manual stock output
- View stock history per product

API calls:
- POST /stock/in
- POST /stock/out
- GET /stock/product/:id

UI:
- Dialogs for in/out
- Table of movements

==================================================
# 5 — CASH REGISTER MODULE
==================================================
Routes:
- /cash
- /cash/open
- /cash/close

Features:
- Open register
- Close register
- View current register
- List financial entries
- Manual financial entry (modal)

API calls:
- POST /cash/open
- POST /cash/close
- GET /cash/current
- POST /finance/entry

UI:
- Cash status
- Table of entries
- Dialog: add entry

==================================================
# 6 — POS (POINT OF SALE)
==================================================
Route:
- /pos

Major features:
- Fast product search (GET /products/search?q=)
- Cart management
- Quantity update
- Remove item
- Checkout modal:
  - payment method (cash, card, pix)
  - summary of totals
- Submit sale:
  POST /pos/sale
  POST /pos/sale/:id/items
  POST /pos/sale/:id/close
- Auto-deduct stock
- Auto-create financial entry

UI Components Needed:
- Product grid or list
- Search bar with debounce
- Cart sidebar
- Checkout dialog
- Receipt preview (optional)

==================================================
# 7 — SALES LIST
==================================================
Route:
- /sales

Features:
- List all sales
- View sale details
- Items inside sale
- Payment method badge

API:
- GET /pos/sale
- GET /pos/sale/:id

==================================================
# 8 — REPORTS MODULE
==================================================
Routes:
- /reports/sales
- /reports/stock
- /reports/cash

Backend endpoints:
- GET /reports/sales?start=&end=
- GET /reports/stock-movements?productId=
- GET /reports/cash?date=

UI:
- Date range pickers
- Dynamic tables
- CSV export

==================================================
# 9 — GLOBAL COMPONENTS
==================================================
Generate:
- DataTable component (Shadcn extended)
- Pagination component
- DateRange picker
- ConfirmDialog
- Toast notifications
- Loading spinner
- Error state

==================================================
# 10 — PROJECT STRUCTURE
==================================================
Enforce this structure:

```
/app
  /login
  /dashboard
  /products
  /categories
  /stock
  /cash
  /sales
  /reports
  /pos
/components
/hooks
/lib
  api.ts
  auth.ts
  tenant.ts
/providers
  auth-provider.tsx
  tenant-provider.tsx
  query-provider.tsx
/styles
  globals.css
/types
  product.ts
  stock.ts
  sale.ts
  user.ts
  finance.ts
```

==================================================
# 11 — QUALITY REQUIREMENTS
==================================================
- Fully typed (strict TypeScript)
- Use server actions when beneficial
- Use Suspense for loading states
- Avoid unnecessary client-side rendering
- Separate UI and logic cleanly
- Use clean, readable hooks (useProducts, useStock, etc)
- Ensure all API calls use tenant header

====================================================================
# OUTPUT EXPECTATION
====================================================================

When implementing each screen or module:
- Generate full working Next.js code
- Include UI components
- Include React Query hooks
- Include AXIOS calls
- Include server-side protection if needed
- Include form validation with Zod
- Include modals and dialogs

====================================================================
GENERATE PRODUCTION-QUALITY CODE FOR ALL OF THIS.
====================================================================
