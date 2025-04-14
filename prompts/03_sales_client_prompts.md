# Phase 3: Sales & Client Management Prompts

## Task 3.1: Backend - Define Sales & Client Models

**Context:**
Define the Prisma schema for Sales, Sale Items, and Clients.

- **Database:** PostgreSQL with Prisma
- **Reference:** `backend_structure.mdc` section "Database Models" for `Sale`, `SaleItem`, `Client`.
- **Rules:** Follow schema details from `backend_structure.mdc`. Ensure `organizationId` is present and indexed. Implement proper relationships and constraints.

**Prompt:**
"Implement the Prisma schema for `Sale`, `SaleItem`, and `Client` models in `prisma/schema.prisma`. Adhere strictly to the field definitions, types, required attributes, default values, indexes, and relationships specified in the `backend_structure.mdc` document. Use proper PostgreSQL types (e.g., `String`, `Boolean`, `DateTime`, `Decimal` for prices/quantities). Ensure proper foreign key relationships and constraints."

---

## Task 3.2: Backend - Implement Client Management APIs

**Context:**
Create CRUD APIs for managing Clients, scoped by organization.

- **Endpoints:** `/api/v1/clients`
- **Models:** `Client`
- **Reference:** REST principles, Clean Architecture Layers from `backend_structure.mdc`.
- **Rules:** Endpoints must be protected by `authMiddleware` and `tenantMiddleware`. All operations must be scoped to the `organizationId`.

**Prompt:**
"Implement the backend CRUD APIs for Clients:

1.  Create services (`ClientService`), controllers (`ClientController`), and routes for this resource.
2.  Protect all routes with `authMiddleware` and `tenantMiddleware`.
3.  Implement endpoints for Clients (`/api/v1/clients`):
    - `POST /`: Create Client. Validate input (e.g., name required, valid email if provided). Ensure email is unique within the organization using Prisma's unique constraint.
    - `GET /`: List Clients. Support pagination (page, limit) and basic search (by name/email) using Prisma's query capabilities.
    - `GET /:clientId`: Get Client by ID.
    - `PATCH /:clientId`: Update Client.
    - `DELETE /:clientId`: Delete Client.
4.  Ensure all service logic and repository queries are strictly filtered by the `organizationId` obtained from `req.user`.
5.  Use role-based authorization (`restrictTo`) as appropriate.
6.  Follow standard API response format and error handling."

---

## Task 3.3: Backend - Implement Sales Management Logic & APIs

**Context:**
Implement the core logic for managing sales and provide APIs for creating and viewing sales.

- **Models:** `Sale`, `SaleItem`, `Product`, `Client`
- **Logic:** Create sales, update product quantities, calculate totals.
- **Endpoints:** `/api/v1/sales`, `/api/v1/sales/:saleId`

**Prompt:**
"Implement the backend sales management logic and related APIs:

1.  Create a `SaleService` (`src/domain/services/sale.service.ts`) and a `SaleController`.
2.  Implement the sales creation logic using Prisma's `$transaction` to ensure atomicity:
    - Create the `Sale` record with organization, client, and total information.
    - Create `SaleItem` records for each product in the sale.
    - Update the `quantity` of each `Product` involved in the sale.
    - Create corresponding `StockMovement` records for each product.
3.  Implement API endpoints:
    - `POST /api/v1/sales`: Create a new sale. Accept client ID, items (product ID, quantity), and optional notes.
    - `GET /api/v1/sales`: List sales with pagination and filtering (by date, client, etc.).
    - `GET /api/v1/sales/:saleId`: Get sale details including items.
4.  Protect all endpoints with auth/tenant middleware and appropriate roles.
5.  Implement proper validation:
    - Ensure products exist and belong to the organization.
    - Ensure client exists and belongs to the organization.
    - Ensure sufficient stock for each product.
    - Validate quantities are positive.
6.  Handle errors appropriately (e.g., insufficient stock, invalid client/product)."

---

## Task 3.4: Frontend - Implement Client Management UI

**Context:**
Create the UI for listing, adding, and editing Clients.

