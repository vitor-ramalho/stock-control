Build the **Stock Page** at `/admin/stock`.

### Purpose
Show stock levels per product and allow manual stock in/out operations.

### Requirements
- Table columns:
  - Product
  - SKU
  - Current Stock
  - Last Update
  - Actions: "Stock In", "Stock Out"
- Fetch data from:
  `GET /api/products?includeStock=true`

### Stock In/Out Dialogs
Create two dialogs:

#### Stock In Dialog
- Fields:
  - quantity (number, required)
  - note (optional)
- POST `/api/stock/in`
Payload:
  - productId
  - quantity
  - note

#### Stock Out Dialog
- Same structure.
- POST `/api/stock/out`

### Features
- Validate stock out (cannot go below zero).
- After success → refresh table.
- Show toasts.

### Components to generate
- `StockTable`
- `StockMovementDialog`
- `StockInButton`
- `StockOutButton`

### Additional Rules
- Use React Query + optimistic update of stock count.
- Abstract all API calls into `/lib/api/stock.ts`.
- Use Zod for form validation.

Generate the full page and components.
