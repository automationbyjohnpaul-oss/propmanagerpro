# PropManager Pro — Decision Log

This document records important architectural, technical, and product decisions
and, most importantly, why they were made.

It is historical/rationale documentation.

It does not override the actual code or the current state documented in `PROJECT_STATE.md`.

> **SSOT RULE:** If implementation and this document disagree, inspect the actual
> implementation, determine the current state, and update this log before proceeding
> with further architectural work. This document is authoritative for WHY decisions
> were made, not for WHAT the current implementation is.

---

## Decision Hierarchy

When interpreting this document:

1. Actual implementation/code is authoritative for what exists.
2. `PROJECT_STATE.md` is authoritative for current project status.
3. `ARCHITECTURE.md` describes intended architecture.
4. This document explains why decisions were made.
5. Older decisions may be superseded by newer decisions.

---

## Decision Lifecycle

```
PENDING → DECIDED → IMPLEMENTED → VERIFIED
```

| Status                | Meaning                                                |
| --------------------- | ------------------------------------------------------ |
| 🟢 Confirmed/Verified | Decision made, implemented, and verified in production |
| 🟡 Planned/Decided    | Decision made, implementation pending                  |
| ⚪ Pending            | Decision required — do not implement until decided     |
| 🔴 Rejected           | Approach explicitly rejected — do not reintroduce      |
| 🟠 Implemented        | Applied but not yet verified in production             |

> **Important:** Implementation status records whether the decision was implemented
> at the time it was recorded. It does not override `PROJECT_STATE.md` or current
> code when determining present state. Always verify against actual implementation.

---

# Product Decisions

## D-001 — Mobile-First Product Strategy

**Status:** 🟢 Confirmed
**Implementation:** ✅ Applied

**Decision:** PropManager Pro will prioritize mobile-first workflows.

**Reason:** The target user is a small landlord who may manage properties primarily
through a phone. The product should optimize for fast actions, simple navigation,
minimal data entry, clear financial information, and usability on small screens.

Desktop functionality remains important but should not dictate the primary UX.

---

## D-002 — Small-Landlord MVP

**Status:** 🟢 Confirmed
**Implementation:** ✅ Applied

**Decision:** Initial product focus is landlords managing approximately 1–10 units.

**Reason:** Large property-management platforms already provide extensive functionality.
Competing feature-for-feature would create unnecessary complexity. PropManager Pro
should win through simplicity, affordability, ease of use, and clear workflows.

---

## D-003 — Simplicity Over Feature Quantity

**Status:** 🟢 Confirmed

**Decision:** Features should be added only when they solve a meaningful user problem.

**Reason:** The product principle is: reliability and usability are more valuable
than feature count. The project should avoid becoming a bloated platform.

---

# Stack Decisions

## D-004 — Next.js Frontend

**Status:** 🟢 Confirmed
**Implementation:** ✅ Applied

**Decision:** Use Next.js with the App Router and TypeScript.

**Reason:** Provides modern React architecture, TypeScript support, routing,
production deployment compatibility, strong ecosystem, and good AI-assisted
development support.

---

## D-005 — Express Backend

**Status:** 🟢 Confirmed
**Implementation:** ✅ Applied

**Decision:** Use Node.js + Express + TypeScript for the backend.

**Reason:** Express provides a relatively simple and transparent REST API
architecture. This supports the project's requirement for an AI-debuggable
and readable backend.

> ⚠️ The backend is Express, NOT NestJS. Do not confuse these.

---

## D-006 — Prisma ORM

**Status:** 🟢 Confirmed
**Implementation:** ✅ Applied

**Decision:** Use Prisma for database access.

**Reason:** Prisma provides typed database access, explicit schema, migration
support, and strong TypeScript integration. It also makes database relationships
easier for AI-assisted development to reason about.

---

## D-007 — PostgreSQL via Supabase

**Status:** 🟢 Confirmed
**Implementation:** ✅ Applied

**Decision:** Production database is PostgreSQL hosted through Supabase.

**Reason:** SQLite was useful during early development, but production SaaS
requirements favor PostgreSQL for concurrent access, reliability, production
scalability, and managed hosting.

---

## D-008 — JWT Authentication

**Status:** 🟢 Confirmed
**Implementation:** ✅ Applied

**Decision:** Authentication uses JWT tokens with 7-day expiration.

**Reason:** JWT provides a straightforward stateless authentication mechanism
between the frontend and REST backend. The frontend stores the JWT client-side
and sends it using the Bearer authentication scheme.

**JWT payload:** `{ userId, email, role }`

---

## D-009 — bcrypt Password Hashing

**Status:** 🟢 Confirmed
**Implementation:** ✅ Applied (salt rounds: 10)

**Decision:** Passwords are hashed using bcrypt.

**Reason:** Passwords must never be stored in plaintext. The backend hashes
passwords during registration and verifies them during login.

---

# Security Decisions

## D-010 — User-Scoped Resources

**Status:** 🟢 Confirmed
**Implementation:** ✅ Applied

