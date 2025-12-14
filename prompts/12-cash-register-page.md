Create the **Cash Register Page** at `/admin/cash-register`.

### Purpose
Allow operators to open/close daily cash sessions and see current status.

### Requirements
- Fetch the active cash register session:
  `GET /api/cash-register/current`
- If no session:
  - Show "Open Cash Register" button.
- If session exists:
  - Show:
    - Opening amount
    - Opened at
    - Current balance (real-time sum)
    - Movements list
    - "Register Movement" button
    - "Close Cash Register" button

### Open Cash Register Modal
Fields:
- openingAmount (required)
POST `/api/cash-register/open`

### Register Movement Modal
Fields:
- type: "income" | "expense"
- amount
- description
POST `/api/cash-register/movement`

### Close Cash Register Modal
Fields:
- closingAmount (required)
POST `/api/cash-register/close`

### Components needed
- `CashRegisterStatusCard`
- `OpenCashRegisterDialog`
- `RegisterMovementDialog`
- `CloseCashRegisterDialog`
- `MovementsList`

### Technical Notes
- Use React Query for real-time polling every 10s.
- Use conditional UI based on session state.
- Handle negative balance validation.

Generate the full page and component implementation.
