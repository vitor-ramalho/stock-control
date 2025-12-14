# Cash Register & Financial Entry Modules

Complete implementation of **Cash Register** and **Financial Entry** modules for the multi-tenant SaaS ERP system.

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

The Cash Register and Financial Entry modules manage daily cash operations and financial tracking for the POS system:

- **Cash Register Management**: Open/close registers, track balances
- **Financial Entries**: Record all incoming and outgoing transactions
- **Automatic Entry Creation**: Integrate with POS for automatic transaction recording
- **Daily Reports**: Generate daily cash flow reports
- **Complete Tenant Isolation**: All operations are tenant-scoped
- **Role-Based Access**: ADMIN, MANAGER, and CASHIER roles supported

---

## Features

✅ **CashRegister Entity** with status tracking (open/closed)  
✅ **FinancialEntry Entity** with type (in/out) and category  
✅ **Open/Close Register Operations** with balance calculation  
✅ **Manual Financial Entries** for cash in/out  
✅ **Automatic Entry Creation** for POS sales  
✅ **Current Register Retrieval** for active sessions  
✅ **Daily Reports** with summaries  
✅ **Complete Tenant Isolation** in all queries  
✅ **Role-Based Access Control** (ADMIN/MANAGER/CASHIER)  
✅ **One Register Per User** validation  

---

## Database Schema

### `cash_registers` Table

| Column          | Type      | Constraints           | Description                    |
|-----------------|-----------|-----------------------|--------------------------------|
| id              | UUID      | PRIMARY KEY           | Unique register identifier     |
| tenantId        | UUID      | NOT NULL, FK          | Reference to tenant            |
| userId          | UUID      | NOT NULL, FK          | Reference to user              |
| openedAt        | TIMESTAMP | DEFAULT now()         | Register opening timestamp     |
| closedAt        | TIMESTAMP | NULLABLE              | Register closing timestamp     |
| initialBalance  | DECIMAL   | DEFAULT 0             | Starting balance (10,2)        |
| finalBalance    | DECIMAL   | NULLABLE              | Closing balance (10,2)         |
| status          | ENUM      | 'open' \| 'closed'    | Register status                |

**Foreign Keys:**
- `tenantId` → `tenants.id` (CASCADE)
- `userId` → `users.id` (CASCADE)

**Indexes:**
- `IDX_CASH_REGISTERS_TENANT` on `tenantId`
- `IDX_CASH_REGISTERS_USER` on `userId`
- `IDX_CASH_REGISTERS_STATUS` on `status`
- `IDX_CASH_REGISTERS_USER_TENANT_STATUS` on `(userId, tenantId, status)`

---

### `financial_entries` Table

| Column          | Type      | Constraints           | Description                        |
|-----------------|-----------|-----------------------|------------------------------------|
| id              | UUID      | PRIMARY KEY           | Unique entry identifier            |
| tenantId        | UUID      | NOT NULL, FK          | Reference to tenant                |
| cashRegisterId  | UUID      | NOT NULL, FK          | Reference to cash register         |
| saleId          | UUID      | NULLABLE              | Optional reference to sale         |
| type            | ENUM      | 'in' \| 'out'         | Entry type                         |
| value           | DECIMAL   | NOT NULL              | Entry amount (10,2)                |
| description     | TEXT      | NULLABLE              | Entry description                  |
| category        | VARCHAR   | NULLABLE              | Entry category (sales, expense...) |
| createdAt       | TIMESTAMP | DEFAULT now()         | Entry timestamp                    |

**Foreign Keys:**
- `tenantId` → `tenants.id` (CASCADE)
- `cashRegisterId` → `cash_registers.id` (CASCADE)

**Indexes:**
- `IDX_FINANCIAL_ENTRIES_TENANT` on `tenantId`
- `IDX_FINANCIAL_ENTRIES_CASH_REGISTER` on `cashRegisterId`
- `IDX_FINANCIAL_ENTRIES_SALE` on `saleId`
- `IDX_FINANCIAL_ENTRIES_TYPE` on `type`
- `IDX_FINANCIAL_ENTRIES_CATEGORY` on `category`
- `IDX_FINANCIAL_ENTRIES_CREATED_AT` on `createdAt`

