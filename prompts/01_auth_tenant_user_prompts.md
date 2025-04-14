# Phase 1: Core Tenant & User Management Prompts

## Task 1.1: Backend - Define Core Models

**Context:**
Define the Mongoose database models for the core entities: Plans, Organizations (Tenants), and Users.

- **Database:** MongoDB with Mongoose
- **Reference:** `backend_structure.mdc` section "Database Models" for `PlanModel`, `OrganizationModel`, `UserModel` [cite: 83-92, 119-123].
- **Rules:** Follow schema details (fields, types, required, indexes, pre-save hooks for password hashing) specified in `backend_structure.mdc` [cite: 83-92, 119-123]. Implement models within `src/infrastructure/database/models/`.

**Prompt:**
"Implement the Mongoose schemas and models for `Plan`, `Organization`, and `User` within the `src/infrastructure/database/models/` directory. Ensure all fields, types, required attributes, default values, indexes, and relationships (`ref`) match the definitions provided in the `backend_structure.mdc` document [cite: 83-92, 119-123]. Implement the `pre('save')` middleware for the `User` model to hash passwords using `bcryptjs` before saving[cite: 85]. Implement the `comparePassword` method on the `User` schema[cite: 86]."

---

## Task 1.2: Backend - Implement Authentication API

**Context:**
Create the API endpoints and logic for user registration (initial tenant admin) and login.

- **Endpoints:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
- **Logic:** Hashing passwords, generating JWTs, validating credentials.
- **Reference:** `backend_structure.mdc` sections on Authentication, JWT, Auth Middleware. `cursor_project_rules.mdc` on Error Handling.
- **Tech:** `bcryptjs`, `jsonwebtoken`.

**Prompt:**
"Implement the backend authentication logic and API endpoints.

1.  Create an Authentication service (`src/domain/services/auth.service.ts`) and controller (`src/api/controllers/auth.controller.ts`).
2.  Implement the registration endpoint (`POST /api/v1/auth/register`):
    - Accept organization name, admin first name, last name, email, and password.
    - Assume a default 'Plan' exists or create a basic one if needed.
    - Create the `Organization` record.
    - Create the `User` record with the 'admin' role, hashing the password using `bcryptjs`.
    - Return the created user and organization data (excluding password).
3.  Implement the login endpoint (`POST /api/v1/auth/login`):
    - Accept email and password.
    - Find the user by email. Check across organizations if necessary or require organization context if login is tenant-specific.
    - Verify the password using `bcryptjs.compare`[cite: 86].
    - If valid, generate a JWT containing `userId`, `tenantId` (organizationId), and `role`[cite: 139]. Use environment variables for JWT secret and expiration [cite: 138, 247-251].
    - Return the JWT.
4.  Create JWT utility functions (`generateToken`, `verifyToken`) in `src/infrastructure/auth/jwt.ts`.
5.  Implement the core `authMiddleware` in `src/api/middleware/auth.middleware.ts` to verify the JWT from the `Authorization` header, attach user payload (`userId`, `tenantId`, `role`) to `req.user`, and verify user existence/activity.
6.  Implement the `tenantMiddleware` in `src/api/middleware/tenant.middleware.ts` to run _after_ `authMiddleware`, verify the tenant from `req.user.tenantId` exists and is active, and attach tenant info to `req.tenant`.
7.  Use custom error classes (`UnauthorizedError`, `ValidationError`, etc.) from `src/errors/index.ts`and ensure consistent API response format."

---

## Task 1.3: Backend - Implement Backoffice Org/Plan APIs

**Context:**
Create basic CRUD APIs for managing Organizations and Plans, intended for backoffice use. Access control will be basic initially.

- **Endpoints:** `/api/v1/backoffice/organizations`, `/api/v1/backoffice/plans`
- **Models:** `OrganizationModel`, `PlanModel`
- **Reference:** REST principles from `backend_structure.mdc`.

**Prompt:**
"Implement CRUD API endpoints for managing `Organizations` and `Plans` for backoffice administration.

1.  Create routes, controllers, and services for these resources (e.g., `src/api/controllers/backoffice.controller.ts`, `src/domain/services/organization.service.ts`, `src/domain/services/plan.service.ts`).
2.  Implement endpoints:
    - `GET /api/v1/backoffice/organizations` (List all organizations)
    - `GET /api/v1/backoffice/organizations/:id` (Get specific organization)
    - `PATCH /api/v1/backoffice/organizations/:id` (Update organization - e.g., change plan, activate/deactivate)
    - `GET /api/v1/backoffice/plans` (List all plans)
    - `POST /api/v1/backoffice/plans` (Create new plan)
    - `GET /api/v1/backoffice/plans/:id` (Get specific plan)
    - `PATCH /api/v1/backoffice/plans/:id` (Update plan)
    - `DELETE /api/v1/backoffice/plans/:id` (Delete plan)
