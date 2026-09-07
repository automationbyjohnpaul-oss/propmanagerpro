# PropManager Pro -- Architecture

**Last Updated:** September 7, 2026

**Architecture State:** [LOCKED] -- SSOT Architecture Baseline

**Current Focus:** Documentation reconciliation diff review; no implementation changes

September 7 source/configuration inspection supports the current descriptions. Historical local tests/builds/database verification were not rerun; production remains unverified. The architecture baseline lock is not a claim that all domain debt or this reconciliation review is complete.

---

## 1. Architectural Principles

PropManager Pro follows these primary engineering principles:

1. Single Source of Truth (SSOT)
2. Tenant isolation by authenticated user identity
3. Financial correctness over convenience
4. Explicit and deterministic behavior
5. Simple, readable architecture
6. Small, safe, verifiable changes
7. AI-debuggable code
8. Documentation must reflect implementation

The system should prefer one authoritative implementation over duplicated logic.

---

## 2. Source-of-Truth Hierarchy

When determining what is actually true:

1. Actual code/database/deployed behavior
2. `PROJECT_STATE.md`
3. `ARCHITECTURE.md`
4. `DECISION_LOG.md`
5. `DOCS/`
6. `CHANGELOG.md`
7. `TODO.md`
8. `AI_HANDOFF.md`
9. `README.md`

If documentation conflicts with implementation:

```text
STOP
|
v
Inspect actual implementation
|
v
Determine current behavior
|
v
Correct PROJECT_STATE.md
|
v
Correct affected documentation
|
v
Record important decision/history if necessary
```

Documentation must never be treated as more authoritative than the running system for current behavior. Explicit decisions establish intended behavior; flag any implementation/decision disagreement rather than treating implementation as proof of architectural correctness.

---

## 3. System Architecture

PropManager Pro follows a modular full-stack architecture:

```text
Browser
   |
   v
Next.js Frontend
   |
   v
Express Backend
   |
   v
Prisma
   |
   v
PostgreSQL / Supabase
```

---

## 4. Backend Layer Responsibilities

```text
HTTP Request
     |
     v
Middleware
     |
     v
Controller
     |
     v
Service
     |
     v
Prisma
     |
     v
PostgreSQL / Supabase
```

### Middleware

Responsible for:

- Authentication
- JWT verification
- Attaching authenticated identity
- Request-level concerns

Authentication identity comes from:

```text
req.userId
```

Client-supplied user IDs must never be trusted for authorization.

### Controllers

Controllers are HTTP orchestration layers.

Controllers are responsible for:

- Reading request parameters
- Reading request bodies
- Reading authenticated identity
- Calling the appropriate service
- Translating service results into HTTP responses
- Translating validation/errors where necessary

Controllers MUST NOT become the authoritative location for business rules.

Controllers should not directly perform business mutations through Prisma when an appropriate service exists.

### Services

Services are the primary authoritative location for domain/business rules.

Services are responsible for:

- Ownership verification
- Authorization-related domain checks
- Relationship integrity
- State transitions
- Business constraints
- Financial rules
- Archive/restore behavior
- Domain mutations
- Coordinating related operations

### SSOT Rule

Every business rule must have one authoritative implementation.

Do not implement the same rule independently in:

```text
Controller + Service + Frontend
```

The frontend may provide UX validation, but the backend service remains authoritative.

---

## 5. Service-Layer SSOT Pattern

Preferred:

```text
Controller
    |
    v
Service
    |
    v
Prisma
```

Example:

```text
activateLease()
terminateLease()
restoreLease()
endLease()
```

These service functions are authoritative for lease state transitions.

The controller should request the transition rather than independently implementing the transition rules.

---

## 6. Mutation SSOT Rule

Meaningful domain mutations should have a single authoritative service function.

Examples:

