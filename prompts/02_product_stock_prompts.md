# Phase 2: Product & Stock Management Prompts

## Task 2.1: Backend - Define Product & Stock Models

**Context:**
Define the Mongoose models for Products, Product Categories, and Stock Movements.

- **Database:** MongoDB with Mongoose
- **Reference:** `backend_structure.mdc` section "Database Models" for `ProductModel`, `ProductCategoryModel`, `StockMovementModel` [cite: 92-102, 114-118].
- **Rules:** Follow schema details from `backend_structure.mdc`. Ensure `tenantId` is present and indexed. Implement unique compound index for `tenantId` and `sku` on `ProductModel`[cite: 96].

**Prompt:**
"Implement the Mongoose schemas and models for `Product`, `ProductCategory`, and `StockMovement` within the `src/infrastructure/database/models/` directory. Adhere strictly to the field definitions, types, required attributes, default values, indexes (including compound indexes for `Product` SKU and `ProductCategory` name per tenant), and relationships specified in the `backend_structure.mdc` document [cite: 92-102, 114-118]. Include the `pre('save')` middleware to update `updatedAt` timestamps[cite: 95, 100]."

---

## Task 2.2: Backend - Implement Product/Category APIs

**Context:**
Create CRUD APIs for managing Products and Product Categories, scoped by tenant.

- **Endpoints:** `/api/v1/products`, `/api/v1/product-categories`
- **Models:** `ProductModel`, `ProductCategoryModel`
- **Reference:** REST principles, Clean Architecture Layersfrom `backend_structure.mdc`.
- **Rules:** Endpoints must be protected by `authMiddleware` and `tenantMiddleware`. All operations must be scoped to the `tenantId`.

**Prompt:**
"Implement the backend CRUD APIs for Products and Product Categories.

1.  Create services (`ProductService`, `ProductCategoryService`), controllers (`ProductController`, `ProductCategoryController`), and routes for these resources.
2.  Protect all routes with `authMiddleware` and `tenantMiddleware`.
3.  Implement endpoints for Products (`/api/v1/products`):
    - `POST /`: Create Product. Validate input (e.g., name/SKU required, price >= 0). Ensure SKU is unique within the tenant[cite: 96].
    - `GET /`: List Products. Support pagination (page, limit) and basic search (by name/SKU).
    - `GET /:productId`: Get Product by ID.
    - `PATCH /:productId`: Update Product.
    - `DELETE /:productId`: Delete Product.
4.  Implement endpoints for Product Categories (`/api/v1/product-categories`):
    - `POST /`: Create Category. Ensure name is unique within the tenant[cite: 101].
    - `GET /`: List Categories (support fetching hierarchical structure if needed).
    - `GET /:categoryId`: Get Category by ID.
    - `PATCH /:categoryId`: Update Category.
    - `DELETE /:categoryId`: Delete Category (consider implications if products are assigned).
5.  Ensure all service logic and repository queries are strictly filtered by the `tenantId` obtained from `req.tenant`.
6.  Use role-based authorization (`restrictTo`) as appropriate (e.g., maybe only 'admin'/'manager' can delete).
7.  Follow standard API response format and error handling [cite: 40-42, 124-138]."

---

## Task 2.3: Backend - Implement Stock Management Logic & APIs

**Context:**
Implement the core logic for tracking stock quantities and provide APIs for adjustments and history viewing.

- **Models:** `ProductModel`, `StockMovementModel`
- **Logic:** Update `Product.quantity`, create `StockMovement` records.
- **Endpoints:** `/api/v1/stock/adjustments`, `/api/v1/products/:productId/stock-history`

**Prompt:**
"Implement the backend stock management logic and related APIs:

1.  Create a `StockService` (`src/domain/services/stock.service.ts`) and potentially a `StockController`.
2.  Refactor `ProductService` (or ensure collaboration with `StockService`) so that when a product's quantity is intended to change (e.g., through manual adjustment, later through sales/purchases), it performs the following atomically (ideally within a transaction if using a DB that supports them easily, or handle carefully with Mongoose):
    - Updates the `quantity` field on the `ProductModel` record.
    - Creates a corresponding `StockMovementModel` record capturing the `tenantId`, `productId`, `type` (e.g., 'adjustment'), `quantity` change, `previousQuantity`, `newQuantity`, `userId`, and optional notes/reference.
3.  Implement an API endpoint for manual stock adjustments: `POST /api/v1/stock/adjustments`.
    - Accept `productId`, `newQuantity` or `adjustmentQuantity` (e.g., +10 or -5), and `notes`.
    - Use the `StockService` to update the product quantity and record the `StockMovement` with type 'adjustment'.
    - Protect with auth/tenant middleware and appropriate roles ('admin', 'manager').
4.  Implement an API endpoint to view stock history for a product: `GET /api/v1/products/:productId/stock-history`.
    - Fetch and return `StockMovement` records for the given `productId` and `tenantId`, ordered by date descending.
    - Support pagination.
    - Protect with auth/tenant middleware and appropriate roles.