**Decision:** User-owned resources must be scoped using the authenticated
user's identity (`req.userId`). Never trust a client-supplied user ID.

**Reason:** Authentication alone is insufficient. A valid user must not be
able to access another user's resources simply by changing a resource ID.
This is a foundational multi-tenant security requirement.

**Correct pattern:**

```typescript
prisma.property.findFirst({ where: { id, userId: req.userId } });
```

**Dangerous — never use:**

```typescript
prisma.property.findUnique({ where: { id } });
```

---

## D-011 — Reject `leases: { none: {} }` Tenant Query

**Status:** 🔴 Rejected
**Implementation:** N/A — rejected approach

**Decision:** Never use `leases: { none: {} }` in tenant queries.

**Reason:** Returns all unleased tenants regardless of owner. This exposes
every landlord's unleased tenants to every other landlord — a critical
multi-tenant isolation breach.

**Resolution:** Added `userId` directly to Tenant model (see D-017).

**Do not reintroduce this pattern.**

---

## D-012 — Soft Delete over Hard Delete

**Status:** 🟢 Confirmed
**Implementation:** ✅ Applied

**Decision:** Properties, Units, and Tenants use soft delete (`deletedAt`)
rather than hard delete.

**Reason:** These records have financial history (leases, payments) that must
be preserved for accounting integrity. Hard deleting would destroy historical
rent records.

**Rule derived:** Payments must never be hard deleted. Void by status change only.

---

## D-013 — Financial Correctness Over Convenience

**Status:** 🟢 Confirmed

**Decision:** Financial records and calculations receive special protection.

**Reason:** Incorrect financial data can damage user trust and create
real-world consequences. Business rules include controlled payment mutation
behavior and explicit financial calculations.

---

# Frontend Decisions

## D-014 — Centralized API Service

**Status:** 🟢 Confirmed
**Implementation:** ✅ Applied

**Decision:** `frontend/src/services/api.ts` is the primary frontend API abstraction.

**Reason:** The service centralizes authentication headers, error handling,
401 handling, request deduplication, HTTP methods, and API base URL handling.
A second competing API client increases maintenance complexity.

**Note:** `frontend/src/lib/api-client.ts` exists but appears unused.
Verify before removing.

---

## D-015 — API Base URL Must Not Contain `/api`

**Status:** 🟢 Confirmed
**Implementation:** ✅ Applied

**Decision:** `NEXT_PUBLIC_API_URL` contains the backend origin only.

```text
Correct:   https://propmanagerpro-production.up.railway.app
Wrong:     https://propmanagerpro-production.up.railway.app/api
```

**Reason:** Services append `/api/...` to the base URL. Including `/api`
in the base URL produces `/api/api/...` routing errors.

---

# Deployment Decisions

## D-016 — Railway for Backend

**Status:** 🟡 Decided
**Implementation:** 🟠 Previously applied — currently expired

**Decision:** Railway is used for backend deployment.

**Reason:** Railway provides a straightforward deployment environment suitable
for the Node.js backend and integrates cleanly with Git-based deployments.

**Current state:** Railway subscription expired. Backend must be redeployed.

---

## D-017 — Vercel for Frontend

**Status:** 🟢 Confirmed
**Implementation:** 🟡 Previously deployed — connectivity unverified

**Decision:** Vercel is the frontend deployment target.

**Reason:** Next.js and Vercel integrate naturally, simplifying frontend deployment.

---

## D-018 — EU West Region for All Infrastructure

**Status:** 🟢 Confirmed
**Implementation:** 🟠 Previously applied — current deployment unverified

**Decision:** Railway (EU West / Amsterdam) and Supabase (EU West /
aws-0-eu-west-1) in the same region.

**Reason:** Lower latency between backend and database. Consistent data
residency. Switched from Railway US West after a regional incident during
initial setup.

**Impact:** Any future infrastructure must maintain EU West placement.

---

## D-019 — Transaction Pooler for Railway → Supabase

**Status:** 🟢 Confirmed
**Implementation:** 🟠 Previously applied — current deployment unverified

**Decision:** Railway connects to Supabase via transaction pooler (port 6543),
not direct connection (port 5432).

**Reason:** Railway's network cannot reach Supabase direct connection.

**Connection format:**

