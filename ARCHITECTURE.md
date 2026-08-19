Paste this entire content into Notepad:

---

```text
# PropManager Pro — Architecture

## 1. Purpose

PropManager Pro is a mobile-first property management SaaS designed for small landlords managing approximately 1–10 units.

The architecture prioritizes:

* Simplicity over feature quantity
* Mobile-first usability
* Clear business workflows
* Financial correctness
* Multi-tenant data isolation
* Modular and readable code
* Explicit and deterministic deployment
* AI-assisted development, debugging, and maintenance
* Reliability before feature expansion

The system is intentionally designed so that an AI assistant can understand, debug, modify, and extend it without requiring unnecessary architectural complexity.

---

## 2. Repository Structure

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
│   └── BILLING.md
│
├── frontend/
├── backend/
├── ai_worker/
├── database/
├── config/
└── tests/
```

Some directories/features may still be planned rather than fully implemented. `PROJECT_STATE.md` is authoritative for current implementation status.

---

## 3. System Architecture

PropManager Pro follows a modular full-stack architecture:

```text
┌─────────────────────────────┐
│          Browser            │
│      Mobile / Desktop       │
└──────────────┬──────────────┘
               │
               │ HTTPS / REST API
               ▼
┌─────────────────────────────┐
│          Frontend           │
│ Next.js + TypeScript        │
│ App Router                  │
│ Tailwind CSS                │
│ Auth Context                │
└──────────────┬──────────────┘
               │
               │ HTTP + JWT
               ▼
┌─────────────────────────────┐
│          Backend            │
│ Node.js + Express           │
│ TypeScript                  │
│ REST API                    │
│ Authentication              │
│ Business Rules              │
│ Validation                  │
└──────────────┬──────────────┘
               │
               │ Prisma
               ▼
┌─────────────────────────────┐
│          Database           │
│     PostgreSQL / Supabase   │
└─────────────────────────────┘
```

Future AI functionality may be provided through:

```text
Backend
   │
   ▼
AI Worker
Python / FastAPI
```

The AI worker is not treated as a dependency of the core application unless explicitly documented as such.

---

## 4. Frontend

### Technology

* Next.js
* React
* TypeScript
* Tailwind CSS
* App Router

Primary frontend location:

```text
frontend/src/
```

### Major areas

```text
frontend/src/
├── app/
├── components/
├── context/
├── lib/
└── services/
```

### Authentication

Authentication state is managed through:

```text
context/AuthContext.tsx
```

Authentication utilities are located in:

```text
lib/auth.ts
```

The current implementation stores:

* JWT token
* User information

in browser `localStorage`.

The frontend uses route-level/client-side protection through:

```text
components/AuthGuard.tsx
app/(app)/layout.tsx
```

---

## 5. Frontend API Architecture

The primary API abstraction is:

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

Responsibilities include:

* API base URL handling
* Authorization header injection
* GET request deduplication
* HTTP error handling
* 401/session-expiration handling
* JSON parsing
* request cancellation support

The API base URL is controlled by:

```text
NEXT_PUBLIC_API_URL
```

The base URL must not include `/api` when service endpoints already contain `/api`.

Correct pattern:

```text
NEXT_PUBLIC_API_URL=https://propmanagerpro-production.up.railway.app
```

Endpoint:

```text
/api/properties
```

Result:

```text
https://propmanagerpro-production.up.railway.app/api/properties
```

Avoid:

```text
https://.../api/api/properties
```

---

## 6. API Client Duplication

The repository currently contains:

```text
frontend/src/lib/api-client.ts
frontend/src/services/api.ts
```

`services/api.ts` is the more capable API abstraction and is the primary service-layer client.

`lib/api-client.ts` is currently not referenced by the rest of the frontend according to repository searches performed during documentation review.

It should not be treated as a second competing API architecture.

Future cleanup should either:

1. Remove `lib/api-client.ts`, or
2. Explicitly establish it as the single API abstraction and migrate all consumers.

Until then:

> `frontend/src/services/api.ts` is the operational frontend API client.

---

## 7. Backend

### Technology

* Node.js
* Express
* TypeScript
* Prisma ORM
* PostgreSQL
* Zod
* JWT
* bcrypt
* Helmet
* express-rate-limit
* Pino / pino-http

Primary location:

```text
backend/src/
```

Major layers:

```text
backend/src/
├── config/
├── controllers/
├── middleware/
├── routes/
├── services/
├── lib/
├── types/
└── tests/
```

---

## 8. Backend Layer Responsibilities

### Routes

Routes define HTTP endpoints and connect requests to controllers.

Examples:

```text
/api/auth
/api/properties
/api/units
/api/tenants
/api/leases
/api/payments
/api/finance
```

### Controllers

Controllers handle:

* HTTP request/response behavior
* Input extraction
* Calling business services
* HTTP status codes
* Error responses

### Services

Services contain business logic and database operations.