---

## Entity Structure

### CashRegister Entity

```typescript
export enum CashRegisterStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

@Entity('cash_registers')
export class CashRegister {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  openedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  initialBalance: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  finalBalance: number;

  @Column({ type: 'enum', enum: CashRegisterStatus, default: CashRegisterStatus.OPEN })
  status: CashRegisterStatus;
}
```

---

### FinancialEntry Entity

```typescript
export enum EntryType {
  IN = 'in',
  OUT = 'out',
}

@Entity('financial_entries')
export class FinancialEntry {
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

  @Column('uuid', { nullable: true })
  saleId: string;

  @Column({ type: 'enum', enum: EntryType })
  type: EntryType;

  @Column('decimal', { precision: 10, scale: 2 })
  value: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

## Service Methods

### CashRegisterService

#### 1. `openRegister(openCashRegisterDto, userId, tenantId)`

**Purpose**: Open a new cash register for a user

**Logic**:
- Validates no other open register exists for user
- Creates register with `status = 'open'`
- Sets initial balance (default: 0)

**Returns**: `CashRegister`

**Throws**:
- `BadRequestException` if user already has open register

---

#### 2. `closeRegister(closeCashRegisterDto, userId, tenantId)`

**Purpose**: Close the current open register

**Logic**:
- Finds user's open register
- Calculates balance from entries (totalIn - totalOut)
- Sets `status = 'closed'`, `closedAt = now()`
- Uses provided finalBalance or calculated balance

**Returns**: `CashRegister`

**Throws**:
- `NotFoundException` if no open register found

---

#### 3. `getCurrentRegister(userId, tenantId)`

**Purpose**: Get the current open register for a user

**Returns**: `CashRegister | null`

---

#### 4. `getDailyReport(date, tenantId)`

**Purpose**: Generate daily report for all registers opened on a specific date

**Logic**:
- Finds all registers opened between startOfDay and endOfDay
- Retrieves all associated financial entries
- Calculates totals: totalIn, totalOut, netBalance

**Returns**: 
```typescript
{
  date: string,
  registers: CashRegister[],
  entries: FinancialEntry[],
  summary: {
    totalRegisters: number,
    totalInitialBalance: number,
    totalFinalBalance: number,
    totalIn: number,
    totalOut: number,
    netBalance: number,
  }
}
```

---

### FinancialEntryService

#### 1. `createEntry(createFinancialEntryDto, userId, tenantId)`

**Purpose**: Create a manual financial entry

**Logic**:
- Finds user's open cash register
- Creates entry linked to that register
- Validates register is open

**Returns**: `FinancialEntry`

**Throws**:
- `BadRequestException` if no open register found

---

#### 2. `autoEntryForSale(saleId, value, cashRegisterId, tenantId, description?)`

**Purpose**: Automatically create entry when a sale happens (POS integration)

**Logic**:
- Validates cash register exists and is open
- Creates entry with `type = 'in'`, `category = 'sales'`
- Links to saleId

**Returns**: `FinancialEntry`

**Throws**:
- `BadRequestException` if register not found or closed

**Usage**: Called by Sales/POS module during checkout

---

#### 3. `getEntriesByRegister(cashRegisterId, tenantId)`

**Purpose**: Get all entries for a specific register

**Returns**: `FinancialEntry[]`

**Throws**:
- `NotFoundException` if register not found

---

#### 4. `findAll(tenantId, limit, offset)`

**Purpose**: Get all entries for tenant (with pagination)

**Returns**: `FinancialEntry[]`

---

#### 5. `getEntriesByType(type, tenantId, limit)`

**Purpose**: Filter entries by type (IN or OUT)

**Returns**: `FinancialEntry[]`

---

#### 6. `getEntriesByCategory(category, tenantId, limit)`

**Purpose**: Filter entries by category

**Returns**: `FinancialEntry[]`

---

## API Endpoints

### Cash Register Endpoints

Base Path: `/api/cash`

All endpoints require **JWT authentication** and appropriate roles.

---

#### 1. POST `/cash/open` - Open Cash Register

**Roles**: `ADMIN`, `MANAGER`, `CASHIER`

**Request Body**:
```json
{
  "initialBalance": 100.00  // optional, default: 0
}
```

**Response**:
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "userId": "uuid",
  "openedAt": "2024-12-02T08:00:00Z",
  "closedAt": null,
  "initialBalance": "100.00",
  "finalBalance": null,
  "status": "open"
}
```

