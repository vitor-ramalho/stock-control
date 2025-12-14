Configure deployment and operational setup.

Backend:
- Deploy NestJS to Render/Railway
- Use ENV variables for DB, JWT, tenant mode

Frontend:
- Deploy Next.js to Vercel

Database:
- Setup PostgreSQL
- Auto-backup
- Run all migrations on deploy

Observability:
- Add Sentry or Logtail
- Add Winston logger in NestJS

Deliver:
- Dockerfile (optional)
- CI workflow (optional)