This separation prevents business rules from being embedded directly in route definitions.

### Middleware

Middleware handles cross-cutting concerns including:

* Authentication
* Error handling
* Security
* Request processing

---

## 9. Authentication Architecture

Authentication uses:

```text
bcrypt
JWT
```

Registration:

```text
Frontend
   ↓
POST /api/auth/register
   ↓
Backend controller
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
```

Login follows the same general pattern.

JWT payload currently contains:

```text
userId
email
role
```

Tokens currently expire after:

```text
7 days
```

The frontend stores the token and sends:

```http
Authorization: Bearer <token>
```

The backend authentication middleware validates the token before allowing protected operations.

---

## 10. Multi-Tenant Security

PropManager Pro is designed as a multi-tenant SaaS.

The authenticated user's identity is extracted from the JWT.

The backend uses:

```text
req.userId
```

to scope user-owned resources.

Business resources must not be retrieved solely by an arbitrary resource ID.

The authorization pattern should be:

```text
authenticated user
        ↓
userId
        ↓
owned resource
        ↓
requested operation
```

This prevents one user from accessing another user's properties, units, tenants, leases, payments, or financial information.

---

## 11. Database

Prisma is the ORM.

Database:

```text
PostgreSQL
```

Hosted through:

```text
Supabase
```

Database schema is maintained through Prisma.

Database implementation must always be considered the authoritative source for actual database structure.

---

## 12. Business Modules

Current core modules include:

```text
Authentication
Properties
Units
Tenants
Leases
Payments
Finance
```

Business rules already established include:

* Lease overlap prevention
* Active lease validation
* Payment void-only policy
* Finance calculations
* Zod validation
* Multi-user data isolation

---

## 13. Finance Architecture

Finance functionality is exposed through dedicated endpoints including:

```text
/api/finance/dashboard
/api/finance/revenue-by-property
/api/finance/outstanding-rent
```

Financial calculations must prioritize correctness over convenience.

Financial records should not be silently modified in ways that destroy historical accuracy.

---

## 14. Deployment Architecture

### Backend

Hosted on:

```text
Railway
```

The production backend uses:

```text
Node.js
Express
Prisma
PostgreSQL / Supabase
```

Production startup currently runs:

```text
npx prisma migrate deploy
node dist/server.js
```

### Frontend

Deployment target:

```text
Vercel
```

The frontend communicates with the production Railway backend through:

```text
NEXT_PUBLIC_API_URL
```

---

## 15. Health and Startup Checks

The backend exposes:

```text
/health
```

Startup validation performs a database connectivity test using:

```text
SELECT 1
```

Startup checks are currently non-blocking.

This means the server can begin listening while startup validation reports failures through logging.

This behavior should be reviewed during production hardening.

---

## 16. Configuration

Backend configuration is validated through:

```text
backend/src/config/env.ts
```

Required values include:

```text
DATABASE_URL
JWT_SECRET
PORT
NODE_ENV
```

`JWT_SECRET` requires a minimum length of 32 characters.

Frontend configuration includes:

```text
NEXT_PUBLIC_API_URL
```

Production secrets must never be committed to Git.

---

## 17. Build and Deployment Philosophy

PropManager Pro follows an explicit and deterministic deployment philosophy.

Production-critical steps should not depend on undocumented or accidental lifecycle behavior.

The preferred pattern is:

```text
install
→ generate Prisma client
→ compile TypeScript
→ deploy
→ start
```

The repository currently contains a Prisma `postinstall` hook.

This is recognized as a potential reliability concern because production builds should explicitly perform critical generation steps.

Future build cleanup should prefer explicit commands such as:

```text
npm ci
npx prisma generate
npm run build
```

rather than depending on implicit lifecycle execution.

---

## 18. AI-First Engineering Model

AI is an intentional part of the engineering workflow.

The system should therefore favor:

* Small modules
* Explicit dependencies
* Predictable file locations
* Strong naming
* Clear business rules
* Type safety
* Deterministic commands
* Documentation of important decisions
* Tests around critical business behavior

The architecture should remain understandable to both humans and AI assistants.

---

## 19. Architectural Rule

When adding functionality:

```text
Do not add complexity merely because it is technically possible.
```

Every new feature should answer:

1. What user problem does it solve?
2. Does it belong in the current MVP?
3. Does it introduce new security risks?
4. Does it affect financial correctness?
5. Does it require a database change?
6. Can it be tested?
7. Can another developer or AI understand it later?

---

## 20. Current Architectural Direction

PropManager Pro should continue evolving toward:

```text
Simple
→ Reliable
→ Secure
→ Maintainable
→ Testable
→ Scalable
```

not:

```text
Feature-rich
→ Complex
→ Fragile
```

The architecture must support the product principle:

> Build the simplest reliable property-management system that solves the real problems of small landlords.

---

**End of `ARCHITECTURE.md`**