```
postgresql://postgres.[project-id]:[password]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

---

## D-020 — Explicit Production Build Process

**Status:** 🟡 Decided
**Implementation:** ❌ Not yet applied

**Decision:** Production builds should explicitly perform critical steps in
observable, separate commands. No `postinstall` hooks for production-critical
operations.

**Reason:** Implicit lifecycle hooks make deployments harder to reason about
and harder to debug. Failures should be isolatable by step.

**Current state (not target):**

```json
"build": "tsc",
"start": "npx prisma migrate deploy && node dist/server.js",
"postinstall": "prisma generate"
```

**Target configuration:**

```
Build:      npm ci && npx prisma generate && npm run build
Pre-deploy: npx prisma migrate deploy
Start:      node dist/server.js
```

**Action:** Apply on next Railway redeployment.

---

## D-021 — Non-Blocking Startup Health Checks

**Status:** 🟡 Decided — under review

**Decision:** Startup database checks currently run without blocking server startup.

**Reason:** The existing implementation allows the server to start while health
validation reports failures through logging.

**Future review:** Production hardening should determine whether critical
dependency failure should prevent readiness declaration.

---

# Architecture Decisions

## D-022 — Tenant Direct Ownership via userId

**Status:** 🟢 Confirmed
**Implementation:** ✅ Applied

**Decision:** Tenant model has direct `userId` field for ownership.

**Reason:** Original design inferred tenant ownership through leases
(`Tenant → Lease → Property → User`). This created a circular dependency —
tenants were invisible until a lease existed, but leases required selecting
a tenant. Direct `userId` ownership breaks the cycle and simplifies queries.

---

## D-023 — Lemon Squeezy as SaaS Billing Provider

**Status:** 🟡 Decided
**Implementation:** ❌ Not started (Phase 5)

**Decision:** Use Lemon Squeezy for subscription billing (not Stripe).

**Reason:** Lemon Squeezy acts as Merchant of Record — handles taxes,
compliance, and global payouts. No US LLC required. Works from Nigeria.
Simpler integration for solo founder at MVP stage.

**Domain clarity:**

- Domain A: Tenant → Landlord rent payments (built — existing Payment model)
- Domain B: Landlord → PropManager Pro subscriptions (Phase 5 — not built)

**Schema impact:** Billing tables not yet designed. Do not harden schema
before billing model is defined.

---

## D-024 — Read-Only Mode for Inactive Subscriptions

**Status:** 🟡 Decided
**Implementation:** ❌ Not started (Phase 5)

**Decision:** When subscription is inactive, downgrade to read-only mode
rather than blocking access entirely.

**Reason:** Hard block risks destroying user trust if a card fails for
reasons outside the user's control. Read-only preserves data access while
enforcing the subscription requirement.

---

## D-025 — Property.unitCount Semantic Ownership

**Status:** ⚪ Pending — decision required before schema hardening
**Implementation:** ❌ Blocked on decision

**Problem:** `Property.unitCount` currently serves dual roles:

1. Input: determines how many Unit records to auto-generate on creation
2. Storage: stored value that can drift from actual Unit count

**Current behavior (verified):**

- Creating property with `unitCount: N` generates N Unit records ✅
- Updating `unitCount` does NOT sync Unit records ❌
- Deleting a Unit does NOT update `unitCount` ❌

**Options:**

Option A — Derived count (recommended):
Remove stored `unitCount`. Compute from actual Unit records at query time.
Eliminates drift entirely.

Option B — Intended capacity:
Keep as "planned unit capacity" config value. UI must distinguish planned
vs actual units.

**Decision required from:** AutomationJaaypee
**Must be recorded here before:** Any unitCount refactor or schema hardening

---

# Documentation Decisions

## D-026 — Documentation as Project Infrastructure

**Status:** 🟢 Confirmed

**Decision:** Maintain a structured documentation hierarchy.

**Reason:** PropManager Pro is developed with substantial AI assistance.
A clear documentation system reduces context loss between chats and makes
future AI continuation significantly more reliable.

---

## D-027 — AI Handoff Document

**Status:** 🟢 Confirmed

**Decision:** Maintain `AI_HANDOFF.md` as the compact entry point for new
AI sessions.

**Reason:** Long conversations eventually become inefficient. The handoff
document provides a compact continuation point optimized for starting a
fresh AI conversation containing current state, architecture, known issues,
active phase, next task, and important constraints.

---

## D-028 — Single Source of Truth Hierarchy

**Status:** 🟢 Confirmed

**Decision:** The project maintains an explicit source-of-truth hierarchy.

**Reason:** Multiple documents can otherwise drift apart. The project must
distinguish what actually exists, what the architecture intends, why decisions
were made, what changed historically, and what is planned.

**Hierarchy:**

```
1. Actual code/database/deployed behavior
2. PROJECT_STATE.md
3. ARCHITECTURE.md
4. DECISION_LOG.md
5. DOCS/
6. CHANGELOG.md
7. TODO.md
8. AI_HANDOFF.md
```

---

## Template for New Decisions

```markdown
## D-XXX — [Title]

**Status:** [🟢 Confirmed / 🟡 Decided / ⚪ Pending / 🔴 Rejected / 🟠 Implemented]
**Implementation:** [✅ Applied / ❌ Not started / N/A]

**Decision:** [What was decided — one clear sentence]

**Reason:** [Why this decision was made]

**Impact:** [What this affects]

**Action:** [If not yet implemented — what needs to happen next]
```

---

_Last updated: August 2026_
_Migrated and consolidated from two separate decision log versions._
_Original decisions D-001 through D-020 preserved. Added D-021 through D-028_
_from architecture audit session. Decision lifecycle and status markers added._
