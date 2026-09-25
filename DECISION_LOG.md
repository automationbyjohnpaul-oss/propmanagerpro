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

Implementation describes observed behavior; an explicit decision describes intended behavior. A disagreement must be flagged, not silently resolved by document age.

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

Reconciliation note (September 7, 2026): historical status labels below are retained. A green label alone is not evidence of current production verification; use explicit verification scope and later resolution notes. Production remains unverified.

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

**Resolution:** Added `userId` directly to Tenant model (see D-022).

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

**Rule derived:** Payments must never be hard deleted. Payment lifecycle and reversal semantics are governed by Payment SSOT D-025.

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

**Current disposition (September 7, 2026):** Local build portion implemented in `4155c2e`: `build: npx prisma generate && tsc`, no `postinstall`. `start` remains `npx prisma migrate deploy && node dist/server.js`. The separate pre-deploy/start target below is not established by current scripts; Railway configuration and production execution remain unverified. Preserve the following status, old configuration, and target as the original record, not current configuration.

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

```text
Build:      npm ci && npx prisma generate && npm run build
Pre-deploy: npx prisma migrate deploy
Start:      node dist/server.js
```

**Action:** Apply on next Railway redeployment.

---

## D-021 — Non-Blocking Startup Health Checks

**Status:** Superseded by the intentional fail-fast change in `1d71c69` (August 24, 2026).

**Original decision:** Startup database checks ran without blocking server startup.

**Historical reason:** The implementation allowed the server to start while health
validation reported failures through logging.

**Subsequent evolution:** `1d71c69` replaced fire-and-forget validation with an awaited check before `app.listen()`. Current startup requires the database `SELECT 1` check to succeed; failure prevents listening and exits with code 1. The commit changed `server.ts` only, without updating this decision record.

**Remaining review:** Startup connectivity and ongoing readiness are separate. `/health` is public HTTP liveness and does not query the database. Actual production monitoring/settings and runtime behavior remain unverified; this reconciliation is based on source and Git history, not new runtime tests.

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

## D-025 — Payment SSOT v1

**Status:** 🟢 Implemented & Verified

**Implementation:** ✅ Payment Integrity Hardening P1 complete

**Decision:** Establish Payment Integrity Hardening rules as the authoritative Payment SSOT for PropManager Pro.

**Rules:**

1. Payments are financial records and must be preserved.
2. Payments must never be hard-deleted.
3. `COMPLETED` payments are immutable.
4. `REFUNDED` payments are immutable.
5. `PENDING` and `FAILED` payments remain editable.
6. Normal payment updates cannot change `status`, `leaseId`, `tenantId`, `propertyId`, or `unitId`.
7. Normal `PUT` operations do not perform payment lifecycle transitions.
8. `REFUNDED` cannot be used as an initial payment status.
9. No `VOID` or `VOIDED` status is introduced.
10. Refund workflow is intentionally deferred to a future phase.
11. Payment business rules are enforced authoritatively at the service layer.
12. Frontend restrictions are UX safeguards only and must not be relied upon for security or integrity.
13. Financial payment mutations remain auditable.

**Architecture Pattern:**

- Service → authorization, business rules, and database mutations
- Controller → HTTP orchestration and audit logging
- Validator → Zod request validation
- Prisma → database access

**Verification:**

- Backend TypeScript: 0 errors
- Frontend TypeScript: 0 errors
- Payment service tests: 20 passed, 0 failed, 0 skipped
- DELETE payment endpoint removed
- Ownership checks verified
- Immutability rules verified

**Deferred:**

Refund workflow remains intentionally deferred. `REFUNDED` is a terminal state in the current Payment SSOT but has no dedicated refund workflow yet.

---

## D-026 — Property.unitCount Semantic Ownership

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

## D-027 — Documentation as Project Infrastructure

**Status:** 🟢 Confirmed

**Decision:** Maintain a structured documentation hierarchy.

**Reason:** PropManager Pro is developed with substantial AI assistance.
A clear documentation system reduces context loss between chats and makes
future AI continuation significantly more reliable.

---

## D-028 — AI Handoff Document

**Status:** 🟢 Confirmed

**Decision:** Maintain `AI_HANDOFF.md` as the compact entry point for new
AI sessions.

**Reason:** Long conversations eventually become inefficient. The handoff
document provides a compact continuation point optimized for starting a
fresh AI conversation containing current state, architecture, known issues,
active phase, next task, and important constraints.

