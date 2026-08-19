# PropManager Pro — System Map

**Version:** 0.1 — Initial (partially verified)
**Last updated:** August 2026
**Status:** Generated from code audit — items marked by evidence status

> **SSOT RULE:** This document maps how the system is currently wired.
> It must be updated whenever routes, middleware, services, or data flow change.
> Items marked ⚪ have not been verified against current code this session.
> Generate from actual code, not from memory or conversation history.

---

## Evidence Status Key

| Symbol | Meaning                                         |
| ------ | ----------------------------------------------- |
| 🟢     | Verified against current code this session      |
| 🟡     | Historical — likely accurate, not reverified    |
| ⚪     | Unverified — inspect before treating as current |
| 🔴     | Known problem                                   |

---

## 1. Request Flow (Backend) 🟢

```
Incoming HTTP Request
        ↓
app.set("trust proxy", 1)        [Railway proxy]
        ↓
helmet()                          [Security headers]
        ↓
cors({ origin: [...] })           [Origin restriction]
        ↓
express.json({ limit: "1mb" })    [Body parsing]
        ↓
pinoHttp({ logger })              [Request logging]
        ↓
Route matching
        ↓
  ┌─────────────────────────────────────┐
  │  PUBLIC routes (no auth)            │
  │  GET /                              │
  │  GET /health                        │
  │  POST /api/auth/register            │
  │  POST /api/auth/login               │
  └─────────────────────────────────────┘
        OR
  ┌─────────────────────────────────────┐
  │  AUTH routes with rate limiting     │
  │  authLimiter → /api/auth/*          │
  └─────────────────────────────────────┘
        OR
  ┌─────────────────────────────────────┐
  │  PROTECTED routes                   │
  │  apiLimiter → /api/*                │
  │  authMiddleware → /api/*            │
  │  (extracts userId, attaches to req) │
  │  → route handler                    │
  └─────────────────────────────────────┘
        ↓
Controller
        ↓
Service (business logic + Prisma)
        ↓
Prisma ORM
        ↓
PostgreSQL (Supabase)
        ↓
Response
        ↓
errorMiddleware (if error thrown)
```

---

## 2. Middleware Stack 🟢

Registered in `backend/src/app.ts` in this order:

| Order | Middleware               | Scope            | File                    |
| ----- | ------------------------ | ---------------- | ----------------------- |
| 1     | trust proxy              | All              | app.ts                  |
| 2     | helmet                   | All              | app.ts                  |
| 3     | cors                     | All              | app.ts                  |
| 4     | express.json (1mb limit) | All              | app.ts                  |
| 5     | pinoHttp                 | All              | app.ts                  |
| 6     | authLimiter              | /api/auth/\*     | rateLimit.middleware.ts |
| 7     | apiLimiter               | /api/\*          | rateLimit.middleware.ts |
| 8     | authMiddleware           | Protected routes | auth.middleware.ts      |
| 9     | errorMiddleware          | All (last)       | error.middleware.ts     |

**authMiddleware behavior:**

```
Authorization header present?
  No  → 401 "Authentication required"
  Yes → extract Bearer token
        ↓
        verifyToken(token)
          fail → 401 "Invalid or expired token"
          pass → attach req.userId, req.user
                 ↓
                 next()
```

---

## 3. Route Map 🟢/⚪

### Public Routes 🟢

```
GET  /         → inline handler in app.ts → { status, service, env, timestamp }
GET  /health   → health.routes.ts → healthRoutes
POST /api/auth/register  → auth.routes.ts → authController.register
POST /api/auth/login     → auth.routes.ts → authController.login
```

### Protected Routes 🟢 (confirmed registered in app.ts)

```
/api/properties      → authMiddleware → property.routes.ts
/api/units           → authMiddleware → unit.routes.ts
/api/tenants         → authMiddleware → tenant.routes.ts
/api/leases          → authMiddleware → lease.routes.ts
/api/payments        → authMiddleware → payment.routes.ts
/api/finance         → authMiddleware → financeAnalytics.routes.ts
/finance             → authMiddleware → finance.routes.ts  🔴 LEGACY ROUTE
```

