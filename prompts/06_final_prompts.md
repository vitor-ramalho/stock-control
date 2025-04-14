# Phase 6: Refinement, Deployment & Documentation Prompts

## Task 6.1: Refinement - UI/UX, Performance, Error Handling

**Context:**
Address any known UI/UX issues, optimize performance bottlenecks, and enhance error handling based on testing and feedback.

- **Scope:** Frontend and Backend.
- **Tools:** Browser DevTools (Lighthouse, Profiler), Backend logging/profiling, Database query analysis (EXPLAIN).

**Prompt:**
"Perform refinement tasks across the application:

1.  **UI/UX:** Review the application flow and component interactions based on `app_flow_document.mdc`and any user feedback. Address inconsistencies, improve usability, and enhance visual polish according to `frontend_guideline_document.mdc`. (Provide specific feedback if available).
2.  **Frontend Performance:**
    - Analyze bundle sizes and identify opportunities for code splitting or dependency reduction.
    - Profile component rendering times and optimize expensive components using `React.memo` or other techniques.
    - Ensure efficient data fetching patterns with React Query/SWR, minimizing unnecessary requests.
    - Optimize image loading.
3.  **Backend Performance:**
    - Identify slow API endpoints using logging or monitoring tools.
    - Analyze database query performance using PostgreSQL's `EXPLAIN ANALYZE` and optimize Prisma queries and indexes where necessary.
    - Implement caching strategies (e.g., using Redis) for frequently accessed, non-critical data if beneficial.
4.  **Error Handling & Logging:**
    - Review error handling middleware and service-level error catching. Ensure user-friendly messages are sent to the frontend while detailed logs are kept on the backend.
    - Enhance logging to include more context where needed for easier debugging. Ensure logs include organization context."

---

## Task 6.2: Deployment Setup

**Context:**
Prepare the application for production deployment.

- **Scope:** Frontend, Backend, Infrastructure.
- **Tech:** Docker, CI/CD platform (e.g., GitHub Actions), Hosting providers (e.g., Vercel, AWS/Fly.io/Heroku).
- **Reference:** `implementation_plan.mdc` Phase 6. `tech_stack_document.mdc`.

**Prompt:**
"Configure the application for production deployment:

1.  **Backend Dockerization:** Create a production-ready `Dockerfile` for the backend Node.js application. Optimize for small image size and security. Consider multi-stage builds. Ensure it correctly handles environment variables for production.
2.  **Frontend Build:** Ensure the Next.js frontend builds correctly for production (`npm run build`). Configure static exports or server deployment as appropriate for your chosen hosting (e.g., Vercel handles this well).
3.  **Environment Variables:** Define and securely manage all required production environment variables (Database URL, JWT Secret, API URLs, external service keys, etc.). Do _not_ commit secrets. Use the hosting provider's secrets management.
4.  **CI/CD Pipeline:** Update the CI/CD pipeline (from Task 0.4) to include build steps for production images/artifacts and deployment steps to the chosen hosting providers (e.g., push Docker image to registry, deploy to Vercel, deploy backend container service). Trigger deployments on merges to the `main` branch.
5.  **Database:** Ensure the production PostgreSQL database is configured, accessible, and secured. Run Prisma migrations as part of the deployment process using `npx prisma migrate deploy`.
6.  **Infrastructure:** Configure hosting services (e.g., Vercel for frontend, AWS/Fly.io/Heroku for backend). Set up load balancing, SSL certificates, and domain names."

---

## Task 6.3: Documentation Finalization

**Context:**
Update and finalize project documentation.

- **Scope:** README files, API documentation, potentially user guides.
- **Reference:** `cursor_project_rules.mdc` Documentation section.

**Prompt:**
"Finalize project documentation:

1.  **README Files:** Update the `README.md` in both frontend and backend repositories. Ensure they include:
    - A clear project description.
    - Updated setup instructions for local development.
    - Instructions for running tests.
    - Details on the build process.
    - Notes on deployment targets and processes.
    - Links to relevant guideline documents (.mdc files).
2.  **API Documentation:** Generate or update the OpenAPI/Swagger documentation for the backend API. Ensure it accurately reflects all endpoints, request/response schemas, and authentication requirements. Host the documentation (e.g., using Swagger UI integrated into the backend or a separate service).
3.  **Code Comments:** Review code for clarity and add/update JSDoc/TSDoc comments where necessary, especially for shared utilities, services, and complex logic.
4.  **(Optional) User Guide:** Create basic user guide documentation explaining core features for end-users (admins, managers, employees)."

---

## Task 6.4: E2E Testing (Optional)

**Context:**
Implement end-to-end tests for critical user flows if time permits and deemed necessary.

- **Scope:** Critical user paths (registration, login, product creation, sale creation).
- **Tech:** Cypress or Playwright.
- **Reference:** `implementation_plan.mdc` Phase 6[cite: 468].

**Prompt:**
"(Optional) Implement End-to-End (E2E) tests for critical user flows using Cypress or Playwright:

1.  Set up the chosen E2E testing framework in a separate test directory or within the frontend repository.
2.  Configure base URLs and environment settings for running against a staging or dedicated E2E environment.
3.  Write test scripts for flows like:
    - User Registration and Login.
    - Creating a new Product.
    - Adding a Client.
    - Creating and completing a Sale.
    - Verifying stock level changes after a sale.
4.  Focus on validating the complete flow across UI interactions and expected outcomes. Keep tests high-level and resilient to minor UI changes.
5.  Integrate E2E tests into the CI/CD pipeline to run against the staging environment after deployment (optional, can be run manually)."

---