---

## D-029 — Single Source of Truth Hierarchy

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

## D-030 — Move Business Rules to Service Layer (P2.1)

**Status:** 🟢 Implemented & Verified
**Implementation:** ✅ P2.1 complete

### Decision

Business rules that protect domain invariants will be enforced in the
service layer rather than duplicated inside controllers.

### Reason

Controllers should remain focused on HTTP orchestration. Business rules
must remain consistent regardless of which application path invokes the
service.

Duplicating rules between controllers creates a risk that future callers
or endpoints will bypass those rules.

### P2.1 Implementation

The following rules were moved into services:

- Tenant archive → reject when an active lease exists.
- Unit archive → reject when an active lease exists.

Controllers now delegate these decisions to the corresponding services.

### Error Handling

`ConflictError` was introduced for business-rule conflicts and represents
HTTP status 409.

### Verification

- TypeScript: 0 errors
- Tenant service tests: 4/4 passed
- Unit service tests: 4/4 passed
- Payment service tests: 20/20 passed
- Full Vitest suite: 28/28 passed

### Deliberately Deferred

**Later clarification (September 7, 2026):** The following records the P2.1 assumptions at the time. D-037 and the reconciliation dispositions for D-031/D-032/D-033 govern current scope; these historical bullets do not schedule implementation.

The following related inconsistencies were identified but intentionally
deferred to P2.2:

- Hard-delete lease-history validation is duplicated for units.
- Tenant hard-delete lease-history validation requires standardization.
- The definition of an "active lease" is inconsistent between existing
  service/controller logic.

P2.1 preserves the existing active-lease definition rather than changing
business behavior while restructuring code.

---

## D-031 — Unit Hard-Delete Lease-History Rule

**Current disposition (September 7, 2026, approved reconciliation):** Not implemented; inapplicable to current business scope under D-037. Direct service inspection found no unit hard-delete capability. The original proposal below is preserved as history, not an active implementation obligation. Any future hard-delete capability requires an explicit new decision and must address lease-history protection before introduction.

**Status:** 🟡 Decided

**Implementation:** ❌ Not yet completed

**Decision:** `hardDeleteUnit` must be the authoritative service-layer location for the unit hard-delete lease-history protection rule.

**Reason:** The same business rule must not be independently enforced by both the controller and service layer. The service layer is the authoritative location for domain/business rules, consistent with D-030.

**Impact:** The unit controller should orchestrate the HTTP request only. Unit hard-delete eligibility and lease-history protection belong to the unit service.

**Action:** Move the lease-history protection completely into `hardDeleteUnit`, remove the duplicate controller-level check, and add/verify service-layer regression tests.

---

## D-032 — Tenant Hard-Delete Lease-History Rule

**Current disposition (September 7, 2026, approved reconciliation):** Not implemented; inapplicable to current business scope under D-037. Direct service inspection found no tenant hard-delete capability. The original proposal below is preserved as history, not an active implementation obligation. Any future hard-delete capability requires an explicit new decision and must address lease-history protection before introduction.

**Status:** 🟡 Decided

**Implementation:** ❌ Not yet completed

**Decision:** Tenant hard-delete lease-history protection must be enforced authoritatively by the tenant service layer.

**Reason:** Hard-delete business rules must have a single enforcement point. Keeping the rule in the service layer prevents future callers from bypassing the business invariant and keeps the architecture consistent with D-030.

**Impact:** Tenant controllers should remain responsible for HTTP orchestration rather than independently implementing tenant hard-delete business rules.

**Action:** Verify the current tenant hard-delete lease-history behavior, standardize enforcement in the tenant service, and add/verify service-layer regression tests.

---

## D-033 — Standard Active-Lease Definition

**Resolution (September 7, 2026):** Resolved through later D-037. Existing lease, unit, tenant, and finance activity checks use `Lease.status = ACTIVE`; lease dates do not independently define activity. The status-only database index and existing archive tests for past-end-date ACTIVE leases support this finding. No standardization implementation was required; tests were inspected, not rerun. The original incomplete status and rationale below are retained as historical record, superseded by this resolution.

**Status:** 🟡 Decided

**Implementation:** ❌ Not yet completed

**Decision:** PropManager Pro must establish one authoritative definition of an "active lease" and use that definition consistently across relevant unit and tenant business rules.

**Reason:** The P2.1 restructuring preserved existing behavior rather than changing the definition of an active lease. The P2.2 investigation identified inconsistent active-lease checks across existing logic. A single definition is required to prevent different parts of the application from reaching different conclusions about whether a lease is active.

