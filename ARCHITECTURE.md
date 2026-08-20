# PropManager Pro — Architecture

**Last Updated:** August 20, 2026
**Architecture State:** 🔒 LOCKED — SSOT Architecture Baseline
**Current Focus:** SSOT Enforcement / Backend Architecture Consolidation

---

# 1. Architectural Principles

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

# 2. Source-of-Truth Hierarchy

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
↓
Inspect actual implementation
↓
Determine current behavior
↓
Correct PROJECT_STATE.md
↓
Correct affected documentation
↓
Record important decision/history if necessary
Documentation must never be treated as more authoritative than the running system.

3. System Architecture
PropManager Pro follows a modular full-stack architecture:

text
Browser
   ↓
Next.js Frontend
   ↓
Express Backend
   ↓
Prisma
   ↓
PostgreSQL / Supabase
4. Backend Layer Responsibilities
text
HTTP Request
     ↓
Middleware
     ↓
Controller
     ↓
Service
     ↓
Prisma
     ↓
PostgreSQL / Supabase
Middleware
Responsible for:

Authentication

JWT verification

Attaching authenticated identity

Request-level concerns

Authentication identity comes from:

text
req.userId
Client-supplied user IDs must never be trusted for authorization.

Controllers
Controllers are HTTP orchestration layers.

Controllers are responsible for:

Reading request parameters

Reading request bodies

Reading authenticated identity

Calling the appropriate service

Translating service results into HTTP responses

Translating validation/errors where necessary

Controllers MUST NOT become the authoritative location for business rules.

Controllers should not directly perform business mutations through Prisma when an appropriate service exists.

Services
Services are the primary authoritative location for domain/business rules.

Services are responsible for:

Ownership verification

Authorization-related domain checks

Relationship integrity

State transitions

Business constraints

Financial rules

Archive/restore behavior

Domain mutations

Coordinating related operations

SSOT Rule
Every business rule must have one authoritative implementation.

Do not implement the same rule independently in:

text
Controller + Service + Frontend
The frontend may provide UX validation, but the backend service remains authoritative.

5. Service-Layer SSOT Pattern
Preferred:

text
Controller
    ↓
Service
    ↓
Prisma
Example:

text
activateLease()
terminateLease()
restoreLease()
endLease()
These service functions are authoritative for lease state transitions.

The controller should request the transition rather than independently implementing the transition rules.

6. Mutation SSOT Rule
Meaningful domain mutations should have a single authoritative service function.

Examples:

text
Property
├── createProperty()
├── updateProperty()
├── archiveProperty()
└── restoreProperty()

Unit
├── createUnit()
├── updateUnit()
├── archive/deleteUnit()
└── restoreUnit()

Tenant
├── createTenant()
├── updateTenant()
├── archiveTenant()
└── restoreTenant()

Lease
├── createLease()
├── updateLease()
├── activateLease()
├── terminateLease()
├── restoreLease()
└── endLease()

Payment
├── createPayment()
└── controlled payment mutation / void workflow
If a controller currently bypasses one of these service operations and directly accesses Prisma, that is considered SSOT technical debt and should be consolidated before major feature expansion.

7. Authorization SSOT
Every protected domain operation must enforce ownership using the authenticated user.

Ownership examples:

text
Property → Property.userId

Unit → Unit.property.userId

Tenant → Tenant.userId

Lease → Lease.property.userId

Payment → Payment.lease.property.userId
The service layer must not rely solely on a controller having performed an ownership check.

A service accepting:

ts
(id, userId)
must actually use userId when determining whether the resource belongs to that user.

A parameter that exists but is not used for authorization is an SSOT/security defect.

8. Frontend Architecture
Technology
Next.js

React

TypeScript

Tailwind CSS

App Router

Primary location:

text
frontend/src/
Major Areas
text
frontend/src/
├── app/
├── components/
├── context/
├── features/
├── lib/
├── services/
└── types/
Authentication
Authentication state is managed through:

text
context/AuthContext.tsx
Authentication utilities are in:

text
lib/auth.ts
Current storage:

JWT token

User information

stored in browser localStorage.

9. Frontend API Architecture
Primary API abstraction:

text
frontend/src/services/api.ts
It provides:

text
api.get()
api.post()
api.put()
api.patch()
api.delete()
Responsibilities:

API base URL handling

Authorization header injection

GET request deduplication

HTTP error handling

401/session-expiration handling

JSON parsing

Request cancellation support

API base URL:

text
NEXT_PUBLIC_API_URL
The base URL must not include /api.

Correct:

text
https://propmanagerpro-production.up.railway.app
Avoid:

text
https://.../api/api/...
10. API Client Duplication
Current files:

text
frontend/src/lib/api-client.ts
frontend/src/services/api.ts
services/api.ts is the operational API abstraction.

lib/api-client.ts appears unused.

Do not treat it as a second architecture.

Future cleanup should either remove it or explicitly migrate all consumers to it.

Until then:

frontend/src/services/api.ts is the operational frontend API client.

11. Authentication Architecture
Authentication uses:

text
bcrypt
JWT
Registration:

text
Frontend
   ↓
POST /api/auth/register
   ↓
Auth controller
   ↓
Auth service
   ↓
bcrypt password hashing
   ↓
