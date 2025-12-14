Implement Inventory/Stock Module.

Requirements:
1. Create `StockMovement` entity:
   - id, tenantId, productId, type ('in' | 'out'), quantity, origin, createdAt
2. Create StockService:
   - Method: manual input (type = 'in')
   - Method: manual output (type = 'out')
   - Method: automaticOutput for sale (type='out', origin='pos')
3. On update:
   - Update product quantity
   - Record stock movement

Endpoints:
- POST /stock/in
- POST /stock/out
- GET /stock/product/:id

Ensure tenant filtering in every query.
