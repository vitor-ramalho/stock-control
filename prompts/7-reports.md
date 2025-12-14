Implement Reports module in backend and frontend.

Backend:
- Create endpoints:
  - GET /reports/sales?start=&end=
  - GET /reports/stock-movements?productId=
  - GET /reports/cash?date=
- Implement aggregation queries using TypeORM

Frontend:
- Pages:
  - /reports/sales
  - /reports/stock
  - /reports/cash
- Tables, filters, date pickers
- Export CSV button

All queries must be tenant-scoped.
