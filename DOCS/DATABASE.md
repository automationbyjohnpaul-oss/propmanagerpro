# PropManager Pro — Database

---

# Database Technology

```text
PostgreSQL
Supabase-hosted
Prisma ORM
```

---

# Schema Authority

The Prisma schema is the implementation source of truth.

Schema location:

```text
backend/prisma/schema.prisma
```

Migrations:

```text
backend/prisma/migrations/
```

If this document conflicts with the Prisma schema, the schema wins.

---

# Core Entities

Current known entities include:

```text
User
Property
Unit
Tenant
Lease
Payment
```

---

# Ownership Model

```text
User
 │
 ├── Property.userId
 │
 └── Tenant.userId

Property
 │
 └── Units

Unit
 │
 └── Leases

Tenant
 │
 └── Leases

Lease
 │
 └── Payments
```

All protected queries must enforce authenticated-user ownership.

---

# Lease Status

Current lease lifecycle:

```text
PENDING
ACTIVE
ENDED
TERMINATED
```

There is no current:

```text
EXPIRED
```

status.

There is no current `isActive` field assumption.

Any older documentation referencing `EXPIRED` or `isActive` is stale until verified.

---

# Active Lease Uniqueness

One ACTIVE lease per unit is enforced by the partial unique index:

```sql
CREATE UNIQUE INDEX "leases_one_active_per_unit_idx"
ON "leases" ("unitId")
WHERE "status" = 'ACTIVE';
```

It is defined by migration 20260901120000_add_active_lease_per_unit_unique_index. The ordinary Prisma indexes on status and [unitId, status] do not themselves enforce uniqueness; the SQL migration supplies this protection.

Multiple historical, PENDING, and TERMINATED leases may reference the same unit. Multiple ACTIVE leases on the same unit are blocked, including competing writes subject to this index.

Local database migration state verified: localhost:5432/propmanagerpro had 15 applied migrations and a unique, valid, ready active-lease index. Production database state was not verified. A real concurrent activation test remains pending.

Lease activity is determined by status, not dates. Future date-overlap policy remains a product decision; this index does not prevent overlapping PENDING date ranges.

---

# Financial Rules

Payments should preserve auditable history.

Current policy is void-only rather than destructive deletion.

Finance analytics derive from authoritative payment/lease records.

---

# Migration State

Production migration state requires verification.

Current known risk:

```text
Production database may have been created outside normal Prisma migration tracking.
```

Before running:

```text
prisma migrate deploy
```

verify production migration history.

This item is tracked in:

```text
TODO.md
```

---

# Verification Command

To inspect current schema:

```powershell
Get-Content backend\prisma\schema.prisma
```

To list migrations:

```powershell
Get-ChildItem backend\prisma\migrations
```

---

**End of `DATABASE.md`**
