# PropManager Pro — AI Engineering Context

**Version:** 0.4 — SSOT Principle Added
**Last updated:** August 2026
**Status:** Pre-production stabilization audit

> **AI INSTRUCTION:** Read this entire document before touching any code.
> Treat 🟢 as fact. Treat 🟡 and ⚪ as requiring verification before action.
> Code and verified infrastructure win when they conflict with this document.
> Correct the document after correcting the code.

---

## Evidence Status Key

| Symbol | Meaning                                                  |
| ------ | -------------------------------------------------------- |
| 🟢     | Confirmed — observed directly in current code            |
| 🟡     | Historical — known from previous dev, not yet reverified |
| ⚪     | Unverified — inspect before assuming                     |
| 🔴     | Known debt — confirmed problem, not yet fixed            |

---

## Section 1 — AI Engineering Contract

_(Read before doing anything else)_

Every AI assistant working on PropManager Pro MUST:

1. **Read this document first.** Do not begin work without context.

2. **Never assume a 🟡 or ⚪ item is current.** Inspect the actual file.

3. **Never modify production infrastructure** without first establishing
   the production environment and database target explicitly.

4. **Never change multiple architectural layers simultaneously**
   unless explicitly required and approved.

5. **Before changing any code:**
   - Identify affected files
   - Explain current behavior
   - State the hypothesis
   - Identify the risk

6. **After changing any code:**
   - Run the narrowest relevant test
   - Run TypeScript/build validation
   - Inspect the diff
   - Report exactly what changed

7. **Never silently change:**
   - Database schema or migrations
   - Authentication or authorization logic
   - Payment logic
   - Deployment configuration
   - Environment variable handling

8. **Every significant change or production bug must produce:**
   - Root cause (not just a fix)
   - Verification that the fix works
   - Regression test where appropriate
   - Update to every affected SSOT document
   - Architectural/product decision recorded in DECISION_LOG.md when applicable

9. **Never use `any` when a meaningful type can be defined.**
   `any` removes structural signals AI uses to reason correctly.

10. **Never claim production is healthy based solely on local tests.**
    Local `.env` points to `localhost:5432`. Production is Supabase.
    These are different databases. Always confirm the target.

---

## Section 2 — Single Source of Truth (SSOT) Principle

PropManager Pro maintains a clear, authoritative source for every important
architectural, operational, and product decision.

Before creating, changing, or trusting information, determine where its
authoritative source lives.

### SSOT Hierarchy

```
1. Actual running code + verified production database
   → source of truth for current implementation and data structure

2. AI_ENGINEERING_CONTEXT.md  (this file)
   → source of truth for engineering context, architecture, known debt,
     verified constraints, and AI operating rules

3. DECISION_LOG.md
   → source of truth for why important decisions were made

4. SYSTEM_MAP.md
   → source of truth for routes, middleware, services, data flow

5. ROADMAP.md
   → source of truth for planned work and sequencing

6. API.md, BILLING.md, other domain docs
   → authoritative for their specific domain; must not contradict above
```

### SSOT Maintenance Rule

When a significant change is made:

1. Change the actual implementation
2. Verify the implementation
3. Update every affected authoritative document
4. Mark previously uncertain information as verified or obsolete
5. Record architectural decisions in DECISION_LOG.md
6. Update SYSTEM_MAP.md when routes, services, or data flow change
7. Commit code and documentation together whenever practical

**Documentation drift is treated as technical debt.**

### Conflict Rule

If two documents disagree:

- Do NOT guess which is correct
- Inspect the actual code/database/configuration
- Establish the current factual state
- Update the appropriate authoritative document
- Record the correction if it represents an architectural decision

### Governing Sequence

```
Inspect → Establish SSOT → Explain → Decide → Change →
Test → Verify → Update SSOT → Commit
```

Not: Inspect → Code → Fix → Move on.

### Goal