```text
Property
+-- createProperty()
+-- updateProperty()
+-- archiveProperty()
+-- restoreProperty()

Unit
+-- createUnit()
+-- updateUnit()
+-- archive/deleteUnit()
+-- restoreUnit()

Tenant
+-- createTenant()
+-- updateTenant()
+-- archiveTenant()
+-- restoreTenant()

Lease
+-- createLease()
+-- updateLease()
+-- activateLease()
+-- terminateLease()
+-- restoreLease()
+-- endLease()

Payment
+-- createPayment()
+-- updatePayment() under D-025; no VOID/VOIDED workflow
```

If a controller currently bypasses one of these service operations and directly accesses Prisma, that is considered SSOT technical debt and should be consolidated before major feature expansion.

---

## 7. Authorization SSOT

Every protected domain operation must enforce ownership using the authenticated user.

Ownership examples:

```text
Property -> Property.userId
Unit -> Unit.property.userId
Tenant -> Tenant.userId
Lease -> Lease.property.userId
Payment -> Payment.lease.property.userId
```

The service layer must not rely solely on a controller having performed an ownership check.

A service accepting:

```ts
(id, userId)
```

must actually use `userId` when determining whether the resource belongs to that user.

A parameter that exists but is not used for authorization is an SSOT/security defect.

---

## 8. Frontend Architecture

### Technology

- Next.js
- React
- TypeScript
- Tailwind CSS
- App Router

Primary location:

```text
frontend/src/
```

### Major Areas

```text
frontend/src/
+-- app/
+-- components/
+-- context/
+-- features/
+-- lib/
+-- services/
+-- types/
```

### Authentication

Authentication state is managed through:

```text
context/AuthContext.tsx
```

Authentication utilities are in:

```text
lib/auth.ts
```

Current storage:

- JWT token
- User information

stored in browser localStorage.

The application guard is `(app)/layout.tsx` using AuthContext; standalone `components/AuthGuard.tsx` has no application references. The layout hides children while loading or without a user, then redirects to /login. It covers dashboard, properties/units, tenants, leases, payments, finance, and More. Login/register are outside the group. Saved user restoration does not validate JWT expiry; the backend verifies JWTs, and API-client 401 handling clears token/user storage and redirects. This establishes source behavior, not end-to-end browser verification.

---

## 9. Frontend API Architecture

Primary API abstraction:

```text
frontend/src/services/api.ts
```

It provides:

```text
api.get()
api.post()
api.put()
api.patch()
api.delete()
```

Responsibilities:

- API base URL handling
- Authorization header injection
- GET request deduplication
- HTTP error handling
- 401/session-expiration handling
- JSON parsing
- Request cancellation support

API base URL:

```text
NEXT_PUBLIC_API_URL
```

The base URL must not include `/api`.

Correct:

```text
https://propmanagerpro-production.up.railway.app
```

Avoid:

```text
https://.../api/api/...
```

---

## 10. API Client Duplication

Current files:

```text
frontend/src/lib/api-client.ts
frontend/src/services/api.ts
```

`services/api.ts` is the operational API abstraction.

`lib/api-client.ts` appears unused.

Do not treat it as a second architecture.

Future cleanup should either remove it or explicitly migrate all consumers to it.

Until then: `frontend/src/services/api.ts` is the operational frontend API client.

---

## 11. Authentication Architecture

Authentication uses:

```text
bcrypt
JWT
```

Registration:

```text
Frontend
   |
   v
POST /api/auth/register
   |
   v
Auth controller
   |
   v
Auth service
   |
   v
bcrypt password hashing
   |
   v
User creation
   |
   v
JWT generation
   |
   v
Frontend
```

Login follows the same pattern.

JWT payload:

```text
userId
email
role
```

Token lifetime:

```text
7 days
```

Protected requests:

```http
Authorization: Bearer <token>
```

---

## 12. Lease State Machine

Authoritative lease states:

```text
PENDING
ACTIVE
ENDED
TERMINATED
```

There is no current `EXPIRED` state.

There is no current `isActive` field.

Transitions:

