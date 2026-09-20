# H2 Database Isolation and Authorization Audit

## Scope Declaration

This audit is a STATIC CODE AUDIT.

Available evidence:

- Current repository source code.
- Prisma schema and migration files.
- Backend services and controllers.
- Existing automated test references.

Not available for this audit:

- Local Windows runtime environment.
- Running backend instance.
- Live PostgreSQL database access.
- Browser-based User A/User B testing.
- Production infrastructure verification.

Therefore, findings are classified only as:

- STATIC-CONFIRMED
- LIKELY
- POSSIBLE

No runtime-confirmed security claims are made in this document.

---

# Audit Objective

The purpose of H2 is to verify that the implementation maintains tenant isolation after the H1 financial integrity changes.

The review focuses on:

- collection endpoint ownership;
- relation-based ownership checks;
- single-resource access control;
- payment idempotency isolation;
- authentication and authorization boundaries;
- identifier exposure;
- future webhook surface.

---

# Section 1 — Authentication and Authorization Boundary Re-confirmation

## Authentication

Authentication establishes the identity of the caller through the existing JWT implementation, as reviewed in the backend authentication flow.

## Authorization

Authorization is enforced separately through ownership checks applied at controller and service query boundaries.

The reviewed H1 payment changes do not bypass the existing authentication flow.

---

## Finding H2-001 — User identity source

Status:

STATIC-CONFIRMED — PASS

The reviewed payment and business-resource flows do not trust client-provided ownership identifiers.

Ownership is derived from the authenticated user context.

No reviewed ownership-sensitive flow inspected during this audit uses a request body value as the source of the authenticated ownership boundary.

---

## Finding H2-002 — Payment idempotency ownership boundary

Status:

STATIC-CONFIRMED — PASS

The PaymentCreateRequest design uses:

```
(userId, requestKey)
```

as the request identity boundary.

The implementation does not perform idempotency lookup using requestKey alone.

A request key submitted by another user creates a separate namespace and cannot collide with an existing user's request.

Replay lookup and request claiming both include authenticated user identity.

No cross-user idempotency isolation weakness was identified.

---

## Finding H2-003 — H1 transaction ownership preservation

Status:

STATIC-CONFIRMED — PASS

Static review confirmed that `createPayment()` in `payment.service.ts` performs ownership validation using the authenticated user identity before payment creation.

`createPayment()` accepts a third parameter typed as `Prisma.TransactionClient`, defaulting to the top-level `prisma` client:

```ts
export async function createPayment(
  userId: string,
  data: CreatePaymentData,
  client: Prisma.TransactionClient = prisma,
) {
```

The reviewed ownership checks use that client:

```ts
const lease = await client.lease.findFirst({
  where: {
    id: data.leaseId,
    property: {
      userId,
      deletedAt: null,
    },
  },
});
```

and:

```ts
const tenant = await client.tenant.findFirst({
  where: {
    id: data.tenantId,
    userId,
  },
});
```

The transaction client originates in `createPaymentHandler` in `payment.controller.ts`:

```ts
responseBody = await prisma.$transaction(async (tx) => {
  await claimPaymentRequest(tx, userId, requestKey, fingerprint);
  const createdPayment = await createPayment(userId, req.body, tx);
  // audit creation and request completion continue through the same transaction client
});
```

The `userId` supplied to these checks originates from `getUserId(req)` in the controller layer:

```ts
function getUserId(req: Request): string {
  return (req as any).userId;
}
```

It is not read from client-provided request body data. `req.body` is passed to `createPayment` only as the payment data argument, not as the identity source.

The transaction flow preserves the ownership boundary while payment creation, audit creation, and request completion execute through the same transaction boundary.

No runtime test was executed as part of this static review.

---

# Section 2 — Collection Endpoints and Relation Ownership

Status:

STATIC-CONFIRMED — PASS

The following collection and aggregate queries were reviewed.

| Area | Result |
|---|---|
| Property collections | PASS |
| Unit collections | PASS |
| Tenant collections | PASS |
| Lease collections | PASS |
| Payment collections | PASS |
| Dashboard aggregates | PASS |
| Revenue analytics | PASS |
| Outstanding rent calculations | PASS |

---

## Ownership patterns confirmed

The implementation uses either:

Direct ownership:

```
where: {
  userId
}
```

or relation ownership:

```
where: {
  property: {
    userId
  }
}
```

No reviewed collection endpoint accepts unrestricted client filters.

No controller spreads arbitrary request query values into Prisma ownership filters.

---

## Optional property filtering

The Unit collection endpoint accepts an optional property identifier.

The ownership check remains part of the same query.

A user requesting another user's property ID receives no records instead of another user's units.

