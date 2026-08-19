# PropManager Pro — TODO

This document contains future work.

**Important:** TODO items are not evidence that functionality exists.

Current implementation status belongs in `PROJECT_STATE.md`.

---

# Immediate Priority

## Phase 5.2 — Production Hardening

Continue production hardening after deployment validation.

Priority areas:

* CORS verification
* Rate limiting verification
* Structured logging verification
* Security headers verification
* Authentication failure handling
* Production environment validation
* Error handling
* Reliability testing

---

# Frontend Cleanup

## API Client Consolidation

Review:

```text
frontend/src/lib/api-client.ts
frontend/src/services/api.ts
```

Current direction:

```text
services/api.ts
```

is the operational API abstraction.

Determine whether `lib/api-client.ts` should be removed.

---

# Build System

Review backend build/deployment process.

Current scripts include:

```text
build: tsc
start: npx prisma migrate deploy && node dist/server.js
postinstall: prisma generate
```

Target direction:

```text
npm ci
prisma generate
npm run build
```

The goal is to make production behavior explicit and deterministic.

---

# Authentication Hardening

Review:

* JWT expiration strategy
* Token storage strategy
* Session expiration UX
* Authentication refresh strategy
* Logout behavior
* Authorization boundaries
* Cross-user access tests

---

# Security

Continue reviewing:

* CORS configuration
* Rate limiting
* Helmet/security headers
* Input validation
* Authentication middleware
* Authorization
* Error disclosure
* Production secrets
* Database access

---

# Testing

Expand automated testing around:

* Authentication
* Authorization
* Property ownership
* Unit ownership
* Tenant ownership
* Lease overlap
* Payment rules
* Finance calculations

Critical business rules should have automated regression tests.

---

# Product

Maintain MVP focus.

Do not add major features simply because they are technically possible.

Prioritize:

1. Reliability
2. Security
3. Financial correctness
4. Usability
5. Small-landlord workflows
6. Only then additional features

---

# Future

Potential future work includes:

* AI worker
* Automated categorization
* Document processing
* Advanced reporting
* Billing/subscription functionality
* Notifications
* Additional integrations

These remain future scope unless explicitly promoted into the active phase.

---

**End of `TODO.md`**
