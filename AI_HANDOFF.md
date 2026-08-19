# PropManager Pro — AI Handoff

## Purpose

This document is the continuation anchor for AI-assisted development.

A new AI chat should read this document first before making architectural or implementation decisions.

---

# Project

**PropManager Pro**

Mobile-first property management SaaS for small landlords managing approximately 1–10 units.

Core philosophy:

> Simple, reliable, financially correct property management without unnecessary complexity.

---

# Current Architecture

```text
PropManager Pro/
├── PROJECT_STATE.md
├── ARCHITECTURE.md
├── DECISION_LOG.md
├── CHANGELOG.md
├── TODO.md
├── AI_HANDOFF.md
├── README.md
│
├── DOCS/
├── frontend/
├── backend/
├── ai_worker/
├── database/
├── config/
└── tests/
```

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
Frontend → Vercel
Backend  → Railway
Database → Supabase PostgreSQL
```

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

---

# Authentication

Current flow:

```text
Register/Login
      ↓
Backend
      ↓
bcrypt
      ↓
JWT
      ↓
Frontend localStorage
      ↓
Bearer token
      ↓
Protected API
```

JWT contains:

```text
userId
email
role
```

Current expiration:

```text
7 days
```

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

Must contain only the backend origin.

Correct:

```text
https://propmanagerpro-production.up.railway.app
```

Service endpoints include:

```text
/api/...
```

Do not create:

```text
/api/api/...
```

There is also:

```text
frontend/src/lib/api-client.ts
```

which appears unused by the rest of the frontend and should be treated as a cleanup candidate rather than a second API architecture.

---

# Important Backend Security Rule

Authenticated resources must be scoped by:

```text
req.userId
```

Never trust a client-supplied user ID for ownership decisions.

Authorization must be based on the authenticated JWT identity.

---

# Current Deployment State

⚪ UNVERIFIED — requires re-establishment before treating as current

The Railway backend previously deployed successfully and database connectivity through Railway to Supabase was validated. However, the Railway subscription has since expired.

Current known deployment status:

```text
Frontend (Vercel)     → 🟡 Previously deployed — connectivity unverified
Backend (Railway)     → 🔴 Expired — must be redeployed
Database (Supabase)   → 🟡 Exists — production schema state unverified
```

Before treating the backend as available, verify:

```text
Railway redeployment
      ↓
/health endpoint responds
      ↓
Database connectivity confirmed
      ↓
Authentication working
      ↓
CRUD working
      ↓
