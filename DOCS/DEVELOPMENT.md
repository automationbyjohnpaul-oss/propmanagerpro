# PropManager Pro — Development

---

# Development Workflow

PropManager Pro uses an AI-assisted engineering workflow.

Every meaningful change should follow:

```text
Inspect
↓
Understand
↓
Plan
↓
Change
↓
Build
↓
Test
↓
Verify
↓
Document
↓
Commit
```

AI may accelerate implementation, but it does not replace verification.

---

# Engineering Principles

1. Inspect before changing
2. Small changes preferred
3. Verify before declaring success
4. Preserve business rules
5. Tenant isolation is mandatory
6. Avoid duplicate architecture
7. Documentation follows implementation
8. AI-generated assumptions must be verified

---

# Source-of-Truth Hierarchy

```text
1. Actual code/database/deployed behavior
2. PROJECT_STATE.md
3. ARCHITECTURE.md
4. DECISION_LOG.md
5. DOCS/
6. CHANGELOG.md
7. TODO.md
8. AI_HANDOFF.md
9. README.md
```

If documentation conflicts with implementation, the implementation wins and documentation must be corrected.

---

# Backend Commands

Development:

```powershell
cd backend
npm run dev
```

Build:

```powershell
npm run build
```

Start production:

```powershell
npm run start
```

---

# Frontend Commands

Development:

```powershell
cd frontend
npm run dev
```

Build:

```powershell
npm run build
```

---

# Environment Variables

## Backend

```text
DATABASE_URL
JWT_SECRET
PORT
NODE_ENV
```

`JWT_SECRET` must be at least 32 characters.

## Frontend

```text
NEXT_PUBLIC_API_URL
```

Must contain backend origin only. Do not append `/api`.

---

# Testing

Current test coverage is limited.

Priority testing areas:

* Authentication
* Authorization
* Ownership checks
* Lease overlap
* Payment rules
* Finance calculations

---

# Documentation Maintenance

After material changes, update only the affected documents.

Use the document update matrix in `AI_HANDOFF.md`.

Do not rewrite all documents after every change.

---

**End of `DEVELOPMENT.md`**
