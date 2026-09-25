# PropManager Pro -- AI Handoff

## Purpose

This document is the continuation anchor for AI-assisted development.

A new AI session should use this document to understand the project's operating rules, source-of-truth hierarchy, continuation protocol, and durable engineering context.

`PROJECT_STATE.md` remains the authoritative operational state document.

## Latest Development Context — September 21, 2026

Recent repository work includes the payment update validation fix and the Node 24 runtime policy. The supplied checkpoint was on `main`, two commits ahead of `origin/main`, with a clean working tree.

Completed and verified locally:

- Payment edit sends only update-compatible fields.
- Payment update and audit creation are atomic.
- Payment integration tests pass (41 tests).
- Backend build and production startup pass.
- Frontend production build passes.
- `.nvmrc` specifies Node 24.18.0 and both packages declare Node 24.x.
- Lease edit now constructs an explicit update payload and omits create-only `status`.
- Property, tenant, and unit edit payloads were reviewed against their update validators; no issues were identified during the review.

Railway deployment is intentionally deferred. Do not treat production infrastructure or Railway's selected runtime as verified until deployment is recreated and confirmed from logs.

Next work:

1. Complete route-by-route local application verification.
2. Review security and production environment configuration.
3. Prepare the Railway deployment checklist.
4. Subscribe and deploy only after local readiness is complete.

---

# Project

**PropManager Pro**

Mobile-first property management SaaS for small landlords managing approximately 1-10 units.

Core philosophy:

> Simple, reliable, financially correct property management without unnecessary complexity.

---

# Current Architecture

```text
PropManager Pro/
+-- PROJECT_STATE.md
+-- ARCHITECTURE.md
+-- DECISION_LOG.md
+-- CHANGELOG.md
+-- TODO.md
+-- AI_HANDOFF.md
+-- README.md
|
+-- DOCS/
+-- frontend/
+-- backend/
+-- ai_worker/
+-- database/
+-- config/
+-- tests/
```

The actual filesystem is always the implementation truth.

Not every documented or planned directory is necessarily implemented.

---

# Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- App Router

## Backend

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- Supabase
- JWT
- bcrypt
- Zod
- Helmet
- express-rate-limit
- Pino

## Hosting

```text
Frontend -> Vercel
Backend  -> Railway
Database -> Supabase PostgreSQL
```

Current platform status must be verified before being treated as current deployment truth.

---

# Current Core Modules

```text
Authentication
Properties
Units
Tenants
Leases
Payments
Finance
```

Additional domains such as billing, documents, maintenance, communications, and AI-assisted workflows must not be treated as completed functionality unless verified in the current codebase.

---

# Authentication

Current verified flow:

```text
Register/Login
      |
      v
Backend
      |
      v
bcrypt
      |
      v
JWT
      |
      v
Frontend localStorage
      |
      v
Bearer token
      |
      v
Protected API
```

JWT payload:

```text
userId
email
role
```

Current token lifetime:

```text
7 days
```

These details must still be inspected against the current implementation before making authentication changes.

The application guard is `frontend/src/app/(app)/layout.tsx` using AuthContext, not the unused standalone `components/AuthGuard.tsx`. It restores saved user state and redirects when no user is present after loading. JWT expiry is checked by the backend; API 401 handling clears stored token/user and redirects. This source inspection does not establish end-to-end browser verification.

---

# Important Frontend API Rule

Primary API client:

```text
frontend/src/services/api.ts
```

API base URL:

```text
NEXT_PUBLIC_API_URL
```

The base URL must contain only the backend origin.

Correct structure:

```text
https://propmanagerpro-production.up.railway.app
```

Domain services append paths such as:

```text
/api/auth/login
/api/properties
/api/tenants
/api/leases
/api/payments
/api/finance
```

Never create:

```text
/api/api/...
```

