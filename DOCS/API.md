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