```text
PENDING
   |
   | activate
   v
ACTIVE
   |
   +-- terminate -> TERMINATED
   |
   +-- end       -> ENDED
```

Restoration:

```text
TERMINATED -> ACTIVE
```

provided no conflicting active lease exists.

### Active Lease Definition

[CONFIRMED BY SOURCE INSPECTION / D-037]

Active Lease = Lease.status == ACTIVE. Lease dates do not independently determine activity. D-033 is resolved through D-037; no implementation change was required. Date ordering validation and payment reporting periods are separate concerns.

The current active-lease checks are enforced across:

- Tenant archive (blocks archiving tenants with active leases)
- Unit archive (blocks archiving units with active leases)
- Lease state transitions (activate/restore conflict detection)
- Active lease lookups
- Finance calculations

Creation/update conflicts also use ACTIVE status. Existing Unit/Tenant tests reject archive for ACTIVE leases with past end dates. Tests were inspected, not rerun.

### Database Enforcement

PostgreSQL enforces the following invariant with a partial unique index:

```text
leases_one_active_per_unit_idx
```

Rule:

```text
At most one ACTIVE lease may exist per unit.
```

The lease service converts concurrent active-lease database conflicts (`P2002`) into:

```text
409 ConflictError
Unit already has an active lease
```

This migration defines the database-level enforcement layer complementing service checks. Local application is historical evidence; current database/production application was not reverified. The existing `P2002` regression mocks a constraint error rather than executing a live race.

---

## 13. Multi-Tenant Security

PropManager Pro is multi-tenant.

Authenticated identity:

```text
req.userId
```

Ownership:

```text
User
 |
 +-- Property.userId
 |
 +-- Tenant.userId

Property
 |
 +-- Units

Unit
 |
 +-- Leases

Tenant
 |
 +-- Leases

Lease
 |
 +-- Payments
```

Non-negotiable rule:

Never trust a resource ID alone when retrieving or modifying protected tenant-owned data.

---

## 14. Database

ORM:

```text
Prisma
```

Database:

```text
PostgreSQL
```

Host:

```text
Supabase
```

Schema location:

```text
backend/prisma/schema.prisma
```

Migrations:

```text
backend/prisma/migrations/
```

Database schema is implementation truth.

---

## 15. Business Modules

Current core modules:

```text
Authentication
Properties
Units
Tenants
Leases
Payments
Finance
Audit
```

---

## 16. Finance Architecture

Finance endpoints include:

```text
/api/finance/dashboard
/api/finance/revenue-by-property
/api/finance/outstanding-rent
```

Rules:

- Financial calculations must prioritize correctness.
- Financial records must not be silently destroyed.
- Finance analytics must remain user-scoped.

`financeAnalytics.service.ts` is the current database-backed calculation source.

Placeholder `finance.service.ts` must not be treated as authoritative.

---

## 17. Audit Logging

Important domain mutations should produce audit records.

Current service:

```text
audit.service.ts
```

Audit fields:

- `userId`
- `action`
- `entity`
- `entityId`
- `metadata`
- `timestamp`

Future hardening should prefer transactional mutation + audit where required.

Preferred:

```text
BEGIN TRANSACTION
    domain mutation
    audit record
COMMIT
```

---

## 18. Soft Delete

Soft delete uses:

```text
deletedAt
```

for:

- Properties
- Units
- Tenants

Rules:

- Soft-deleted records normally excluded from active queries.
- Historical financial/lease data must be preserved.
- No hard-delete business capability exists for Property, Unit, Tenant, Lease, or Payment in the inspected services/routes.
- Leases use lifecycle transitions; Payments have no delete workflow and their Lease/Tenant relations use Restrict.
- Operational database cascades and test cleanup are separate from business deletion workflows.
- D-031/D-032 are not implemented and are inapplicable to current scope under D-037. A future hard-delete capability requires an explicit new decision.

---

## 19. Deployment Architecture

```text
Frontend -> Vercel
Backend  -> Railway
Database -> Supabase PostgreSQL
```

