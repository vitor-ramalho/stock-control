#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Verifying ERP Backend Setup..."
echo ""

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found"
    exit 1
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} v$NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi

# Check PostgreSQL
echo -n "Checking PostgreSQL... "
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version | awk '{print $3}')
    echo -e "${GREEN}✓${NC} $PSQL_VERSION"
else
    echo -e "${RED}✗${NC} PostgreSQL not found"
    exit 1
fi

# Check if .env exists
echo -n "Checking .env file... "
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} Found"
else
    echo -e "${RED}✗${NC} Not found"
    exit 1
fi

# Check if node_modules exists
echo -n "Checking dependencies... "
if [ -d node_modules ]; then
    echo -e "${GREEN}✓${NC} Installed"
else
    echo -e "${RED}✗${NC} Not installed (run: npm install)"
    exit 1
fi

# Check if dist folder exists
echo -n "Checking build... "
if [ -d dist ]; then
    echo -e "${GREEN}✓${NC} Built"
else
    echo -e "${YELLOW}⚠${NC} Not built (run: npm run build)"
fi

# Check database connection
echo -n "Checking database connection... "
DB_HOST=$(grep DB_HOST .env | cut -d '=' -f2)
DB_PORT=$(grep DB_PORT .env | cut -d '=' -f2)
DB_USER=$(grep DB_USERNAME .env | cut -d '=' -f2)
DB_NAME=$(grep DB_DATABASE .env | cut -d '=' -f2)

if PGPASSWORD=$(grep DB_PASSWORD .env | cut -d '=' -f2) psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &> /dev/null; then
    echo -e "${GREEN}✓${NC} Connected to $DB_NAME"
else
    echo -e "${RED}✗${NC} Cannot connect to database"
    echo -e "${YELLOW}   Make sure PostgreSQL is running and database exists${NC}"
    exit 1
fi

# Check if migrations table exists
echo -n "Checking migrations... "
if PGPASSWORD=$(grep DB_PASSWORD .env | cut -d '=' -f2) psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT * FROM migrations LIMIT 1" &> /dev/null; then
    MIGRATION_COUNT=$(PGPASSWORD=$(grep DB_PASSWORD .env | cut -d '=' -f2) psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM migrations")
    echo -e "${GREEN}✓${NC} $MIGRATION_COUNT migration(s) applied"
else
    echo -e "${YELLOW}⚠${NC} Not run (run: npm run migration:run)"
fi

# Check if tenants exist
echo -n "Checking seed data... "
if PGPASSWORD=$(grep DB_PASSWORD .env | cut -d '=' -f2) psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT * FROM tenants LIMIT 1" &> /dev/null; then
    TENANT_COUNT=$(PGPASSWORD=$(grep DB_PASSWORD .env | cut -d '=' -f2) psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM tenants")
    echo -e "${GREEN}✓${NC} $TENANT_COUNT tenant(s) found"
else
    echo -e "${YELLOW}⚠${NC} No tenants (run: npm run seed)"
fi

echo ""
echo -e "${GREEN}✓ Setup verification complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Start the server: npm run start:dev"
echo "  2. Test the API: see API-TESTING.md"
echo "  3. View docs: see README.md or QUICKSTART.md"
