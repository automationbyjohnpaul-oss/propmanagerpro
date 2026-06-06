# Authorization Matrix — PropManager Pro

## Rules
- Owner = The authenticated user who created the resource
- Void Only = Cannot delete, only change status to void/refunded
- Never = No user can perform this action

## Matrix

| Resource | Create | Read  | Update    | Delete     |
| -------- | ------ | ----- | --------- | ---------- |
| Property | Owner  | Owner | Owner     | Owner      |
| Unit     | Owner  | Owner | Owner     | Owner      |
| Tenant   | Owner  | Owner | Owner     | Owner      |
| Lease    | Owner  | Owner | Owner     | Owner      |
| Payment  | Owner  | Owner | Void Only | Never      |

## Ownership Chain

User -> Property (direct: userId)
User -> Tenant (direct: userId) — v0.6.1
Property -> Unit (inferred: property.userId)
Property -> Lease (inferred: property.userId)
Lease -> Payment (inferred: lease.property.userId)

## Enforcement Points
- Service layer: where: { userId } or where: { property: { userId } }
- Controller: req.userId passed to all service calls
- Middleware: authMiddleware on all protected routes
