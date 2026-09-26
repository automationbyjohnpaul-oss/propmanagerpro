# PropManager Pro — Security

---

# Authentication

Authentication uses JWT.

Payload:

```text
userId
email
role
```

Token lifetime:

```text
7 days
```

Passwords use bcrypt hashing.

---

# Authorization

Authentication and authorization are different.

Authentication answers:

> Who is this user?

Authorization answers:

> Is this user allowed to access this resource?

Every protected resource must perform appropriate ownership checks.

---

# Multi-Tenant Isolation

A user's request must not be able to access another user's property, unit, tenant, lease, payment, or financial information by changing an ID.

Server-side ownership checks are mandatory.

---

# Secrets

Never commit:

```text
DATABASE_URL
JWT_SECRET
production credentials
```

Use environment variables.

JWT secrets must meet the backend environment validation requirements.

---

# CORS

Production CORS should permit only trusted frontend origins.

The frontend production origin must be explicitly configured.

---

# Rate Limiting

Authentication and other abuse-sensitive endpoints should use rate limiting.

---

# Logging

Structured logging should be used for operational diagnostics.

Sensitive information must not be logged.

Never log:

* passwords
* JWT secrets
* authentication tokens
* unnecessary personal information

---

# Error Responses

Production errors should not expose:

* stack traces
* database internals
* secrets
* implementation details

---

## Business and Unexpected Error Responses

Explicitly typed ConflictError responses preserve HTTP 409 and user-safe business messages in all environments. This includes lease occupancy conflicts and the existing tenant/unit archive conflicts. PaymentRequestError retains its existing status, message, code, and optional Retry-After header behavior.

Unexpected errors remain masked in production. An ordinary unexpected Error returns HTTP 500 with {"message":"Internal Server Error"} and no stack trace, original internal message, or database details in the response body. Arbitrary error messages are not exposed merely because the ConflictError branch exists.

This behavior was verified through isolated middleware/source checks with mocked inputs under development and production configuration. It does not establish deployed production behavior, live endpoint behavior, or logging/redaction behavior; logging was stubbed in the isolated checks.

---

# Security Verification

Security changes are not complete until they are tested against:

* valid authentication
* invalid authentication
* expired authentication
* missing authentication
* unauthorized resource access
* cross-user resource access

---

# Known Security Items

The following items are tracked for review:

* `FRONTEND_URL` missing from environment validation
* API client duplication may create inconsistent error handling
* Startup health checks are non-blocking and may need readiness review

For current security-related technical debt, see:

```text
TODO.md
```

---

**End of `SECURITY.md`**
