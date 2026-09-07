# PropManager Pro -- Project State

**Last Updated:** September 7, 2026

**State:** P2.2 inspection complete / documentation reconciliation prepared for diff review

**Current Development Mode:** Documentation-only reconciliation; no implementation changes

Evidence boundary: September 7 source/configuration/test inspection at `82c475b`; the recorded 75/75 tests, builds, local API checks, and migration application remain historical and were not rerun. Changes since baseline `7b3e76c` were documentation-only. Production remains unverified.

Implementation establishes current behavior; explicit decisions establish intended behavior. Flag any disagreement rather than treating either as proof of the other.

---

## 1. Current Project Truth

PropManager Pro is a mobile-first property-management SaaS for small landlords managing approximately 1-10 units.

Core principles:

- Simplicity over feature quantity
- Mobile-first UX
- Financial correctness
- Tenant isolation
- AI-debuggable architecture
- Explicit/deterministic engineering
- Single Source of Truth

---

## 2. Current Technology Stack

### Frontend

[CONFIRMED]

- Next.js
- Next.js App Router
- TypeScript
- Tailwind CSS
- React Context API for authentication

Primary location:

```text
frontend/
```

### Backend

[CONFIRMED]

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod
- JWT
- bcrypt
- Helmet
- express-rate-limit
- Pino / pino-http

Primary location:

```text
backend/
```

### Database

[CONFIRMED]

- PostgreSQL
- Supabase-hosted PostgreSQL
- Prisma ORM

Schema location:

```text
backend/prisma/schema.prisma
```

### Infrastructure

[HISTORICAL] PREVIOUSLY ESTABLISHED / [PENDING] CURRENTLY UNVERIFIED

- Frontend: Vercel
- Backend: Railway
- Database: Supabase PostgreSQL

Production deployment state remains unverified because Railway is unavailable.

---

## 3. Source-of-Truth Hierarchy

```text
1. Actual code/database/deployed behavior
2. PROJECT_STATE.md
3. ARCHITECTURE.md
4. DECISION_LOG.md
5. DOCS/
6. CHANGELOG.md
7. TODO.md
8. AI_HANDOFF.md
9. README.md
```

**Rules:**

- Current code and database schema are the ultimate implementation truth.
- If documentation conflicts with implementation, documentation must be corrected.
- `PROJECT_STATE.md` describes verified operational state.
- `ARCHITECTURE.md` describes intended/current system structure.
- `DECISION_LOG.md` records important architectural/product decisions.
- `TODO.md` contains planned work and must never be treated as completed functionality.
- `AI_HANDOFF.md` is derived and is not an independent source of truth.
- Historical information must not be presented as current functionality unless verified.

---

## 4. Current Backend Architecture

```text
Express
   |
   v
Controllers
   |
   v
Services
   |
   v
Prisma
   |
   v
PostgreSQL / Supabase
```

The service layer is the intended authoritative location for business/domain rules.

Controllers should coordinate HTTP operations and should not independently duplicate business logic.

---

## 5. SSOT Architecture Decision

Single Source of Truth is now a formal architectural rule.

Every important business rule should have exactly one authoritative implementation.

**Primary ownership:**

| Responsibility | Authority |
|----------------|-----------|
| Authentication | Auth middleware |
| Input validation | Zod validators |
| HTTP orchestration | Controllers |
| Business rules | Services |
| Persistence | Prisma |
| Database integrity | PostgreSQL |
| Audit records | Audit service |
| Current project state | PROJECT_STATE.md |
| Architecture | ARCHITECTURE.md |
| Decision rationale | DECISION_LOG.md |
| Historical changes | CHANGELOG.md |
| Planned work | TODO.md |

---

## 6. Current Verified Domain Services

The following services exist:

```text
auth.service.ts
property.service.ts
unit.service.ts
tenant.service.ts
lease.service.ts
payment.service.ts
finance.service.ts
financeAnalytics.service.ts
audit.service.ts
```

The architecture is partially aligned with SSOT.

The inspected domain controllers delegate mutations to services. Remaining boundary review includes the unit controller's direct property ownership read and lease termination-reason validation in the controller. Controller reads for HTTP responses/audit context do not establish missing service authorization.

Therefore: SSOT architecture is the target baseline, but the codebase is not yet fully SSOT-consolidated.

---

