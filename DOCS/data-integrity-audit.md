# Data Integrity Audit — PropManager Pro

## Foreign Keys

| Table    | FK         | References  | On Delete |
|----------|------------|-------------|-----------|
| Property | userId     | User.id     | Cascade   |
| Unit     | propertyId | Property.id | Cascade   |
| Lease    | propertyId | Property.id | Cascade   |
| Lease    | unitId     | Unit.id     | Cascade   |
| Lease    | tenantId   | Tenant.id   | Cascade   |
| Payment  | leaseId    | Lease.id    | Cascade   |
| Payment  | tenantId   | Tenant.id   | Cascade   |
| Tenant   | userId     | User.id     | Cascade   |

## Unique Constraints

| Table  | Constraint               | Type   |
|--------|--------------------------|--------|
| User   | email                    | Global |
| Unit   | (propertyId, unitNumber) | Scoped |
| Tenant | email                    | Global |

Planned: Tenant email -> @@unique([userId, email])

## Cascade Delete Behavior
Deleting a User cascades to all Properties, Units, Leases, Payments, Tenants.
No soft delete — all data is permanently removed.

## Prisma to Production Consistency
- Local: in sync
- Production: manually aligned (v0.6.1)
- _prisma_migrations: needs normalization
