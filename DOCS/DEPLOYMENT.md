# PropManager Pro — Deployment

---

# Production Architecture

```text
GitHub
 ├── Frontend → Vercel
 └── Backend  → Railway
                    ↓
               Supabase
               PostgreSQL
```

---

# Backend

Platform:

Railway

Production backend:

```text
https://propmanagerpro-production.up.railway.app
```

Expected production start:

```text
npx prisma migrate deploy && node dist/server.js
```

Health endpoint:

```text
/health
```

Server must listen on:

```text
0.0.0.0
```

and use the Railway-provided `PORT`.

---

# Frontend

Platform:

Vercel

Environment:

```text
NEXT_PUBLIC_API_URL
```

Expected value:

```text
https://propmanagerpro-production.up.railway.app
```

Do not append `/api`.

---

# Deployment Principle

Production deployments must be explicit and deterministic.

Critical operations must not depend solely on implicit lifecycle behavior.

---

# Verification

After deployment verify:

1. Backend starts
2. `/health` works
3. Database connection works
4. Authentication works
5. Invalid authentication is rejected
6. CRUD works
7. Cross-user access is rejected
8. Frontend connects to production backend
9. CORS works
10. Database migrations are applied

---

# Current State Note

Deployment information in this document is based on previously established configuration.

Actual platform state must be verified directly before being treated as current production truth.

For current verified deployment status, see:

```text
PROJECT_STATE.md
```

---

**End of `DEPLOYMENT.md`**
