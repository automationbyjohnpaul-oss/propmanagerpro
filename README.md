# PropManager Pro

**Simple property management for small landlords.**

PropManager Pro is a mobile-first SaaS application designed to simplify property management for landlords managing approximately 1–10 units.

---

# Product Goal

PropManager Pro aims to replace fragmented workflows such as:

* Spreadsheets
* Manual rent tracking
* Paper receipts
* WhatsApp-based maintenance records
* Scattered tenant information
* Manual financial summaries

with a simple centralized system.

---

# Product Principle

> Simplicity over feature quantity.

The product should be:

* Easy to understand
* Fast to use
* Mobile-first
* Financially reliable
* Secure
* Maintainable

---

# Core Modules

```text
Authentication
Properties
Units
Tenants
Leases
Payments
Finance
```

---

# Technology

## Frontend

```text
Next.js
TypeScript
React
Tailwind CSS
```

## Backend

```text
Node.js
Express
TypeScript
Prisma
```

## Database

```text
PostgreSQL
Supabase
```

## Deployment

```text
Vercel
Railway
```

---

# Repository

```text
PropManager Pro/
│
├── PROJECT_STATE.md
├── ARCHITECTURE.md
├── DECISION_LOG.md
├── CHANGELOG.md
├── TODO.md
├── AI_HANDOFF.md
├── README.md
│
├── DOCS/
├── frontend/
├── backend/
├── ai_worker/
├── database/
├── config/
└── tests/
```

---

# Documentation Guide

## `PROJECT_STATE.md`

Current project state.

Read this first.

It answers:

> Where are we now?

## `ARCHITECTURE.md`

System architecture and intended design.

It answers:

> How is the system supposed to be structured?

## `DECISION_LOG.md`

Important decisions and their reasoning.

It answers:

> Why did we choose this approach?

## `CHANGELOG.md`

Historical record of completed changes.

It answers:

> What has changed over time?

## `TODO.md`

Future work.

It answers:

> What remains to be done?

## `AI_HANDOFF.md`

AI continuation context.

It answers:

> What does a new AI session need to know before continuing?

## `DOCS/`

Detailed operational documentation:

```text
DOCS/
├── API.md
├── DEPLOYMENT.md
├── SECURITY.md
└── BILLING.md
```

---

# Development Philosophy

PropManager Pro is developed using an AI-assisted engineering workflow.

The project therefore emphasizes:

* Clear architecture
* Small changes
* Explicit commands
* Strong typing
* Business-rule validation
* Documentation
* Testing
* Deterministic deployment
* Security
* Financial correctness

AI is an engineering tool, not a substitute for verification.

Every important AI-generated change should be:

```text
Proposed
→ Reviewed
→ Implemented
→ Tested
→ Verified
→ Documented
```

---

# Source of Truth

The project uses the following hierarchy:

```text
Actual implementation
        ↓
PROJECT_STATE.md
        ↓
ARCHITECTURE.md
        ↓
DECISION_LOG.md
        ↓
DOCS/
        ↓
CHANGELOG.md
        ↓
TODO.md
        ↓
AI_HANDOFF.md
        ↓
README.md
```

When these disagree, verify the implementation first and then synchronize the documentation.

---

# Getting Started

For development:

```text
frontend/
```

contains the Next.js application.

```text
backend/
```

contains the Express API.

The backend requires environment configuration including:

```text
DATABASE_URL
JWT_SECRET
PORT
NODE_ENV
```

The frontend requires:

```text
NEXT_PUBLIC_API_URL
```

Never commit production secrets.

---

# Production

Current deployment architecture:

```text
Browser
   ↓
Vercel
   ↓
Railway
   ↓
Supabase PostgreSQL
```

The backend exposes:

```text
/health
```

for health verification.

---

# AI Continuation

When starting a new AI development session, read:

```text
PROJECT_STATE.md
AI_HANDOFF.md
ARCHITECTURE.md
```

before making changes.

Then inspect the actual relevant code.

Do not assume that an item being mentioned in documentation means it is currently implemented.

---

# Project Rule

Build the simplest reliable system that solves the real problems of small landlords.

Do not confuse:

```text
more features
```

with:

```text
better product
```

---

**End of `README.md`**
 