**Error (Already Open)**:
```json
{
  "statusCode": 400,
  "message": "You already have an open cash register. Please close it before opening a new one.",
  "error": "Bad Request"
}
```

---

#### 2. POST `/cash/close` - Close Cash Register

**Roles**: `ADMIN`, `MANAGER`, `CASHIER`

**Request Body**:
```json
{
  "finalBalance": 500.00  // optional, uses calculated if not provided
}
```

**Response**:
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "userId": "uuid",
  "openedAt": "2024-12-02T08:00:00Z",
  "closedAt": "2024-12-02T18:00:00Z",
  "initialBalance": "100.00",
  "finalBalance": "500.00",
  "status": "closed"
}
```

---

#### 3. GET `/cash/current` - Get Current Register

**Roles**: All authenticated users

**Response**:
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "userId": "uuid",
  "openedAt": "2024-12-02T08:00:00Z",
  "closedAt": null,
  "initialBalance": "100.00",
  "finalBalance": null,
  "status": "open",
  "user": {
    "id": "uuid",
    "email": "cashier@example.com",
    "name": "John Doe"
  }
}
```

---

#### 4. GET `/cash/report/daily` - Daily Report

**Roles**: `ADMIN`, `MANAGER`

**Query Parameters**:
- `date` (optional): Date in YYYY-MM-DD format (default: today)

**Request**:
```
GET /api/cash/report/daily?date=2024-12-02
```

**Response**:
```json
{
  "date": "2024-12-02",
  "registers": [
    {
      "id": "uuid",
      "userId": "uuid",
      "openedAt": "2024-12-02T08:00:00Z",
      "closedAt": "2024-12-02T18:00:00Z",
      "initialBalance": "100.00",
      "finalBalance": "500.00",
      "status": "closed",
      "user": { "email": "cashier1@example.com" }
    }
  ],
  "entries": [
    {
      "id": "uuid",
      "type": "in",
      "value": "50.00",
      "category": "sales",
      "createdAt": "2024-12-02T09:00:00Z"
    }
  ],
  "summary": {
    "totalRegisters": 1,
    "totalInitialBalance": 100.00,
    "totalFinalBalance": 500.00,
    "totalIn": 450.00,
    "totalOut": 50.00,
    "netBalance": 400.00
  }
}
```

---

### Financial Entry Endpoints

Base Path: `/api/finance`

---

#### 1. POST `/finance/entry` - Create Manual Entry

**Roles**: `ADMIN`, `MANAGER`, `CASHIER`

**Request Body**:
```json
{
  "type": "out",
  "value": 20.00,
  "description": "Office supplies purchase",
  "category": "expense"  // optional
}
```

**Response**:
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "cashRegisterId": "uuid",
  "saleId": null,
  "type": "out",
  "value": "20.00",
  "description": "Office supplies purchase",
  "category": "expense",
  "createdAt": "2024-12-02T10:30:00Z"
}
```

**Error (No Open Register)**:
```json
{
  "statusCode": 400,
  "message": "No open cash register found. Please open a cash register first.",
  "error": "Bad Request"
}
```

---

#### 2. GET `/finance/entries` - Get All Entries

**Roles**: `ADMIN`, `MANAGER`

**Query Parameters**:
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Skip N results (default: 0)

**Response**:
```json
[
  {
    "id": "uuid",
    "tenantId": "uuid",
    "cashRegisterId": "uuid",
    "type": "in",
    "value": "50.00",
    "category": "sales",
    "createdAt": "2024-12-02T09:00:00Z",
    "cashRegister": {
      "id": "uuid",
      "userId": "uuid"
    }
  }
]
```

---

#### 3. GET `/finance/entries/register/:id` - Get Register Entries

**Roles**: `ADMIN`, `MANAGER`

**Response**: Array of `FinancialEntry[]`

---

#### 4. GET `/finance/entries/type/:type` - Filter by Type

**Roles**: `ADMIN`, `MANAGER`

**Request**:
```
GET /api/finance/entries/type/in?limit=50
```

**Response**: Array of entries with `type = 'in'`

---

#### 5. GET `/finance/entries/category/:category` - Filter by Category

**Roles**: `ADMIN`, `MANAGER`

**Request**:
```
GET /api/finance/entries/category/sales?limit=50
```

**Response**: Array of entries with matching category

---

## Usage Examples

### Example 1: Open Cash Register

```bash
curl -X POST http://localhost:3000/api/cash/open \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-Tenant-ID: <tenant_uuid>" \
  -d '{
    "initialBalance": 100
  }'
