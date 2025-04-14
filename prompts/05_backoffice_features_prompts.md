# Phase 5: Backoffice & SaaS Features Prompts

## Task 5.1: Backend - Implement Backoffice APIs

**Context:**
Secure and refine the Backoffice APIs for managing Organizations and Plans.

- **Endpoints:** `/api/v1/backoffice/organizations`, `/api/v1/backoffice/plans`
- **Security:** Implement proper role-based access control for these endpoints.
- **Reference:** APIs created in Task 1.3. `implementation_plan.mdc` Phase 5.

**Prompt:**
"Refine and secure the Backoffice API endpoints:

1.  Define a specific 'superadmin' role or permission within your authorization system.
2.  Protect all routes under `/api/v1/backoffice/` using `authMiddleware` and `restrictTo('superadmin')` (or the equivalent permission check). Remove any temporary/hardcoded access controls.
3.  Ensure the existing CRUD operations for Organizations and Plans (from Task 1.3) function correctly with this new role protection.
4.  Optionally, implement an endpoint for superadmins to potentially impersonate a tenant admin (e.g., `POST /api/v1/backoffice/impersonate/:userId`). This should generate a new JWT with the impersonated user's ID and tenantId but perhaps a special indicator/role. _Implement with extreme caution and extensive logging._ (Consider skipping if not strictly necessary for MVP).
5.  Review and ensure all sensitive data is handled appropriately in responses."

---

## Task 5.2: Frontend - Implement Backoffice UI

**Context:**
Create a separate UI section for superadmins to manage Organizations and Plans.

- **Pages:** Backoffice Org List, Backoffice Plan List.
- **Components:** Data Table, Forms/Modals.
- **Tech:** Next.js, React Query/SWR, TanStack Table, shadcn/ui.
- **Reference:** Backend APIs from Task 5.1. `frontend_guideline_document.mdc`.

**Prompt:**
"Implement the frontend UI for the Backoffice section:

1.  Create a separate layout or routing group for backoffice pages (e.g., `app/(backoffice)/layout.tsx`). This layout should only be accessible to users with the 'superadmin' role (check role from auth context). Redirect unauthorized users.
2.  Create a page to list and manage Organizations (`app/(backoffice)/organizations/page.tsx`).
    - Fetch data from `GET /api/v1/backoffice/organizations`.
    - Display organizations in a `DataTable`. Columns: Name, Email, Plan Name, Status (Active/Inactive), Actions (Edit/View).
    - Implement 'Edit' action opening a `Dialog` to modify organization details (e.g., change plan, activate/deactivate) calling `PATCH /api/v1/backoffice/organizations/:id`.
3.  Create a page to list and manage Plans (`app/(backoffice)/plans/page.tsx`).
    - Fetch data from `GET /api/v1/backoffice/plans`.
    - Display plans in a `DataTable`. Columns: Name, Price, Billing Cycle, Limits (Users, Products), Status, Actions.
    - Implement 'Add Plan' button opening a `Dialog` (`POST /api/v1/backoffice/plans`).
    - Implement 'Edit'/'Delete' actions (`PATCH`/`DELETE /api/v1/backoffice/plans/:id`).
4.  Use React Query/SWR for data fetching and mutations."

---

## Task 5.3: Backend - Implement Basic Subscription Logic

**Context:**
Implement basic checks to enforce plan limits (e.g., number of users, number of products).

- **Models:** `OrganizationModel`, `PlanModel`, `UserModel`, `ProductModel`.
- **Logic:** Add middleware or checks in services before creating resources limited by the plan.
- **Reference:** `backend_structure.mdc` models [cite: 88-92, 119-123]. `implementation_plan.mdc` Phase 5.

**Prompt:**
"Implement basic subscription limit enforcement:

1.  Add fields like `userCount` and `productCount` to the `OrganizationModel` schema(or fetch counts dynamically, though counters might be more performant). Update these counters whenever users/products are added/deleted for an organization.
2.  In the `UserService` (`POST /api/v1/users` endpoint logic):
    - Before creating a new user, fetch the user's `Organization` and its associated `Plan`.
    - Compare the current `organization.userCount` with the `plan.limits.users`.
    - If the limit is reached or would be exceeded, throw a `ForbiddenError` (or a specific 'LimitExceededError') with an appropriate message.
3.  In the `ProductService` (`POST /api/v1/products` endpoint logic):
    - Before creating a new product, fetch the user's `Organization` and its `Plan`.
    - Compare the current `organization.productCount` with the `plan.limits.products`.
    - If the limit is reached or would be exceeded, throw an appropriate error.
4.  Add the `subscriptionEndsAt` field to `OrganizationModel`[cite: 91]. (Actual checking against this date can be basic middleware applied to relevant routes, returning an error if expired - full billing integration is deferred)."

---

## Task 5.4: Backend - Implement Stock Replenishment & Import API

**Context:**
Provide logic for suggesting stock replenishment and allow importing stock updates via spreadsheet.

