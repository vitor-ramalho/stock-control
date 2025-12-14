You are building the **Categories Management Page** for the ERP SaaS Admin Panel.

### Requirements
- Page at: `/admin/categories`
- Server components for listing + client components for modals.
- Use the provided base layout: `AdminPageLayout`.
- Fetch categories from `GET /api/categories`.
- Show table with:
  - Name
  - Description
  - CreatedAt
  - Actions (Edit/Delete)
- "Create Category" button → opens modal.
- Modals use ShadCN Dialog.

### Create Category Modal
- Fields: name (required), description (optional).
- Submit to: `POST /api/categories`.
- After success: refresh categories table.

### Edit Category Modal
- Same fields as create.
- Submit to: `PUT /api/categories/:id`.

### Delete Category
- Confirmation modal.
- DELETE `/api/categories/:id`.
- Use toast notifications for success/errors.

### Components to create
- `CategoriesTable`
- `CategoryForm`
- `CreateCategoryDialog`
- `EditCategoryDialog`
- `DeleteCategoryDialog`

### Technical Notes
- Use React Query for all data fetching.
- Use optimistic updates where possible.
- Follow clean architecture: keep API calls inside `/lib/api`.

Generate the full implementation.
