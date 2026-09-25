# PropManager Pro — Changelog

All notable project changes should be recorded here in chronological order.

This document is historical.

For current status, use `PROJECT_STATE.md`.

---

# 2026

## September 21, 2026

### Fixed

- Fixed payment edit failures caused by create-only fields being sent to strict update validation.
- Updated payment edit submission to send only fields accepted by the payment update schema.
- Updated lease edit submission to send update-compatible payloads and prevent create-only fields from being submitted during updates.

### Changed

- Added an explicit Node.js runtime policy:
  - `.nvmrc` defines the local development runtime as Node 24.18.0.
  - Backend and frontend packages declare Node 24.x compatibility.
  - Production runtime selection remains pending deployment verification.

- Added AI debugging investigation guidance to `AI_HANDOFF.md` to standardize issue investigation steps before code changes.

### Verification

- Payment integration tests passed.
- Backend TypeScript build passed.
- Backend startup verified against the local database.
- Frontend production build passed.
- Production deployment verification remains pending.

## September 2026 Stability and Update-Payload Hardening

### Fixed

- Fixed payment edit validation failure caused by sending create-payment fields to the update endpoint.
- Restricted payment edit requests to update-compatible fields.
- Made payment updates and `UPDATE_PAYMENT` audit records commit or roll back together.
- Fixed lease editing so the create-only `status` field is not sent to the strict lease update endpoint.
- Added an explicit lease update input type and explicit edit-page payload construction.

### Added

- Added `.nvmrc` with Node 24.18.0.
- Declared Node 24.x in backend and frontend package engines.

### Verified

- Backend build and production startup succeeded locally.
- Frontend production build succeeded locally.
- Payment atomicity integration tests passed (41 tests).
- Property, tenant, and unit edit payloads were audited against their backend update validators; no unsupported fields were found.
- Railway runtime selection remains unverified because deployment has not started.

## Frontend Payment Recovery (September 19, 2026; uncommitted)

* Persist per-user UUID/original payload before sending; restore for review with no auto-submit or expiry. Same-key retry preserves details; explicit reconciliation is required before replacing an unresolved attempt.
* Coordinate same-origin tabs using Web Locks; stop submission when coordination/storage is unavailable. Validate confirmations, preserve evidence on uncertain responses, and retain minimal resolution markers against stale resubmission.
* Preserve attempts across logout/account changes; a delayed non-GET 401 no longer signs out a newer account. Expose Retry-After through backend CORS.
* Verified 25 frontend Node recovery tests with simulated browser primitives, targeted lint, frontend production build and backend source types. Full backend suite: 120/120 across 9 files, including 2 real-app CORS checks.
* Real-browser acceptance and deployment remain unverified. No added dependencies, development/production migration, commit or push.

## Backend Payment Creation Idempotency (September 19, 2026; uncommitted)

* Applied the reviewed additive migration only to verified localhost:5432/propmanagerpro_test (15 total migrations); regenerated Prisma Client 6.19.3.
* Reproduced duplicate same-key payment creation with failing HTTP regressions, then implemented mandatory UUID keys, deterministic v1 fingerprints, transactional claims, original-response storage, and authorized replay.
* Preserved omitted dates through validation; restored effective lock timeout after the first-write claim. Added explicit safe recovery/integrity error codes without changing unrelated error handling.
* Full suite: 118/118 in 8 files, including 41 payment HTTP/database cases. Real blocking verifies concurrent commit/rollback/timeout; source and integration-test type checks pass.
* Existing frontend remains keyless and requires the separate persistent-recovery implementation before release. No frontend, development/production DB, deployment, push or commit changes in this checkpoint. Payment-update atomicity remains open.

## Idempotency Schema Proposal (September 19, 2026; not applied)

* Recorded D-039 and the payment request identity/replay/recovery contract, including a 21-case planned backend regression matrix.
* Prepared PaymentCreateRequest and an additive migration from an offline Prisma datamodel comparison. Schema validation passed; existing payment data needs no backfill.
* No migration application, client generation, runtime behavior changes, or new passing idempotency tests in this checkpoint. D-038's 82/82 suite result remains historical for this step.

## Payment Creation Audit Atomicity (September 19, 2026)

* Reproduced HTTP 500 with a committed payment when the audit insert fails in the local test database.
* Wrapped payment creation and its audit in one controller-owned Prisma transaction; preserved service business rules and the pre-existing payment-record helper.
* Added five HTTP/database integration regressions covering success, audit insert failure, failure after the audit insert, rejected lease access, and input validation. Both rollback tests failed before the fix and passed afterward.
* Verification: existing baseline 77/77; full backend suite 82/82 across 8 files; backend source `tsc --noEmit` passed. Tests use guarded localhost `propmanagerpro_test`; authenticated identity is supplied by the HTTP harness.
* No new dependencies, schema/migration changes, or production verification. Payment-update atomicity and idempotency remain separate work. Recorded D-038 and synchronized current-state/continuation documentation.

## Unit Reassignment Authorization and Test Isolation (September 7, 2026)

* Reproduced a service-level defect allowing a user to move their unit to another user's property and receive that property's details.
* Added destination-property ownership and active-status validation to `updateUnit()`; same-user active-property reassignment remains allowed.
* Added cross-user rejection and same-user success regressions, including persisted relationship assertions and `finally` cleanup.
* Added Vitest configuration/setup selecting local `propmanagerpro_test` before test imports and rejecting remote hosts. Verified the guard in isolation and through Vitest; removed temporary verification artifacts.
* Initialized the dedicated local test database using the existing 14 migrations. No schema or migration files changed; the development database was not targeted.
* Fresh verification: both focused regressions passed and the unit suite passed 77/77 across 7 files. Earlier 75/75 records below remain historical. No fresh backend build, HTTP reproduction, or production verification was performed.
* JWT lifetime remains seven days; production suitability is pending. The non-blocking Vite module-format warning remains unchanged.

---

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
