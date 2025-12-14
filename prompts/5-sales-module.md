Implement POS module using NestJS and TypeORM.

Entities:
1. Sale:
   - id, tenantId, cashRegisterId, total, paymentMethod, createdAt
2. SaleItem:
   - id, tenantId, saleId, productId, quantity, unitPrice, subtotal

Service behavior:
- Create sale
- Add items
- Subtotal calculation
- Deduct stock automatically
- Register financial entry automatically

Endpoints:
- POST /pos/sale
- POST /pos/sale/:id/items
- POST /pos/sale/:id/close
- GET /pos/sale/:id

Add validations:
- A sale must belong to an open cash register
- Deduct stock per item
