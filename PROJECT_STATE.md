Great.

Now paste this entire content into Notepad:

---

```text
# PropManager Pro — Project State

**Document:** `PROJECT_STATE.md`
**Status:** 🟢 Active — Source of Current Operational State
**Last Updated:** 2026-08-19
**Project:** PropManager Pro

---

## 1. Purpose of This Document

`PROJECT_STATE.md` is the primary operational state document for PropManager Pro.

It answers:

> **What is true about the project right now?**

It records the current product, architecture, technology, security model, deployment state, development rules, known issues, and current phase.

This document is intentionally different from:

* `ARCHITECTURE.md` — how the system is structured
* `DECISION_LOG.md` — why important decisions were made
* `CHANGELOG.md` — what changed historically
* `TODO.md` — what remains to be done
* `DOCS/*` — detailed technical reference
* `AI_HANDOFF.md` — compact entry point for a new AI conversation

---

## 2. Source-of-Truth Hierarchy

PropManager Pro follows this hierarchy:

```text
1. CURRENT CODE + DATABASE SCHEMA
          ↓
2. PROJECT_STATE.md
          ↓
3. ARCHITECTURE.md
          ↓
4. DECISION_LOG.md
          ↓
5. DOCS/*
          ↓
6. CHANGELOG.md
          ↓
7. TODO.md
          ↓
8. AI_HANDOFF.md
```

### Rules

1. Current code and database schema are the ultimate implementation truth.
2. If documentation conflicts with current implementation, the documentation must be corrected.
3. `PROJECT_STATE.md` describes the verified operational state.
4. `ARCHITECTURE.md` describes the intended/current system structure.
5. `DECISION_LOG.md` records important architectural and product decisions.
6. `TODO.md` contains planned work and must never be treated as completed functionality.
7. `AI_HANDOFF.md` is derived from the authoritative documents and is not an independent source of truth.
8. Historical information must not be presented as current functionality unless verified.

---

## 3. Evidence Status

Project documentation uses the following status markers:

```text
🟢 CONFIRMED
Verified directly from current code, schema, configuration, or deployment evidence.

🟡 HISTORICAL
Known from previous development work but not recently re-verified.

⚪ UNVERIFIED
Potentially true but requires inspection or testing before being treated as fact.

🔴 CONFIRMED PROBLEM
A verified defect, risk, inconsistency, or technical debt item.

🔵 DECISION
An explicitly accepted project/product/architecture decision.
```

---

## 4. Product Identity

### Product

**PropManager Pro**

### Product Type

Multi-tenant property-management SaaS.

### Primary Target

Small landlords and small property managers.

### Product Philosophy

PropManager Pro prioritizes:

* Simplicity
* Mobile-first usability
* Clear workflows
* Financial correctness
* Reliable data handling
* Strong tenant isolation
* Maintainable architecture
* AI-assisted development and debugging
* Automation where it meaningfully reduces work
* Avoiding unnecessary feature complexity

The product is intentionally not trying to compete through feature quantity alone.

---

## 5. Core Domain

The current core business domains are:

```text
Authentication
    │
    ├── Users
    └── Roles

Property Management
    │
    ├── Properties
    └── Units

Tenant Management
    │
    └── Tenants

Lease Management
    │
    └── Leases

Financial Management
    │
    ├── Payments
    └── Finance Analytics

Security / Operations
    │
    ├── Authentication
    ├── Authorization
    ├── Audit Logging
    ├── Rate Limiting
    └── Error Handling
```

Future/extended domains may include:

* SaaS billing
* Document management
* Maintenance management
* Communication history
* AI-assisted workflows
* AI worker/service

These must not be treated as completed functionality unless confirmed in the current codebase.

---

## 6. Current Technology Stack

### Frontend

🟢 CONFIRMED

* Next.js
* Next.js App Router
* TypeScript
* Tailwind CSS
* React Context API for authentication

Primary frontend location:

```text
frontend/
```

### Backend

🟢 CONFIRMED

* Node.js
* Express
* TypeScript
* Prisma ORM
* PostgreSQL
* Zod
* JWT
* bcrypt

Primary backend location:

```text
backend/
```

### Database

🟢 CONFIRMED

* PostgreSQL
* Supabase-hosted PostgreSQL
* Prisma ORM

Database schema is part of the implementation source of truth.

### Infrastructure

🟢 CONFIRMED / deployment configuration previously established

* Frontend: Vercel
* Backend: Railway
* Database: Supabase PostgreSQL

Production deployment details must be verified against current platform configuration before being treated as current deployment truth.

---

## 7. Repository Structure

The intended top-level structure is:

```text
PropManager Pro/
│
├── PROJECT_STATE.md
├── ARCHITECTURE.md
├── DECISION_LOG.md
├── CHANGELOG.md
├── TODO.md
├── AI_HANDOFF.md
├── README.md
│
├── DOCS/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── SECURITY.md
│   ├── BILLING.md
│   ├── DATABASE.md
│   ├── TESTING.md
│   └── DEVELOPMENT.md
│
├── frontend/
├── backend/
├── database/
├── ai_worker/
└── tests/
```

Not every future directory is necessarily implemented yet.

The actual filesystem remains the implementation truth.

---

## 8. Frontend Architecture

The current frontend authentication-related structure includes:

```text
frontend/src/
│
├── app/
│   ├── layout.tsx
│   ├── login/
│   ├── register/
│   └── (app)/
│
├── components/
│   ├── AuthGuard.tsx
│   └── ...
│
├── context/
│   └── AuthContext.tsx
│
├── lib/
│   ├── auth.ts
│   └── api-client.ts
│
└── services/
    ├── api.ts
    ├── authApi.ts
    ├── finance.service.ts
    ├── financeApi.ts
    ├── leaseApi.ts
    ├── paymentApi.ts
    ├── propertyApi.ts
    ├── tenantApi.ts
    └── unitApi.ts
```

### API client status

🟢 `frontend/src/services/api.ts`

This is the currently identified shared API abstraction used by multiple domain services.

It provides:

* API base URL handling
* JWT authorization headers
* GET request deduplication
* 401 handling
* session cleanup
* API error handling
* 204 handling
* GET/non-GET request handling

### `api-client.ts`

⚪ `frontend/src/lib/api-client.ts`

The file exists but repository searches performed during the current documentation review did not identify imports using it.

Therefore:

> Its active architectural role is currently unverified.

Do not remove it until its usage and intended purpose have been confirmed.

---

## 9. Frontend Authentication State

🟢 CONFIRMED

Authentication is currently implemented through:

```text
AuthProvider
    ↓
AuthContext
    ↓
authApi.ts
    ↓
Backend authentication API
    ↓
JWT
    ↓
localStorage
```

The frontend stores:

```text
propmanager_token
propmanager_user
```

The authentication helper is:

```text
frontend/src/lib/auth.ts
```

It provides:

* `getToken()`
* `setToken()`
* `removeToken()`
* `getUser()`
* `setUser()`
* `isAuthenticated()`

---

## 10. Frontend Authentication Flow

### Login

```text
Login Page
    ↓
useAuth()
    ↓
AuthContext.login()
    ↓
authApi.login()
    ↓
POST /api/auth/login
    ↓
Backend
    ↓
JWT + User
    ↓
localStorage
    ↓
AuthContext state
    ↓
Application
```

### Registration

```text
Register Page
    ↓
useAuth()
    ↓
AuthContext.register()
    ↓
authApi.register()
    ↓
POST /api/auth/register
    ↓
Backend
    ↓
JWT + User
    ↓
localStorage
    ↓
AuthContext state
    ↓
Application
```

---

## 11. Frontend Route Protection

🟢 CONFIRMED

The authenticated application layout:

```text
frontend/src/app/(app)/layout.tsx
```

uses `useAuth()` and checks:

```text
loading
user
```

If authentication is unavailable after loading, the application redirects to:

```text
/login
```

The layout does not render the protected application UI when the user is missing.

### AuthGuard

⚪ UNVERIFIED

```text
frontend/src/components/AuthGuard.tsx
```

exists and performs a token check.

Current repository searches did not identify active usage beyond its own definition.

Therefore the project must not currently assume that `AuthGuard` is part of the primary route-protection mechanism.

---

## 12. Backend Authentication

🟢 CONFIRMED

Authentication routes:

```text
POST /api/auth/register
POST /api/auth/login
```

Route file:

```text
backend/src/routes/auth.routes.ts
```

Authentication service:

```text
backend/src/services/auth.service.ts
```

---

## 13. Password Security

🟢 CONFIRMED

Passwords are hashed using bcrypt.

Current configured salt rounds:

```text
10
```

Passwords are not returned as part of the authentication response.

---

## 14. JWT Authentication

🟢 CONFIRMED

JWT signing and verification are implemented in:

```text
backend/src/services/auth.service.ts
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

The signing secret is loaded from:

```text
JWT_SECRET
```

The environment configuration requires:

```text
JWT_SECRET
```

to contain at least 32 characters.

---

## 15. Backend Authentication Middleware

🟢 CONFIRMED

Authentication middleware:

```text
backend/src/middleware/auth.middleware.ts
```

Expected header:

```text
Authorization: Bearer <token>
```

Successful verification populates:

```text
req.userId
req.user
```

The current authenticated user object contains:

```text
id
email
role
```

Requests without a valid authentication header receive:

```text
401 Authentication required
```

Invalid or expired tokens receive:

```text
401 Invalid or expired token
```

---

## 16. Multi-Tenant Security Model

🔵 DECISION / 🟢 IMPLEMENTED PRINCIPLE

PropManager Pro is a multi-tenant application.

A user's protected resources must not be accessible merely by knowing their database ID.

Ownership must be enforced through authenticated user context.

Core ownership model:

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

Protected queries must scope data to the authenticated user's ownership boundary.

### Non-negotiable security rule

> Never trust a resource ID alone when retrieving or modifying protected tenant-owned data.

---

## 17. Backend Layering

The backend follows the general structure:

```text
HTTP Request
     ↓
Route
     ↓
Middleware
     ↓
Controller
     ↓
Service
     ↓
Prisma
     ↓
PostgreSQL
```

### Responsibilities

**Routes**

Define HTTP endpoints.

**Middleware**

Handle cross-cutting concerns such as:

* authentication
* rate limiting
* security
* errors

**Controllers**

Handle HTTP-level concerns and translate requests into service operations.

**Services**

Contain business logic and database operations.

**Prisma**

Provides database access.

---

## 18. Current Core Backend Domains

🟢 CONFIRMED from the current project structure/history

```text
Authentication
Properties
Units
Tenants
Leases
Payments
Finance Analytics
Audit
```

Relevant backend locations include:

```text
backend/src/controllers/
backend/src/services/
backend/src/routes/
backend/src/middleware/
backend/src/config/
backend/src/lib/
```

---

## 19. Lease Model — Current Truth

🟢 CONFIRMED from current project state/code evidence

Lease lifecycle uses:

```text
PENDING
ACTIVE
ENDED
TERMINATED
```

There is no documented current:

```text
EXPIRED
```

status.

There is also no current assumption that leases contain an `isActive` field.

Any older documentation referencing:

```text
EXPIRED
isActive
```

must be treated as stale until verified against the current Prisma schema.

---

## 20. Business Rules

The project has previously implemented or established the following business rules:

### Lease overlap prevention

A unit must not have conflicting active lease periods.

### Active lease validation

Lease operations must respect the current lease lifecycle.

### Payment void-only policy

Payments should not be casually deleted when business history must be preserved.

### Financial calculations

Finance calculations must be derived from authoritative payment/lease data.

### Validation

Zod is used for request/data validation in relevant backend areas.

These rules should be verified against current implementation whenever they are modified.

---

## 21. API Base URL

🟢 CONFIRMED DESIGN RULE

The frontend API base URL is:

```text
NEXT_PUBLIC_API_URL
```

The base URL should identify the backend origin only.

API services append paths such as:

```text
/api/auth/login
/api/properties
/api/tenants
/api/leases
/api/payments
/api/finance
```

Therefore the production base URL must not itself contain `/api`.

This prevents:

```text
/api/api/...
```

routing errors.

---

## 22. Environment Configuration

### Backend

Current environment schema validates:

```text
DATABASE_URL
JWT_SECRET
PORT
NODE_ENV
```

Current defaults:

```text
PORT=4000
NODE_ENV=development
```

### Frontend

Current frontend environment variable:

```text
NEXT_PUBLIC_API_URL
```

---

## 23. Environment Configuration Gap

🔴 CONFIRMED PROBLEM

The application has historically used:

```text
FRONTEND_URL
```

for CORS configuration.

However, the current `backend/src/config/env.ts` schema does not currently validate `FRONTEND_URL`.

This means the application environment contract and runtime usage are not fully aligned.

This is a documentation/technical-debt item and must be tracked in:

```text
TODO.md
```

It should not be silently treated as fixed.

---

## 24. Backend Build and Startup

🟢 CONFIRMED from current `backend/package.json`

Current scripts include:

```text
dev:
ts-node-dev --respawn --transpile-only src/server.ts

build:
tsc

start:
npx prisma migrate deploy && node dist/server.js

postinstall:
prisma generate
```

The current production build/deployment process should therefore be documented based on actual platform configuration rather than assumed configuration.

Any future move toward a fully explicit deterministic build pipeline must be recorded as a decision before being treated as the current standard.

---

## 25. Backend Startup

🟢 CONFIRMED

The backend starts through:

```text
backend/src/server.ts
```

Startup includes:

```text
runStartupChecks()
```

The startup health check currently executes:

```sql
SELECT 1
```

through Prisma.

The server listens on:

```text
0.0.0.0
```

using the configured `PORT`.

Graceful SIGTERM handling is implemented.

---

## 26. Deployment State

🟡 HISTORICAL / ⚪ CURRENT DEPLOYMENT REQUIRES VERIFICATION

The project has previously been deployed using:

```text
Frontend → Vercel
Backend → Railway
Database → Supabase PostgreSQL
```

Previous production work established a Railway backend deployment and Supabase database connection.

However, platform configuration is external to the repository and must be verified directly before being recorded as the current production state.

Therefore this document intentionally does not claim that the current production deployment is healthy merely because it was healthy during an earlier phase.

---

## 27. Production Verification Rule

Before declaring a production deployment healthy, verify:

```text
Vercel
   ↓
Railway
   ↓
Express
   ↓
Prisma
   ↓
Supabase PostgreSQL
```

At minimum verify:

* frontend can reach backend
* backend health endpoint responds
* database connection works
* authentication works
* authenticated CRUD works
* tenant isolation works
* production environment variables are correct

---

## 28. Current Frontend API Architecture Rule

🔵 DECISION

The project should maintain a single canonical shared API abstraction.

Current identified canonical implementation:

```text
frontend/src/services/api.ts
```

New API wrappers should not be introduced merely because an individual feature needs an API call.

Domain-specific service files may use the canonical API abstraction.

The existing:

```text
frontend/src/lib/api-client.ts
```

must be verified before removal or consolidation.

---

## 29. Development Principles

PropManager Pro follows these engineering principles:

### 1. Inspect before changing

Do not modify code based on assumptions.

### 2. Small changes

Prefer small, reversible changes.

### 3. Verify before declaring success

A successful edit is not the same as a successful feature.

### 4. Preserve business rules

Technical refactoring must not silently change financial or tenancy behavior.

### 5. Tenant isolation is mandatory

No feature may weaken user-data isolation.

### 6. Avoid duplicate architecture

Do not introduce a second implementation of an existing concern without an explicit reason.

### 7. Documentation follows implementation

Meaningful changes require corresponding documentation updates.

### 8. AI-assisted development

AI may assist with:

* debugging
* code generation
* refactoring
* testing
* documentation
* architecture analysis

But AI-generated assumptions must be verified against the actual repository.

---

## 30. Current Known Technical Debt

🔴 Confirmed or previously identified items requiring verification/tracking:

```text
1. Property.unitCount consistency/drift
2. Unit deletion policy
3. Unsafe any usage in backend services
4. FRONTEND_URL missing from environment validation
5. Finance route/path consistency
6. Production debug logging
7. Prisma migration/deployment state
8. Test automation coverage
9. API client duplication / api-client.ts usage
10. AuthGuard usage/necessity
```

These are tracked in:

```text
TODO.md
```

This section is a summary only. `TODO.md` is the authoritative task list.

---

## 31. Current Development Phase

🟡 CURRENT PHASE — DOCUMENTATION / ARCHITECTURE FREEZE

The project is currently undergoing a documentation and architecture-state freeze before entering the next engineering phase.

The objective is to:

```text
Verify current implementation
        ↓
Freeze project state
        ↓
Document architecture
        ↓
Document decisions
        ↓
Document technical debt
        ↓
Create AI handoff
        ↓
Begin next development phase
```

No major feature expansion should begin until the documentation baseline is finalized.

---

## 32. Rules for Future AI Sessions

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
12. Update the appropriate documentation after meaningful architectural changes.

---

## 33. Current Next Step

The documentation freeze continues in this order:

```text
PROJECT_STATE.md     ← Current document
        ↓
ARCHITECTURE.md
        ↓
DECISION_LOG.md
        ↓
TODO.md
        ↓
CHANGELOG.md
        ↓
DOCS/*
        ↓
AI_HANDOFF.md
        ↓
Final consistency audit
        ↓
New development chat
```

`PROJECT_STATE.md` should be updated whenever the project's actual operational state materially changes.

---

## 34. Document Maintenance Rule

Do not append historical development discussions to this document.

If something happened in the past but is no longer current:

* put the historical explanation in `CHANGELOG.md`
* put the reasoning in `DECISION_LOG.md`
* put unresolved work in `TODO.md`
* keep only the resulting current state here

The goal is for an AI or developer to read this document and understand the project **without reading the entire development history**.

---

## Current State Summary

```text
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
Documentation / architecture freeze

Next engineering phase:
To be defined after documentation freeze

Primary unresolved areas:
Deployment verification
Database/migration verification
API abstraction cleanup
Environment configuration alignment
Technical debt cleanup
Test coverage/automation
```

**End of `PROJECT_STATE.md`**
