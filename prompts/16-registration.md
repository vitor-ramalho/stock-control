You are building the **Company + Admin User Registration Page** for the ERP SaaS system.

### Route
`/register`

### Purpose
A new company signs up and creates the **primary admin user** and **tenant** in one operation.

### Requirements
- Multi-step or single-page form (choose whichever is simpler).
- Use client components + react-hook-form + Zod validation.
- Submit to backend endpoint:  
  `POST /api/auth/register`

### Form Fields

#### Company
- companyName (required)
- companyEmail (required)
- companyPhone (optional)

#### Admin User
- fullName (required)
- email (required)
- password (required, min 6 chars)
- confirmPassword

### Payload Format
```json
{
  "company": {
    "name": "...",
    "email": "...",
    "phone": "..."
  },
  "user": {
    "fullName": "...",
    "email": "...",
    "password": "..."
  }
}