**Impact:** Unit archive, tenant archive, unit hard-delete, tenant hard-delete, and other relevant lease-dependent business rules must use the standardized definition.

**Action:** Review all active-lease checks across the backend, establish the authoritative definition, standardize service-layer implementations, and add regression tests covering the agreed definition.

---

## D-034 — Test Database Cleanup

**Status:** 🟡 Decided

**Implementation:** 🟠 Partially applied

**Decision:** Tests that create persistent database records must explicitly clean up those records using dependency-safe deletion order.

**Reason:** PropManager Pro service tests use a real database and create related users, properties, units, tenants, leases, and payments. Explicit cleanup prevents test data from contaminating subsequent tests and prevents foreign-key dependency failures.

**Impact:** Test setup and teardown must account for relational dependencies. Test cleanup operations such as `prisma.user.delete()` are test-infrastructure operations and must not be interpreted as production user-account hard-delete functionality.

**Action:** Preserve the existing explicit cleanup approach and verify that each database-integrated test suite leaves the test database in a predictable state. Do not introduce a production hard-delete user feature based solely on test cleanup code.

**Later clarification (September 7, 2026):** Explicit test-database isolation is separate from record cleanup. Vitest setup now loads local connection settings, rejects hosts other than `localhost`, rewrites the database name to `propmanagerpro_test`, and validates the resulting target before test/application imports. The dedicated database was initialized from the existing 14 migrations. Guard and Vitest integration checks passed, followed by 77/77 unit tests including two unit reassignment regressions. These results do not prove every cleanup path or failure case; the original cleanup decision and partially applied status remain. Development and production databases were not targeted by these tests.

---

## D-035 — Database-Level Active Lease Uniqueness

**Status:** 🟢 Verified Locally

**Implementation:** ✅ Applied

**Decision:** PostgreSQL enforces at most one ACTIVE lease per unit using a partial unique index.

**Index:**

```text
leases_one_active_per_unit_idx
```

**Migration:**

```text
20260901120000_add_active_lease_per_unit_unique_index
```

**Reason:** Service-layer checks alone cannot prevent concurrent requests from creating two ACTIVE leases for the same unit. A database constraint is required to guarantee the invariant even under race conditions.

**Impact:** The lease service converts concurrent active-lease database conflicts (`P2002`) into a `409 ConflictError` with the message `Unit already has an active lease`.

**Verification:**

- Duplicate ACTIVE lease query returned zero rows before migration.
- Migration applied locally with `prisma migrate dev`.
- `prisma migrate status` reports schema up to date.
- `prisma migrate deploy` reports no pending migrations.
- Lease service regression test covers the database conflict path.
- Full backend test suite passes.

**Production note:** Production database migration state remains unverified because Railway is currently unavailable.

---

## D-036 — Payments Against Ended Leases

**Status:** ⚪ Pending

**Implementation:** ❌ No implementation change made

**Decision:** The business rule for recording payments against an ENDED lease is unresolved.

**Evidence:** Verification established that the current payment workflow permits a payment to be created against an ENDED lease.

**Current classification:** Not currently classified as a defect. There are legitimate scenarios where a payment after lease termination may represent settlement of an outstanding obligation.

**Required business decision:**

Should PropManager Pro:

1. Allow payments against ENDED leases,
2. Reject payments against ENDED leases, or
3. Allow them only under specific conditions?

**If allowed, the following must be defined:**

- How should such payments affect outstanding rent?
- How should they appear in finance reporting?
- Should the system distinguish current rent from post-termination settlement?
- Should audit records distinguish this payment type?

**Action:** No implementation change until this business rule is decided and recorded.

---

## D-037 — Hard-Delete Business Boundary and Active-Lease Definition

**Status:** 🟢 Confirmed
**Implementation:** ✅ Confirmed in current implementation

**Decision:** PropManager Pro does not support hard deletion as a business operation for Properties, Units, Tenants, Leases, or Payments. An active lease is defined exclusively by `Lease.status = ACTIVE`.

**Reason:** Historical property-management and financial records must not be removed through normal business workflows. Property, Unit, and Tenant records use soft deletion; Leases use lifecycle state transitions; Payments have no delete workflow. A single status-based definition of an active lease prevents different parts of the application from interpreting lease dates differently.