Current backend start:

```text
npx prisma migrate deploy && node dist/server.js
```

Current backend scripts:

```text
dev: ts-node-dev --respawn --transpile-only src/server.ts
build: npx prisma generate && tsc
start: npx prisma migrate deploy && node dist/server.js
```

Known issues:

- No `postinstall` exists; explicit generation was implemented in `4155c2e`. D-020 preserves the old configuration and target as history.
- Migration is coupled to application startup; D-020's separate pre-deploy/start target is not established. No tracked Railway configuration was found and platform settings remain unverified.
- Railway subscription expired.
- Production deployment requires re-establishment.

---

## 20. Environment Configuration

Backend validates:

```text
DATABASE_URL
JWT_SECRET
PORT
NODE_ENV
FRONTEND_URL
```

`JWT_SECRET` minimum length:

```text
32 characters
```

Frontend:

```text
NEXT_PUBLIC_API_URL
```

`FRONTEND_URL` is URL-validated by `env.ts`. Production values and CORS behavior remain unverified.

---

## 21. Type Safety

Avoid `any` in domain services.

Known debt:

```ts
data: any
tx?: any
```

particularly in `unit.service.ts`.

Target:

```text
Explicit domain input types
|
v
Typed service functions
|
v
Typed Prisma operations
```

---

## 22. Known Architecture Debt

| Area | Problem | Priority |
|------|---------|----------|
| Lease | Review controller termination-reason validation boundary; service ownership checks exist | P1 |
| Property | Two service soft-delete paths (`deleteProperty` / `archiveProperty`) remain | P1 |
| Unit | Controller performs a direct property ownership read; mutations delegate to service | P1 |
| Unit | `any` types in service layer | P1 |
| Payment | D-025 rules are service-enforced; D-036 business decision remains pending | P1 |
| Audit | Mutation + audit not consistently transactional | P1 |
| Property | `unitCount` semantic drift | P1 |
| Finance | Placeholder/static finance service exists | P1 |

**Note:** P2.1 addressed the active-lease archive business-rule duplication for Unit and Tenant.

Property/Unit/Tenant archive and restore already delegate to ownership-checking services. No `deleteLease()` or Unit/Tenant hard-delete service capability exists. D-037 resolves the active-lease definition; D-031/D-032 do not schedule implementation in current scope. Remaining finance review includes archived-record filtering; D-026 remains pending for `unitCount` semantics.

---

## 23. Architectural Refactoring Rule

Do not perform a broad rewrite.

Refactor incrementally:

```text
Lease
  |
  v
Property
  |
  v
Unit
  |
  v
Tenant
  |
  v
Payment
  |
  v
Finance
  |
  v
Audit
```

For each domain:

```text
Inspect
|
v
Identify duplicated rules
|
v
Choose authoritative service implementation
|
v
Move logic
|
v
Remove controller duplication
|
v
Type it
|
v
Test
|
v
Verify
|
v
Update documentation
|
v
LOCK
|
v
Next domain
```

---

## 24. AI Engineering Rule

For every meaningful change:

```text
Inspect implementation
|
v
Form hypothesis
|
v
Make smallest safe change
|
v
Test
|
v
Verify
|
v
Assess documentation impact
|
v
Update affected SSOT documents
|
v
Continue
```

Never make unrelated changes merely because they appear while working on another issue.

---

## 25. Architecture Lock Rule

When a major architectural change or domain refactor is completed and verified:

```text
IMPLEMENTED
     |
     v
TESTED
     |
     v
VERIFIED
     |
     v
DOCUMENTED
     |
     v
[LOCKED]
```

A locked state means:

- The current architecture is the working baseline.
- Do not casually reopen the completed work.
- Any later change that alters the locked architecture requires an explicit new decision.
- Continue to the next planned domain/work item.

Locking does not mean the code can never change. It means the current verified architecture becomes the baseline for subsequent work.

---

**End of `ARCHITECTURE.md`**
