#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Stock Control ERP - Quick Start Script   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Step 1: Starting PostgreSQL database...${NC}"
cd erp-backend
docker compose up -d postgres
sleep 3

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${RED}❌ Failed to start PostgreSQL${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📦 Step 2: Running database migrations...${NC}"
npm run migration:run

echo ""
echo -e "${YELLOW}🌱 Step 3: Seeding initial data...${NC}"
npm run seed

echo ""
echo -e "${GREEN}✅ Backend setup complete!${NC}"
echo ""
echo -e "${YELLOW}Default Credentials:${NC}"
echo -e "  Email:    ${GREEN}admin@example.com${NC}"
echo -e "  Password: ${GREEN}admin123${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Start backend:  ${GREEN}cd erp-backend && npm run start:dev${NC}"
echo -e "  2. Start frontend: ${GREEN}cd erp-frontend && npm run dev${NC}"
echo -e "  3. Open browser:   ${GREEN}http://localhost:3001${NC}"
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Setup Complete! 🎉              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