## 7. Current Lease Rules

Authoritative LeaseStatus values:

```text
PENDING
ACTIVE
ENDED
TERMINATED
```

**Active Lease Definition:** [CONFIRMED]

An active lease is defined exclusively by:

```text
Lease.status = ACTIVE
Lease dates (startDate / endDate) do not independently determine whether a
lease is active.
This definition is used by the current lease, unit, tenant, and finance logic
for active-lease checks.
Local verification confirmed that an ACTIVE lease with a past endDate still
qualifies as active for lease-dependent business rules.
```

**Hard-Delete Business Rule**

Hard deletion is not a supported business operation for:
- Properties
- Units
- Tenants
- Leases
- Payments

Properties, Units, and Tenants use soft deletion through `deletedAt`.
Leases use lifecycle state transitions rather than deletion.
Payments have no delete workflow and must be preserved.
Payment foreign keys use `onDelete: Restrict` for both Lease and Tenant,
protecting financial records from cascading deletion.

The database contains some cascade relationships between parent operational
records and their historical child records. These were inspected during P2.2,
but no schema change is justified by the current application behavior because
the public business layer does not expose hard-delete operations for these
domains.

No Prisma schema change or migration was made as part of P2.2 inspection.

Current service-level state transitions:

```text
activateLease()
terminateLease()
restoreLease()
endLease()
```

Creation/update and activation/restoration conflict checks use ACTIVE status. Termination/end eligibility, unit/tenant archive restrictions, and finance activity queries also use status. Date ordering validation and payment reporting periods do not define lease activity. D-033 is resolved through D-037; no standardization change is required.

### Database Invariant

PostgreSQL enforces one ACTIVE lease per unit through a partial unique index.

Index name:

```text
leases_one_active_per_unit_idx
```

Migration:

```text
20260901120000_add_active_lease_per_unit_unique_index
```

The lease service converts concurrent ACTIVE-lease database conflicts (`P2002`) into a `409 ConflictError` with the message:

```text
Unit already has an active lease
```

**Local verification:** migration applied and database up to date. Production database state remains unverified because Railway is currently unavailable.

---

## 8. Current Multi-Tenant Ownership

Authenticated identity:

```text
req.userId
```

Ownership model:

```text
Property -> userId
Unit -> Property -> userId
Tenant -> userId
Lease -> Property -> userId
Payment -> Lease -> Property -> userId
```

This remains a critical security invariant.

**Local verification:** explicitly tested cross-user property access and received 404. Tenant isolation holds locally.

---

## 9. Current Soft Delete Model

Soft deletion uses:

```text
deletedAt
```

for:

- Properties
- Units
- Tenants

Property, Unit, and Tenant archive/restore controllers call ownership-checking services. No hard-delete business method was found in those services or the Lease/Payment services. Test cleanup and database cascades are separate from business capabilities; D-031/D-032 are not implemented and are inapplicable to current scope under D-037.

---

## 10. Current Frontend Architecture

Primary API abstraction:

```text
frontend/src/services/api.ts
```

Authentication:

```text
AuthContext + localStorage
```

Known items:

```text
lib/api-client.ts appears unused
Standalone components/AuthGuard.tsx has no application references
(app)/layout.tsx uses AuthContext as the application guard
```

The layout covers dashboard, properties/units, tenants, leases, payments, finance, and More; login/register are outside it. AuthContext restores the saved user from localStorage. The layout hides children while loading or without a user and redirects unauthenticated users to /login. It does not validate JWT expiry on initialization. The backend verifies JWTs; API-client 401 handling clears stored token/user and redirects to login. This is source-confirmed behavior, not new end-to-end browser verification.

---

## 11. Current Known Problems

**P0**
- Railway backend expired / production deployment requires re-establishment.
- Production migration state remains unverified.
- Supabase database password rotation required.

**P1**
- Unit controller ownership read and lease controller termination-reason validation require service-boundary review.
- Property `deleteProperty` and `archiveProperty` both implement soft deletion in the service; no controller mutation bypass was found.
- `unit.service.ts` uses `any`.
- Payment ownership and D-025 mutation rules are enforced in the service; D-036 remains an unresolved business decision.
- Audit operations are not consistently transactional.
- `Property.unitCount` can drift from actual Units.
- `FRONTEND_URL` is already URL-validated in `env.ts`; production configuration remains unverified.
- Development mode returns full stack traces.
- Finance archived-property filtering requires review.

