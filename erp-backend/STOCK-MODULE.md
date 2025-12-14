# Stock/Inventory Module

Complete implementation of the **Stock Module** for inventory management in the multi-tenant SaaS ERP system.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Database Schema](#database-schema)
- [Entity Structure](#entity-structure)
- [Service Methods](#service-methods)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)
- [Multi-Tenant Considerations](#multi-tenant-considerations)
- [Integration with Other Modules](#integration-with-other-modules)
- [Testing](#testing)
- [Next Steps](#next-steps)

---

## Overview

The Stock Module manages inventory movements for products in the system. It provides:

- **Manual Stock Input**: Add inventory to products
- **Manual Stock Output**: Remove inventory from products
- **Automatic Output**: Integrate with POS/Sales for automatic inventory deduction
- **Movement History**: Track all inventory changes with timestamps and origins
- **Product Quantity Updates**: Automatically update product quantities on each movement
- **Tenant Isolation**: Complete multi-tenant support with tenant-scoped queries

---

## Features

✅ **StockMovement Entity** with tenant relationship  
✅ **Stock Input/Output Operations** with quantity validation  
✅ **Automatic Product Quantity Updates**  
✅ **Movement History Tracking** per product  
✅ **POS Integration Ready** via `automaticOutput()` method  
✅ **Role-Based Access Control** (ADMIN/MANAGER for manual operations)  
✅ **Complete Tenant Isolation** in all queries  
✅ **Insufficient Stock Prevention** with validation  
✅ **Origin Tracking** (manual, pos, etc.)  

---

## Database Schema

### `stock_movements` Table

| Column      | Type      | Constraints           | Description                        |
|-------------|-----------|-----------------------|------------------------------------|
| id          | UUID      | PRIMARY KEY           | Unique movement identifier         |
| tenantId    | UUID      | NOT NULL, FK          | Reference to tenant                |
| productId   | UUID      | NOT NULL, FK          | Reference to product               |
| type        | ENUM      | 'in' \| 'out'         | Movement type                      |
| quantity    | INT       | NOT NULL              | Quantity moved                     |
| origin      | VARCHAR   | NULLABLE              | Origin of movement (manual, pos)   |
| createdAt   | TIMESTAMP | DEFAULT now()         | Movement timestamp                 |

**Foreign Keys:**
- `tenantId` → `tenants.id` (CASCADE)
- `productId` → `products.id` (CASCADE)

**Indexes:**
- `IDX_STOCK_MOVEMENTS_TENANT` on `tenantId`
- `IDX_STOCK_MOVEMENTS_PRODUCT` on `productId`
- `IDX_STOCK_MOVEMENTS_TENANT_PRODUCT` on `(tenantId, productId)`
- `IDX_STOCK_MOVEMENTS_CREATED_AT` on `createdAt`

---

## Entity Structure

### StockMovement Entity

```typescript
@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column('uuid')
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  product: Product;

  @Column({ type: 'enum', enum: MovementType })
  type: MovementType; // 'in' | 'out'

  @Column('int')
  quantity: number;

  @Column({ nullable: true })
  origin: string; // 'manual', 'pos', etc.

  @CreateDateColumn()
  createdAt: Date;
}

export enum MovementType {
  IN = 'in',
  OUT = 'out',
}
```

---

## Service Methods

### StockService

All methods enforce **tenant isolation** and **product ownership validation**.

#### 1. `stockIn(createStockInDto, tenantId)`

**Purpose**: Manual stock input (increases product quantity)

**Logic**:
- Validates product exists and belongs to tenant
- Creates stock movement with `type = 'in'`
- Increments product quantity
- Default origin: `'manual'`

**Returns**: `StockMovement`

**Throws**:
- `NotFoundException` if product not found in tenant

---

#### 2. `stockOut(createStockOutDto, tenantId)`

**Purpose**: Manual stock output (decreases product quantity)

**Logic**:
- Validates product exists and belongs to tenant
- **Checks sufficient stock** before allowing operation
- Creates stock movement with `type = 'out'`
- Decrements product quantity
- Default origin: `'manual'`

**Returns**: `StockMovement`

**Throws**:
- `NotFoundException` if product not found in tenant
- `BadRequestException` if insufficient stock

---

#### 3. `automaticOutput(productId, quantity, tenantId, origin)`

**Purpose**: Automatic stock output for POS/Sales integration

**Logic**:
- Validates product exists and belongs to tenant
- **Checks sufficient stock** before allowing operation
- Creates stock movement with `type = 'out'`
- Decrements product quantity
- Default origin: `'pos'`

**Returns**: `StockMovement`

**Throws**:
- `NotFoundException` if product not found in tenant
- `BadRequestException` if insufficient stock (with product name)

**Usage**: Called by Sales/POS module during checkout

---

#### 4. `getProductMovements(productId, tenantId)`

**Purpose**: Get all stock movements for a specific product

**Logic**:
- Validates product exists and belongs to tenant
- Queries: `where: { productId, tenantId }`
- Orders by `createdAt DESC` (most recent first)
- Includes product relation

**Returns**: `StockMovement[]`

**Throws**:
- `NotFoundException` if product not found in tenant

---

#### 5. `findAll(tenantId, limit, offset)`

**Purpose**: Get all stock movements for the tenant (with pagination)

**Logic**:
- Queries: `where: { tenantId }`
- Orders by `createdAt DESC`
- Includes product relation
- Default limit: 100

**Returns**: `StockMovement[]`

---

## API Endpoints

### Base Path: `/api/stock`

All endpoints require **JWT authentication** (`@UseGuards(JwtAuthGuard, RolesGuard)`).

---

### 1. POST `/stock/in` - Manual Stock Input

**Roles**: `ADMIN`, `MANAGER`

**Request Body**:
```json
{
  "productId": "uuid",
  "quantity": 50,
  "origin": "purchase" // optional
}
```

**Response**:
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "productId": "uuid",
  "type": "in",
  "quantity": 50,
  "origin": "purchase",
  "createdAt": "2024-12-02T10:30:00Z"
}
```

---

### 2. POST `/stock/out` - Manual Stock Output

**Roles**: `ADMIN`, `MANAGER`

**Request Body**:
```json
{
  "productId": "uuid",
  "quantity": 10,
  "origin": "damage" // optional
}
```

**Response**:
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "productId": "uuid",
  "type": "out",
  "quantity": 10,
  "origin": "damage",
  "createdAt": "2024-12-02T11:00:00Z"
}
```

**Error (Insufficient Stock)**:
```json
{
  "statusCode": 400,
  "message": "Insufficient stock. Available: 5, Requested: 10",
  "error": "Bad Request"
}
```

---

### 3. GET `/stock/product/:id` - Get Product Movements

**Roles**: All authenticated users

**Request**:
```
GET /api/stock/product/550e8400-e29b-41d4-a716-446655440000
Headers:
  Authorization: Bearer <jwt_token>
  X-Tenant-ID: <tenant_uuid>
```

**Response**:
```json
[
  {
    "id": "uuid",
    "tenantId": "uuid",
    "productId": "550e8400-e29b-41d4-a716-446655440000",
    "type": "in",
    "quantity": 100,
    "origin": "purchase",
    "createdAt": "2024-12-01T10:00:00Z",
    "product": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Laptop Dell XPS 13",
      "sku": "LAPTOP-001",
      "quantity": 95
    }
  },
  {
    "id": "uuid",
    "tenantId": "uuid",
    "productId": "550e8400-e29b-41d4-a716-446655440000",
    "type": "out",
    "quantity": 5,
    "origin": "pos",
    "createdAt": "2024-12-02T09:30:00Z",
    "product": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Laptop Dell XPS 13",
      "sku": "LAPTOP-001",
      "quantity": 95
    }
  }
]
```

---

### 4. GET `/stock` - Get All Movements

**Roles**: All authenticated users

**Query Parameters**:
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Skip N results (default: 0)

**Request**:
```
GET /api/stock?limit=50&offset=0
Headers:
  Authorization: Bearer <jwt_token>
  X-Tenant-ID: <tenant_uuid>
```

**Response**:
```json
[
  {
    "id": "uuid",
    "tenantId": "uuid",
    "productId": "uuid",
    "type": "in",
    "quantity": 100,
    "origin": "purchase",
    "createdAt": "2024-12-02T10:00:00Z",
    "product": {
      "id": "uuid",
      "name": "Product A",
      "sku": "SKU-001"
    }
  },
  // ... more movements
]
```

---

## Usage Examples

### Example 1: Manual Stock Input

```bash
curl -X POST http://localhost:3000/api/stock/in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-Tenant-ID: <tenant_uuid>" \
  -d '{
    "productId": "550e8400-e29b-41d4-a716-446655440000",
    "quantity": 50,
    "origin": "supplier-delivery"
  }'
```

**Result**: Product quantity increased by 50

---

### Example 2: Manual Stock Output

```bash
curl -X POST http://localhost:3000/api/stock/out \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-Tenant-ID: <tenant_uuid>" \
  -d '{
    "productId": "550e8400-e29b-41d4-a716-446655440000",
    "quantity": 5,
    "origin": "damaged-goods"
  }'
```

**Result**: Product quantity decreased by 5

---

### Example 3: View Product Stock History

```bash
curl http://localhost:3000/api/stock/product/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-Tenant-ID: <tenant_uuid>"
```

**Result**: Array of all movements for the product

---

### Example 4: POS Integration (Automatic Output)

**From Sales/POS Service**:

```typescript
// In SalesService
constructor(
  private stockService: StockService,
) {}

async createSale(items: SaleItem[], tenantId: string) {
  for (const item of items) {
    // Automatic stock output
    await this.stockService.automaticOutput(
      item.productId,
      item.quantity,
      tenantId,
      'pos',
    );
  }
  
  // Create sale record...
}
```

**Result**: Each sold item automatically deducts inventory

---

## Multi-Tenant Considerations

### ✅ Tenant Isolation Enforcement

Every method includes tenant filtering:

```typescript
// Example from stockIn()
const product = await this.productRepository.findOne({
  where: { id: productId, tenantId },
});

// Example from getProductMovements()
return this.stockMovementRepository.find({
  where: { productId, tenantId },
  order: { createdAt: 'DESC' },
});
```

### ✅ Tenant Header Required

All endpoints require `X-Tenant-ID` header via `TenantMiddleware`.

### ✅ Cross-Tenant Prevention

Users cannot:
- Add stock to products from other tenants
- View movements from other tenants
- Perform any operation outside their tenant boundary

---

## Integration with Other Modules

### 1. **Products Module**

Stock Module depends on the Products Module:
- Imports `Product` entity
- Validates product existence before operations
- Updates product quantity on each movement

### 2. **Sales/POS Module** (Future)

Sales Module will use Stock Module:
- Call `automaticOutput()` during checkout
- Validate stock availability before completing sale
- Track origin as `'pos'`

### 3. **Reports Module** (Future)

Reports can use Stock Module:
- Inventory turnover reports
- Stock movement analytics
- Low stock alerts

---

## Testing

### Test Scenarios

#### 1. Stock Input
- ✅ Create stock input for valid product
- ✅ Verify product quantity increased
- ✅ Verify movement recorded with type='in'
- ❌ Try to add stock to product from another tenant (should fail)

#### 2. Stock Output
- ✅ Create stock output for product with sufficient stock
- ✅ Verify product quantity decreased
- ✅ Verify movement recorded with type='out'
- ❌ Try to output more than available (should fail with 400)
- ❌ Try to output stock from another tenant's product (should fail)

#### 3. Automatic Output (POS Integration)
- ✅ Call automaticOutput() with valid product
- ✅ Verify product quantity decreased
- ✅ Verify origin='pos'
- ❌ Try to output insufficient stock (should fail with product name)

#### 4. Movement History
- ✅ Get movements for specific product
- ✅ Verify ordered by createdAt DESC
- ✅ Verify only tenant's movements returned
- ❌ Try to get movements for product from another tenant (should fail)

---

## Next Steps

### 1. Run Migration

```bash
cd erp-backend
npm run migration:run
```

Verify `stock_movements` table created with proper indexes.

---

### 2. Test Endpoints

#### Step 1: Create a product (if not already)
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-Tenant-ID: <tenant_uuid>" \
  -d '{
    "name": "Test Product",
    "sku": "TEST-001",
    "price": 100,
    "cost": 50,
    "quantity": 0
  }'
```

#### Step 2: Add stock
```bash
curl -X POST http://localhost:3000/api/stock/in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-Tenant-ID: <tenant_uuid>" \
  -d '{
    "productId": "<product_uuid_from_step1>",
    "quantity": 100
  }'
```

#### Step 3: Remove stock
```bash
curl -X POST http://localhost:3000/api/stock/out \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-Tenant-ID: <tenant_uuid>" \
  -d '{
    "productId": "<product_uuid>",
    "quantity": 10
  }'
```

#### Step 4: View movements
```bash
curl http://localhost:3000/api/stock/product/<product_uuid> \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-Tenant-ID: <tenant_uuid>"
```

---

### 3. Implement Sales/POS Module

Next module should integrate with Stock Module:
- Use `automaticOutput()` during sales
- Validate stock before completing transactions
- Track all inventory deductions automatically

Reference: `prompts/5-sales-module.md`

---

## Implementation Checklist

- ✅ Create `StockMovement` entity with tenant relation
- ✅ Create `CreateStockInDto` and `CreateStockOutDto`
- ✅ Implement `StockService` with:
  - ✅ `stockIn()` method
  - ✅ `stockOut()` method
  - ✅ `automaticOutput()` method
  - ✅ `getProductMovements()` method
  - ✅ `findAll()` method with pagination
- ✅ Implement `StockController` with:
  - ✅ `POST /stock/in` (ADMIN/MANAGER only)
  - ✅ `POST /stock/out` (ADMIN/MANAGER only)
  - ✅ `GET /stock/product/:id` (all authenticated)
  - ✅ `GET /stock` (all authenticated)
- ✅ Create `StockModule` and register in `AppModule`
- ✅ Generate migration with proper indexes
- ✅ All queries tenant-scoped
- ✅ Product quantity updates on movements
- ✅ Insufficient stock validation
- ✅ Export `StockService` for POS integration

---

## Summary

The **Stock Module** provides complete inventory management with:

- ✅ Manual stock input/output operations
- ✅ Automatic POS integration support
- ✅ Product quantity synchronization
- ✅ Complete movement history tracking
- ✅ Strict tenant isolation
- ✅ Role-based access control
- ✅ Stock validation (insufficient stock prevention)
- ✅ Origin tracking for audit trails

**Ready for**: Sales/POS module integration and inventory reporting.

