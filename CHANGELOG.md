# PropManager Pro — Changelog

All notable project changes should be recorded here in chronological order.

This document is historical.

For current status, use `PROJECT_STATE.md`.

---

# 2026
## P2.1 — Move Business Rules to Service Layer (August 2026)

- Added `AppError` and `ConflictError` classes.
- Moved tenant active-lease archive protection from controller to service.
- Moved unit active-lease archive protection from controller to service.
- Removed duplicated active-lease checks from controllers.
- Added tenant service archive tests (4 tests).
- Added unit service archive tests (4 tests).
- Removed obsolete manual unit test script from `src/tests/`.
- Verified full backend test suite: 28/28 tests passing.
- Verified TypeScript compilation with no errors.
- Verified `git diff --check` clean.

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
* Finance calculations
* Zod validation

---

## Deployment

### Backend

* Backend deployed to Railway
* PostgreSQL connected through Supabase
* `/health` endpoint established
* Startup database connectivity checks established
* Railway database connectivity validated
* Authentication behavior validated against production backend

### Frontend

* Next.js application configured for production backend
* `NEXT_PUBLIC_API_URL` established as frontend API configuration

---

## Reliability / Engineering

* Added request deduplication to frontend GET requests
* Added 401 handling to API layer
* Added structured backend logging
* Added security middleware
* Added rate-limiting capability
* Added startup health checks
* Established explicit project documentation structure
* Established AI handoff workflow

---

## Known Cleanup Areas

The following are documented technical cleanup items and should not be interpreted as completed work:

* Consolidate/remove duplicate frontend API client abstraction
* Review Prisma `postinstall` dependency
* Improve production build determinism
* Review startup readiness behavior
* Expand automated test coverage
* Continue production hardening

---

**End of `CHANGELOG.md`**
