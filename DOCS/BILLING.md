# PropManager Pro — Billing

> Status: Planned / Not yet established as a production billing subsystem.

---

# Current State

Billing is not currently treated as an authoritative production domain.

Do not implement billing assumptions based solely on this document.

---

# Future Billing Requirements

When billing is introduced, document:

- subscription model
- pricing
- plans
- trial rules
- payment provider
- webhook architecture
- subscription state
- failed payments
- cancellation
- refunds
- invoices
- entitlements
- access control

---

# Architectural Rule

Billing state must have one authoritative source.

The application must not infer subscription status from unreliable frontend state.

---

# Future Security Requirements

Payment credentials and provider secrets must remain server-side.

Webhook signatures must be verified.

Billing events must be idempotent.

---

# Status

No production billing architecture should be considered finalized until recorded in:

```text
DECISION_LOG.md
PROJECT_STATE.md
ARCHITECTURE.md
```

---

**End of `BILLING.md`**