```

---

### Example 2: Create Manual Entry (Cash Out)

```bash
curl -X POST http://localhost:3000/api/finance/entry \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-Tenant-ID: <tenant_uuid>" \
  -d '{
    "type": "out",
    "value": 25.50,
    "description": "Petty cash - office supplies",
    "category": "expense"
  }'
```

---

### Example 3: Check Current Register

```bash
curl http://localhost:3000/api/cash/current \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-Tenant-ID: <tenant_uuid>"
```

---

### Example 4: Close Register

```bash
curl -X POST http://localhost:3000/api/cash/close \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-Tenant-ID: <tenant_uuid>" \
  -d '{
    "finalBalance": 524.50
  }'
```

---

### Example 5: Get Daily Report

```bash
curl "http://localhost:3000/api/cash/report/daily?date=2024-12-02" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-Tenant-ID: <tenant_uuid>"
```

---

### Example 6: POS Integration (Auto-Entry)

**From Sales/POS Service**:

```typescript
// In SalesService
constructor(
  private financialEntryService: FinancialEntryService,
) {}

async completeSale(saleId: string, totalAmount: number, cashRegisterId: string, tenantId: string) {
  // Create automatic financial entry for sale
  await this.financialEntryService.autoEntryForSale(
    saleId,
    totalAmount,
    cashRegisterId,
    tenantId,
    `Sale #${saleId}`,
  );
  
  // Mark sale as completed...
}
```

**Result**: Automatic entry created with `type='in'`, `category='sales'`

---

## Multi-Tenant Considerations

### ✅ Tenant Isolation Enforcement

Every method includes tenant filtering:

```typescript
// Example from openRegister()
const existingOpenRegister = await this.cashRegisterRepository.findOne({
  where: {
    userId,
    tenantId,
    status: CashRegisterStatus.OPEN,
  },
});

// Example from getEntriesByRegister()
const cashRegister = await this.cashRegisterRepository.findOne({
  where: { id: cashRegisterId, tenantId },
});
```

### ✅ Tenant Header Required

All endpoints require `X-Tenant-ID` header via `TenantMiddleware`.

### ✅ Cross-Tenant Prevention

Users cannot:
- Open/close registers from other tenants
- Create entries in other tenant's registers
- View other tenant's financial data

---

## Integration with Other Modules

### 1. **Users Module**

Cash Register Module depends on Users Module:
- Each register is owned by a specific user
- User authentication determines register ownership

### 2. **Sales/POS Module** (Future)

Sales Module will use Financial Entry Module:
- Call `autoEntryForSale()` during checkout
- Link sale to cashRegisterId
- Automatically record revenue as `type='in'`

### 3. **Reports Module** (Future)

Reports can use Cash Register & Financial Entry data:
- Daily cash flow reports
- Revenue analytics
- Expense tracking
- Cashier performance

---

## Testing

### Test Scenarios

#### Cash Register Tests

1. **Open Register**
   - ✅ Open register with initial balance
   - ✅ Verify status is 'open'
   - ❌ Try to open second register (should fail)

2. **Close Register**
   - ✅ Close register with calculated balance
   - ✅ Close register with manual final balance
   - ✅ Verify status is 'closed'
   - ❌ Try to close when no open register (should fail)

3. **Get Current Register**
   - ✅ Get current open register
   - ✅ Return null when no register open

4. **Daily Report**
   - ✅ Generate report for specific date
   - ✅ Verify summary calculations
   - ✅ Only tenant's data included

#### Financial Entry Tests

1. **Create Manual Entry**
   - ✅ Create entry with open register
   - ✅ Verify entry recorded
   - ❌ Try to create without open register (should fail)

2. **Auto-Entry for Sale**
   - ✅ Create entry linked to sale
   - ✅ Verify type='in' and category='sales'
   - ❌ Try with closed register (should fail)

3. **Filter Entries**
   - ✅ Get entries by register
   - ✅ Get entries by type (IN/OUT)
   - ✅ Get entries by category
   - ✅ Verify tenant isolation

---

## Next Steps

### 1. Run Migration

```bash
cd erp-backend
npm run migration:run
```

Verify `cash_registers` and `financial_entries` tables created.

---

### 2. Test Endpoints

#### Open Register
```bash
# Login first
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenant_uuid>" \
  -d '{"email":"admin@example.com","password":"admin123"}' | jq -r '.access_token')