5.  Ensure proper error handling (e.g., product not found, invalid quantity)."

---

## Task 2.4: Frontend - Implement Product/Category Management UI

**Context:**
Create the UI for listing, adding, editing Products and Product Categories.

- **Pages:** Products list, Categories list.
- **Components:** Data Table, Forms/Modals.
- **Tech:** Next.js, React Query/SWR, TanStack Table, shadcn/ui.
- **Reference:** Backend APIs from Task 2.2. `frontend_guideline_document.mdc`.

**Prompt:**
"Implement the frontend UI for Product and Product Category management:

1.  Create a Product list page (e.g., `app/(app)/products/page.tsx`).
    - Fetch products using React Query/SWR (`GET /api/v1/products`). Support pagination and search integrated with the `DataTable`.
    - Display products in a `DataTable`. Columns: SKU, Name, Category, Price, Cost, Quantity, Status, Actions (Edit, Delete).
    - Implement 'Add Product' button opening a `Dialog` with a `Form`for creating products (call `POST /api/v1/products`). Include fields based on `ProductModel`. Use Zod/React Hook Form for validation. Handle success/error.
    - Implement 'Edit' action opening a `Dialog` pre-filled for updating (call `PATCH /api/v1/products/:productId`).
    - Implement 'Delete' action with confirmation (call `DELETE /api/v1/products/:productId`).
2.  Create a Product Category list page (e.g., `app/(app)/settings/categories/page.tsx`).
    - Fetch categories (`GET /api/v1/product-categories`).
    - Display categories (perhaps using a simpler list or tree view if hierarchy is supported). Include Actions (Edit, Delete).
    - Implement 'Add Category' button opening a `Dialog` (`POST /api/v1/product-categories`).
    - Implement 'Edit'/'Delete' actions (`PATCH`/`DELETE /api/v1/product-categories/:categoryId`).
3.  Use React Query/SWR for data fetching, caching, and mutations (updates/creations/deletions) with appropriate cache invalidation."

---

## Task 2.5: Frontend - Implement Stock Adjustment UI

**Context:**
Create the UI for manually adjusting stock levels.

- **Location:** Could be a dedicated page or integrated into the Product details/list view.
- **Components:** Form/Modal, Input (Number).
- **Tech:** Next.js, React Query/SWR, shadcn/ui.
- **Reference:** Backend API from Task 2.3 (`POST /api/v1/stock/adjustments`).

**Prompt:**
"Implement the frontend UI for manual stock adjustments:

1.  Decide on the UI placement (e.g., an 'Adjust Stock' button on the product list/details page).
2.  Clicking the button should open a `Dialog` (modal).
3.  The modal should display the product name/SKU and current quantity.
4.  Include an input field (`Input` type='number') to enter the `newQuantity` or the `adjustmentQuantity` (e.g., +10, -5). Clarify which approach the API expects or support both.
5.  Include an optional `Textarea` for 'Notes' or 'Reason'.
6.  On submit, call the `POST /api/v1/stock/adjustments` endpoint with the `productId`, adjustment details, and notes.
7.  Use React Query/SWR for the mutation. Handle success (close modal, show notification, refresh product list/details) and errors (display message in the modal)."

---

## Task 2.6: Backend - Write Phase 2 Tests

**Context:**
Write unit and integration tests for the backend features developed in Phase 2.

- **Scope:** Product Service, Category Service, Stock Service, Product/Category/Stock Endpoints.
- **Tech:** Jest, Supertest.
- **Reference:** Testing strategy.

**Prompt:**
"Write unit and integration tests for the Phase 2 backend features:

1.  **Unit Tests (Jest):**
    - Test `ProductService`: Mock repository. Test CRUD operations, validation logic (unique SKU), search/pagination logic.
    - Test `ProductCategoryService`: Mock repository. Test CRUD operations, validation (unique name).
    - Test `StockService`: Mock repositories (`ProductRepository`, `StockMovementRepository`). Test stock adjustment logic, ensuring `Product.quantity` is updated correctly and `StockMovement` is created accurately. Test edge cases (e.g., adjusting non-existent product).
2.  **Integration Tests (Jest + Supertest):**
    - Test Product Endpoints (`/api/v1/products`): Test CRUD operations via HTTP requests. Verify tenant scoping, role restrictions, validation (e.g., unique SKU violation), pagination, search.
    - Test Category Endpoints (`/api/v1/product-categories`): Test CRUD operations, tenant scoping, validation (unique name).
    - Test Stock Adjustment Endpoint (`/api/v1/stock/adjustments`): Test successful adjustments, verify `Product.quantity` update and `StockMovement` creation in the test database. Test authorization and error cases (product not found, invalid input).
    - Test Stock History Endpoint (`/api/v1/products/:productId/stock-history`): Verify it returns the correct history for a product within the tenant. Test pagination.
3.  Follow testing best practices: use a test database, seed necessary data (users, tenants), clean up afterwards, use authentication tokens for protected routes."

---
