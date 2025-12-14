Implement the full Products Module using NestJS + TypeORM.

Requirements:
1. Create `Category` entity:
   - id, tenantId, name
2. Create `Product` entity:
   - id, tenantId, name, sku, price, cost, quantity, categoryId
3. Create DTOs for create/update
4. Create CRUD controller for both Category and Product
5. ProductService must:
   - Enforce tenant isolation
   - Ensure SKU uniqueness per tenant
   - Provide search endpoint for POS
6. Create endpoints:
   - GET /products
   - POST /products
   - PUT /products/:id
   - DELETE /products/:id
   - GET /products/search?q=
7. Generate migrations.

Make the module fully tenant-isolated.