- **Pages:** Clients list.
- **Components:** Data Table, Forms/Modals.
- **Tech:** Next.js, React Query/SWR, TanStack Table, shadcn/ui.
- **Reference:** Backend APIs from Task 3.2. `frontend_guideline_document.mdc`.

**Prompt:**
"Implement the frontend UI for Client management:

1.  Create a Client list page (e.g., `app/(app)/clients/page.tsx`).
    - Fetch clients using React Query/SWR (`GET /api/v1/clients`). Support pagination and search integrated with the `DataTable`.
    - Display clients in a `DataTable`. Columns: Name, Email, Phone, Address, Actions (Edit, Delete).
    - Implement 'Add Client' button opening a `Dialog` with a `Form` for creating clients (call `POST /api/v1/clients`). Include fields based on `Client` model. Use Zod/React Hook Form for validation.
    - Implement 'Edit' action opening a `Dialog` pre-filled for updating (call `PATCH /api/v1/clients/:clientId`).
    - Implement 'Delete' action with confirmation (call `DELETE /api/v1/clients/:clientId`).
2.  Use React Query/SWR for data fetching, caching, and mutations with appropriate cache invalidation."

---

## Task 3.5: Frontend - Implement Sales Management UI

**Context:**
Create the UI for creating and viewing sales.

- **Pages:** Sales list, Create Sale.
- **Components:** Data Table, Forms/Modals, Select/Dropdown.
- **Tech:** Next.js, React Query/SWR, TanStack Table, shadcn/ui.
- **Reference:** Backend APIs from Task 3.3.

**Prompt:**
"Implement the frontend UI for Sales management:

1.  Create a Sales list page (e.g., `app/(app)/sales/page.tsx`).
    - Fetch sales using React Query/SWR (`GET /api/v1/sales`). Support pagination and filtering.
    - Display sales in a `DataTable`. Columns: Date, Client, Total, Status, Actions (View).
2.  Create a Create Sale page (e.g., `app/(app)/sales/new/page.tsx`).
    - Implement a multi-step form:
      - Step 1: Select client (use a searchable dropdown with client list).
      - Step 2: Add products (searchable dropdown for products, quantity input, price display).
      - Step 3: Review and confirm (display summary, total, notes field).
    - On submit, call `POST /api/v1/sales` and handle success/error.
3.  Create a Sale details page (e.g., `app/(app)/sales/[saleId]/page.tsx`).
    - Fetch sale details using `GET /api/v1/sales/:saleId`.
    - Display sale information, client details, and items table.
4.  Use React Query/SWR for data fetching and mutations with appropriate cache invalidation."

---

## Task 3.6: Backend - Write Phase 3 Tests

**Context:**
Write unit and integration tests for the backend features developed in Phase 3.

- **Scope:** Client Service, Sale Service, Client/Sale Endpoints.
- **Tech:** Jest, Supertest.
- **Reference:** Testing strategy.

**Prompt:**
"Write unit and integration tests for the Phase 3 backend features:

1.  **Unit Tests (Jest):**
    - Test `ClientService`: Mock Prisma Client. Test CRUD operations, validation logic (unique email), search/pagination logic.
    - Test `SaleService`: Mock Prisma Client. Test sale creation logic, including:
      - Proper creation of `Sale` and `SaleItem` records.
      - Correct product quantity updates.
      - Stock movement creation.
      - Total calculation.
      - Error cases (insufficient stock, invalid client/product).
2.  **Integration Tests (Jest + Supertest):**
    - Test Client Endpoints (`/api/v1/clients`): Test CRUD operations via HTTP requests. Verify organization scoping, role restrictions, validation (e.g., unique email violation), pagination, search.
    - Test Sale Endpoints (`/api/v1/sales`): Test sale creation and retrieval. Verify:
      - Proper creation of sale records.
      - Product quantity updates.
      - Stock movement creation.
      - Organization scoping.
      - Authorization.
      - Error handling.
3.  Follow testing best practices: use a test database, seed necessary data (users, organizations, products, clients), clean up afterwards, use authentication tokens for protected routes."

---