3.  For now, protect these routes with a simple check (e.g., require a specific hardcoded API key in the header or a specific 'superadmin' role if already implemented in `authMiddleware`). Implement proper role-based access later.
4.  Ensure responses follow the standard API format."

---

## Task 1.4: Backend - Implement Tenant User Management API & Roles

**Context:**
Allow tenant admins to manage users within their own organization.

- **Endpoints:** `/api/v1/users` (implicitly scoped to the logged-in user's tenant via middleware)
- **Models:** `UserModel`
- **Reference:** `backend_structure.mdc` User model, Auth Middleware, Tenant Middleware.
- **Tech:** Mongoose

**Prompt:**
"Implement the API for tenant administrators to manage users within their organization.

1.  Create `UserService` (`src/domain/services/user.service.ts`), `UserController` (`src/api/controllers/user.controller.ts`), and routes (`src/api/routes/user.routes.ts`).
2.  The routes should be protected by both `authMiddleware` and `tenantMiddleware`. The `tenantId` will be automatically available from `req.user` or `req.tenant`.
3.  Implement endpoints operating within the user's `tenantId`:
    - `POST /api/v1/users` (Create User): Accepts user details (first name, last name, email, role - e.g., 'manager', 'employee'). Generate a temporary password or trigger an invitation flow (implement invitation later). Hash password if set directly. Requires 'admin' role.
    - `GET /api/v1/users` (List Users): List users belonging to the `tenantId`. Requires 'admin' or 'manager' role.
    - `GET /api/v1/users/:userId` (Get User): Get a specific user by ID within the `tenantId`. Requires 'admin' or 'manager' role.
    - `PATCH /api/v1/users/:userId` (Update User): Update user details (name, role, isActive). Requires 'admin' role. Do not allow password change here (separate endpoint later if needed).
    - `DELETE /api/v1/users/:userId` (Delete User): Deactivate or delete a user within the `tenantId`. Requires 'admin' role.
4.  Implement the `restrictTo(...)` authorization middleware factory as shown in `backend_structure.mdc`and apply it to the routes based on the required roles mentioned above.
5.  Ensure all database operations in the service/repository are filtered by `tenantId`.
6.  Use standard API response format and error handling [cite: 40-42, 124-138]."

---

## Task 1.5: Frontend - Implement Auth Pages & API Integration

**Context:**
Create the user interface for Login and Registration, and connect them to the backend API.

- **Pages:** Login page, Registration page.
- **Tech:** Next.js App Router, React Hook Form, Zod, Axios/fetch, Tailwind CSS, shadcn/ui components (`Button`, `Input`, `Label`, `Card`, `Form`)[cite: 474].
- **Reference:** `frontend_guideline_document.mdc`, `app_flow_document.mdc` Authentication Flow.

**Prompt:**
"Implement the frontend Authentication pages and logic:

1.  Create the Login page (`app/login/page.tsx`). Use `Card`, `Form`, `Label`, `Input`, `Button` components from shadcn/ui [cite: 293-303, 303-310, 359-377]. Use React Hook Form and Zod for form handling and validation (email, password required)[cite: 474]. On submit, call the backend `POST /api/v1/auth/login` endpoint. On success, store the received JWT securely (e.g., in an HttpOnly cookie via a backend endpoint `/api/auth/session` or context/local storage - _clarify storage strategy if needed_) and redirect to the dashboard (`/`). Display errors appropriately.
2.  Create the Registration page (`app/register/page.tsx`). Use relevant shadcn/ui components. Include fields for Organization Name, Admin First Name, Last Name, Email, and Password. Use React Hook Form and Zod for validation. On submit, call the backend `POST /api/v1/auth/register` endpoint[cite: 412]. On success, redirect to the login page or dashboard, showing a success message. Display errors appropriately.
3.  Create an API client utility (e.g., using Axios or wrapping `Workspace` in `src/lib/api.ts`) to handle requests to the backend, including setting headers (like `Authorization`) and handling base URL and standard responses/errors."

---

## Task 1.6: Frontend - Implement Basic Layout & Logout

**Context:**
Create the main authenticated application layout, including navigation and logout functionality.

- **Components:** Sidebar, Header.
- **Tech:** Next.js App Router Layouts, shadcn/ui components.
- **Reference:** `frontend_guideline_document.mdc` Layout examples.

**Prompt:**
"Implement the main application layout for authenticated users:

1.  Create a root layout (`app/layout.tsx`) if not already sufficiently configured. Include providers (e.g., ThemeProvider, QueryClientProvider)[cite: 330].
2.  Create a layout for authenticated routes (e.g., `app/(app)/layout.tsx` or similar grouping). This layout should include:
    - A persistent `Sidebar` component (`src/components/layout/sidebar.tsx`) with navigation links (initially just placeholders like Dashboard, Products, etc.). Use shadcn/ui components for structure and styling[cite: 331].
    - A `Header` component (`src/components/layout/header.tsx`) displayed above the main content area. Include the application title/logo and user account information/menu.
    - The main content area where page components will be rendered (`{children}`)[cite: 332].
3.  Implement state management (e.g., using React Context or Zustand [cite: 478]) to track the user's authentication status based on the presence/validity of the stored token.
4.  Implement protected routing. Unauthenticated users accessing authenticated routes should be redirected to `/login`. This can be done in the authenticated layout or using middleware.
5.  Implement Logout functionality: Add a logout button (e.g., in the `Header` user menu). Clicking it should clear the stored authentication token/session and redirect the user to the `/login` page[cite: 421]."

---

## Task 1.7: Frontend - Implement Tenant User Management UI

**Context:**
Create the UI for tenant admins to list, invite/create, and edit users within their organization.

- **Page:** User Management page (e.g., `/users`).
- **Components:** Data Table, Forms/Modals, Buttons.
- **Tech:** Next.js, React Query/SWR, TanStack Table, shadcn/ui components (`DataTable`, `Dialog`, `Form`, `Input`, `Select`, `Button`)[cite: 474].
- **Reference:** Backend API from Task 1.4. `frontend_guideline_document.mdc` Table and Form components [cite: 311-329, 359-377].

**Prompt:**
"Implement the User Management UI for tenant administrators:

1.  Create a new page (e.g., `app/(app)/users/page.tsx`).
2.  Fetch the list of users for the current tenant using React Query/SWR by calling the `GET /api/v1/users` endpoint. Include logic to handle loading and error states.
3.  Display the users in a `DataTable` component (based on `shadcn/ui`'s example using TanStack Table). Columns should include Name, Email, Role, Status (Active/Inactive), and Actions (Edit, Delete).
4.  Implement a button to 'Add User' or 'Invite User'. Clicking this should open a `Dialog` (modal) containing a `Form`.
5.  The 'Add User' form should collect First Name, Last Name, Email, and Role (use a `Select` component). On submit, call the `POST /api/v1/users` endpoint. Handle success (close modal, refresh user list) and errors (display messages in the form).
6.  Implement the 'Edit' action button in the table. Clicking it should open a similar `Dialog` pre-filled with the selected user's data. Allow editing Name, Role, and Status (IsActive). On submit, call the `PATCH /api/v1/users/:userId` endpoint. Handle success and errors.
7.  Implement the 'Delete' action button (use an icon button). Clicking it should show a confirmation `AlertDialog`. On confirmation, call the `DELETE /api/v1/users/:userId` endpoint. Handle success (refresh list) and errors.
8.  Ensure the UI respects roles (e.g., disable certain actions if the logged-in user is not an 'admin'). Fetch the current user's role from the auth context/token."

---

## Task 1.8: Backend - Write Phase 1 Tests

**Context:**
Write unit and integration tests for the backend features developed in Phase 1.

- **Scope:** Auth Service, User Service, Org/Plan Services (if implemented), Auth Endpoints, User Endpoints, Org/Plan Endpoints.
- **Tech:** Jest, Supertest.
- **Reference:** Testing strategy in `backend_structure.mdc`. `cursor_project_rules.mdc` Testing section.

**Prompt:**
"Write unit and integration tests for the Phase 1 backend features:

1.  **Unit Tests (Jest):**
    - Test `AuthService`: Mock repositories/dependencies. Test registration logic (hashing), login logic (password comparison, token generation). Test edge cases and error handling.
    - Test `UserService`: Mock repositories. Test user creation, retrieval, update, deletion logic, ensuring tenant scoping is considered. Test role checks if implemented in the service.
    - Test `OrganizationService` / `PlanService`: Mock repositories. Test basic CRUD logic.
    - Test JWT utilities (`generateToken`, `verifyToken`).
2.  **Integration Tests (Jest + Supertest):**
    - Test Auth Endpoints (`/api/v1/auth/register`, `/api/v1/auth/login`): Use Supertest to make HTTP requests to the running app instance (connected to a test database). Verify successful registration/login, correct status codes, response formats, and error handling (e.g., invalid credentials, existing user). Seed necessary data (e.g., default plan) and clean up afterwards.
    - Test User Management Endpoints (`/api/v1/users`): Simulate requests with valid JWTs for different roles (admin, manager). Test creating, listing, getting, updating, and deleting users. Verify tenant isolation (a user from tenant A cannot manage users in tenant B). Test role restrictions (`restrictTo` middleware). Verify response formats and error handling (e.g., user not found, validation errors).
    - Test Backoffice Endpoints (`/api/v1/backoffice/...`): Test basic CRUD operations, ensuring the temporary access control works.
3.  Ensure tests follow the structure and mocking strategies outlined in `backend_structure.mdc`."

---
