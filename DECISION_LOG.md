
# PropManager Pro — Decision Log

This document records important architectural, technical, and product decisions and, most importantly, why they were made.

It is historical/rationale documentation.

It does not override the actual code or the current state documented in `PROJECT_STATE.md`.

---

## Decision Hierarchy

When interpreting this document:

1. Actual implementation/code is authoritative for what exists.
2. `PROJECT_STATE.md` is authoritative for current project status.
3. `ARCHITECTURE.md` describes intended architecture.
4. This document explains why decisions were made.
5. Older decisions may be superseded by newer decisions.

---

# D-001 — Mobile-First Product Strategy

**Decision:** PropManager Pro will prioritize mobile-first workflows.

**Reason:**

The target user is a small landlord who may manage properties primarily through a phone.

The product should therefore optimize for:

* Fast actions
* Simple navigation
* Minimal data entry
* Clear financial information
* Usability on small screens

Desktop functionality remains important but should not dictate the primary UX.

---

# D-002 — Small-Landlord MVP

**Decision:** Initial product focus is landlords managing approximately 1–10 units.

**Reason:**

Large property-management platforms already provide extensive functionality.

Competing feature-for-feature would create unnecessary complexity.

PropManager Pro should instead win through:

* Simplicity
* Affordability
* Ease of use
* Clear workflows

---

# D-003 — Simplicity Over Feature Quantity

**Decision:** Features should be added only when they solve a meaningful user problem.

**Reason:**

The project should avoid becoming a bloated property-management platform.

The product principle is:

> Reliability and usability are more valuable than feature count.

---

# D-004 — Next.js Frontend

**Decision:** Use Next.js with the App Router and TypeScript.

**Reason:**

Provides:

* Modern React architecture
* TypeScript support
* Routing
* Production deployment compatibility
* Strong ecosystem
* Good AI-assisted development support

---

# D-005 — Express Backend

**Decision:** Use Node.js + Express + TypeScript for the backend.

**Reason:**

Express provides a relatively simple and transparent REST API architecture.

This supports the project's requirement for an AI-debuggable and readable backend.

---

# D-006 — Prisma ORM

**Decision:** Use Prisma for database access.

**Reason:**

Prisma provides:

* Typed database access
* Explicit schema
* Migration support
* Strong TypeScript integration

It also makes database relationships easier for AI-assisted development to reason about.

---

# D-007 — PostgreSQL Instead of SQLite for Production

**Decision:** Production database is PostgreSQL hosted through Supabase.

**Reason:**

SQLite was useful during early development, but production SaaS requirements favor PostgreSQL for:

* Concurrent access
* Reliability
* Production scalability
* Managed hosting

---

# D-008 — JWT Authentication

**Decision:** Authentication uses JWT tokens.

**Reason:**

JWT provides a straightforward stateless authentication mechanism between the frontend and REST backend.

The current implementation stores the JWT client-side and sends it using the Bearer authentication scheme.

---

# D-009 — bcrypt Password Hashing

**Decision:** Passwords are hashed using bcrypt.

**Reason:**

Passwords must never be stored in plaintext.

The backend hashes passwords during registration and verifies them during login.

---

# D-010 — User-Scoped Resources

**Decision:** User-owned resources must be scoped using the authenticated user's identity.

**Reason:**

Authentication alone is insufficient.

A valid user must not be able to access another user's resources simply by changing a resource ID.

This is a foundational multi-tenant security requirement.

---

# D-011 — Centralized API Service

**Decision:** `frontend/src/services/api.ts` is the primary frontend API abstraction.

**Reason:**

The service centralizes:

* Authentication headers
* Error handling
* 401 handling
* Request deduplication
* HTTP methods
* API base URL handling

A second competing API client increases maintenance complexity.

---

# D-012 — API Base URL Must Not Contain `/api`

**Decision:**

```text
NEXT_PUBLIC_API_URL
```

contains the backend origin only.

Example:

```text
https://propmanagerpro-production.up.railway.app
```

Services append:

```text
/api/...
```

**Reason:**

Prevents accidental URLs such as:

```text
/api/api/...
```

---

# D-013 — Explicit Production Build Process

**Decision:** Production builds should explicitly perform critical generation and compilation steps.

**Reason:**

Implicit lifecycle hooks such as `postinstall` can make deployments harder to reason about.

Production should be deterministic.

Preferred conceptual flow:

```text
npm ci
→ prisma generate
→ npm run build
→ deploy
```

---

# D-014 — Railway for Backend

**Decision:** Railway is used for backend deployment.

**Reason:**

Railway provides a straightforward deployment environment suitable for the Node.js backend and integrates cleanly with Git-based deployments.

---

# D-015 — Vercel for Frontend

**Decision:** Vercel is the frontend deployment target.

**Reason:**

Next.js and Vercel integrate naturally, simplifying frontend deployment.

---

# D-016 — Non-Blocking Startup Health Checks

**Decision:** Startup database checks currently run without blocking server startup.

**Reason:**

The existing implementation was designed to allow the server to start while health validation reports failures through logging.

**Future review:**

Production hardening should determine whether critical dependency failure should prevent readiness.

---

# D-017 — Financial Correctness Over Convenience

**Decision:** Financial records and calculations receive special protection.

**Reason:**

Incorrect financial data can damage user trust and create real-world consequences.

Business rules therefore include controlled payment mutation behavior and explicit financial calculations.

---

# D-018 — Documentation as Project Infrastructure

**Decision:** Maintain a structured documentation hierarchy.

**Reason:**

PropManager Pro is being developed with substantial AI assistance.

A clear documentation system reduces context loss between chats and makes future AI continuation significantly more reliable.

---

# D-019 — AI Handoff Document

**Decision:** Maintain `AI_HANDOFF.md`.

**Reason:**

Long conversations eventually become inefficient.

The handoff document provides a compact continuation point containing:

* Current state
* Architecture
* Known issues
* Active phase
* Next task
* Important constraints

It is specifically optimized for starting a fresh AI conversation.

---

# D-020 — Single Source of Truth

**Decision:** The project maintains an explicit source-of-truth hierarchy.

**Reason:**

Multiple documents can otherwise drift apart.

The project must distinguish:

* What actually exists
* What the architecture intends
* Why decisions were made
* What changed historically
* What is planned

The documents must not silently overwrite one another.

---

**End of `DECISION_LOG.md`**
 