Implement the full multi-tenant foundation.

Requirements:
1. Create `Tenant` entity:
   - id, name, createdAt
2. Update `User` entity:
   - id, tenantId, name, email, passwordHash, role
3. Create `TenantMiddleware`:
   - Read `X-Tenant-ID` header
   - Attach tenantId to request object
4. Create `TenantInterceptor`:
   - Inject tenantId into service layer context via request-scoped providers
5. Authentication:
   - JWT login, register, refresh token
   - AuthGuard + RolesGuard
6. Ensure every query in user service and tenant service is tenant-scoped:
   ```ts
   where: { tenantId: requestTenantId }
   ```
7. Generate TypeORM migrations for all entities.

Produce:
- Entities
- Controllers
- Services
- Guards
- Middleware
- Interceptor
- Migration files
