
---

# 🚀 **3. Prompt – Backoffice (Global Admin Only)**

```markdown
You are building the **Global Backoffice Admin Panel** for the ERP SaaS system.  
Only the **root system admin** (seeded user) can access this panel.

### Route
`/backoffice`

### Access Rules
- Only users with `role: "superadmin"` can access.
- Validate role using:
  - Decode JWT stored in localStorage
  - If no valid token or not superadmin → redirect to `/login`

### Purpose
Manage all companies (tenants) in the system.

### Required Features
1. **List all companies**
   - Fetch: `GET /api/backoffice/tenants`
   - Columns:
     - Name
     - Email
     - Status (active/inactive)
     - CreatedAt
     - Actions: Enable / Disable

2. **Enable/Disable Company**
   - Button toggles tenant status
   - Request:
     `PATCH /api/backoffice/tenants/:id/status`
   - Payload:
     `{ "isActive": boolean }`
   - Confirm modal before action
   - Toast on success/error

3. **Company Details Drawer/Modal**
   - Show:
     - Company name
     - Company email
     - CreatedAt
     - User list (`GET /api/backoffice/tenants/:id/users`)
   - Read-only for now

### Components to generate
- `BackofficeLayout`
- `TenantTable`
- `ToggleTenantStatusDialog`
- `TenantDetailsDrawer`

### Technical Notes
- Use React Query for all data fetching.
- Use server components only for static layout; tables must be client components.
- Add breadcrumb: Backoffice / Tenants
- Make the UI consistent with the rest of the admin panel (Shadcn UI).

Generate the entire backoffice section (pages, components, queries, layout).
