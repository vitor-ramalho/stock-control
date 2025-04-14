# Phase 4: Dashboard & Reporting Prompts

## Task 4.1: Backend - Implement Dashboard Aggregation APIs

**Context:**
Develop API endpoints to provide aggregated data needed for the main dashboard display.

- **Endpoints:** `/api/v1/dashboard/summary`, `/api/v1/dashboard/low-stock` (or combined)
- **Logic:** Database aggregation queries using Prisma's aggregation features.
- **Models:** `Sale`, `Product`, potentially others.
- **Reference:** `implementation_plan.mdc` Phase 4. `backend_structure.mdc`.

**Prompt:**
"Implement backend API endpoints to fetch aggregated data for the dashboard:

1.  Create a `DashboardService` and `DashboardController`. Protect routes with `authMiddleware` and `tenantMiddleware`.
2.  Implement an endpoint like `GET /api/v1/dashboard/summary`:
    - This endpoint should perform database aggregation queries (scoped by `organizationId`) to calculate metrics such as:
      - Total sales revenue (e.g., today, this week, this month) using Prisma's `aggregate` with `_sum` and date filters.
      - Number of sales (today, this week, this month) using Prisma's `count` with date filters.
      - Total active products count using Prisma's `count` with `where` clause for active products.
      - Total clients count using Prisma's `count`.
      - Potentially recent sales activity (e.g., last 5 sales) using Prisma's `findMany` with `orderBy` and `take`.
    - Use efficient queries with proper indexes to avoid fetching large amounts of data.
    - Return the aggregated data in a structured format.
3.  Implement an endpoint like `GET /api/v1/dashboard/low-stock`:
    - Fetch products where `quantity` is less than or equal to `minStockLevel` for the current `organizationId` using Prisma's `findMany` with appropriate `where` clause.
    - Limit the results (e.g., top 10 most critical) using `take`.
    - Return the list of low-stock products (e.g., ID, name, SKU, current quantity, min stock level).
4.  Consider combining these into a single dashboard endpoint if appropriate.
5.  Ensure queries are optimized for performance by using proper indexes defined in the Prisma schema."

---

## Task 4.2: Frontend - Implement Dashboard UI

**Context:**
Create the main dashboard page displaying key metrics, charts, and lists fetched from the backend.

- **Page:** `/` or `/dashboard`.
- **Components:** Stat Cards, Charts (Line/Bar), Data Table.
- **Tech:** Next.js, React Query/SWR, Recharts, shadcn/ui.
- **Reference:** Backend APIs from Task 4.1. `frontend_guideline_document.mdc` Dashboard examples, StatCard, LineChartComponent [cite: 347-358, 377-389]. `app_flow_document.mdc` Dashboard Flow.

**Prompt:**
"Implement the frontend Dashboard UI:

1.  Create the main dashboard page (e.g., `app/(app)/dashboard/page.tsx` or `/page.tsx` within the authenticated layout).
2.  Use React Query/SWR to fetch data from the dashboard summary endpoint (`GET /api/v1/dashboard/summary`). Handle loading and error states.
3.  Display the key metrics (Total Revenue, Sales Count, Active Products, Clients) using the `StatCard` component. Include trend indicators if the API provides comparison data (e.g., vs. previous period).
4.  Use React Query/SWR to fetch sales trend data (if available from the summary endpoint or a separate one) and display it using `LineChartComponent` or a similar chart component (e.g., monthly sales trend).
5.  Use React Query/SWR to fetch the list of low-stock products (`GET /api/v1/dashboard/low-stock`).
6.  Display the low-stock products in a simple `DataTable` or list format, showing key information (Name, SKU, Current Qty, Min Qty). Link items to their respective product detail pages if available.
7.  Arrange the components logically on the page using a grid layout. Ensure responsiveness[cite: 336].
8.  Handle loading states gracefully, potentially using `Skeleton` components."

---

## Task 4.3: Backend - Write Phase 4 Tests

**Context:**
Write integration tests for the backend dashboard endpoints.

- **Scope:** Dashboard Endpoints (`/api/v1/dashboard/...`).
- **Tech:** Jest, Supertest.
- **Reference:** Testing strategy.

**Prompt:**
"Write integration tests for the Phase 4 backend dashboard features:

1.  **Integration Tests (Jest + Supertest):**
    - Test the Dashboard Summary endpoint (`GET /api/v1/dashboard/summary`):
      - Seed the test database with sample data (multiple users, products with varying stock, clients, sales across different dates) for a specific test organization using Prisma's `create` operations.
      - Make authenticated requests to the endpoint.
      - Verify that the returned aggregated data (revenue, counts, etc.) is calculated correctly based on the seeded data.
      - Check organization isolation – ensure data from other organizations isn't included.
      - Verify the response format and status codes.
    - Test the Low Stock endpoint (`GET /api/v1/dashboard/low-stock`):
      - Seed products with quantities above, at, and below their `minStockLevel` using Prisma's `create` operations.
      - Make authenticated requests.
      - Verify that only the correct low-stock products for the organization are returned.
      - Check the limit and sorting if applicable.
      - Verify response format and status codes.
2.  Ensure tests use authentication tokens and clean up seeded data using Prisma's `deleteMany` operations."

---