- **Logic:** Identify products below `minStockLevel`. Parse CSV/XLSX file.
- **Models:** `ProductModel`, `StockMovementModel`.
- **Endpoints:** `/api/v1/stock/replenishment-suggestions`, `/api/v1/stock/import`
- **Tech:** Need a library for spreadsheet parsing (e.g., `xlsx` or `papaparse`).

**Prompt:**
"Implement backend features for stock replenishment:

1.  Implement an endpoint `GET /api/v1/stock/replenishment-suggestions`:
    - Fetch products for the tenant where `quantity <= minStockLevel`.
    - Return a list of these products, potentially including suggested replenishment quantity (e.g., `maxStockLevel - quantity` if `maxStockLevel` is defined, or just highlight the need).
    - Protect with auth/tenant middleware.
2.  Implement an endpoint `POST /api/v1/stock/import`:
    - This endpoint should accept a file upload (CSV or XLSX). Use `multer` or a similar library to handle file uploads.
    - Install a suitable library (like `xlsx` or `papaparse`) to parse the spreadsheet data.
    - Expect specific columns in the spreadsheet (e.g., 'SKU', 'NewQuantity' or 'AdjustmentQuantity').
    - Parse the file row by row. For each row:
      - Find the product by SKU within the tenant.
      - Validate the data (e.g., numeric quantity).
      - Use the `StockService` (from Task 2.3) to update the product's quantity based on the parsed value (treating it as an 'adjustment' or 'purchase' type movement) and record the `StockMovement`.
    - Handle errors during parsing and processing gracefully (e.g., invalid SKU, non-numeric quantity). Return a summary of successful updates and failures.
    - Protect with auth/tenant middleware and appropriate roles ('admin', 'manager').
    - Consider processing large files asynchronously using a background job queue if needed."

---

## Task 5.5: Frontend - Implement Replenishment & Import UI

**Context:**
Create the UI for viewing replenishment suggestions and uploading stock update spreadsheets.

- **Pages/Components:** Replenishment Suggestions list, Import Modal/Page.
- **Tech:** Next.js, React Query/SWR, shadcn/ui (`DataTable`, `Dialog`, `Input type='file'`, `Button`).
- **Reference:** Backend APIs from Task 5.4. `frontend_guideline_document.mdc`.

**Prompt:**
"Implement the frontend UI for stock replenishment features:

1.  Create a page or section (e.g., under Inventory or Reports) to display Stock Replenishment Suggestions.
    - Fetch data from `GET /api/v1/stock/replenishment-suggestions` using React Query/SWR.
    - Display the suggested products in a `DataTable` or list, showing Name, SKU, Current Qty, Min Qty, and Suggested Replenish Qty (if available).
2.  Implement a Stock Import feature:
    - Add an 'Import Stock' button (e.g., on the Products or Inventory page).
    - Clicking it should open a `Dialog` or navigate to an import page.
    - Provide instructions and a link to download a template spreadsheet (the backend might need an endpoint to provide this template structure, or define it in the frontend).
    - Include an `<Input type='file' />` element for file selection.
    - On file selection/submit, upload the file to the `POST /api/v1/stock/import` endpoint. Handle multipart/form-data submission.
    - Display progress/loading state during upload and processing.
    - On completion, display the summary returned by the backend (successful updates, errors). Refresh relevant product/stock data."

---

## Task 5.6: Backend - Write Phase 5 Tests

**Context:**
Write integration tests for the backend features developed in Phase 5.

- **Scope:** Backoffice APIs, Subscription Limit Checks, Replenishment/Import Endpoints.
- **Tech:** Jest, Supertest.
- **Reference:** Testing strategy.

**Prompt:**
"Write integration tests for the Phase 5 backend features:

1.  **Integration Tests (Jest + Supertest):**
    - Test Backoffice Endpoints (`/api/v1/backoffice/...`):
      - Verify that requests _without_ the 'superadmin' role/token are rejected (403 Forbidden).
      - Verify that requests _with_ the 'superadmin' role can successfully perform CRUD operations on Organizations and Plans.
      - If impersonation was implemented, test its functionality and security carefully.
    - Test Subscription Limit Checks:
      - Seed an organization with a plan having specific limits (e.g., 3 users). Seed 3 users for that org.
      - Attempt to create a 4th user via `POST /api/v1/users`. Verify that the request fails with an appropriate limit exceeded error (e.g., 403 or 422).
      - Repeat for product limits via `POST /api/v1/products`.
    - Test Replenishment Suggestions Endpoint (`GET /api/v1/stock/replenishment-suggestions`):
      - Seed products with quantities below, at, and above `minStockLevel`.
      - Make an authenticated request and verify that only the expected low-stock products are returned for the tenant.
    - Test Stock Import Endpoint (`POST /api/v1/stock/import`):
      - Create a sample CSV/XLSX file for testing. Include valid rows, rows with invalid SKUs, rows with non-numeric quantities.
      - Make an authenticated request, uploading the test file using Supertest's file upload capabilities.
      - Verify the response summary indicates correct successes and failures.
      - Check the test database to confirm that quantities for valid SKUs were updated correctly and `StockMovement` records were created.
    - Ensure proper test setup (seeding plans, orgs, users, products) and teardown."

---
    