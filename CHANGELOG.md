# PropManager Pro — Changelog

All notable project changes should be recorded here in chronological order.

This document is historical.

For current status, use `PROJECT_STATE.md`.

---

# 2026

## Documentation Reconciliation (September 7, 2026)

* Reconciled six Markdown documents against source/configuration/test inspection at `82c475b`; prepared for diff review before commit.
* Clarified that P2.2 inspection was complete without implementation or migration changes; earlier P2.2 implementation assumptions below are historical.
* Preserved D-031/D-032 proposals as not implemented and inapplicable to current scope under D-037; resolved D-033 through D-037.
* Preserved D-020's original configuration/target and recorded the local build portion implemented in `4155c2e`; production staging remains unverified.
* Identified the actual `(app)` layout/AuthContext guard and separated source inspection from browser verification.
* Corrected stale SSOT debt and environment-validation claims; fixed the unclosed D-037 code fence.
* D-026 and D-036 remain pending. No VOID/VOIDED workflow was introduced.
* No source, schema, migrations, tests, packages, or deployment configuration changed. The recorded 75/75 tests, builds, local API checks, and migration application were not rerun; production remains unverified.

---

## P2.1 — Move Business Rules to Service Layer (August 2026)

* Added `AppError` and `ConflictError` classes.
* Moved tenant active-lease archive protection from controller to service.
* Moved unit active-lease archive protection from controller to service.
* Removed duplicated active-lease checks from controllers.
* Added tenant service archive tests (4 tests).
* Added unit service archive tests (4 tests).
* Removed obsolete manual unit test script from `src/tests/`.
* Verified full backend test suite: 28/28 tests passing.
* Verified TypeScript compilation with no errors.
* Verified `git diff --check` clean.
* Established the service layer as the authoritative location for these archive business rules.

---

## P2.2c — Active Lease Standardization (Pending)

Later clarification (September 7, 2026): this entry preserves the pending state recorded at the time. D-037 and the D-033 resolution establish that the existing status-based implementation already satisfies the definition; these bullets are not current pending work.

* Recorded that the authoritative active-lease definition has not yet been finalized.
* Standardization remains scheduled as P2.2 work.
* Existing active-lease checks will be reviewed and aligned during P2.2.

---

## Lease Database Invariant (September 2026)

* Added PostgreSQL partial unique index:

  `leases_one_active_per_unit_idx`

  enforcing one `ACTIVE` lease per unit.

* Confirmed no duplicate active leases existed before applying the migration.
* Migration name:

  `20260901120000_add_active_lease_per_unit_unique_index`

* Lease service converts `P2002` concurrent active-lease conflicts into `409 ConflictError` with message:

  `Unit already has an active lease`

* Added lease service regression test for the database-constraint conflict path.

---

## v0.2.0 — Authentication & Multi-Tenant Security

### Added

* User model
* User registration
* User login
* JWT authentication
* JWT verification middleware
* bcrypt password hashing
* User identity propagation through authenticated requests
* User-scoped resource access
* Authentication context in frontend
* Login/logout flows
* Authentication guards

### Security

* Protected application routes
* Unauthorized requests return HTTP 401
* Invalid or expired JWTs are rejected
* User-owned resources are scoped using authenticated user identity

---

## v0.1.0 — Core Operations

### Added

* Property CRUD
* Unit CRUD
* Tenant CRUD
* Lease CRUD
* Payment CRUD
* Finance analytics

### Business Rules

* Lease overlap prevention
* Active lease validation
* Payment void-only policy

  Later clarification (September 7, 2026): this historical policy wording is superseded by D-025. It does not establish a current or previously verified VOID implementation; no VOID/VOIDED workflow exists in current code.

* Finance calculations
* Zod validation

---

# Deployment

## Backend

* Backend was deployed to Railway.
* PostgreSQL was connected through Supabase.
* `/health` endpoint was established.
* Startup database connectivity checks were established.
* Railway database connectivity was validated.
* Authentication behavior was validated against the production backend.

**Historical deployment note:** The Railway deployment subsequently became unavailable following subscription expiration. Current production deployment state must be verified separately and is not established by these historical entries.

## Frontend

* Next.js application was configured for the production backend.
* `NEXT_PUBLIC_API_URL` was established as frontend API configuration.

---

# Reliability / Engineering

* Added request deduplication to frontend GET requests.
* Added 401 handling to API layer.
* Added structured backend logging.
* Added security middleware.
* Added rate-limiting capability.
* Added startup health checks.
* Established explicit project documentation structure.
* Established AI handoff workflow.
* Established Single Source of Truth as an architectural engineering principle.
* Established incremental domain-by-domain refactoring as the preferred consolidation approach.

---

# Known Cleanup Areas

Later clarification (September 7, 2026): the following preserves earlier cleanup tracking, not current TODO status. `4155c2e` removed the Prisma postinstall dependency; D-037 and the D-031/D-032 dispositions remove hard-delete work from current scope. See TODO.md and PROJECT_STATE.md for remaining work.

The following are documented technical cleanup items and should not be interpreted as completed work:

* Consolidate/remove duplicate frontend API client abstraction.
* Review Prisma `postinstall` dependency.
* Improve production build determinism.
* Review startup readiness behavior.
* Expand automated test coverage.
* Continue production hardening.
* Complete remaining hard-delete business-rule consolidation.
* Continue service/controller SSOT consolidation where implementation still contains duplication.
* Review payment, finance, and audit architecture as their respective phases are reached.

---

**End of `CHANGELOG.md`**
