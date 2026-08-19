# System Invariants — PropManager Pro

These are the laws of the system. Any bug can be traced to a violation of one of these invariants.

## Ownership Invariants

1. Every Property belongs to exactly one User (`property.userId`)
2. Every Tenant belongs to exactly one User (`tenant.userId`) — v0.6.1
3. A User may only access records they own (all queries scoped)
4. Every Lease references exactly one Property, one Unit, one Tenant
5. A Unit belongs to exactly one Property
6. Finance calculations must only include records owned by the authenticated user

## Uniqueness Invariants

7. User emails are globally unique
8. Unit numbers are unique within a Property (`@@unique([propertyId, unitNumber])`)
9. Tenant emails are unique per User (`@@unique([userId, email])`) — v0.6.2

## Data Integrity Invariants

10. Payments are never hard-deleted (voided via status change only)
11. A Unit cannot have two active overlapping Leases
12. Foreign key cascades ensure no orphan records

## Auth Invariants

13. All protected routes require valid JWT
14. Expired/invalid tokens return 401
15. CORS only allows configured frontend origins

## API Invariants

16. All error responses follow `{ "message": "..." }` format
17. All service functions accept `userId` as first parameter
18. All controllers extract `req.userId` and pass to services
