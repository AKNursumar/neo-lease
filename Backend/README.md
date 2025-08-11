# Neo Lease Backend

Production-ready backend scaffold for rental & booking platform.

## Features Implemented (Initial Scaffold)
- NestJS + TypeScript + Prisma (PostgreSQL)
- Auth (register/login) issuing access & refresh JWTs
- Prisma schema covering core domain models
- Global response envelope & Swagger docs
- Dockerfile + docker-compose with Postgres, Redis, MinIO

## Quick Start
```bash
# Copy env
cp .env.example .env
# Start infra + app (first build)
docker compose up --build
# Run migrations (already in app command, but for dev)
npx prisma migrate dev
```

API runs at http://localhost:4000
Swagger docs at http://localhost:4000/api/docs

## Next Steps (Planned)
- Refresh token rotation w/ httpOnly cookies
- RBAC guards & role decorators
- Availability & booking conflict logic (transactions / locks)
- Payments (Razorpay integration & webhooks via BullMQ worker)
- File uploads (signed URL + direct streaming to S3/MinIO)
- Background jobs & metrics (Prometheus)
- API key issuance & rate limiting middleware
- Admin analytics & audit logging

## Testing
```bash
npm run test
```

## Migrations
Prisma schema at prisma/schema.prisma.
Generate client: `npm run prisma:generate`
Create migration: `npx prisma migrate dev --name init`
Deploy migration (prod): `npx prisma migrate deploy`

## Security Notes
- Do NOT use default secrets in production.
- Use Vault/Secrets Manager for secret distribution.
- Enforce TLS at load balancer / ingress.

## License
MIT