**P2**
- Duplicate/legacy frontend API abstraction requires verification.
- Static/placeholder finance service requires cleanup.
- Remaining debug logging requires review.
- Other minor architecture cleanup.

---

## 12. Current Work Plan

### Phase A -- SSOT Backend Consolidation

**Status:** Follow-up review only; no domain implementation is active during reconciliation. The items below distinguish existing behavior from remaining review; they do not declare whole-domain locks.

#### A1 -- Lease SSOT
- Service ownership and status-based conflict/lifecycle checks exist; no `deleteLease()` exists.
- Review termination-reason validation at the controller boundary and remaining `any` usage.
- Test and verify only if a subsequent implementation change is approved.

#### A2 -- Property SSOT
- Archive/restore already delegate to ownership-checking services.
- Review duplicate soft-delete service paths if consolidation is needed.
- D-026 (`unitCount` semantics) remains pending; do not refactor it before a decision.

#### A3 -- Unit SSOT
- Archive protection and restore are already service-owned; P2.1 archive work remains the baseline.
- Review the controller property lookup, remove `any` when scoped, and type transaction support.
- No hard-delete implementation is scheduled under D-031/D-037.

#### A4 -- Tenant SSOT
- Archive/restore and status-based active-lease restrictions are service-owned.
- Preserve the P2.1 baseline; review further work only against a demonstrated gap.
- No hard-delete implementation is scheduled under D-032/D-037.

#### A5 -- Payment SSOT
- Preserve implemented D-025 ownership, immutability, and controlled update rules.
- D-036 remains pending; refunds are deferred and no VOID/VOIDED workflow exists.
- Identify a concrete gap before scheduling further consolidation.

#### A6 -- Finance SSOT
- Remove/retire misleading placeholder finance logic where appropriate.
- Preserve `financeAnalytics.service.ts` as the database-backed calculation source; review archived-record filtering.
- Verify tenant isolation.
- Verify financial calculations.
- Lock Finance domain only after its remaining scoped work is completed and verified.

#### A7 -- Audit SSOT
- Review audit coverage.
- Identify mutations requiring transactional audit records.
- Establish consistent audit strategy.
- Test.
- Verify.
- Lock Audit domain only after its remaining scoped work is completed and verified.

---

## 13. Work Execution Rule

Only one logical domain should be actively refactored at a time.

```text
ONE DOMAIN
   |
   v
IMPLEMENT
   |
   v
TEST
   |
   v
VERIFY
   |
   v
DOCUMENT
   |
   v
[LOCKED]
   |
   v
NEXT DOMAIN
```

Do not begin the next domain while the current domain remains unverified.

---

## 14. Current Immediate Objective

Current action: Review the six-document reconciliation diff before committing.

P2.2 business-boundary and active-lease inspection is complete; no implementation or migration change was required. Documentation corrections are prepared for review. A documentation lock does not establish fresh test/build/database or production verification.

1. Inspect the actual documentation diff and consistency checks.
2. Preserve D-026 and D-036 as pending and D-031/D-032 as not implemented.
3. Commit only after user approval of the diff.
4. Determine the next smallest controlled task from remaining evidence-backed work.

---

## 15. Deployment State

```text
Frontend (Vercel)
-> Previously deployed
-> Current connectivity UNVERIFIED

Backend (Railway)
-> Previously deployed
-> Subscription expired
-> Current deployment UNAVAILABLE / requires redeployment

Database (Supabase PostgreSQL)
-> Exists
-> Current production schema/migration state UNVERIFIED
```

Do not treat production as verified until fresh evidence is collected.

---

## 16. Documentation Lock

When a major change is completed, tested, verified, and documented, the resulting work-plan state is LOCKED before moving to the next major item.

A lock means the completed state becomes the baseline.

If a later discovery requires reopening a locked item:

```text
STOP
|
v
Document the new evidence
|
v
Explain why the lock must be reopened
|
v
Make the change
|
v
Re-test
|
v
Re-verify
|
v
Re-lock
```

---

## 17. Local Verification Baseline

Historical local verification recorded before this reconciliation (not rerun):