Tenant isolation verified
```

For exact current deployment state, consult:

```text
PROJECT_STATE.md
```

---

# Current Development Direction

The project is moving from:

```text
Feature development
```

toward:

```text
Production hardening
```

The next major focus is Phase 5.2 production hardening.

Primary areas:

- CORS
- Rate limiting
- Structured logging
- Security headers
- Authentication robustness
- Authorization
- Error handling
- Reliability
- Deployment determinism
- Testing

---

# Known Technical Cleanup

## Frontend

Investigate duplicate API abstraction:

```text
lib/api-client.ts     → appears unused — verify before removing
services/api.ts       → confirmed primary API abstraction
```

## Backend

Review:

```text
postinstall: prisma generate
```

Production-critical Prisma generation should eventually be explicit rather than dependent on lifecycle hooks.

## Startup

Startup health checks currently run non-blocking.

Review whether production readiness should distinguish:

```text
process running
```

from:

```text
application ready
```

---

# AI Operating Rules

When continuing this project:

1. Read `PROJECT_STATE.md` first.
2. Read `AI_HANDOFF.md`.
3. Consult `ARCHITECTURE.md` before changing architecture.
4. Consult `DECISION_LOG.md` before reversing an important decision.
5. Check the actual source code before assuming a documented feature exists.
6. Never mark TODO items complete without evidence.
7. Do not introduce unnecessary architecture.
8. Make one logical change at a time.
9. Test after each meaningful change.
10. Prefer explicit commands over implicit behavior.
11. Preserve financial correctness.
12. Preserve tenant isolation.
13. Do not change unrelated code while fixing a targeted problem.
14. Update documentation after significant architectural changes.

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

If documentation conflicts with actual implementation:

```text
STOP
↓
VERIFY THE CODE
↓
VERIFY DEPLOYED STATE IF RELEVANT
↓
UPDATE PROJECT_STATE.md
↓
UPDATE AFFECTED DOCUMENTS
```

Never silently assume that documentation is more correct than the system.

---

# Continuation Protocol

A new AI session should begin by determining:

```text
What is actually implemented?
What is currently deployed?
What phase are we in?
What is the next smallest safe change?
```

Do not immediately start modifying code.

First establish the current state.

---

# Document Maintenance Rule

Do not rewrite every project document after every code change.

Documentation must be updated according to the purpose of each document.

A small implementation change normally requires only the relevant code change.

A material change requires updating the appropriate documentation.

The goal is:

> **Minimum necessary documentation update, maximum preservation of project truth.**

---

# When Documentation Must Be Updated

After making a change, determine whether the change is:

### A. Local / trivial change

Examples:

- fixing a typo
- changing a button label
- correcting minor styling
- refactoring internal code without changing behavior
- improving variable names
- removing dead code
- fixing an isolated implementation bug with no architectural or behavioral significance

Normally:

**No project documentation update is required.**

### B. Material change

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

For material changes, update the **minimum set of documents required to keep the source of truth synchronized.**

---

# Document Update Matrix

| Change                          | PROJECT_STATE         | ARCHITECTURE             | DECISION_LOG            | CHANGELOG         | TODO                 | AI_HANDOFF                          |
| ------------------------------- | --------------------- | ------------------------ | ----------------------- | ----------------- | -------------------- | ----------------------------------- |
| Minor UI fix                    | Usually no            | No                       | No                      | No                | No                   | No                                  |
| Bug fix no lasting significance | Usually no            | No                       | No                      | Optional          | No                   | No                                  |
| Major bug fix                   | Yes if state changes  | If architectural         | If decision involved    | Yes               | If TODO affected     | If workflow changes                 |
| New feature                     | Yes                   | If architecture affected | If decision involved    | Yes               | If TODO affected     | Usually no                          |
| Database schema change          | Yes                   | Yes                      | If significant decision | Yes               | If affected          | If workflow/risk changes            |
| API contract change             | Yes                   | Yes                      | If significant          | Yes               | If affected          | If workflow changes                 |
| Security change                 | Yes                   | Yes if architectural     | Yes if a decision       | Yes               | If follow-up remains | Yes if procedure changes            |
| Deployment change               | Yes                   | Yes if arch/infra        | Yes if significant      | Yes               | If follow-up remains | Yes if deployment procedure changes |
| Major architectural refactor    | Yes                   | Yes                      | Yes                     | Yes               | Yes if affected      | Yes                                 |
| New major engineering rule      | Yes if state affected | Possibly                 | Yes                     | Yes if noteworthy | Possibly             | **Yes**                             |
| Phase completion                | Yes                   | Usually no               | No                      | Yes               | Yes                  | Yes if handoff context changes      |

---

# Mandatory Post-Change Documentation Check

After completing a meaningful change, perform a documentation-impact check.

Ask:

1. Did the current project state change?
2. Did the architecture change?
3. Was an important engineering decision made?
4. Is this a meaningful historical change?
5. Did the TODO list change?
6. Did an AI workflow or permanent engineering rule change?
7. Did security, deployment, database, API, financial, or multi-tenant behavior change?

Then update only the affected documents.

The AI must **not skip this check for material changes**.

---

# Source-of-Truth Conflict Rule

If documentation conflicts with actual implementation:

1. Inspect the implementation.
2. Determine the actual current behavior.
3. Correct the outdated documentation.
4. If the discrepancy resulted from an important decision, record the decision/change in DECISION_LOG.md and CHANGELOG.md as appropriate.

Never preserve incorrect documentation simply because it was written earlier.

---

# AI Session Startup Procedure

At the beginning of a new AI session:

1. Read `AI_HANDOFF.md` to understand the operating rules and continuation protocol.
2. Read `PROJECT_STATE.md` to establish the current project truth.
3. Read `ARCHITECTURE.md` when architectural context is needed.
4. Read relevant sections of `DECISION_LOG.md`.
5. Read relevant recent entries in `CHANGELOG.md`.
6. Read `TODO.md`.
7. Inspect actual source code/configuration before making assumptions.
8. Identify the current phase and immediate objective.
9. Continue from the existing state rather than recreating previous work.

Do not ask the user to repeat information that can be established from the project documentation and source code.

---

# AI Session End / Handoff Procedure

Before ending a significant work session:

1. Verify the implementation.
2. Run relevant tests/build checks.
3. Update PROJECT_STATE.md if the current state changed.
4. Update CHANGELOG.md for meaningful completed changes.
5. Update ARCHITECTURE.md if architecture changed.
6. Update DECISION_LOG.md if an important decision was made.
7. Update TODO.md if outstanding work changed.
8. Update AI_HANDOFF.md only if the handoff rules or durable AI context changed.
9. Ensure documentation does not contradict the implementation.
10. Leave the repository in a state that another AI can continue safely.

---

# Critical Principle

**Documentation is part of the engineering system, but documentation is not the work itself.**

Do not waste development time continuously rewriting documentation.

Instead:

> **Change the code when the code needs changing.**
>
> **Update the source-of-truth document when the truth changes.**
>
> **Record history when something meaningful happened.**
>
> **Record decisions when an important decision was made.**
>
> **Update the handoff instructions when the way future AI sessions should operate changes.**

The objective is to keep PropManager Pro **accurate, maintainable, transferable, and AI-debuggable** without creating unnecessary documentation overhead.

---

# Default AI Behavior

When uncertain whether documentation needs updating, **inspect the impact of the change rather than automatically updating everything**.

The preferred behavior is:

**Implement → Test → Assess impact → Update affected source-of-truth documents → Verify consistency → Continue.**

Never:

**Implement → Rewrite every document regardless of impact.**

---

**End of `AI_HANDOFF.md`**