### Individual endpoint handlers ⚪ (verify against route files)

```
Properties:
  GET    /api/properties          → getAllProperties(userId)
  POST   /api/properties          → createProperty(userId, data)
  GET    /api/properties/:id      → getPropertyById(id, userId)
  PUT    /api/properties/:id      → updateProperty(id, userId, data)
  DELETE /api/properties/:id      → deleteProperty(id, userId)
  POST   /api/properties/:id/archive  ⚪
  POST   /api/properties/:id/restore  ⚪

Units:
  GET    /api/units               → getAllUnits(userId)
  POST   /api/units               → createUnit(userId, data)
  GET    /api/units/:id           → getUnitById(id, userId)
  PUT    /api/units/:id           → updateUnit(id, userId, data)
  DELETE /api/units/:id           → ⚪ soft or hard delete?

Tenants:
  GET    /api/tenants             → getAllTenants(userId)
  POST   /api/tenants             → createTenant(userId, data)
  GET    /api/tenants/:id         → getTenantById(id, userId)
  PUT    /api/tenants/:id         → updateTenant(id, userId, data)
  DELETE /api/tenants/:id         → deleteTenant(id, userId)

Leases:
  GET    /api/leases              → getAllLeases(userId)
  POST   /api/leases              → createLease(userId, data)
  GET    /api/leases/:id          → getLeaseById(id, userId)
  PUT    /api/leases/:id          → updateLease(id, userId, data)
  POST   /api/leases/:id/terminate  ⚪

Payments:
  GET    /api/payments            → getAllPayments(userId)
  POST   /api/payments            → createPayment(userId, data)
  GET    /api/payments/:id        → getPaymentById(id, userId)
  PUT    /api/payments/:id        → updatePayment(id, userId, data)
  DELETE /api/payments/:id        → ⚪ void or hard delete?

Finance:
  GET    /api/finance/dashboard   → getDashboardMetrics(userId)  ⚪
```

---

## 4. Service → Database Map 🟢/⚪

### property.service.ts 🟢

```
getAllProperties(userId)
  → prisma.property.findMany({ where: { userId, deletedAt: null } })

getPropertyById(id, userId)
  → prisma.property.findFirst({ where: { id, userId } })

createProperty(userId, data)
  → prisma.$transaction:
      prisma.property.create({ data: { ...data, userId } })
      if unitCount > 0:
        prisma.unit.createMany({ data: N units with propertyId })

updateProperty(id, userId, data)
  → ownership check: findFirst({ where: { id, userId } })
  → prisma.property.update({ where: { id }, data })
  ⚠️ does NOT sync units when unitCount changes (TD-002)

deleteProperty / archiveProperty
  → ⚪ verify soft vs hard delete behavior
```

### unit.service.ts 🟢 (with known issues)

```
getAllUnits(userId)
  → traverses: Unit → Property → userId
  → prisma.unit.findMany({ where: { property: { userId }, deletedAt: null } })

createUnit(userId, data, tx?)
  ⚠️ data typed as `any` (TD-003)
  ⚠️ tx typed as `any` (TD-003)

updateUnit / deleteUnit
  → ⚪ verify ownership enforcement pattern
```

### tenant.service.ts 🟢

```
getAllTenants(userId)
  → prisma.tenant.findMany({ where: { userId, deletedAt: null } })

getTenantById(id, userId)
  → prisma.tenant.findFirst({ where: { id, userId } })
  ⚠️ does NOT filter by deletedAt: null — archived tenants visible (may be intentional)

createTenant(userId, data)
  → prisma.tenant.create({ data: { ...data, userId } })

updateTenant(id, userId, data)
  → ownership: findFirst({ where: { id, userId } })
  → prisma.tenant.update

deleteTenant(id, userId)
  → ⚪ soft or hard delete?
```

### auth.service.ts 🟢

```
registerUser(data)
  → prisma.user.findUnique({ where: { email } }) — check existing
  → bcrypt.hash(password, 10)
  → prisma.user.create({ data })
  → jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: "7d" })

loginUser(data)
  → prisma.user.findUnique({ where: { email } })
  → bcrypt.compare(password, user.password)
  → jwt.sign(...)

verifyToken(token)
  → jwt.verify(token, JWT_SECRET)
```

