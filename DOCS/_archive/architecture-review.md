# PropManager Pro — Architecture Review v0.6.1

## Ownership Model — Source of Truth

| Entity   | Ownership Path              | Source of Truth            |
| -------- | --------------------------- | -------------------------- |
| Property | Direct                      | `property.userId`          |
| Tenant   | Direct (v0.6.1)             | `tenant.userId`            |
| Unit     | Via Property                | `unit.property.userId`     |
| Lease    | Via Property                | `lease.property.userId`    |
| Payment  | Via Lease → Property        | `payment.lease.propertyId` |
| Finance  | Aggregated (all via userId) | All queries scoped         |

## Authorization Matrix

| Resource | Create | Read  | Update    | Delete |
| -------- | ------ | ----- | --------- | ------ |
| Property | Owner  | Owner | Owner     | Owner  |
| Unit     | Owner  | Owner | Owner     | Owner  |
| Tenant   | Owner  | Owner | Owner     | Owner  |
| Lease    | Owner  | Owner | Owner     | Owner  |
| Payment  | Owner  | Owner | Void Only | Never  |

## Critical Business Rules

### Property

- Property belongs to exactly one user

### Unit

- Unit number unique within a property (`@@unique([propertyId, unitNumber])`)

### Tenant

- Tenant belongs to exactly one user (v0.6.1)
- Email uniqueness: composite @@unique([userId, email]) ✅ v0.6.2

### Lease

- Lease cannot overlap active lease for same unit (business rule in controller)

### Payment

- Payments are never hard deleted
- Payments may only be voided (status: refunded)

### Finance

- Dashboard only aggregates authenticated user's data

## API Conventions

- Auth: `Authorization: Bearer <token>`
- Error format: `{ "message": "..." }`
- Validation: Zod
- Status codes: 200, 201, 204, 400, 401, 404, 409
- All services: `getAll`, `getById`, `create`, `update`, `delete`
- All controllers: `try/catch` → `res.status().json()`

## Database Constraints

- Unit: unique on (propertyId, unitNumber)
- Lease: overlap prevention (application-level)
- Tenant email: @@unique([userId, email]) ✅ v0.6.2

## Known Gaps (v0.6.2 Hardening)

- [x] Tenant email: changed to @@unique([userId, email]) ✅ v0.6.2
- [x] Rate limiting added (express-rate-limit, 100 req/15min) ? v0.6.2
- [x] Error boundary added to root layout ? v0.6.2
- [x] Error messages audited � clean, no leaks ? v0.6.2
- [ ] Prisma migration history needs normalization
- [ ] No automated backups
- [x] Monitoring added (UptimeRobot, 5-min interval) ? v0.6.2
- [ ] No frontend loading/empty/error state audit

## AI-Friendly Conventions

- Every service: `getAll`, `getById`, `create`, `update`, `delete`
- Every controller: `try/catch` → `res.status().json()`
- Auth: `AuthRequest` extends Express Request with `userId`
- Middleware: `authMiddleware` on all protected routes
- Prisma: standard `@prisma/client` imports
- Error format consistent across all endpoints

## Deployment Architecture
