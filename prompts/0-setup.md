You are creating the foundation of a multi-tenant SaaS ERP built with NestJS and TypeORM.

Create:
1. A NestJS project called `erp-backend`
2. Configure TypeORM with PostgreSQL
3. Create environment variable files (.env, .env.example)
4. Add modules:
   - auth
   - users
   - tenant
5. Implement multi-tenant base structure:
   - tenantId column in user and tenant entities
   - Middleware to extract tenantId from header `X-Tenant-ID`
   - Interceptor to inject tenantId into request context
6. Implement JWT authentication
7. Create seed command to create the first tenant and admin user
8. Prepare TypeORM migration setup
9. Set project folder structure using clean modular organization

Deliver full working code with entities, DTOs, controllers, services, middleware, and interceptor.

Also generate basic scripts in package.json:
- start
- start:dev
- migration:generate
- migration:run