User creation
   ↓
JWT generation
   ↓
Frontend
Login follows the same pattern.

JWT payload:

text
userId
email
role
Token lifetime:

text
7 days
Protected requests:

http
Authorization: Bearer <token>
12. Lease State Machine
Authoritative lease states:

text
PENDING
ACTIVE
ENDED
TERMINATED
There is no current EXPIRED state.

There is no current isActive field.

Transitions:

text
PENDING
   │
   │ activate
   ↓
ACTIVE
   │
   ├── terminate → TERMINATED
   │
   └── end       → ENDED
Restoration:

text
TERMINATED → ACTIVE
provided no conflicting active lease exists.

13. Multi-Tenant Security
PropManager Pro is multi-tenant.

Authenticated identity:

text
req.userId
Ownership:

text
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
Non-negotiable rule:

Never trust a resource ID alone when retrieving or modifying protected tenant-owned data.

14. Database
ORM:

text
Prisma
Database:

text
PostgreSQL
Host:

text
Supabase
Schema location:

text
backend/prisma/schema.prisma
Migrations:

text
backend/prisma/migrations/
Database schema is implementation truth.

15. Business Modules
Current core modules:

text
Authentication
Properties
Units
Tenants
Leases
Payments
Finance
Audit
16. Finance Architecture
Finance endpoints include:

text
/api/finance/dashboard
/api/finance/revenue-by-property
/api/finance/outstanding-rent
Rules:

Financial calculations must prioritize correctness.

Financial records must not be silently destroyed.

Finance analytics must remain user-scoped.

financeAnalytics.service.ts is the current database-backed calculation source.

Placeholder finance.service.ts must not be treated as authoritative.

17. Audit Logging
Important domain mutations should produce audit records.

Current service:

text
audit.service.ts
Audit fields:

userId

action

entity

entityId

metadata

timestamp

Future hardening should prefer transactional mutation + audit where required.

Preferred:

text
BEGIN TRANSACTION
    domain mutation
    audit record
COMMIT
18. Soft Delete
Soft delete uses:

text
deletedAt
for:

Properties

Units

Tenants

Rules:

Soft-deleted records normally excluded from active queries.

Historical financial/lease data must be preserved.

Hard deletion only where explicitly justified.

19. Deployment Architecture
text
Frontend → Vercel
Backend  → Railway
Database → Supabase PostgreSQL
Current backend start:

text
npx prisma migrate deploy && node dist/server.js
Current backend scripts:

text
dev: ts-node-dev --respawn --transpile-only src/server.ts
build: tsc
start: npx prisma migrate deploy && node dist/server.js
postinstall: prisma generate
Known issues:

postinstall Prisma generation is implicit.

Migration is coupled to application startup.

Railway subscription expired.

Production deployment requires re-establishment.

20. Environment Configuration
Backend validates:

text
DATABASE_URL
JWT_SECRET
PORT
NODE_ENV
JWT_SECRET minimum length:

text
32 characters
Frontend:

text
NEXT_PUBLIC_API_URL
Known gap:

text
FRONTEND_URL is used for CORS but not validated by env.ts
21. Type Safety
Avoid any in domain services.

Known debt:

ts
data: any
tx?: any
particularly in unit.service.ts.

Target:

text
Explicit domain input types
↓
Typed service functions
↓
Typed Prisma operations
22. Known Architecture Debt
Area	Problem	Priority
Lease	deleteLease() does not independently enforce ownership	P0
Lease	Some ownership/business checks remain in controller	P1
Property	Archive/restore logic bypasses property service	P1
Unit	Archive/restore logic bypasses unit service	P1
Tenant	Archive/restore logic duplicated between controller/service	P1
Unit	any types	P1
Payment	Validation/business rules need consolidation	P1
Audit	Mutation + audit not consistently transactional	P1
Property	unitCount semantic drift	P1
Finance	Placeholder/static finance service exists	P1
23. Architectural Refactoring Rule
Do not perform a broad rewrite.

Refactor incrementally:

text
Lease
  ↓
Property
  ↓
Unit
  ↓
Tenant
  ↓
Payment
  ↓
Finance
  ↓
Audit
For each domain:

text
Inspect
↓
Identify duplicated rules
↓
Choose authoritative service implementation
↓
Move logic
↓
Remove controller duplication
↓
Type it
↓
Test
↓
Verify
↓
Update documentation
↓
LOCK
↓
Next domain
24. AI Engineering Rule
For every meaningful change:

text
Inspect implementation
↓
Form hypothesis
↓
Make smallest safe change
↓
Test
↓
Verify
↓
Assess documentation impact
↓
Update affected SSOT documents
↓
Continue
Never make unrelated changes merely because they appear while working on another issue.

25. Architecture Lock Rule
When a major architectural change or domain refactor is completed and verified:

text
IMPLEMENTED
     ↓
TESTED
     ↓
VERIFIED
     ↓
DOCUMENTED
     ↓
🔒 LOCKED
A locked state means:

The current architecture is the working baseline.

Do not casually reopen the completed work.

Any later change that alters the locked architecture requires an explicit new decision.

Continue to the next planned domain/work item.

Locking does not mean the code can never change. It means the current verified architecture becomes the baseline for subsequent work.

End of ARCHITECTURE.md
```
