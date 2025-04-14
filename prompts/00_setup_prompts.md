# Phase 0: Setup & Foundation Prompts

## Task 0.1: Initialize Backend Project

**Context:**
We are starting the backend for a multi-tenant SaaS stock management application.

- **Tech Stack:** Node.js (v20+), Express.js, TypeScript (v5+) [cite: 474]
- **Database:** PostgreSQL (v16+) with Prisma ORM [cite: 474]
- **Rules:** Follow guidelines in `backend_structure.mdc`, `tech_stack_document.mdc`, and `cursor_project_rules.mdc`.

**Prompt:**
"Initialize a new Node.js project using TypeScript. Set up an Express.js server (`src/app.ts`)[cite: 404]. Install necessary core dependencies: `express`, `@prisma/client`, `dotenv`, `bcryptjs`, `jsonwebtoken`, `cors`, `typescript`, `@types/node`, `@types/express`, etc.[cite: 403]. Configure TypeScript (`tsconfig.json`) for strict mode and paths (`@/*`)[cite: 477]. Implement the basic directory structure as defined in `backend_structure.mdc` (src/api, src/domain, src/infrastructure, etc.). Setup ESLint and Prettier with recommended TypeScript configurations [cite: 405, 207-213]. Configure environment variable handling using `dotenv` [cite: 405, 247-251]. Setup basic Winston or Pino logging configured via environment variables[cite: 406]."

---

## Task 0.2: Initialize Frontend Project

**Context:**
We are starting the frontend for the SaaS application.

- **Tech Stack:** Next.js (v14+ App Router), TypeScript (v5+), Tailwind CSS, shadcn/ui [cite: 474]
- **Rules:** Follow guidelines in `frontend_guideline_document.mdc`, `tech_stack_document.mdc`, and `cursor_project_rules.mdc`.

**Prompt:**
"Initialize a new Next.js project using `create-next-app` with TypeScript and Tailwind CSS support[cite: 407]. Ensure the App Router is used. Configure TypeScript (`tsconfig.json`) with strict mode and paths (`@/*`)[cite: 477]. Setup ESLint and Prettier [cite: 407, 207-213]. Implement the basic folder structure (`components`, `app`, `lib`, `styles`, etc.)[cite: 408, 479]. Configure Tailwind CSS (`tailwind.config.js`, `globals.css`) including theme extensions if necessary based on `frontend_guideline_document.mdc` [cite: 408, 267-293]. Install `shadcn/ui` CLI and set it up."

---

## Task 0.3: Backend Database Setup

**Context:**
Set up the PostgreSQL database and Prisma ORM configuration.

- **Database:** PostgreSQL (v16+) [cite: 474]
- **ORM:** Prisma [cite: 474]
- **Rules:** Use environment variables for connection strings and follow Prisma best practices.

**Prompt:**
"Initialize Prisma in the backend project using `npx prisma init`. Configure the PostgreSQL connection in `prisma/schema.prisma` using the `DATABASE_URL` environment variable. Create a singleton Prisma Client instance in `src/lib/prisma.ts` to be used throughout the application. Implement proper error handling and connection management. Ensure the Prisma Client is properly instantiated when the application starts[cite: 492]."

---

## Task 0.4: Basic CI Setup

**Context:**
Set up a basic Continuous Integration pipeline.

- **Platform:** GitHub Actions (or specify another if preferred)
- **Goals:** Linting, Type Checking, Building, Prisma Generation

**Prompt:**
"Create a basic CI workflow file (e.g., `.github/workflows/ci.yml`) for the backend repository. The workflow should trigger on pushes to `main` and `develop` branches and on pull requests targeting `develop`. It should include steps to:

1. Checkout code.
2. Setup Node.js (v20+).
3. Install dependencies (`npm ci` or `yarn install`).
4. Run Prisma generate (`npx prisma generate`).
5. Run ESLint (`npm run lint` or `yarn lint`)[cite: 411].
6. Run TypeScript compiler check (`npm run typecheck` or `yarn tsc --noEmit`)[cite: 411].
   Repeat this process for the frontend repository, adjusting steps as needed (e.g., build step `npm run build`)."

---