The unused `frontend/src/lib/api-client.ts` was removed after confirming no application callers. `services/api.ts` remains the operational client. Frontend TypeScript and production build passed after removal; this does not reverify the historical backend tests or production.

---

# Important Backend Security Rule

Authenticated resources must be scoped by the authenticated identity:

```text
req.userId
```

Never trust a client-supplied user ID for ownership decisions.

Authorization must be based on the authenticated JWT identity.

Non-negotiable principle:

> A user must not gain access to another user's protected resources merely by knowing a resource ID.

Tenant isolation must be preserved in every new feature and modification.

---

# Current Deployment State

[UNVERIFIED] **UNVERIFIED -- requires re-establishment before being treated as current**

The Railway backend previously deployed successfully and database connectivity through Railway to Supabase was previously validated.

The Railway subscription has since expired.

Current known deployment state:

```text
Frontend (Vercel)
-> [PREVIOUSLY DEPLOYED] Previously deployed -- current connectivity unverified

Backend (Railway)
-> [EXPIRED] Expired -- must be redeployed

Database (Supabase)
-> [EXISTS] Exists -- current production schema state unverified
```

Do not describe the backend as currently healthy or available without current verification.

Before declaring production operational, verify:

```text
Railway redeployment
      |
      v
/health endpoint responds
      |
      v
Database connectivity confirmed
      |
      v
Authentication working
      |
      v
Authenticated CRUD working
      |
      v
Tenant isolation verified
```

Production verification must establish the complete path:

```text
Vercel
   |
   v
Railway
   |
   v
Express
   |
   v
Prisma
   |
   v
Supabase PostgreSQL
```

For current operational state, consult:

```text
PROJECT_STATE.md
```

---

# Current Development Phase

[H1 ATOMICITY COMMITTED / BACKEND IDEMPOTENCY VERIFIED / FRONTEND PENDING]

Historical September 19 checkpoint: atomicity committed at `28a2a6d`; D-039 backend and compatible frontend recovery implemented but uncommitted. Migration `20260919150000_add_payment_create_requests` was applied only to verified localhost:5432/propmanagerpro_test (15 applied migrations); Prisma Client 6.19.3 regenerated. Three red tests reproduced duplicate same-key creation, missing-key acceptance and changed-payload acceptance before implementation. The backend suite passed 120/120 across 9 files (41 payment HTTP/database cases and 2 real-app CORS tests); backend source types passed. Concurrency tests observed real blocked transactions. Frontend payment recovery passed 25 Node tests using simulated browser primitives, targeted lint and a production build including types. Payment-update atomicity was still open at this historical checkpoint and was completed on September 21. Deployment timeout compatibility remains open. No production deployment occurred.

September 19 continuation: repository HEAD was `690eb0b`; an existing uncommitted extraction of `createPaymentRecord()` was preserved. The property-service test checkpoint showed persisted success assertions, not rollback coverage. D-025 assigns audit orchestration to the controller, so D-038 uses a controller-owned transaction with a shared client for payment service checks/write and audit creation.

Five tests in `backend/tests/integration/payment.controller.test.ts` exercise real HTTP routes, validation, controller/services, error middleware, and local PostgreSQL. The harness supplies identity rather than testing JWT. Both rollback regressions failed before the fix with a committed payment and HTTP 500; all five passed afterward. Existing baseline was freshly confirmed as 77/77, then `npm test` passed 82/82 in 8 files; backend source `tsc --noEmit` passed. See PROJECT_STATE.md for current evidence boundaries.

The user reviewed the service/controller diff and committed the atomicity checkpoint as `28a2a6d`. That historical checkpoint added no idempotency or payment-update atomicity guarantee and changed no migrations or deployment configuration. D-039's later local reproduction and backend fix are recorded above; this is not a reproduced production incident. H2 stays paused and no push is authorized.

### Historical September 7 verification

