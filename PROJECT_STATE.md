# PropManager Pro — Project State

**Last Updated:** August 21, 2026

**State:** 🔒 LOCKED — Documentation / SSOT Architecture Baseline

**Current Development Mode:** Controlled architectural consolidation

---

# 1. Current Project Truth

PropManager Pro is a mobile-first property-management SaaS for small landlords managing approximately 1–10 units.

Core principles:

- Simplicity over feature quantity
- Mobile-first UX
- Financial correctness
- Tenant isolation
- AI-debuggable architecture
- Explicit/deterministic engineering
- Single Source of Truth

---

# 2. Current Technology Stack

## Frontend

🟢 CONFIRMED

- Next.js
- Next.js App Router
- TypeScript
- Tailwind CSS
- React Context API for authentication

Primary location:

```text
frontend/
Backend
🟢 CONFIRMED

Node.js

Express

TypeScript

Prisma ORM

PostgreSQL

Zod

JWT

bcrypt

Helmet

express-rate-limit

Pino / pino-http

Primary location:

text
backend/
Database
🟢 CONFIRMED

PostgreSQL

Supabase-hosted PostgreSQL

Prisma ORM

Schema location:

text
backend/prisma/schema.prisma
Infrastructure
🟡 PREVIOUSLY ESTABLISHED / ⚪ CURRENTLY UNVERIFIED

Frontend: Vercel

Backend: Railway

Database: Supabase PostgreSQL

Current deployment state must be verified before being treated as production truth.

3. Source-of-Truth Hierarchy
text
1. Actual code/database/deployed behavior
2. PROJECT_STATE.md
3. ARCHITECTURE.md
4. DECISION_LOG.md
5. DOCS/
6. CHANGELOG.md
7. TODO.md
8. AI_HANDOFF.md
9. README.md
Rules:

Current code and database schema are the ultimate implementation truth.

If documentation conflicts with implementation, documentation must be corrected.

PROJECT_STATE.md describes verified operational state.

ARCHITECTURE.md describes intended/current system structure.

DECISION_LOG.md records important architectural/product decisions.

TODO.md contains planned work and must never be treated as completed functionality.

AI_HANDOFF.md is derived and is not an independent source of truth.

Historical information must not be presented as current functionality unless verified.

4. Current Backend Architecture
text
Express
   ↓
Controllers
   ↓
Services
   ↓
Prisma
   ↓
PostgreSQL / Supabase
The service layer is the intended authoritative location for business/domain rules.

Controllers should coordinate HTTP operations and should not independently duplicate business logic.

5. SSOT Architecture Decision
Single Source of Truth is now a formal architectural rule.

Every important business rule should have exactly one authoritative implementation.

Primary ownership:

Responsibility	Authority
Authentication	Auth middleware
Input validation	Zod validators
HTTP orchestration	Controllers
Business rules	Services
Persistence	Prisma
Database integrity	PostgreSQL
Audit records	Audit service
Current project state	PROJECT_STATE.md
Architecture	ARCHITECTURE.md
Decision rationale	DECISION_LOG.md
Historical changes	CHANGELOG.md
Planned work	TODO.md
6. Current Verified Domain Services
The following services exist:

text
auth.service.ts
property.service.ts
unit.service.ts
tenant.service.ts
lease.service.ts
payment.service.ts
finance.service.ts
financeAnalytics.service.ts
audit.service.ts
The architecture is partially aligned with SSOT.

However, some controllers still contain direct Prisma mutations and duplicate business rules.

Therefore:

SSOT architecture is the target baseline, but the codebase is not yet fully SSOT-consolidated.

7. Current Lease Rules
Authoritative LeaseStatus values:

text
PENDING
ACTIVE
ENDED
TERMINATED
Current service-level state transitions:

text
activateLease()
terminateLease()
restoreLease()
endLease()
Active lease conflicts are checked when activating/restoring leases.

8. Current Multi-Tenant Ownership
Authenticated identity:

text
req.userId
Ownership model:

text
Property → userId

Unit → Property → userId

Tenant → userId

Lease → Property → userId

Payment → Lease → Property → userId
This remains a critical security invariant.

9. Current Soft Delete Model
Soft deletion uses:

text
deletedAt
for:

Properties

Units

Tenants

Archive and restore functionality exists, but some controller implementations currently bypass the corresponding service methods.

This is now classified as SSOT consolidation work.

10. Current Frontend Architecture
Primary API abstraction:

text
frontend/src/services/api.ts
Authentication:

text
AuthContext + localStorage
Known items:

text
lib/api-client.ts appears unused
AuthGuard usage unverified
11. Current Known Problems
P0
Railway backend expired / production deployment requires re-establishment.

Production migration state remains unverified.

Supabase database password rotation required.

P1
Service/controller SSOT duplication.

deleteLease() accepts userId but does not use it for ownership verification.

Property archive/restore logic exists directly in controller.

Unit archive/restore logic exists directly in controller.

Tenant archive/restore logic is duplicated between controller/service.

unit.service.ts uses any.

Payment business rules require further consolidation.

Audit operations are not consistently transactional.

Property.unitCount can drift from actual Units.

Automated test runner is not yet established.

Finance analytics isolation requires full verification.

FRONTEND_URL missing from environment validation.

Deployment pipeline non-explicit — postinstall + bundled migration.

P2
Duplicate/legacy frontend API abstraction requires verification.

Static/placeholder finance service requires cleanup.

Remaining debug logging requires review.

Other minor architecture cleanup.

12. Current Work Plan
Phase A — SSOT Backend Consolidation
Status: 🟡 ACTIVE

A1 — Lease SSOT
Move remaining business/ownership rules into lease service.

Ensure deleteLease() enforces ownership.

Remove unnecessary controller duplication.

Type service inputs.

Test.

Verify.

🔒 Lock Lease domain.

A2 — Property SSOT
Consolidate archive/restore into service.

Ensure ownership is enforced by service.

Remove direct controller Prisma mutations.

Test.

Verify.

🔒 Lock Property domain.

A3 — Unit SSOT
Consolidate archive/restore/delete rules.

Remove any.

Type transaction support correctly.

Test.

Verify.

🔒 Lock Unit domain.

A4 — Tenant SSOT
Consolidate archive/restore/delete rules.

Remove controller/service duplication.

Verify active-lease restrictions.

Test.

Verify.

🔒 Lock Tenant domain.

A5 — Payment SSOT
Consolidate payment validation.

Confirm payment mutation policy.

Ensure ownership is authoritative in service.

Test financial integrity.

Verify.

🔒 Lock Payment domain.

A6 — Finance SSOT
Remove/retire misleading placeholder finance logic where appropriate.

Establish authoritative calculation source.

Verify tenant isolation.

Verify financial calculations.

🔒 Lock Finance domain.

A7 — Audit SSOT
Review audit coverage.

Identify mutations requiring transactional audit records.

Establish consistent audit strategy.

Test.

Verify.

🔒 Lock Audit domain.

13. Work Execution Rule
Only one logical domain should be actively refactored at a time.

text
ONE DOMAIN
   ↓
IMPLEMENT
   ↓
TEST
   ↓
VERIFY
   ↓
DOCUMENT
   ↓
🔒 LOCK
   ↓
NEXT DOMAIN
Do not begin the next domain while the current domain remains unverified.

14. Current Immediate Objective
Next action: P2.2 — Standardize Hard-Delete Business Rules and Active-Lease Definition.

Before changing code:

Inspect current lease routes.

Inspect lease validators.

Inspect lease service.

Identify every lease business rule currently implemented outside the service.

Identify ownership gaps.

Create the smallest safe refactor plan.

Implement.

Test/build.

Verify.

Update documentation.

🔒 Lock Lease domain.

15. Deployment State
text
Frontend (Vercel)
→ Previously deployed
→ Current connectivity UNVERIFIED

Backend (Railway)
→ Previously deployed
→ Subscription expired
→ Current deployment UNAVAILABLE / requires redeployment

Database (Supabase PostgreSQL)
→ Exists
→ Current production schema/migration state UNVERIFIED
Do not treat production as verified until fresh evidence is collected.

16. Documentation Lock
When a major change is completed, tested, verified, and documented, the resulting work-plan state is LOCKED before moving to the next major item.

A lock means the completed state becomes the baseline.

If a later discovery requires reopening a locked item:

text
STOP
↓
Document the new evidence
↓
Explain why the lock must be reopened
↓
Make the change
↓
Re-test
↓
Re-verify
↓
Re-lock
17. Current Status
text
Documentation architecture     → 🔒 LOCKED
SSOT principle                 → 🔒 LOCKED
Backend layered architecture   → 🔒 LOCKED
Lease SSOT consolidation       → 🔒 LOCKED
Property SSOT                  → 🔒 LOCKED
Unit SSOT                      → 🔒 LOCKED
Tenant SSOT                    → 🔒 LOCKED
Payment SSOT                   → 🔒 LOCKED
P2.1 Business Rules to Service → 🔒 LOCKED
P2.2 Hard-Delete Rules         → 🟡 READY / NEXT
Finance SSOT                   → ⚪ WAITING
Audit SSOT                     → ⚪ WAITING
Production redeployment        → ⚪ WAITING
18. Continuation Instruction

The next AI/session must NOT jump directly into unrelated feature development.

Continue from: P2.2 — Standardize Hard-Delete Business Rules and Active-Lease Definition.

Inspect the current implementation first.

Do not assume that documentation is more accurate than the code.

19. Evidence Status
Project documentation uses:

text
🟢 CONFIRMED
Verified directly from current code/schema/config/deployment evidence.

🟡 HISTORICAL
Known from previous development but not recently re-verified.

⚪ UNVERIFIED
Requires inspection/testing before being treated as fact.

🔴 CONFIRMED PROBLEM
Verified defect, risk, inconsistency, or technical debt.

🔵 DECISION
Explicitly accepted architectural/product decision.
20. Rules for Future AI Sessions
Any AI working on PropManager Pro must:

Read AI_HANDOFF.md first.

Follow the source-of-truth hierarchy.

Treat current code/schema as implementation truth.

Inspect relevant files before making changes.

Never assume historical documentation is current.

Preserve tenant isolation.

Preserve financial/business rules.

Avoid duplicate abstractions.

Make the smallest safe change.

Test the change.

Report verification evidence.

Update appropriate documentation after material changes.

21. Document Maintenance Rule
Do not append historical development discussions to this document.

If something happened in the past but is no longer current:

put the historical explanation in CHANGELOG.md

put the reasoning in DECISION_LOG.md

put unresolved work in TODO.md

keep only the resulting current state here

The goal is for an AI or developer to read this document and understand the project without reading the entire development history.

Current State Summary
text
Product:
PropManager Pro

Type:
Multi-tenant property-management SaaS

Frontend:
Next.js + TypeScript + Tailwind

Backend:
Node.js + Express + TypeScript

ORM:
Prisma

Database:
PostgreSQL / Supabase

Authentication:
JWT + bcrypt

Frontend Auth:
AuthContext + localStorage

Primary API abstraction:
frontend/src/services/api.ts

Backend authentication:
authMiddleware + JWT verification

Tenant isolation:
Authenticated user ownership boundaries

Current phase:
P2.2 READY / NEXT

Next engineering action:
P2.2 — Standardize Hard-Delete Business Rules and Active-Lease Definition

Primary unresolved areas:
Railway redeployment required
Supabase password rotation required
Production migration state unverified
API abstraction cleanup
Environment configuration alignment
SSOT controller/service duplication
Technical debt cleanup
Test coverage/automation
End of PROJECT_STATE.md
```
