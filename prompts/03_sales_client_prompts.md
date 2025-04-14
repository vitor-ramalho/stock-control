# Phase 3: Sales & Client Management Prompts

## Task 3.1: Backend - Define Client & Sale Models

**Context:**
Define the Mongoose models for Clients and Sales (including Sale Items).

- **Database:** MongoDB with Mongoose
- **Reference:** `backend_structure.mdc` section "Database Models" for `ClientModel`, `SaleModel` (including `saleItemSchema`).
- **Rules:** Follow schema details from `backend_structure.mdc`. Ensure `tenantId` is present and indexed. Implement unique compound index for `tenantId` and `invoiceNumber` on `SaleModel`. Implement pre-save hook for `SaleModel` to generate invoice numbers if not provided.

**Prompt:**
"Implement the Mongoose schemas and models for `Client` and `Sale` (including the nested `saleItemSchema`) within the `src/infrastructure/database/models/` directory. Adhere strictly to the field definitions, types, required attributes, default values, enums, indexes (including the compound index for `Sale` invoice number per tenant), and relationships specified in the `backend_structure.mdc` document. Include the `pre('save')` middleware on `ClientModel` and `SaleModel` to update `updatedAt` timestamps. Also implement the `pre('save')` hook on `SaleModel` to automatically generate a unique `invoiceNumber` if one is not provided[cite: 111]."

---

## Task 3.2: Backend - Implement Client API

**Context:**
Create CRUD APIs for managing Clients, scoped by tenant.

- **Endpoints:** `/api/v1/clients`
- **Models:** `ClientModel`
- **Reference:** REST principles, Clean Architecture Layersfrom `backend_structure.mdc`.
- **Rules:** Endpoints must be protected by `authMiddleware` and `tenantMiddleware`. All operations must be scoped to the `tenantId`.

**Prompt:**
"Implement the backend CRUD APIs for Clients.

1.  Create `ClientService`, `ClientController`, and routes for this resource.
2.  Protect all routes with `authMiddleware` and `tenantMiddleware`.
3.  Implement endpoints for Clients (`/api/v1/clients`):
    - `POST /`: Create Client. Validate input (e.g., name required).
    - `GET /`: List Clients. Support pagination and search (by name/email/phone).
    - `GET /:clientId`: Get Client by ID.
    - `PATCH /:clientId`: Update Client.
    - `DELETE /:clientId`: Delete Client (or mark as inactive).
4.  Ensure all service logic and repository queries are strictly filtered by the `tenantId`.
5.  Use role-based authorization (`restrictTo`) if needed (e.g., view vs. edit permissions).
6.  Follow standard API response format and error handling [cite: 40-42, 124-138]."

---

## Task 3.3: Backend - Implement Sales Logic & APIs

**Context:**
Implement the logic for creating and managing sales, including updating stock levels.

- **Models:** `SaleModel`, `ProductModel`, `StockMovementModel`
- **Endpoints:** `/api/v1/sales`
- **Logic:** Calculate totals, decrease product quantities, create stock movements.
- **Reference:** `backend_structure.mdc`, `app_flow_document.mdc` Sales Process Flow.

**Prompt:**
"Implement the backend Sales logic and APIs:

1.  Create `SaleService`, `SaleController`, and routes. Protect routes with `authMiddleware` and `tenantMiddleware`.
2.  Implement the 'Create Sale' endpoint (`POST /api/v1/sales`):
    - Accept `clientId` (optional), `userId` (from `req.user`), `status` (e.g., 'draft' or 'completed'), `items` array (each with `productId`, `quantity`, `unitPrice`), `paymentMethod`, `notes`, etc.
    - **Crucially:** If the `status` is 'completed', the service logic must:
      - Iterate through sale `items`.
      - For each item, fetch the corresponding `Product`.
      - Decrease the `Product.quantity` by the `item.quantity` sold[cite: 439].
      - Create a `StockMovement` record for each item with `type: 'sale'`, the negative quantity change, and a reference to the Sale ID[cite: 439]. Perform these updates atomically if possible (or handle potential failures gracefully).
      - Validate that sufficient stock exists _before_ processing the sale completion.
    - Calculate `subtotal`, `taxAmount`, `discountAmount`, and `total` based on items and potentially organization settings (tax rate)[cite: 439].
    - Save the `SaleModel` record.
    - Return the created sale.
3.  Implement endpoint to list sales (`GET /api/v1/sales`): Support pagination, filtering (by status, date range, client), and sorting.
4.  Implement endpoint to get a specific sale (`GET /api/v1/sales/:saleId`).
5.  Implement endpoint to update sale status (`PATCH /api/v1/sales/:saleId`): e.g., changing from 'draft' to 'completed'. If changing to 'completed', trigger the stock deduction logic described in step 2. Handle cases where status might change to 'canceled' (potentially reversing stock movements - consider complexity).
6.  Apply appropriate role-based restrictions.
7.  Ensure standard API responses and error handling (e.g., insufficient stock, product not found)."

