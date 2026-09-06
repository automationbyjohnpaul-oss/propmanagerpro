# PropManager Pro — TODO

This document contains future work and intentionally limited follow-up work.

**Important:** TODO items are not evidence that functionality exists.

Current implementation status belongs in `PROJECT_STATE.md`.

---

# Completed

## P2.1 — Move Business Rules to Service Layer ✅ COMPLETE

- [x] Add `ConflictError` class
- [x] Move tenant active-lease check to service
- [x] Move unit active-lease check to service
- [x] Remove controller active-lease checks
- [x] Add tenant service archive tests
- [x] Add unit service archive tests
- [x] Remove obsolete manual test script
- [x] Verify full test suite
- [x] TypeScript check
- [x] Documentation update

---

## P2.2 — Business Boundary and Active-Lease Inspection ✅ COMPLETE

P2.2 inspection has been completed and documented.

Confirmed:

- Properties, Units, and Tenants use soft deletion through the application business layer.
- Leases use lifecycle/status transitions rather than a public hard-delete workflow.
- Payments have no delete workflow.
- Payment relations to Lease and Tenant use `Restrict`.
- The authoritative active-lease definition is `Lease.status = ACTIVE`.
- Lease dates do not independently determine whether a lease is active.
- The database partial unique index enforcing one active lease per unit has been implemented and verified locally.
- Existing database cascade relationships were reviewed and no schema change was justified.
- No code implementation changes were required by the P2.2 inspection.

### Remaining decision verification

The following decisions remain tracked separately and must not be treated as completed solely because the broader P2.2 inspection is complete:

- [ ] D-031 — Verify/standardize Unit hard-delete lease-history behavior if a hard-delete service capability is introduced.
- [ ] D-032 — Verify/standardize Tenant hard-delete lease-history behavior if a hard-delete service capability is introduced.

See `DECISION_LOG.md` and `PROJECT_STATE.md` for authoritative status.

---

# Frontend Cleanup

## API Client Consolidation

Inspection completed.

The operational API abstraction is:

```text
frontend/src/services/api.ts
```

The following file was found to be unused application code:

```text
frontend/src/lib/api-client.ts
```

Repository inspection found no application references to `apiClient` or `api-client.ts`.

### Cleanup

- [ ] Remove `frontend/src/lib/api-client.ts`.
- [ ] Run frontend TypeScript/build verification after removal.
- [ ] Confirm no repository application references remain.

No replacement API abstraction should be introduced unless a demonstrated requirement exists.

---

# Build and Deployment Hardening

The previous build-system TODO is stale.

Current backend scripts already use explicit Prisma generation and TypeScript compilation:

```text
build: npx prisma generate && tsc
start: npx prisma migrate deploy && node dist/server.js
```

No `postinstall` script currently exists.

The previously established Railway build direction is also explicit:

```text
npm ci
npx prisma generate
npm run build
```

### Remaining work

- [ ] Review the complete local and production build/deployment configuration for deterministic behavior.
- [ ] Confirm production deployment uses explicit Prisma generation.
- [ ] Confirm production migration execution occurs at the intended deployment stage.
- [ ] Review Node.js/runtime version consistency between local and production.
- [ ] Re-verify Railway deployment only when production infrastructure is available.
- [ ] Avoid introducing implicit lifecycle hooks for production-critical behavior.

**Important:** Railway production verification remains separate from local verification while the Railway service is unavailable.

---

# Authentication Hardening

Authentication is already implemented.

Current verified behavior includes:

- JWT authentication.
- JWT verification.
- Bearer-token authorization.
- JWT expiration currently set to 7 days.
- Frontend token storage in `localStorage`.
- Logout through session/token removal.
- Automatic session cleanup and redirect after a `401`.
- Authentication guard on the frontend.

The following remain **review items**, not assumptions that the current implementation is defective:

- [ ] Review whether the 7-day JWT expiration policy is appropriate for production.
- [ ] Review the security implications of storing JWTs in `localStorage`.
- [ ] Decide whether a refresh-token/session-renewal strategy is required.
- [ ] Review session-expiration UX.
- [ ] Review logout behavior and session cleanup.
- [ ] Review authorization boundaries across all protected resources.
- [ ] Expand authentication/authorization regression tests only where actual coverage gaps are identified.

Do not redesign authentication without an explicit security/architecture decision.

---

# Security Hardening

The backend already implements:

- CORS.
- Helmet security headers.
- Authentication middleware.
- Authentication rate limiting.
- General API rate limiting.
- Request-size limiting.
- Structured request logging.
- Sensitive-value redaction.
- Global error handling.
- Resource ownership checks across protected business domains.

### Remaining review work

- [ ] Verify production CORS configuration.
- [ ] Review CORS `credentials` configuration against the actual authentication mechanism.
- [ ] Review rate-limit thresholds and behavior behind the production proxy.
- [ ] Review Helmet configuration for production requirements.
- [ ] Review input-validation coverage for security-sensitive endpoints.
- [ ] Review authentication middleware behavior and failure responses.
- [ ] Review authorization boundaries for every protected resource.
- [ ] Review error responses for unnecessary information disclosure.
- [ ] Review production secret management and rotation procedures.
- [ ] Review database access and least-privilege considerations.
- [ ] Perform production security verification when Railway is available.

Security changes must be based on demonstrated requirements or explicit decisions rather than speculative hardening.

---

# Testing

The backend currently contains unit-test suites for:

```text
auth.service.test.ts
financeAnalytics.service.test.ts
lease.service.test.ts
payment.service.test.ts
property.service.test.ts
tenant.service.test.ts
unit.service.test.ts
```

The full test suite has been verified locally at:

```text
75/75 tests passing
```

Existing coverage includes authentication, ownership checks, lease rules, payment rules, finance calculations, archive behavior, and active-lease race protection.

### Remaining testing work

- [ ] Identify genuine authorization coverage gaps.
- [ ] Identify genuine authentication/security edge-case gaps.
- [ ] Add regression tests when a specific uncovered business rule is identified.
- [ ] Maintain automated coverage for financial correctness.
- [ ] Maintain automated coverage for lease invariants and ownership isolation.
- [ ] Re-run the full suite after meaningful backend changes.
- [ ] Maintain a clear distinction between local test verification and production verification.

Do not add tests solely to increase test count. Tests should protect meaningful business rules and known failure modes.

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

Avoid expanding product scope while core reliability, security, and operational correctness still require attention.

---

# Future

Potential future work includes:

- AI worker
- Automated categorization
- Document processing
- Advanced reporting
- Billing/subscription functionality
- Notifications
- Additional integrations

These remain future scope unless explicitly promoted into an active phase through the project decision process.

---

**End of `TODO.md`**