```text
Backend automated tests         -> 75/75 passed
Backend production build        -> passed
Frontend production build       -> passed
Registration                    -> verified
Login                           -> verified
Protected property route        -> verified
Property creation               -> verified
Tenant isolation                -> verified
Finance isolation               -> verified
Active lease conflict path      -> verified
Database partial unique index   -> verified
```

**Important:**

```text
LOCAL VERIFIED
       !=
PRODUCTION VERIFIED
```

---

## 18. Current Status

Runtime/build/database confirmation markers below refer to the historical local baseline, not new execution. P2.2 implementation findings were checked by source inspection. Documentation reconciliation awaits diff review.

```text
Documentation architecture       -> [LOCKED]
SSOT principle                   -> [LOCKED]
Backend layered architecture     -> [LOCKED]
Lease database invariant         -> [CONFIRMED LOCALLY]
Automated test baseline          -> [CONFIRMED]
Backend build                    -> [CONFIRMED]
Frontend production build        -> [CONFIRMED]
Local API verification           -> [CONFIRMED]
Tenant isolation                 -> [CONFIRMED LOCALLY]
Finance isolation                -> [CONFIRMED LOCALLY]
P2.1 Business Rules to Service   -> [LOCKED]
P2.2 Hard-Delete Rules           -> [CONFIRMED]
P2.2 Active-Lease Definition     -> [CONFIRMED]
P2.2 Implementation Changes      -> [NONE REQUIRED]
Finance SSOT                     -> [PENDING] WAITING
Audit SSOT                       -> [PENDING] WAITING
Production deployment            -> [PENDING] WAITING
Production migration state       -> [PENDING] WAITING
```

---

## 19. Continuation Instruction

The next AI/session must NOT jump directly into unrelated feature development.

Continue from: P2.2 inspection complete; review the documentation reconciliation diff before committing. No lease refactor is implicitly scheduled.

Inspect the current implementation first.

Do not assume that documentation is more accurate than the code.

---

## 20. Evidence Status

Project documentation uses:

```text
[CONFIRMED]
Verified directly from current code/schema/config/deployment evidence.

[HISTORICAL]
Known from previous development but not recently re-verified.

[PENDING] UNVERIFIED
Requires inspection/testing before being treated as fact.

[CONFIRMED PROBLEM]
Verified defect, risk, inconsistency, or technical debt.

[DECISION]
Explicitly accepted architectural/product decision.
```

---

## 21. Rules for Future AI Sessions

Any AI working on PropManager Pro must:

1. Read `AI_HANDOFF.md` first.
2. Follow the source-of-truth hierarchy.
3. Treat current code/schema as implementation truth.
4. Inspect relevant files before making changes.
5. Never assume historical documentation is current.
6. Preserve tenant isolation.
7. Preserve financial/business rules.
8. Avoid duplicate abstractions.
9. Make the smallest safe change.
10. Test the change.
11. Report verification evidence.
12. Update appropriate documentation after material changes.

---

## 22. Document Maintenance Rule

Do not append historical development discussions to this document.

If something happened in the past but is no longer current:
- put the historical explanation in `CHANGELOG.md`
- put the reasoning in `DECISION_LOG.md`
- put unresolved work in `TODO.md`
- keep only the resulting current state here

The goal is for an AI or developer to read this document and understand the project without reading the entire development history.

---

## Current State Summary

```text
Product:                      PropManager Pro
Type:                         Multi-tenant property-management SaaS
Frontend:                     Next.js + TypeScript + Tailwind
Backend:                      Node.js + Express + TypeScript
ORM:                          Prisma
Database:                     PostgreSQL / Supabase
Authentication:               JWT + bcrypt
Frontend Auth:                AuthContext + localStorage
Primary API abstraction:      frontend/src/services/api.ts
Backend authentication:       authMiddleware + JWT verification
Tenant isolation:             Authenticated user ownership boundaries
Current phase:                P2.2 INSPECTION COMPLETE / RECONCILIATION DIFF REVIEW
Next engineering action:      Review documentation diff; obtain approval before committing
```

**Primary unresolved areas:**
- Railway redeployment required
- Supabase password rotation required
- Production migration state unverified
- API abstraction cleanup
- Environment configuration alignment
- SSOT controller/service duplication
- Technical debt cleanup
- Development stack-trace exposure
- Finance archived-property consistency
- Payment-against-ended-lease business decision

---

**End of `PROJECT_STATE.md`**