# Open register
curl -X POST http://localhost:3000/api/cash/open \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: <tenant_uuid>" \
  -d '{"initialBalance": 100}'
```

#### Create Entry
```bash
curl -X POST http://localhost:3000/api/finance/entry \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: <tenant_uuid>" \
  -d '{
    "type": "in",
    "value": 50,
    "description": "Cash sale",
    "category": "sales"
  }'
```

#### Close Register
```bash
curl -X POST http://localhost:3000/api/cash/close \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: <tenant_uuid>" \
  -d '{}'
```

#### Daily Report
```bash
curl "http://localhost:3000/api/cash/report/daily" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: <tenant_uuid>"
```

---

### 3. Implement Sales/POS Module

Next module should integrate with Cash Register & Financial Entry:
- Use `autoEntryForSale()` during checkout
- Track which cashRegisterId processed the sale
- Automatically create financial entries for revenue

Reference: `prompts/5-sales-module.md`

---

## Implementation Checklist

- ✅ Create `CashRegister` entity with status enum
- ✅ Create `FinancialEntry` entity with type enum
- ✅ Create DTOs for open/close/entry operations
- ✅ Implement `CashRegisterService` with:
  - ✅ `openRegister()` method
  - ✅ `closeRegister()` method
  - ✅ `getCurrentRegister()` method
  - ✅ `getDailyReport()` method
- ✅ Implement `FinancialEntryService` with:
  - ✅ `createEntry()` method
  - ✅ `autoEntryForSale()` method
  - ✅ `getEntriesByRegister()` method
  - ✅ `findAll()` method
  - ✅ `getEntriesByType()` method
  - ✅ `getEntriesByCategory()` method
- ✅ Implement `CashRegisterController` with:
  - ✅ `POST /cash/open` (ADMIN/MANAGER/CASHIER)
  - ✅ `POST /cash/close` (ADMIN/MANAGER/CASHIER)
  - ✅ `GET /cash/current` (all authenticated)
  - ✅ `GET /cash/report/daily` (ADMIN/MANAGER)
- ✅ Implement `FinancialEntryController` with:
  - ✅ `POST /finance/entry` (ADMIN/MANAGER/CASHIER)
  - ✅ `GET /finance/entries` (ADMIN/MANAGER)
  - ✅ Additional filter endpoints
- ✅ Create modules and register in AppModule
- ✅ Generate migration with proper indexes
- ✅ All queries tenant-scoped
- ✅ One register per user validation
- ✅ Balance calculation from entries
- ✅ Export services for POS integration

---

## Summary

The **Cash Register & Financial Entry** modules provide complete cash management:

- ✅ Open/close register operations
- ✅ Initial and final balance tracking
- ✅ Manual financial entry creation
- ✅ Automatic entry for POS sales
- ✅ Current register status
- ✅ Daily reports with summaries
- ✅ Filter by type and category
- ✅ Strict tenant isolation
- ✅ Role-based access control
- ✅ One register per user validation

**Ready for**: Sales/POS module integration and financial reporting.