A future engineer or AI assistant should be able to enter this project,
read the authoritative documents, inspect the relevant code, and continue
work without reconstructing months of historical conversation.

---

## Section 3 — Product Purpose 🟢

PropManager Pro is a **multi-tenant property management SaaS** targeting small
landlords managing 1–10 residential units.

Core capabilities (v1.0 scope):

- Property and unit management
- Tenant management
- Lease lifecycle management
- Rent payment recording
- Finance analytics dashboard
- SaaS subscription billing (Lemon Squeezy — Phase 5, not yet built)

---

## Section 4 — Architecture Overview 🟢

```
Browser (Next.js — Vercel)
        ↓
Express API (TypeScript — Railway)
        ↓
Prisma ORM
        ↓
PostgreSQL (Supabase — EU West)
```

Monorepo:

```
propmanagerpro/
  backend/    → Express + TypeScript + Prisma
  frontend/   → Next.js + TypeScript + Tailwind
  docs/       → Engineering documentation (this file + SSOT system)
```

---

## Section 5 — Technology Stack

### Backend 🟢

- Runtime: Node.js 22
- Framework: **Express** (NOT NestJS — never confuse these)
- Language: TypeScript
- ORM: Prisma 6
- Validation: Zod
- Auth: JWT (jsonwebtoken + bcrypt)
- Logging: Pino + pino-http
- Security: Helmet, cors, express-rate-limit

### Frontend 🟡

