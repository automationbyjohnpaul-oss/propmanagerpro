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