---

## Task 3.4: Frontend - Implement Client Management UI

**Context:**
Create the UI for listing, adding, and editing Clients.

- **Page:** Clients list page.
- **Components:** Data Table, Forms/Modals.
- **Tech:** Next.js, React Query/SWR, TanStack Table, shadcn/ui.
- **Reference:** Backend API from Task 3.2. `frontend_guideline_document.mdc`. `app_flow_document.mdc` Client Management Flow[cite: 8].

**Prompt:**
"Implement the frontend UI for Client management:

1.  Create a Client list page (e.g., `app/(app)/clients/page.tsx`).
2.  Fetch clients using React Query/SWR (`GET /api/v1/clients`). Support pagination and search integrated with the `DataTable`.
3.  Display clients in a `DataTable`. Columns: Name, Email, Phone, possibly address fields, Actions (Edit, Delete).
4.  Implement 'Add Client' button opening a `Dialog` with a `Form`for creating clients (call `POST /api/v1/clients`). Include fields based on `ClientModel`. Use Zod/React Hook Form for validation. Handle success/error.
5.  Implement 'Edit' action opening a `Dialog` pre-filled for updating (call `PATCH /api/v1/clients/:clientId`).
6.  Implement 'Delete' action with confirmation (call `DELETE /api/v1/clients/:clientId`).
7.  Use React Query/SWR for data fetching and mutations with cache invalidation."

---

## Task 3.5: Frontend - Implement Sales UI

**Context:**
Create the UI for recording new sales and listing past sales.

- **Pages:** New Sale form, Sales list.
- **Components:** Forms, Data Table, Select/Autocomplete (for clients/products).
- **Tech:** Next.js, React Query/SWR, shadcn/ui.
- **Reference:** Backend API from Task 3.3. `frontend_guideline_document.mdc`. `app_flow_document.mdc` Sales Process Flow.

**Prompt:**
"Implement the frontend UI for Sales management:

1.  Create a 'New Sale' page/form (e.g., `app/(app)/sales/new/page.tsx`).
    - Include fields to select a Client (use a searchable `Combobox` or `Select` populated by `GET /api/v1/clients`). Allow creating a new client inline if needed.
    - Implement a mechanism to add sale items:
      - Search/select products (use a `Combobox` or similar, fetching from `GET /api/v1/products`).
      - Input quantity for each selected product.
      - Display unit price (fetched with product) and calculate line total. Allow applying discounts if applicable.
      - Show running subtotal, tax (if applicable), and total.
    - Include fields for Payment Method (`Select`), Notes (`Textarea`).
    - On submit (e.g., 'Complete Sale'), call the `POST /api/v1/sales` endpoint with the sale data and status 'completed'. Handle loading state and success/error responses (e.g., show notification, redirect to sales list).
2.  Create a Sales list page (e.g., `app/(app)/sales/page.tsx`).
    - Fetch sales using React Query/SWR (`GET /api/v1/sales`). Support pagination and filtering (by date, status, client).
    - Display sales in a `DataTable`. Columns: Invoice Number, Date, Client Name, Status, Total Amount, Actions (View Details).
    - Implement a 'View Details' action, linking to a sale detail page (to be created if needed, or show details in a modal) which calls `GET /api/v1/sales/:saleId`."

---

## Task 3.6: Backend - Write Phase 3 Tests

**Context:**
Write unit and integration tests for the backend features developed in Phase 3.

- **Scope:** Client Service, Sale Service, Client Endpoints, Sale Endpoints.
- **Tech:** Jest, Supertest.
- **Reference:** Testing strategy.

**Prompt:**
"Write unit and integration tests for the Phase 3 backend features:

1.  **Unit Tests (Jest):**
    - Test `ClientService`: Mock repository. Test CRUD operations and any specific validation or logic.
    - Test `SaleService`: Mock repositories (`SaleRepository`, `ProductRepository`, `StockMovementRepository`). Test sale creation logic, especially the stock deduction and `StockMovement` creation process. Test calculations (totals, taxes). Test status update logic. Test validation (e.g., insufficient stock).
2.  **Integration Tests (Jest + Supertest):**
    - Test Client Endpoints (`/api/v1/clients`): Test CRUD operations via HTTP requests. Verify tenant scoping, pagination, search.
    - Test Sale Endpoints (`/api/v1/sales`):
      - Test creating a sale (both 'draft' and 'completed'). For 'completed' sales, verify via subsequent requests or direct DB checks (in test DB) that `Product.quantity` was correctly decreased and `StockMovement` records were created.
      - Test listing sales with filters and pagination.
      - Test getting a specific sale.
      - Test updating sale status and verify side effects (like stock deduction on completion).
      - Test error handling (e.g., insufficient stock when completing a sale, invalid product ID).
    - Ensure tests use auth tokens and respect tenant isolation. Seed necessary products with initial stock for testing sales."

---