- Framework: Next.js (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- API client: `frontend/src/services/api.ts`
  - Constructs: `${API_BASE_URL}${endpoint}`
  - Endpoints already include `/api/...`
  - **Never add `/api` to `NEXT_PUBLIC_API_URL` — causes double prefix**

### Infrastructure

| Service                                          | Status                                   |
| ------------------------------------------------ | ---------------------------------------- |
| Railway (EU West — Amsterdam)                    | 🔴 Expired — needs redeployment          |
| Vercel (frontend)                                | 🟡 Deployed — connectivity unverified    |
| Supabase (PostgreSQL, EU West)                   | 🟡 Exists — production schema unverified |
| GitHub (automationbyjohnpaul-oss/propmanagerpro) | 🟢 Active, main synced                   |

---

## Section 6 — Database Model 🟢

```
User
 ├── properties  Property[]
 └── tenants     Tenant[]

Property
 ├── userId      String   (direct ownership)
 ├── deletedAt   DateTime? (soft delete)
 ├── units       Unit[]
 └── leases      Lease[]

Unit
 ├── propertyId  String   (ownership through Property.userId)
 ├── deletedAt   DateTime? (soft delete)
 └── leases      Lease[]

Tenant
 ├── userId      String   (direct ownership — confirmed post-refactor)
 ├── deletedAt   DateTime? (soft delete)
 ├── leases      Lease[]
 └── payments    Payment[]
 @@unique([userId, email])

Lease
 ├── status            LeaseStatus  @default(PENDING)
 ├── terminatedAt      DateTime?
 ├── terminationReason String?
 ├── propertyId        String
 ├── unitId            String
 ├── tenantId          String
 └── payments          Payment[]

Payment
 ├── status    PaymentStatus
 ├── method    PaymentMethod
 ├── leaseId   String
 └── tenantId  String

AuditLog 🟡
 ├── userId, action, entity, entityId, metadata Json?
```

### Enums 🟢

```
LeaseStatus:   PENDING | ACTIVE | ENDED | TERMINATED
               ⚠️ NO "EXPIRED" VALUE — never generate queries using it

PaymentStatus: pending | completed | failed | refunded
PaymentMethod: cash | bank_transfer | card | check
UserRole:      LANDLORD | MANAGER | ADMIN
```

> ⚠️ No `isActive` field on Lease. `status` is the sole source of truth.

---

## Section 7 — Authentication Model 🟢

```
POST /api/auth/register  → creates User, returns JWT
POST /api/auth/login     → verifies password, returns JWT
```

JWT payload: `{ "userId": "...", "email": "...", "role": "..." }`
All protected requests: `Authorization: Bearer <token>`

`authMiddleware` → extracts/verifies token → attaches `req.userId` + `req.user`
All `/api/*` routes except `/api/auth` require this middleware.

---

## Section 8 — Tenant Isolation Rules CRITICAL 🟢

Every database query on protected resources MUST enforce ownership.
Violation = data breach.

### Correct pattern

```typescript
prisma.property.findFirst({
  where: { id, userId: req.userId },
});
```

### Dangerous — never use

```typescript
prisma.property.findUnique({
  where: { id }, // no userId — any user accesses any record
});
```

### Ownership chain 🟢

- `Property.userId` — direct
- `Unit` — through `Property.userId` (join required)
- `Tenant.userId` — direct (confirmed post-refactor)
- `Lease` — through `Property.userId`
- `Payment` — through `Lease → Property.userId`

### Explicitly rejected — never reintroduce 🔴

```typescript
leases: {
  none: {
  }
} // exposes all unleased tenants to all users
```

---

## Section 9 — API Route Map ⚪ UNVERIFIED

_Verify against route files before treating as authoritative._

### Public

```
GET  /                    → root health
GET  /health              → health endpoint
POST /api/auth/register
POST /api/auth/login
```

### Protected (authMiddleware required)

```
/api/properties           GET, POST
/api/properties/:id       GET, PUT, DELETE
/api/properties/:id/archive    ⚪
/api/properties/:id/restore    ⚪

/api/units                GET, POST
/api/units/:id            GET, PUT, DELETE

/api/tenants              GET, POST
/api/tenants/:id          GET, PUT, DELETE

/api/leases               GET, POST
/api/leases/:id           GET, PUT
/api/leases/:id/terminate      ⚪

/api/payments             GET, POST
/api/payments/:id         GET, PUT, DELETE

/api/finance              GET (analytics)
```

**Route debt 🔴:** `/finance` (without `/api`) also registered — likely legacy.
Inspect before removing. See TD-005.

---

## Section 10 — Service Map 🟢

```
backend/src/
  routes/         → Express route registration
  controllers/    → Request/response, validation
  services/       → Business logic, Prisma queries
  middleware/
    auth.middleware.ts      → JWT verification
    error.middleware.ts     → Global error handler
    rateLimit.middleware.ts → authLimiter + apiLimiter
  validators/     → Zod schemas
  lib/
    prisma.ts     → PrismaClient singleton
    logger.ts     → Pino instance
  config/
    env.ts        → Zod-validated env vars
  types/          → Shared TypeScript types
  tests/          → Test files (runner not configured — TD-011)
```

---

## Section 11 — Business Rules

### Properties 🟢

- `unitCount > 0` on create → auto-generates units (1..N)
- Auto-units default: bedrooms:1, bathrooms:1, rentAmount:0
- `unitCount` design decision pending — see TD-001
- Updating `unitCount` does NOT create/remove units — TD-002
- Soft delete via `deletedAt`

### Units 🟢

- Ownership through Property.userId
- Soft delete
- `hardDeleteUnit()` exists — policy undefined TD-007

### Tenants 🟢

- Direct `userId` ownership (confirmed)
- `@@unique([userId, email])`
- Soft delete

### Leases 🟢

- Overlapping active leases on same unit → 409
- `PENDING → ACTIVE → ENDED or TERMINATED`
- No `isActive` field — `status` only

### Payments 🟢

- NEVER hard deleted — void via status change only
- Preserves financial history

### Finance Analytics ⚪

- Must scope to `userId` — cross-tenant = critical failure
- Isolation not yet reverified

---

## Section 12 — Soft Delete Rules 🟢

```typescript
// Archive
prisma.model.update({ where: { id }, data: { deletedAt: new Date() } });

// Query active
prisma.model.findMany({ where: { userId, deletedAt: null } });

// Restore
prisma.model.update({ where: { id }, data: { deletedAt: null } });
```

Soft delete: Properties, Units, Tenants
Never deleted: Payments (void only)
Unclear: `hardDeleteUnit()` — TD-007

---

## Section 13 — Lease State Machine 🟢

```
[CREATE] → PENDING → ACTIVE → ENDED
                           ↘ TERMINATED
```

Valid values: `PENDING | ACTIVE | ENDED | TERMINATED`
No `EXPIRED` — do not use it.

---

## Section 14 — Deployment Architecture

### Current actual configuration 🟡

```json
"build": "tsc",
"start": "npx prisma migrate deploy && node dist/server.js",
"postinstall": "prisma generate"
```

> ⚠️ Migration bundled into start command. Postinstall contains critical
> Prisma generation. Both violate explicit pipeline principle. This is the
> current state, not the target.

### Target pipeline (desired — not yet applied) 🟡

```
Build command:  npm ci && npx prisma generate && npm run build
Pre-deploy:     npx prisma migrate deploy
Start command:  node dist/server.js
```

Apply this configuration when redeploying Railway.

### Supabase connection 🟢

Use transaction pooler only:

```
postgresql://postgres.[project-id]:[password]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

Direct connection (`db.[project-id].supabase.co:5432`) unreachable from Railway.

### 🔴 PRODUCTION DATABASE MIGRATION WARNING

```
NEVER run `prisma migrate deploy` against production until:
  1. DATABASE_URL explicitly set to Supabase pooler URL
  2. Production _prisma_migrations table inspected
  3. Database password rotated
  4. Git checkpoint created

Local `prisma migrate status` → localhost:5432 only.
It tells you NOTHING about production Supabase state.

History: Tables created manually via SQL editor during Railway network
incident. _prisma_migrations tracking may be incomplete or absent.
```

---

## Section 15 — Environment Variables

### Backend (Railway)

| Variable     | Required    | In Zod          | Notes                       |
| ------------ | ----------- | --------------- | --------------------------- |
| DATABASE_URL | Yes         | ✅              | Supabase pooler only        |
| JWT_SECRET   | Yes         | ✅ min 32 chars | Rotate — exposed in session |
| NODE_ENV     | Yes         | ✅              | Must be "production"        |
| FRONTEND_URL | Recommended | ❌ TD-004       | CORS — not Zod validated    |
| PORT         | No          | ✅ default 4000 |                             |

### Frontend (Vercel)

| Variable            | Required | Notes                        |
| ------------------- | -------- | ---------------------------- |
| NEXT_PUBLIC_API_URL | Yes      | Railway URL — NO /api suffix |

> ⚠️ CORS gap: `FRONTEND_URL` read via `process.env` directly, not through
> Zod schema. Missing value fails silently at CORS level, not at startup.

---

## Section 16 — Security Posture 🟢

| Control                  | Status        | Notes                                               |
| ------------------------ | ------------- | --------------------------------------------------- |
| Helmet                   | ✅            | crossOriginResourcePolicy:false — verify necessity  |
| CORS                     | ✅ Restricted | localhost:3000 + FRONTEND_URL                       |
| Rate limiting            | ✅            | authLimiter + apiLimiter                            |
| JWT auth                 | ✅            | All /api except /auth                               |
| Env validation           | ✅ Zod        | Fails at startup if DATABASE_URL/JWT_SECRET invalid |
| Body limit               | ✅ 1mb        |                                                     |
| FRONTEND_URL in Zod      | ❌            | TD-004                                              |
| Debug logs in production | ❌            | TD-006                                              |

---

## Section 17 — Known Technical Debt

| ID     | Description                                                                  | Priority |
| ------ | ---------------------------------------------------------------------------- | -------- |
| TD-001 | `Property.unitCount` semantic ownership undefined — design decision required | P1       |
| TD-002 | `updateProperty()` does not sync units when unitCount changes                | P1       |
| TD-003 | `any` types in unit.service.ts                                               | P1       |
| TD-004 | `FRONTEND_URL` not in Zod env schema                                         | P2       |
| TD-005 | `/finance` orphan route vs `/api/finance`                                    | P2       |
| TD-006 | Debug console.log in app.ts runs in production                               | P2       |
| TD-007 | `hardDeleteUnit()` — policy undefined                                        | P1       |
| TD-008 | Production Supabase migration state unverified                               | P0       |
| TD-009 | `isActive` references may exist in old code                                  | P2       |
| TD-010 | Lemon Squeezy billing not scoped into schema                                 | P1       |
| TD-011 | Automated test runner not configured                                         | P1       |
| TD-012 | Railway backend expired                                                      | P0       |
| TD-013 | Finance analytics isolation not reverified                                   | P1       |
| TD-014 | Deployment pipeline uses postinstall + bundled migration                     | P1       |

### TD-001 Detail — Decision required before schema hardening

`unitCount` currently serves as both input (units to auto-generate) and storage
(stored value that can drift). Two options:

**Option A (recommended):** Derive from actual Unit records at query time.
Units become single source of truth. Remove stored `unitCount`.

**Option B:** Keep as "intended capacity" — landlord config, separate from
actual units. UI must distinguish planned vs actual.

Record decision in DECISION_LOG.md before any implementation.

---

## Section 18 — Evidence Status Summary

### 🟢 CONFIRMED FROM CURRENT CODE

- Express (not NestJS)
- Prisma 6, PostgreSQL, Supabase
- Zod env validation (DATABASE_URL, JWT_SECRET, PORT, NODE_ENV)
- JWT authentication with authMiddleware
- Tenant direct `userId` ownership
- Property direct `userId` ownership
- Units inherit through Property
- Properties, Units, Tenants use soft delete
- CORS restricted to localhost:3000 + FRONTEND_URL
- Helmet, rate limiting, Pino logging, error middleware present
- LeaseStatus: PENDING | ACTIVE | ENDED | TERMINATED
- No `isActive` on Lease, no `EXPIRED` status

### 🟡 HISTORICAL — NOT YET REVERIFIED

- Archive/restore endpoints
- Lease termination endpoint
- Audit log coverage
- Frontend AuthGuard on all protected pages
- Vercel deployment connectivity

### ⚪ UNVERIFIED — INSPECT BEFORE ASSUMING

- Production Supabase schema vs local schema
- Railway variables still configured
- Finance analytics tenant isolation
- All route files match route map
- `/finance` vs `/api/finance` overlap
- `hardDeleteUnit()` callers

### 🔴 CONFIRMED PROBLEMS

- Railway expired (TD-012)
- Production migration state unknown (TD-008)
- Deployment pipeline not explicit (TD-014)
- `any` types in unit.service.ts (TD-003)
- `unitCount` design decision pending (TD-001, TD-002)
- Test runner not configured (TD-011)
- Debug logs in production (TD-006)

---

## Section 19 — Testing Architecture

### Current state 🔴

```
File exists:  backend/src/tests/unit.service.test.ts
Runner:       NOT CONFIGURED
package.json: "test": "echo \"Error: no test specified\" && exit 1"
```

### Required coverage before v1.0

- Authentication: register, login, invalid credentials, expired token
- Authorization: User A cannot access User B data (all entities)
- Properties, Units, Tenants: CRUD + archive/restore + ownership
- Leases: overlap prevention, state transitions
- Payments: create, void, no hard delete
- Finance: tenant isolation on analytics

### Target

```
npm run test:unit
npm run test:integration
npm run test:security
```

AI-assisted loop requires deterministic output:

```
CHANGE → npm test → FAIL (exact error) → fix → npm test → PASS
```

This loop is currently not possible. Establishing it is P1.

---

## Section 20 — Debugging Protocol

```
1. IDENTIFY ENVIRONMENT — local / Railway / Vercel / Supabase?
   Confirm DATABASE_URL target before any DB command.

2. COLLECT EVIDENCE — logs, error codes, network tab, stack traces

3. IDENTIFY LAYER — Frontend → Backend → Database → Infrastructure

4. FORM HYPOTHESIS — state what is wrong and why before proposing a fix

5. SMALLEST SAFE CHANGE — one change, verify, then next

6. VERIFY — confirm fix works before committing

7. UPDATE SSOT — update this doc or DECISION_LOG.md
```

### Prisma error codes

| Code  | Meaning                     |
| ----- | --------------------------- |
| P1001 | Cannot reach database       |
| P2002 | Unique constraint violation |
| P2021 | Table does not exist        |
| P2025 | Record not found            |
| P3005 | Database schema not empty   |
| P3008 | Migration already applied   |

---

## Section 21 — Release Protocol

### Launch Freeze Rule

Once Phase 5 (billing) begins: NO new features.
Only bug fixes, security fixes, deployment fixes.

### Roadmap — phases only, version numbers not yet frozen

| Phase | Description                                 | Status         |
| ----- | ------------------------------------------- | -------------- |
| 1     | Frontend ↔ Backend integration verification | 🟡 Partial     |
| 2     | End-to-end workflow testing                 | ⚪             |
| 3     | Production backend redeployment             | 🔴 Blocked     |
| 4     | Production frontend verification            | ⚪             |
| 5     | Lemon Squeezy billing                       | ⚪ Not started |
| 6     | Launch readiness                            | ⚪             |
| RC    | Release candidate freeze                    | ⚪             |
| v1.0  | Public launch                               | ⚪             |

### Git checkpoint rule

```bash
git add .
git commit -m "checkpoint: before [description]"
```

---

## Section 22 — Lemon Squeezy Billing (Phase 5)

**Domain B:** SaaS subscription billing — separate from tenant rent payments.

Planned:

- Endpoints: `POST /billing/create-checkout`, `POST /billing/webhook`
- Webhooks: subscription_created, subscription_updated, subscription_cancelled
- DB models needed: Subscription, BillingStatus (NOT YET IN SCHEMA)
- Gating: read-only mode when subscription inactive

> ⚠️ Do not finalize schema hardening before billing tables are designed.
> Billing adds User → Subscription relations affecting authorization throughout.

---

## Section 23 — Documentation System

Controlled doc set — do not create files outside this list without approval:

```
docs/
├── AI_ENGINEERING_CONTEXT.md  ← this file (AI/project operating context)
├── SYSTEM_MAP.md              ← routes, middleware, services, data flow
├── DECISION_LOG.md            ← why important decisions were made
├── ROADMAP.md                 ← planned work and sequencing
├── API.md                     ← API contract
├── ARCHITECTURE.md            ← deeper architectural reference
├── ERROR_HANDLING.md          ← error conventions
└── BILLING.md                 ← Lemon Squeezy design (create at Phase 5)
```

### Document update triggers

| Change                   | Documents to update                                       |
| ------------------------ | --------------------------------------------------------- |
| New API route            | SYSTEM_MAP.md, API.md, AI_ENGINEERING_CONTEXT.md          |
| Schema change            | AI_ENGINEERING_CONTEXT.md, DECISION_LOG.md, SYSTEM_MAP.md |
| Architectural decision   | DECISION_LOG.md, AI_ENGINEERING_CONTEXT.md                |
| New feature              | ROADMAP.md, SYSTEM_MAP.md                                 |
| Production incident      | AI_ENGINEERING_CONTEXT.md, DECISION_LOG.md                |
| Bug fix (no arch impact) | AI_ENGINEERING_CONTEXT.md if known debt changes           |

---

_Version 0.4 — SSOT principle, AI contract strengthened, doc system defined_
_Corrections from 0.3: deployment current vs target clarified, TD-001 expanded,_
_SSOT section added, AI contract rule 8 broadened, doc system section added_