Fresh local verification (September 7, 2026): the cross-user unit reassignment defect was reproduced at the service layer, then fixed. Both reassignment regression tests passed; `npm run test:unit` passed 77/77 tests in 7 files against `localhost:5432/propmanagerpro_test`. The existing 14 migrations were applied to that dedicated database; no schema or migration files changed. The development database was not targeted. No fresh backend build, HTTP reproduction, or production verification was performed. The Vite module-format warning persists and remains separate tooling maintenance.

`updateUnit()` now requires a supplied destination `propertyId` to identify an active property owned by the authenticated user. Preserve both cross-user rejection and same-user reassignment coverage.

Vitest loads `tests/setup/test-database.ts` before test modules: it loads local environment settings, rejects non-`localhost` hosts, and rewrites the database name to `propmanagerpro_test`. Isolated guard and Vitest integration checks passed; temporary verification files were removed. Fixture cleanup is separate from database isolation and is not universally proven by passing tests.

Historical next step was SSOT/diff review for the authorization fix, subsequently committed as `690eb0b`. Seven-day JWT production suitability remains a pending risk-acceptance decision; the policy is unchanged.

## Historical P2.2 checkpoint

The recorded local verification baseline is historical. The 75/75 tests, builds, local API checks, and migration application were not rerun during reconciliation; production remains unverified. September 7 source inspection at `82c475b` supports the P2.2 findings below.

P2.2 inspection has now established:

```text
Hard-delete business workflows -> Not supported
Property deletion              -> Soft delete
Unit deletion                  -> Soft delete
Tenant deletion                -> Soft delete
Lease deletion                 -> No delete workflow; lifecycle transitions
Payment deletion               -> No delete workflow
Payment -> Lease               -> onDelete: Restrict
Payment -> Tenant              -> onDelete: Restrict
Active lease definition        -> Lease.status = ACTIVE
Date-based active status       -> Not used
No Prisma schema change or migration was required from this inspection.
The existing database cascade relationships were reviewed but were not changed
because the supported application workflows do not expose hard-delete operations
for these business records.
No hard-delete business service capability was found, independently of routes.
D-031/D-032 are not implemented and are inapplicable to current scope under D-037.
D-033 is resolved through D-037; D-026 and D-036 remain pending.
The earlier six-document reconciliation was subsequently committed and published; it is not the current pending diff.
Do not treat a documentation lock as new runtime or production verification.
The next engineering task must be determined from the updated
PROJECT_STATE.md and TODO.md, rather than assuming that P2.2 still requires
implementation work.
```

---

# Known Technical Cleanup

## Frontend

Operational client:

```text
frontend/src/services/api.ts
```

Current intended architecture:

```text
services/api.ts
        |
        v
domain API/service modules
```

Legacy `lib/api-client.ts` cleanup is complete; no replacement abstraction was introduced.

---

## Backend Build

Current verified scripts:

```text
build: npx prisma generate && tsc
start: npx prisma migrate deploy && node dist/server.js
```

Production-critical Prisma generation is explicit in the build script.

D-020 records the historical configuration and separate pre-deploy/start target. Commit `4155c2e` implemented the local build portion; migrations still run in `start`. Production deployment staging remains unverified.

Do not reintroduce reliance on implicit `postinstall` behavior.

---

## Startup

Startup health checks originally ran non-blocking. Commit `1d71c69` (August 24, 2026) deliberately superseded that behavior: current startup awaits the database `SELECT 1` check before listening; failure prevents server startup and exits with code 1. See D-021 for the historical decision.

The public `/health` endpoint reports HTTP liveness without querying the database. Production monitoring remains unverified. Keep the distinction between:

```text
process running
```

from:

```text
application ready
```

Do not change this behavior without inspecting the current startup implementation first.

---

# AI Operating Rules

When continuing this project:

