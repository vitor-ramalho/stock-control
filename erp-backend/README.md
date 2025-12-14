# ERP Backend - Multi-Tenant SaaS

A multi-tenant SaaS ERP backend built with NestJS, TypeORM, and PostgreSQL.

## Features

- ✅ Multi-tenant architecture with `tenantId` in all entities
- ✅ JWT authentication
- ✅ User management with role-based access
- ✅ Tenant management
- ✅ TypeORM migrations
- ✅ Seed command for initial data
- ✅ Clean modular architecture

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator & class-transformer

## Project Structure

```
src/
├── common/
│   ├── decorators/
│   │   ├── tenant-id.decorator.ts    # Extract tenantId from request
│   │   ├── current-user.decorator.ts # Extract current user
│   │   └── public.decorator.ts       # Mark routes as public
│   ├── interceptors/
│   │   └── tenant.interceptor.ts     # Global tenant context
│   └── middleware/
│       └── tenant.middleware.ts      # Extract X-Tenant-ID header
├── modules/
│   ├── auth/                         # Authentication module
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── strategies/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── tenant/                       # Tenant management
│   │   ├── entities/
│   │   ├── dto/
│   │   ├── tenant.controller.ts
│   │   ├── tenant.service.ts
│   │   └── tenant.module.ts
│   └── users/                        # User management
│       ├── entities/
│       ├── dto/
│       ├── users.controller.ts
│       ├── users.service.ts
│       └── users.module.ts
├── commands/                         # CLI commands
│   ├── seed.command.ts
│   └── command.module.ts
├── config/
│   └── typeorm.config.ts            # TypeORM configuration
├── migrations/                       # Database migrations
├── app.module.ts
├── main.ts
└── cli.ts
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=erp_saas

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=7d

PORT=3000
NODE_ENV=development
```

3. Create the database:
```bash
createdb erp_saas
```

4. Build the project:
```bash
npm run build
```

5. Run migrations:
```bash
npm run migration:run
```

6. Seed the database:
```bash
npm run seed
```

This will create:
- Default tenant (slug: `default`)
- Admin user:
  - Email: `admin@example.com`
  - Password: `admin123`

**Important**: Note the `Tenant ID` displayed after seeding. You'll need this for API requests.

### Running the Application

Development mode:
```bash
npm run start:dev
```

Production mode:
```bash
npm run build
npm run start:prod
```

The API will be available at: `http://localhost:3000/api`

## API Usage

### Authentication

All requests (except auth endpoints) require the `X-Tenant-ID` header.

#### Register
```bash
POST /api/auth/register
Headers:
  X-Tenant-ID: <your-tenant-id>
  Content-Type: application/json
Body:
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```bash
POST /api/auth/login
Headers:
  X-Tenant-ID: <your-tenant-id>
  Content-Type: application/json
Body:
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin",
    "tenantId": "uuid"
  },
  "access_token": "jwt-token"
}
```

### Protected Routes

For protected routes, include the JWT token:

```bash
GET /api/users
Headers:
  X-Tenant-ID: <your-tenant-id>
  Authorization: Bearer <your-jwt-token>
```

## Multi-Tenancy

This application implements multi-tenancy using a **shared database** with `tenantId` column:

1. **All entities** must include `tenantId`
2. **All queries** are automatically filtered by tenant
3. The `X-Tenant-ID` header is **required** on every request
4. The `TenantMiddleware` extracts and validates the header
5. The `TenantInterceptor` ensures tenant context in all operations

### Adding Tenant-Aware Entities

```typescript
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;  // Always include this!

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  // Your other columns...
}
```

### Querying with TenantId

```typescript
@Injectable()
export class ProductService {
  async findAll(tenantId: string): Promise<Product[]> {
    return this.repository.find({
      where: { tenantId },  // Always filter by tenantId!
    });
  }
}
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run start` | Start the application |
| `npm run start:dev` | Start in development mode with watch |
| `npm run build` | Build the project |
| `npm run migration:generate -- src/migrations/MigrationName` | Generate a new migration |
| `npm run migration:run` | Run pending migrations |
| `npm run migration:revert` | Revert the last migration |
| `npm run seed` | Seed database with initial tenant and admin |
| `npm run lint` | Lint the code |
| `npm run test` | Run unit tests |

## Database Migrations

### Generate a migration
```bash
npm run migration:generate -- src/migrations/AddProductsTable
```

### Run migrations
```bash
npm run migration:run
```

### Revert last migration
```bash
npm run migration:revert
```

## User Roles

- `admin` - Full access to all resources
- `manager` - Manage products, inventory, view reports
- `cashier` - POS operations, cash register
- `user` - Basic read access

## Security

- Passwords are hashed using bcrypt (10 rounds)
- JWT tokens expire in 7 days (configurable)
- All routes require authentication (except auth endpoints)
- Multi-tenant isolation ensures data separation

## Development Guidelines

1. **Always include tenantId** in new entities
2. **Filter all queries** by tenantId
3. Use **DTOs** for validation
4. Follow **NestJS best practices**
5. Write **migrations** for schema changes
6. Keep modules **independent and clean**

## Troubleshooting

### Database connection errors
- Ensure PostgreSQL is running
- Check `.env` credentials
- Verify database exists

### Migration errors
- Build the project first: `npm run build`
- Check migration files in `dist/migrations/`
- Ensure TypeORM config is correct

### Tenant header missing
- All requests need `X-Tenant-ID` header
- Get tenant ID from seed output or database

## Next Steps

This backend is ready for:
- ✅ Products module
- ✅ Stock/Inventory module
- ✅ POS/Sales module
- ✅ Cash register module
- ✅ Financial entries
- ✅ Reports and analytics

## License

UNLICENSED - Private project