**Database protection:** Payment relations to Lease and Tenant use `onDelete: Restrict`, preventing payment records from being removed through those relationships.

**Active-lease rule:**

```text
Active Lease = Lease.status == ACTIVE
Lease startDate and endDate do not independently determine active status.
```

P2.2 inspection result: Existing implementation already follows the status-based active-lease definition across the inspected lease-dependent business rules. No code change was required.
The existing database cascade relationships between operational records were reviewed. They were not changed because the supported application layer does not expose hard-delete operations for these domains and no demonstrated defect requires a schema migration.
Important: This decision does not introduce a VOID/VOIDED payment workflow. Payment reversal semantics remain governed by D-025, and payments against ENDED leases remain governed by pending decision D-036.
Action: Treat the above as the baseline for future domain work. Any future hard-delete capability would require an explicit architectural decision and must not be introduced implicitly.
P2.2 Decision Boundary
P2.2 inspection is complete.
The current implementation establishes:
Hard deletion is not a supported business operation for Property, Unit,
Tenant, Lease, or Payment.
Property, Unit, and Tenant use soft deletion.
Lease records use lifecycle transitions rather than deletion.
Payments have no delete workflow.
Payment → Lease and Payment → Tenant use onDelete: Restrict.
The authoritative active-lease definition is Lease.status = ACTIVE.
Lease dates do not independently determine active status.
No Prisma schema change or migration is required from the P2.2 inspection.
No implementation changes were made during this inspection.
P2.2 can be locked after the affected SSOT documentation is synchronized and
verified.
D-031 and D-032 remain pending until their specific service-layer hard-delete
lease-history behavior is explicitly verified and standardized.
D-037 establishes the broader business boundary and active-lease definition;
it does not by itself mark D-031 or D-032 as implemented.

**Reconciliation clarification (September 7, 2026):** The conditional lock and pending wording above records the earlier handoff state. P2.2 inspection is complete; the six-document reconciliation is prepared for diff review before commit. D-031/D-032 remain not implemented and are inapplicable to current scope, as explicitly resolved in their notes; D-033 is resolved through this decision. No hard-delete service method was found, independently of route availability. D-026 and D-036 remain pending; D-025 continues to govern payments. Historical tests/builds/database checks were not rerun, and production remains unverified.

## D-038 — Atomic Payment Creation and Audit

**Date:** September 19, 2026

**Status:** Implemented; verified locally; service/controller diff reviewed by the user

**Decision:** The payment creation controller owns one Prisma interactive transaction and passes its client to the payment service and existing audit service. HTTP 201 is sent only after commit.

**Reason:** Source inspection and HTTP/database regressions established that audit failure previously returned HTTP 500 while leaving a committed payment. D-025 assigns HTTP/audit orchestration to the controller and business rules to the service. A controller-owned boundary preserves those responsibilities without adding a workflow abstraction or rewriting the audit service.

**Impact:** `createPayment()` accepts an optional transaction client (defaulting to Prisma for existing callers); ownership/relationship checks and payment insertion use that client. The pre-existing payment-record helper is retained. Audit failures propagate to existing error middleware after rollback. Direct service callers remain responsible for their audit orchestration.

**Verification:** Five HTTP/database tests cover committed success, a real audit foreign-key failure, an exception after audit insertion, rejected lease access, and invalid input. Both rollback regressions failed before the change and passed afterward. Full backend suite: 82/82 across 8 files; backend source TypeScript check passed. The HTTP test harness supplies user identity; JWT and production deployment were not verified.

**Scope:** Creation only. Payment-update atomicity and idempotency remain separate work. No broad uniqueness constraints, schema/migrations, new dependencies, authentication changes, or production changes.

---

## D-039 — Payment Creation Request Identity and Persistent Recovery

**Date:** September 19, 2026

**Status:** Backend and frontend recovery implemented locally; uncommitted. Migration applied only to local test DB. Automated checks pass; real-browser acceptance and coordinated release pending.

**Decision:** Identify payment creation by authenticated user plus client UUID request key. Claim that key as the first data write in the same transaction as payment, audit, and original response storage. Retain successful server records and unresolved browser attempts without silent expiry.

**Reason:** D-038 prevents an undocumented committed creation, but does not prevent a retry after a lost response from creating another payment. Request identity must not prohibit distinct legitimate payments with identical business fields. User approved persistent browser/server recovery without automatic submission or silent expiry.