1. Read `AI_HANDOFF.md`.
2. Read `PROJECT_STATE.md`.
3. Follow the source-of-truth hierarchy.
4. Consult `ARCHITECTURE.md` before changing architecture.
5. Consult `DECISION_LOG.md` before reversing an important decision.
6. Read relevant recent `CHANGELOG.md` entries when historical context matters.
7. Read `TODO.md` when determining outstanding work.
8. Inspect the actual source code before assuming a documented feature exists.
9. Verify deployed behavior when the question concerns production.
10. Never mark TODO items complete without evidence.
11. Do not introduce unnecessary architecture.
12. Make one logical change at a time.
13. Test after each meaningful change.
14. Prefer explicit commands over implicit behavior.
15. Preserve financial correctness.
16. Preserve tenant isolation.
17. Do not change unrelated code while fixing a targeted problem.
18. Report verification evidence.
19. Update documentation after significant changes.
20. Never treat historical information as current without verification.
21. For frontend/backend validation failures, capture the actual network payload and compare it with the backend Zod schema.
22. Confirm whether the operation is create or update before changing the contract.
23. Do not weaken backend validation unless the business rule requires it.
24. Prefer correcting frontend payloads when rejected fields are immutable or create-only.

---

# AI Debug Context

When investigating any issue, follow the failure path before modifying code.

### 1. User Action

Document:

- What was the user trying to do?
- What steps produced the issue?
- What was the expected behaviour?

### 2. Frontend Behaviour

Inspect:

- Page/component involved
- Form state
- Submitted payload
- Browser console/network evidence

### 3. API Contract

Verify:

- Route being called
- HTTP method
- Request schema
- Allowed fields
- Response expectations

### 4. Backend Validation

Check:

- Zod schemas
- Input transformation
- Validation failures
- Error handling

### 5. Business Logic

Inspect:

- Service functions
- Permissions
- Domain rules
- Transaction boundaries

### 6. Database Behaviour

Verify:

- Prisma queries
- Relations
- Constraints
- Transaction behaviour
- Migration state

### 7. Evidence Review

Collect:

- Application logs
- Database state
- Tests
- Previous decisions
- Related incidents

### 8. Regression Protection

Before closing an issue:

- Add or update tests where appropriate.
- Record reusable lessons.
- Update relevant documentation.

Rule:

Do not modify code until the failure layer has been identified.

---

# Source-of-Truth Hierarchy

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

Implementation establishes current behavior; explicit architectural/business decisions establish intended behavior. Flag disagreements rather than assuming existing code proves the architecture correct.

If documentation conflicts with actual implementation:

```text
STOP
 |
 v
VERIFY THE CODE
 |
 v
VERIFY DEPLOYED STATE IF RELEVANT
 |
 v
UPDATE PROJECT_STATE.md
 |
 v
UPDATE AFFECTED DOCUMENTS
```

Never silently assume that documentation is more correct than the system.

---

# Continuation Protocol

A new AI session should determine:

```text
What is actually implemented?
What is currently deployed?
What phase are we in?
What is the next smallest safe change?
```

Do not immediately modify code.

First establish the current state.

The AI should not ask the user to repeat information that can be established from the project documentation, repository, configuration, or available deployment evidence.

---

# Inspect Before Changing

The required workflow is:

```text
Read authoritative documentation
        |
        v
Inspect actual implementation
        |
        v
Establish current behavior
        |
        v
Identify discrepancy/risk/task
        |
        v
Choose smallest safe change
        |
        v
Implement
        |
        v
Test
        |
        v
Assess documentation impact
        |
        v
Update affected documents
        |
        v
Verify consistency
```

Do not skip the inspection stage simply because documentation describes the expected behavior.

---

# Smallest Safe Change Principle

Prefer:

```text
One logical change
        |
        v
Verify
        |
        v
Continue
```

Avoid:

```text
Multiple unrelated changes
        |
        v
Large refactor
        |
        v
Difficult debugging
```

Do not introduce new architecture when an existing abstraction can safely be reused.

---

# Financial Correctness

Financial behavior is a protected system invariant.

Changes involving:

