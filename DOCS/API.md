# PropManager Pro — API Documentation

> Current API documentation must be verified against backend routes.

---

# Authentication

Base:

```text
/api/auth
```

Endpoints:

```text
POST /api/auth/register
POST /api/auth/login
```

Authentication returns:

```text
user
token
```

Protected requests use:

```http
Authorization: Bearer <JWT>
```

---

# Core Resources

Known API domains:

```text
/api/properties
/api/units
/api/tenants
/api/leases
/api/payments
/api/finance
```

---

# Lease Lifecycle and Conflicts

Backend lifecycle endpoints:

```text
PATCH /api/leases/:id/activate    PENDING -> ACTIVE
PATCH /api/leases/:id/end         ACTIVE -> ENDED
PATCH /api/leases/:id/terminate   ACTIVE -> TERMINATED
PATCH /api/leases/:id/restore     TERMINATED -> ACTIVE
```

Active-lease conflicts return HTTP 409 with:

```json
{"message":"Unit already has an active lease"}
```

This applies to creating an ACTIVE lease, activating a lease, restoring a lease, and updates whose resulting lease status is ACTIVE when another ACTIVE lease exists on the unit. The update endpoint does not accept status changes; lifecycle endpoints control those transitions.

The response is preserved in development and production configuration. Verification used isolated service/middleware checks with mocked inputs and source inspection, not live HTTP or deployed production testing.

---

# Payment Creation

Payment creation update (D-039, verified locally September 19, 2026): `POST /api/payments` requires a UUID `Idempotency-Key` header. Reuse the key and original accepted details after an uncertain response. Matching authorized replays return the stored original 201/body, which can differ from the payment's current edited state, without another payment or audit. New keys permit distinct legitimate payments. Omitted dates remain omitted for fingerprinting and are resolved once on creation.

Missing/invalid key returns 400; changed details return 409 `IDEMPOTENCY_PAYLOAD_MISMATCH`; claim lock timeout returns 503 `IDEMPOTENCY_CLAIM_TIMEOUT` with `Retry-After: 2`. Integrity failures return distinct 500 codes and must not cause submission under a new key. Full contract: [Payment idempotency](PAYMENT_IDEMPOTENCY.md).

The frontend persists and sends the key with the original payload, validates successful confirmations and retains uncertain attempts for explicit retry/reconciliation. CORS exposes Retry-After so the browser can honor the retry countdown. Backend/client release must be coordinated. Real-browser acceptance and production behavior remain unverified.

# Finance

Known analytics endpoints include:

```text
/api/finance/dashboard
/api/finance/revenue-by-property
/api/finance/outstanding-rent
```

---

# API Rules

* Authentication must be enforced on protected resources.
* Resource access must be scoped to the authenticated user.
* Validation should occur before business logic.
* Business rules belong in backend services.
* Financial records must preserve auditability.

---

# Important Frontend Rule

`NEXT_PUBLIC_API_URL` represents the backend origin only.

Correct:

```text
https://propmanagerpro-production.up.railway.app
```

Endpoints provide `/api/...`.

Do not create:

```text
/api/api/...
```

---

# Verification Note

This document describes the intended API surface.

Actual routes and behavior must be verified against:

```text
backend/src/routes/
backend/src/controllers/
```

If a route documented here does not exist, the implementation is authoritative.

---

**End of `API.md`**
