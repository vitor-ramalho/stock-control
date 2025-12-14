# POS (Point of Sale) Module

Complete implementation of the **POS Module** for sales management in the multi-tenant SaaS ERP system.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Database Schema](#database-schema)
- [Entity Structure](#entity-structure)
- [Service Methods](#service-methods)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)
- [Integrations](#integrations)
- [Multi-Tenant Considerations](#multi-tenant-considerations)
- [Testing](#testing)
- [Next Steps](#next-steps)

---

## Overview

The POS Module manages sales transactions with complete integration with inventory and financial systems:

- **Sales Management**: Create, track, and close sales
- **Item Management**: Add products to sales with automatic calculations
- **Stock Integration**: Automatic inventory deduction per item
- **Financial Integration**: Automatic revenue entry creation
- **Cash Register Validation**: Sales must belong to open registers
- **Complete Tenant Isolation**: All operations are tenant-scoped

---

## Features

✅ **Sale Entity** with status tracking (pending/closed/cancelled)  
✅ **SaleItem Entity** with product linking and calculations  
✅ **Automatic Stock Deduction** when adding items  
✅ **Automatic Financial Entry** when closing sales  
✅ **Cash Register Validation** (must be open)  
✅ **Automatic Total Calculation** from items  
✅ **Payment Method Tracking** (cash, cards, PIX)  
✅ **Complete Tenant Isolation** in all queries  
✅ **Role-Based Access Control** (ADMIN/MANAGER/CASHIER)  
✅ **Product Stock Validation** before adding to sale  

---

## Database Schema

### `sales` Table

| Column          | Type      | Constraints                    | Description                   |
|-----------------|-----------|--------------------------------|-------------------------------|
| id              | UUID      | PRIMARY KEY                    | Unique sale identifier        |
| tenantId        | UUID      | NOT NULL, FK                   | Reference to tenant           |
| cashRegisterId  | UUID      | NOT NULL, FK                   | Reference to cash register    |
| total           | DECIMAL   | DEFAULT 0 (10,2)               | Sale total amount             |
| paymentMethod   | ENUM      | NULLABLE                       | cash/credit/debit/pix         |
| status          | ENUM      | DEFAULT 'pending'              | pending/closed/cancelled      |
| createdAt       | TIMESTAMP | DEFAULT now()                  | Sale creation timestamp       |

**Foreign Keys:**
- `tenantId` → `tenants.id` (CASCADE)
- `cashRegisterId` → `cash_registers.id` (CASCADE)

**Indexes:**
- `IDX_SALES_TENANT` on `tenantId`
- `IDX_SALES_CASH_REGISTER` on `cashRegisterId`
- `IDX_SALES_STATUS` on `status`
- `IDX_SALES_CREATED_AT` on `createdAt`
- `IDX_SALES_TENANT_STATUS` on `(tenantId, status)`

---

### `sale_items` Table

| Column     | Type    | Constraints      | Description                 |
|------------|---------|------------------|-----------------------------|
| id         | UUID    | PRIMARY KEY      | Unique item identifier      |
| tenantId   | UUID    | NOT NULL, FK     | Reference to tenant         |
| saleId     | UUID    | NOT NULL, FK     | Reference to sale           |
| productId  | UUID    | NOT NULL, FK     | Reference to product        |
| quantity   | INT     | NOT NULL         | Quantity sold               |
| unitPrice  | DECIMAL | NOT NULL (10,2)  | Price per unit              |
| subtotal   | DECIMAL | NOT NULL (10,2)  | Item subtotal (qty * price) |

**Foreign Keys:**
- `tenantId` → `tenants.id` (CASCADE)
- `saleId` → `sales.id` (CASCADE)
- `productId` → `products.id` (CASCADE)

**Indexes:**
- `IDX_SALE_ITEMS_TENANT` on `tenantId`
- `IDX_SALE_ITEMS_SALE` on `saleId`
- `IDX_SALE_ITEMS_PRODUCT` on `productId`

---

## Entity Structure

### Sale Entity

```typescript
export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
}

export enum SaleStatus {
  PENDING = 'pending',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column('uuid')
  cashRegisterId: string;

  @ManyToOne(() => CashRegister, { onDelete: 'CASCADE' })
  cashRegister: CashRegister;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.PENDING })
  status: SaleStatus;

  @OneToMany(() => SaleItem, (saleItem) => saleItem.sale, { cascade: true })
  items: SaleItem[];

  @CreateDateColumn()
  createdAt: Date;
}
```

---

### SaleItem Entity

```typescript
@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column('uuid')
  saleId: string;

  @ManyToOne(() => Sale, (sale) => sale.items, { onDelete: 'CASCADE' })
  sale: Sale;

  @Column('uuid')
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  product: Product;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;
}
```

---

## Service Methods

### PosService

#### 1. `createSale(createSaleDto, tenantId)`

**Purpose**: Create a new sale

**Logic**:
- Validates cash register exists, belongs to tenant, and is OPEN
- Creates sale with `status = 'pending'`, `total = 0`

**Returns**: `Sale`

**Throws**:
- `BadRequestException` if cash register not found or closed

---

#### 2. `addItem(saleId, addSaleItemDto, tenantId)`

**Purpose**: Add item to sale

**Logic**:
1. Validates sale exists, belongs to tenant, and status is PENDING
2. Validates product exists, belongs to tenant, and is active
3. **Validates sufficient stock**
4. Calculates: `unitPrice = product.price`, `subtotal = unitPrice * quantity`
5. Creates sale item
6. **Automatically deducts stock** via `stockService.automaticOutput()`
7. **Recalculates sale total** from all items

**Returns**: `SaleItem` (with product relation)

**Throws**:
- `NotFoundException` if sale or product not found
- `BadRequestException` if product inactive or insufficient stock

**Integration**: Calls `StockService.automaticOutput()` to deduct inventory

---

#### 3. `closeSale(saleId, closeSaleDto, tenantId)`

**Purpose**: Close sale and create financial entry

**Logic**:
1. Validates sale exists, belongs to tenant, and status is PENDING
2. Validates sale has at least one item
3. Sets `status = 'closed'` and `paymentMethod`
4. **Automatically creates financial entry** via `financialEntryService.autoEntryForSale()`

**Returns**: `Sale`

**Throws**:
- `NotFoundException` if sale not found or already closed
- `BadRequestException` if sale has no items

**Integration**: Calls `FinancialEntryService.autoEntryForSale()` to record revenue

---

#### 4. `findOne(saleId, tenantId)`

**Purpose**: Get sale by ID with all details

**Logic**:
- Queries with relations: `items`, `items.product`, `cashRegister`

**Returns**: `Sale` (with nested data)

**Throws**:
- `NotFoundException` if sale not found

---

#### 5. `findAll(tenantId, limit, offset)`

**Purpose**: Get all sales for tenant (with pagination)

**Logic**:
- Queries with relations: `items`, `cashRegister`
- Orders by `createdAt DESC`
- Default limit: 100

**Returns**: `Sale[]`

---

## API Endpoints

### Base Path: `/api/pos`

All endpoints require **JWT authentication** and appropriate roles.

---

### 1. POST `/pos/sale` - Create Sale

**Roles**: `ADMIN`, `MANAGER`, `CASHIER`

**Request Body**:
```json
{
  "cashRegisterId": "uuid"
}
```

**Response**:
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "cashRegisterId": "uuid",
  "total": "0.00",
  "paymentMethod": null,
  "status": "pending",
  "createdAt": "2024-12-02T10:00:00Z"
}
```

**Error (Cash Register Closed)**:
```json
{
  "statusCode": 400,
  "message": "Cash register not found or is not open. Please open a cash register first.",
  "error": "Bad Request"
}
```

---

### 2. POST `/pos/sale/:id/items` - Add Item to Sale

**Roles**: `ADMIN`, `MANAGER`, `CASHIER`

**Request Body**:
```json
{
  "productId": "uuid",
  "quantity": 2
}
```

**Response**:
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "saleId": "uuid",
  "productId": "uuid",
  "quantity": 2,
  "unitPrice": "100.00",
  "subtotal": "200.00",
  "product": {
    "id": "uuid",
    "name": "Laptop Dell XPS 13",
    "sku": "LAPTOP-001",
    "price": "100.00"
  }
}
```

**Error (Insufficient Stock)**:
```json
{
  "statusCode": 400,
  "message": "Insufficient stock for \"Laptop Dell XPS 13\". Available: 1, Requested: 2",
  "error": "Bad Request"
}
```

**Side Effects**:
- Stock automatically deducted
- Sale total recalculated

---

### 3. POST `/pos/sale/:id/close` - Close Sale

**Roles**: `ADMIN`, `MANAGER`, `CASHIER`

**Request Body**:
```json
{
  "paymentMethod": "cash"
}
```

**Response**:
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "cashRegisterId": "uuid",
  "total": "200.00",
  "paymentMethod": "cash",
  "status": "closed",
  "createdAt": "2024-12-02T10:00:00Z"
}
```

**Side Effects**:
- Financial entry created with `type='in'`, `category='sales'`
- Sale status changed to 'closed'

---

### 4. GET `/pos/sale/:id` - Get Sale Details

**Roles**: All authenticated users

**Response**:
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "cashRegisterId": "uuid",
  "total": "200.00",
  "paymentMethod": "cash",
  "status": "closed",
  "createdAt": "2024-12-02T10:00:00Z",
  "items": [
    {
      "id": "uuid",
      "productId": "uuid",
      "quantity": 2,
      "unitPrice": "100.00",
      "subtotal": "200.00",
      "product": {
        "id": "uuid",
        "name": "Laptop Dell XPS 13",
        "sku": "LAPTOP-001"
      }
    }
  ],
  "cashRegister": {
    "id": "uuid",
    "userId": "uuid",
    "status": "open"
  }
}
```

---

### 5. GET `/pos/sales` - Get All Sales

**Roles**: `ADMIN`, `MANAGER`

**Query Parameters**:
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Skip N results (default: 0)

**Response**: Array of `Sale[]` with items and cash register relations

---

## Usage Examples

### Complete Sale Flow

#### Step 1: Open Cash Register

```bash
curl -X POST http://localhost:3000/api/cash/open \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-Tenant-ID: <tenant_uuid>" \
  -d '{"initialBalance": 100}'
```

**Response**: `{ "id": "cash-register-uuid", ... }`

---

#### Step 2: Create Sale

```bash
curl -X POST http://localhost:3000/api/pos/sale \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-Tenant-ID: <tenant_uuid>" \
  -d '{"cashRegisterId": "cash-register-uuid"}'
```

**Response**: `{ "id": "sale-uuid", "status": "pending", "total": "0.00" }`

---

#### Step 3: Add Items

```bash
# Add first item
curl -X POST http://localhost:3000/api/pos/sale/sale-uuid/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-Tenant-ID: <tenant_uuid>" \
  -d '{
    "productId": "product-uuid-1",
    "quantity": 2
  }'

# Add second item
curl -X POST http://localhost:3000/api/pos/sale/sale-uuid/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-Tenant-ID: <tenant_uuid>" \
  -d '{
    "productId": "product-uuid-2",
    "quantity": 1
  }'
```

**Side Effect**: Stock deducted automatically for each item

---

#### Step 4: Close Sale

```bash
curl -X POST http://localhost:3000/api/pos/sale/sale-uuid/close \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-Tenant-ID: <tenant_uuid>" \
  -d '{"paymentMethod": "cash"}'
```

**Side Effects**:
- Sale status → 'closed'
- Financial entry created (revenue)

---

#### Step 5: View Sale Details

```bash
curl http://localhost:3000/api/pos/sale/sale-uuid \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-Tenant-ID: <tenant_uuid>"
```

**Response**: Complete sale with all items and product details

---

## Integrations

### 1. Stock Module Integration

**Method Used**: `StockService.automaticOutput()`

**When**: Every time an item is added to a sale

**What It Does**:
- Validates sufficient stock
- Creates stock movement record (type='out', origin='pos')
- Decrements product quantity

**Code Location**: `pos.service.ts` → `addItem()` method

```typescript
await this.stockService.automaticOutput(
  productId,
  quantity,
  tenantId,
  'pos',
);
```

---

### 2. Financial Entry Module Integration

**Method Used**: `FinancialEntryService.autoEntryForSale()`

**When**: Sale is closed

**What It Does**:
- Creates financial entry (type='in', category='sales')
- Links entry to saleId and cashRegisterId
- Records revenue amount

**Code Location**: `pos.service.ts` → `closeSale()` method

```typescript
await this.financialEntryService.autoEntryForSale(
  saleId,
  Number(sale.total),
  sale.cashRegisterId,
  tenantId,
  `Sale #${saleId} - ${paymentMethod}`,
);
```

---

### 3. Cash Register Module Integration

**Validation**: Sale must belong to an open cash register

**Code Location**: `pos.service.ts` → `createSale()` method

```typescript
const cashRegister = await this.cashRegisterRepository.findOne({
  where: {
    id: cashRegisterId,
    tenantId,
    status: CashRegisterStatus.OPEN,
  },
});

if (!cashRegister) {
  throw new BadRequestException(
    'Cash register not found or is not open.',
  );
}
```

---

## Multi-Tenant Considerations

### ✅ Tenant Isolation Enforcement

Every method includes tenant filtering:

```typescript
// Example from createSale()
const cashRegister = await this.cashRegisterRepository.findOne({
  where: {
    id: cashRegisterId,
    tenantId,
    status: CashRegisterStatus.OPEN,
  },
});

// Example from addItem()
const sale = await this.saleRepository.findOne({
  where: { id: saleId, tenantId, status: SaleStatus.PENDING },
});

const product = await this.productRepository.findOne({
  where: { id: productId, tenantId },
});
```

### ✅ Tenant Header Required

All endpoints require `X-Tenant-ID` header via `TenantMiddleware`.

### ✅ Cross-Tenant Prevention

Users cannot:
- Create sales in other tenant's registers
- Add products from other tenants
- View other tenant's sales

---

## Testing

### Test Scenarios

#### Sale Creation

1. **Create Sale**
   - ✅ Create sale with open register
   - ✅ Verify status is 'pending'
   - ❌ Try to create with closed register (should fail)

#### Adding Items

2. **Add Item to Sale**
   - ✅ Add item with sufficient stock
   - ✅ Verify stock deducted
   - ✅ Verify sale total updated
   - ❌ Try to add with insufficient stock (should fail)
   - ❌ Try to add inactive product (should fail)
   - ❌ Try to add to closed sale (should fail)

#### Closing Sales

3. **Close Sale**
   - ✅ Close sale with items
   - ✅ Verify financial entry created
   - ✅ Verify status changed to 'closed'
   - ❌ Try to close without items (should fail)
   - ❌ Try to close already closed sale (should fail)

#### Tenant Isolation

4. **Multi-Tenant Tests**
   - ✅ Verify tenant can only see own sales
   - ❌ Try to add product from another tenant (should fail)
   - ❌ Try to view sale from another tenant (should fail)

---

## Next Steps

### 1. Run Migration

```bash
cd erp-backend
npm run migration:run
```

Verify `sales` and `sale_items` tables created.

---

### 2. Test Complete Sale Flow

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenant_uuid>" \
  -d '{"email":"admin@example.com","password":"admin123"}' | jq -r '.access_token')

# 2. Open register
REGISTER=$(curl -X POST http://localhost:3000/api/cash/open \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: <tenant_uuid>" \
  -d '{"initialBalance":100}' | jq -r '.id')

# 3. Create sale
SALE=$(curl -X POST http://localhost:3000/api/pos/sale \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: <tenant_uuid>" \
  -d "{\"cashRegisterId\":\"$REGISTER\"}" | jq -r '.id')

# 4. Add item (replace with actual product ID)
curl -X POST "http://localhost:3000/api/pos/sale/$SALE/items" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: <tenant_uuid>" \
  -d '{"productId":"<product_uuid>","quantity":1}'

# 5. Close sale
curl -X POST "http://localhost:3000/api/pos/sale/$SALE/close" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: <tenant_uuid>" \
  -d '{"paymentMethod":"cash"}'

# 6. View sale
curl "http://localhost:3000/api/pos/sale/$SALE" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: <tenant_uuid>"
```

---

### 3. Verify Integrations

#### Check Stock Deduction
```bash
curl "http://localhost:3000/api/stock/product/<product_uuid>" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: <tenant_uuid>"
```

Should show stock movement with `origin='pos'`

#### Check Financial Entry
```bash
curl "http://localhost:3000/api/finance/entries" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: <tenant_uuid>"
```

Should show entry with `category='sales'`

---

## Implementation Checklist

- ✅ Create `Sale` entity with status enum
- ✅ Create `SaleItem` entity with calculations
- ✅ Create DTOs for create/add/close operations
- ✅ Implement `PosService` with:
  - ✅ `createSale()` with cash register validation
  - ✅ `addItem()` with stock integration
  - ✅ `closeSale()` with financial entry integration
  - ✅ `findOne()` with full relations
  - ✅ `findAll()` with pagination
  - ✅ `recalculateSaleTotal()` helper
- ✅ Implement `PosController` with:
  - ✅ `POST /pos/sale` (ADMIN/MANAGER/CASHIER)
  - ✅ `POST /pos/sale/:id/items` (ADMIN/MANAGER/CASHIER)
  - ✅ `POST /pos/sale/:id/close` (ADMIN/MANAGER/CASHIER)
  - ✅ `GET /pos/sale/:id` (all authenticated)
  - ✅ `GET /pos/sales` (ADMIN/MANAGER)
- ✅ Create `PosModule` importing Stock and FinancialEntry modules
- ✅ Register in AppModule
- ✅ Generate migration with proper indexes
- ✅ All queries tenant-scoped
- ✅ Automatic stock deduction per item
- ✅ Automatic financial entry on close
- ✅ Cash register validation

---

## Summary

The **POS Module** provides complete sales management with automatic integrations:

- ✅ Create and manage sales with status tracking
- ✅ Add items with automatic calculations
- ✅ **Automatic stock deduction** via Stock Module
- ✅ **Automatic revenue recording** via Financial Entry Module
- ✅ Cash register validation (must be open)
- ✅ Payment method tracking
- ✅ Complete tenant isolation
- ✅ Role-based access control
- ✅ Product stock validation
- ✅ Sale total auto-calculation

**Ready for**: Production use with complete inventory and financial tracking.