### financeAnalytics.service.ts ⚪

```
getDashboardMetrics(userId)
  → multiple Prisma aggregations scoped to userId
  → MUST verify tenant isolation here before production
  → ⚪ inspect before trusting
```

---

## 5. Environment → Behavior Map 🟢

```
env.ts (Zod schema):
  DATABASE_URL  → PrismaClient connection
  JWT_SECRET    → jwt.sign / jwt.verify
  PORT          → app.listen
  NODE_ENV      → logged at startup, controls some behaviors

process.env (NOT in Zod):
  FRONTEND_URL  → cors origin array (TD-004)
```

**Startup behavior:**

```
1. env.ts parses process.env through Zod
   → fails fast if DATABASE_URL or JWT_SECRET missing/invalid
2. console.log environment check (TD-006 — remove before launch)
3. Middleware stack registered
4. Routes registered
5. app.listen(PORT)
```

---

## 6. Database Connection 🟢

```
lib/prisma.ts
  → PrismaClient singleton
  → globalThis pattern (prevents multiple instances in dev)
  → reads DATABASE_URL from environment

Production (Railway → Supabase):
  URL: postgresql://postgres.[id]:[pw]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
  Mode: Transaction pooler (PgBouncer)
  Params: ?pgbouncer=true&connection_limit=1

Local (.env):
  URL: postgresql://postgres:[pw]@localhost:5432/propmanagerpro
  ⚠️ Local and production are DIFFERENT databases
```

---

## 7. Frontend → Backend Flow 🟡

```
frontend/src/services/api.ts
  → API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  → request(endpoint, options):
      url = `${API_BASE_URL}${endpoint}`
      attach Authorization: Bearer <token> if token exists
      401 response → removeToken(), redirect to /login
      204 response → return undefined
      error response → throw Error(message)

Token storage:
  → frontend/src/lib/auth.ts  ⚪ (getToken/removeToken — verify storage mechanism)

Auth flow: ⚪
  → frontend/src/context/AuthContext.tsx
  → AuthGuard wrapping protected pages
```

---

## 8. Known Wiring Issues 🔴

| Issue                                 | Location          | Impact                                                           |
| ------------------------------------- | ----------------- | ---------------------------------------------------------------- |
| `/finance` legacy route               | app.ts            | Duplicate of `/api/finance` — unknown if different handler       |
| `any` types in unit.service.ts        | unit.service.ts   | Type safety gap at data layer                                    |
| `getTenantById` no `deletedAt` filter | tenant.service.ts | Archived tenants may appear — verify if intentional              |
| Debug env logs at startup             | app.ts            | Runs in production — remove before launch                        |
| `postinstall` prisma generate         | package.json      | Hidden lifecycle step — violates explicit pipeline rule          |
| Migration bundled in `start`          | package.json      | Startup responsible for schema — violates explicit pipeline rule |

---

## 9. Files Not Yet Mapped ⚪

These files exist but have not been inspected this session:

```
backend/src/routes/
  health.routes.ts
  finance.routes.ts        ← legacy route — what does this serve?
  financeAnalytics.routes.ts

backend/src/controllers/
  property.controller.ts
  unit.controller.ts
  tenant.controller.ts
  lease.controller.ts
  payment.controller.ts
  financeAnalytics.controller.ts

backend/src/services/
  lease.service.ts
  payment.service.ts
  financeAnalytics.service.ts

backend/src/middleware/
  error.middleware.ts
  rateLimit.middleware.ts

backend/src/validators/
  (all validator files)

frontend/src/
  context/AuthContext.tsx
  lib/auth.ts
  All page components
```

These should be audited in priority order:

1. `financeAnalytics.service.ts` — tenant isolation risk
2. `finance.routes.ts` — legacy route investigation
3. `lease.service.ts` — business rule verification
4. `error.middleware.ts` — error handling audit
5. `rateLimit.middleware.ts` — rate limit configuration

---

_Version 0.1 — Initial system map from audit session_
_Partially verified. Items marked ⚪ require code inspection before treating as current._
_Update this document whenever routes, services, or data flow change._