**Contract:** Versioned deterministic fingerprints preserve date omission until service resolution after claim. Same-key matching requests replay the original authorized 201/body; changed details return 409. Claim lock timeout returns 503 with a distinct code/Retry-After. Incomplete records and unsupported versions fail closed with distinct integrity errors, never replacement creation. Replay checks current access without rerunning creation eligibility.

**Mechanism:** Parameterized raw SQL for timeout settings and claim insertion only; remaining writes use Prisma. Capture/restore the effective lock timeout around the claim. No server retry loop. Local six-case contention experiment on Prisma 6.19.3/PostgreSQL 18.6 established structured raw-query SQLSTATE handling; it did not verify payment idempotency.

**Implementation boundary:** Additive PaymentCreateRequest model/table, per-user/key primary key, nullable unique payment link, restrictive foreign keys. Nullable completion fields require workflow finalization checks; schema alone does not enforce complete-at-commit. No backfill, broad payment uniqueness, new active-lease rule, or status-update workflow.

**Verification:** Three red HTTP tests reproduced same-key duplicate creation and absent key/mismatch enforcement before the backend fix. Full suite passes 118/118 in 8 files; the 41 payment HTTP/database tests exercise the contract matrix, including real blocked commit/rollback/timeout cases. Source and integration-test TypeScript checks pass. Migration applied only to localhost:5432/propmanagerpro_test after verifying its existing 14 migrations and sole pending addition; Prisma regenerated. No production verification or frontend recovery tests. Initial 2-second claim/10-second transaction settings passed local cases; deployment timeout review remains pending.

**Frontend checkpoint:** User-scoped immutable attempts persist before fetch without expiry or automatic restoration submission. Same-origin per-user Web Locks prevent concurrent preparation/retry/reconciliation; missing coordination/storage fails closed. A valid successful response or explicit confirmed reconciliation writes a resolution marker before removing details. Integrity/mismatch/validation errors preserve evidence for review. CORS exposes Retry-After. Frontend passes 25 Node recovery tests with simulated storage/fetch/locks, targeted lint and a production build including types. Full backend suite now passes 120/120 in 9 files with 2 real-app CORS checks; source types pass. Real-browser acceptance and deployment timeout review remain pending.

**Specification:** `DOCS/PAYMENT_IDEMPOTENCY.md`. Runtime helpers handle request identity/persistence/replay only; the controller still owns payment/audit transaction orchestration. Frontend and backend now implement compatible mandatory keys locally and must be released together. D-038's 82-test and the backend-only 118-test results remain historical.

---

## D-040 — Node 24 Runtime Policy

**Date:** September 21, 2026

**Status:** Accepted and implemented locally; production verification pending

**Decision:** PropManager Pro uses Node 24 as its intended runtime family.

**Implementation:** `.nvmrc` pins the developer runtime to `24.18.0`; `backend/package.json` and `frontend/package.json` declare `"node": "24.x"`.

**Reason:** The project previously had no explicit runtime contract, so a deployment platform could select a runtime different from the locally verified environment.

**Important:** Railway runtime selection remains unverified until deployment logs confirm the resolved Node version.

---

## D-041 — Strict Update Payload Separation

**Date:** September 21, 2026

**Status:** Accepted and applied to payment and lease editing

**Decision:** Frontend update flows must send only fields accepted by the corresponding backend update schema. Edit pages must not spread create-shaped form state into strict update requests.

**Reason:** Create and update operations have different business rules. Create forms may contain relationship or initial-state fields that are immutable or controlled through dedicated lifecycle endpoints during updates.

**Implementation:** Payment editing sends only `amount`, `paymentDate`, `method`, `reference`, and `notes`. Lease editing constructs an explicit update payload and omits the create-only `status` field; lease status changes remain controlled by lifecycle endpoints. Property, tenant, and unit edit flows were reviewed and currently send fields accepted by their update validators.

---

Template for New Decisions
## D-XXX — [Title]

**Status:** [🟢 Confirmed / 🟡 Decided / ⚪ Pending / 🔴 Rejected / 🟠 Implemented]
**Implementation:** [✅ Applied / ❌ Not started / N/A]

**Decision:** [What was decided — one clear sentence]

**Reason:** [Why this decision was made]

**Impact:** [What this affects]

**Action:** [If not yet implemented — what needs to happen next]

Last updated: September 2026
Migrated and consolidated from two separate decision log versions.
Original decisions D-001 through D-020 preserved. Added D-021 through D-037
from architecture audit session. Decision lifecycle and status markers added.