- payments
- leases
- rent
- balances
- finance analytics
- financial calculations
- payment history
- payment deletion/voiding

must be evaluated for business-rule and data-integrity impact before implementation.

Never sacrifice financial correctness for implementation convenience.

---

# Tenant Isolation

Tenant isolation is a protected security invariant.

Every authenticated resource operation must respect the authenticated user's ownership boundary.

Before completing a change that touches protected resources, verify that:

```text
User A
```

cannot access or modify:

```text
User B's data
```

through:

- direct IDs
- API requests
- nested resources
- analytics
- filters
- search
- exports
- aggregate queries
- related-resource traversal

---

# Documentation Maintenance Rule

Do not rewrite every project document after every code change.

Documentation must be updated according to the purpose of each document.

A small implementation change normally requires only the relevant code change.

A material change requires updating the appropriate documentation.

The goal is:

> **Minimum necessary documentation update, maximum preservation of project truth.**

---

# When Documentation Must Be Updated

After making a change, determine whether it is:

## A. Local / Trivial Change

Examples:

- fixing a typo
- changing a button label
- correcting minor styling
- refactoring internal code without changing behavior
- improving variable names
- removing dead code
- fixing an isolated implementation bug with no lasting architectural or behavioral significance

Normally:

**No project documentation update is required.**

---

## B. Material Change

A change is material when it affects one or more of:

- architecture
- security
- authentication
- authorization
- database schema
- API contracts
- business rules
- deployment
- infrastructure
- environment variables
- production behavior
- financial calculations
- data ownership / multi-tenancy
- major frontend/backend boundaries
- reliability
- testing strategy
- dependencies with architectural significance
- user-visible functionality
- major feature completion
- major bug resolution
- project phase/status
- technical decisions
- known risks
- future work

For material changes:

> Update the minimum set of documents required to keep the source of truth synchronized.

---

# Document Update Matrix

| Change                               | PROJECT_STATE         | ARCHITECTURE                       | DECISION_LOG         | CHANGELOG     | TODO                 | AI_HANDOFF                          |
| ------------------------------------ | --------------------- | ---------------------------------- | -------------------- | ------------- | -------------------- | ----------------------------------- |
| Minor UI fix                         | Usually no            | No                                 | No                   | No            | No                   | No                                  |
| Bug fix with no lasting significance | Usually no            | No                                 | No                   | Optional      | No                   | No                                  |
| Major bug fix                        | Yes if state changes  | If architectural                   | If decision involved | Yes           | If TODO affected     | If workflow changes                 |
| New feature                          | Yes                   | If architecture affected           | If decision involved | Yes           | If TODO affected     | Usually no                          |
| Database schema change               | Yes                   | Yes                                | If significant       | Yes           | If affected          | If workflow/risk changes            |
| API contract change                  | Yes                   | Yes                                | If significant       | Yes           | If affected          | If workflow changes                 |
| Security change                      | Yes                   | Yes if architectural               | Yes if decision      | Yes           | If follow-up remains | Yes if procedure changes            |
| Deployment change                    | Yes                   | Yes if architecture/infrastructure | If significant       | Yes           | If follow-up remains | Yes if deployment procedure changes |
| Major architectural refactor         | Yes                   | Yes                                | Yes                  | Yes           | If affected          | Yes                                 |
| New major engineering rule           | Yes if state affected | Possibly                           | Yes                  | If noteworthy | Possibly             | Yes                                 |
| Phase completion                     | Yes                   | Usually no                         | No                   | Yes           | Yes                  | Yes if handoff context changes      |

---

# Mandatory Post-Change Documentation Check

After every meaningful change, ask:

1. Did the current project state change?
2. Did the architecture change?
3. Was an important engineering decision made?
4. Is this a meaningful historical change?
5. Did the TODO list change?
6. Did an AI workflow or permanent engineering rule change?
7. Did security, deployment, database, API, financial, or multi-tenant behavior change?

