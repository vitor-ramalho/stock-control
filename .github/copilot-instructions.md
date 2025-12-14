# Copilot Project Instructions — SaaS ERP MVP

## Project Overview
You are assisting in the development of a multi-tenant SaaS ERP MVP that includes:
- Product management
- Inventory control
- POS sales system
- Daily cash register
- Financial entries
- Administrative dashboard
- Authentication and authorization

The system must fully support **multi-tenancy**, with **tenantId stored in every table** and resolved on each request via middleware/interceptor.

## Tech Stack
### Backend
- Node.js
- NestJS (modular architecture)
- TypeScript
- TypeORM
- PostgreSQL
- JWT Authentication
- Class-validator / class-transformer

### Frontend
- Next.js (App Router)
- TypeScript
- React Query
- TailwindCSS + Shadcn UI
- Axios with tenant header

### Architecture
- Multi-tenant SaaS using shared database + tenantId column in all entities.
- Clean modules:
  - Core (auth, users, tenant)
  - Products
  - Stock
  - Finance
  - POS (sales)
  - Reports
- Controllers → Services → Repositories
- NestJS Interceptor to inject tenantId in all database operations.
- DTOs for validation.
- Each module in its own folder with entities / dto / controller / service.

## Important Rules for Copilot
1. Always include **tenantId** in entities, DTOs, queries, and services.
2. All queries must be tenant-filtered:
   ```ts
   where: { tenantId }
   ```
3. Avoid over-engineering: keep implementation clean and modular.
4. Generate TypeORM migrations when modifying entities.
5. Use dependency injection everywhere.
6. For the frontend:
   - Always include tenant header in Axios:
     ```ts
     { headers: { 'X-Tenant-ID': tenantId } }
     ```
   - Use React Query for every API call.
7. All modules must be standalone and clean.

Use these instructions as the global context for all generated code.