Status:

STATIC-CONFIRMED — PASS

---

# Section 3 — Single Resource Access Review

## Property access

Status:

STATIC-CONFIRMED — PASS

Property retrieval and mutation paths verify ownership before returning or modifying records.

---

## Unit access

Status:

STATIC-CONFIRMED — PASS

Unit access remains protected through property ownership validation.

No cross-property access path was identified.

---

## Tenant access

Status:

STATIC-CONFIRMED — PASS

Tenant retrieval and mutation paths verify tenant ownership.

Non-security observation:

The update path does not consistently apply soft-delete filtering.

This does not bypass ownership boundaries.

Classification:

Product behaviour consistency issue, not H2 security finding.

---

## Lease access

Status:

STATIC-CONFIRMED — PASS

Lease access is protected through property ownership.

Lease mutation flows perform ownership validation before modification.

---

## Payment access

Status:

STATIC-CONFIRMED — PASS

Payment access is scoped through:

```
payment
 ↓
lease
 ↓
property
 ↓
userId
```

No payment access path returning another user's payment was identified.

---

# Nested Resource Traversal Review

Status:

STATIC-CONFIRMED — PASS

Direct foreign-key includes attached to already-authorized parent records do not create an isolation weakness.

Example:

A payment retrieved only after confirming:

```
payment.id
AND
lease.property.userId
```

cannot later include unrelated tenant or lease records because the included relations follow existing database relationships.

Additional review attention was applied to relations with independent filtering.

No unsafe independently-filtered relation query was identified.

---

# Section 4 — PaymentCreateRequest Isolation

Status:

STATIC-CONFIRMED — PASS

The PaymentCreateRequest model defines the request identity boundary through a composite primary key:

```
(userId, requestKey)
```

This is enforced in Prisma through:

```prisma
@@id([userId, requestKey], map: "payment_create_requests_pkey")
```

and in the database migration through:

```sql
CONSTRAINT "payment_create_requests_pkey" PRIMARY KEY ("userId","requestKey")
```

Migration source:

`backend/prisma/migrations/20260919150000_add_payment_create_requests/migration.sql`

A separate unique index enforces the one-to-one relationship between a payment and its creation request:

```sql
CREATE UNIQUE INDEX "payment_create_requests_paymentId_key"
ON "payment_create_requests"("paymentId")
```

The implementation confirms:

- request claiming includes user identity;
- replay lookup includes user identity;
- no lookup occurs by requestKey alone;
- raw SQL uses parameterised Prisma queries.

The composite primary key prevents one user from accessing another user's idempotency request record. The `paymentId` unique index is separate from the request identity boundary and enforces that one payment cannot be linked to multiple payment-create-request records.

---

# Section 5 — Identifier Enumerability

Status:

STATIC-CONFIRMED — PASS

Domain resource identifiers use Prisma CUID identifiers.

Reviewed models include:

- User
- Property
- Unit
- Tenant
- Lease
- Payment

These identifiers are not sequential integers, but they are also not random UUID values.

The PaymentCreateRequest request key is separately enforced as a UUID and is not equivalent to the domain resource identifier format.

Identifier format alone is not considered an access-control mechanism.

The security boundary remains ownership validation applied during resource access.

---

# Section 6 — Analytics and Aggregate Isolation

Status:

STATIC-CONFIRMED — PASS

Dashboard and financial analytics queries were reviewed.

The reviewed:

- count;
- aggregate;
- groupBy;

queries apply ownership filtering through user-owned properties and leases.

No analytics leakage issue was identified.

---

# Section 7 — Webhook Surface

Status:

N/A — Not implemented

No webhook route, controller, or integration surface was identified in the reviewed source.

No webhook security assessment is applicable at this stage.

---

# Non-Security Observations

## Archived property lease visibility

The lease collection flow does not currently exclude leases belonging to archived properties.

Impact:

- Same-owner data remains protected.
- No tenant isolation issue exists.

Classification:

Product filtering decision.

---

## Archived tenant update behaviour

The tenant update path allows modification of archived tenant records.

Impact:

- Ownership remains protected.
- No cross-user access exists.

Classification:

Product lifecycle decision.

---

# Final H2 Verdict

## STATIC-CONFIRMED — PASS

The reviewed implementation does not show a STATIC-CONFIRMED tenant isolation vulnerability.

The H1 financial integrity changes preserve existing ownership boundaries.

No confirmed issues were identified in:

- collection endpoints;
- aggregate queries;
- payment idempotency isolation;
- single-resource authorization;
- authentication boundaries;
- analytics queries.

Remaining observations relate to product behaviour consistency and require separate decisions if the product rules change.