Then update only the affected documents.

The AI must not skip this check for material changes.

---

# Source-of-Truth Conflict Rule

If documentation conflicts with actual implementation:

1. Inspect the implementation.
2. Determine the actual current behavior.
3. Verify deployed behavior when relevant.
4. Correct outdated documentation.
5. If the discrepancy resulted from an important decision, record the decision/change in `DECISION_LOG.md`.
6. Record meaningful historical changes in `CHANGELOG.md`.
7. Update `PROJECT_STATE.md` to reflect the resulting current truth.

Never preserve incorrect documentation simply because it was written earlier.

---

# AI Session Startup Procedure

At the beginning of a new AI session:

1. Read `AI_HANDOFF.md` to understand the operating rules and continuation protocol.
2. Read `PROJECT_STATE.md` to establish the current project state.
3. Read `ARCHITECTURE.md` when architectural context is needed.
4. Read relevant sections of `DECISION_LOG.md`.
5. Read relevant recent entries in `CHANGELOG.md`.
6. Read `TODO.md`.
7. Inspect actual source code/configuration before making assumptions.
8. Verify deployment state when relevant.
9. Identify the current phase and immediate objective.
10. Continue from the existing state rather than recreating previous work.

Do not ask the user to repeat information that can be established from the project documentation and source code.

## Local Database Migration Check

Before continuing H2 or running browser acceptance tests, confirm that the active local database has no pending Prisma migrations.

Run `npx prisma migrate status` from the `backend` directory.

The expected condition is that there are no pending migrations and the local database is up to date with the Prisma migration history.

The H1 browser verification initially used a local database where:

`20260919150000_add_payment_create_requests`

was pending. After applying migrations, verification passed.

---

# AI Session End / Handoff Procedure

Before ending a significant work session:

1. Verify the implementation.
2. Run relevant tests/build checks.
3. Update `PROJECT_STATE.md` if the current state changed.
4. Update `CHANGELOG.md` for meaningful completed changes.
5. Update `ARCHITECTURE.md` if architecture changed.
6. Update `DECISION_LOG.md` if an important decision was made.
7. Update `TODO.md` if outstanding work changed.
8. Update `AI_HANDOFF.md` only if the handoff rules or durable AI context changed.
9. Ensure documentation does not contradict the implementation.
10. Leave the repository in a state that another AI can continue safely.

---

# Critical Principle

Documentation is part of the engineering system, but documentation is not the work itself.

Do not waste development time continuously rewriting documentation.

Instead:

> **Change the code when the code needs changing.**

> **Update the source-of-truth document when the truth changes.**

> **Record history when something meaningful happened.**

> **Record decisions when an important decision was made.**

> **Update the handoff instructions when the way future AI sessions should operate changes.**

The objective is to keep PropManager Pro:

```text
Accurate
Maintainable
Transferable
AI-debuggable
```

without creating unnecessary documentation overhead.

---

# Default AI Behavior

When uncertain whether documentation needs updating, inspect the impact of the change rather than automatically updating everything.

Preferred workflow:

```text
Implement
   |
   v
Test
   |
   v
Assess impact
   |
   v
Update affected source-of-truth documents
   |
   v
Verify consistency
   |
   v
Continue
```

Never:

```text
Implement
   |
   v
Rewrite every document regardless of impact
```

---

# Final Rule

The AI must never confuse:

```text
Documented
```

with:

```text
Implemented
```

or:

```text
Historically implemented
```

with:

```text
Currently working
```

The correct progression is:

```text
Documented claim
      |
      v
Inspect implementation
      |
      v
Verify behavior
      |
      v
Establish evidence
      |
      v
Declare current truth
```

**Code is truth.**

**Database state is truth.**

**Deployed behavior is truth when deployment is relevant.**

Documentation records and communicates that truth; it does not override it.

---

**End of `AI_HANDOFF.md`**
