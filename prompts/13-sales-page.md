Build the **Sales Page** at `/admin/sales`.

### Requirements
- Fetch sales list:
  `GET /api/sales`
- Table columns:
  - ID
  - Customer (if any)
  - Total
  - Payment Method
  - Created At
  - Actions: "View Details"

### Sales Details Modal
Fetch from:
`GET /api/sales/:id`
Show:
- Items (product, quantity, price)
- Subtotal
- Discounts
- Taxes
- Final total
- Cash register link
- POS operator

### Components
- `SalesTable`
- `SaleDetailsDialog`
- `SaleItemsList`

### Technical Notes
- Infinite scroll or pagination.
- Date filters (today, week, month).
- Export sales list (CSV button).

Generate the full implementation.
