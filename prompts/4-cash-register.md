Implement Cash Register and Financial Entry modules.

Entities:
1. CashRegister:
   - id, tenantId, userId, openedAt, closedAt, initialBalance, finalBalance, status
2. FinancialEntry:
   - id, tenantId, cashRegisterId, saleId (optional), type ('in'|'out'), value, description, category, createdAt

Features:
- Open register
- Close register
- Add financial entry
- Auto-entry when sale happens
- Daily report

Endpoints:
- POST /cash/open
- POST /cash/close
- POST /finance/entry
- GET /cash/current
- GET /cash/report/daily

Ensure tenantId is always injected.
