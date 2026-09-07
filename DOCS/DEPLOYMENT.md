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

## Backend Environment Variables

These are application validation requirements from `backend/src/config/env.ts`, not evidence of actual Railway values. The example file contains development settings. For production, explicitly configure `NODE_ENV=production` and the deployed frontend origin.

| Variable | Requirement |
| -------- | ----------- |
| `DATABASE_URL` | Required valid URL; startup separately checks database connectivity with `SELECT 1`. |
| `JWT_SECRET` | Required, minimum 32 characters. |
| `PORT` | Use Railway-provided port; numeric coercion defaults to `4000` when omitted, including locally. |
| `NODE_ENV` | `development`, `test`, or `production`; defaults to `development` when omitted. |
| `FRONTEND_URL` | Required valid URL; production must point to the deployed frontend. |
| `LOG_LEVEL` | `debug`, `info`, `warn`, or `error`; defaults to `info`. |

Validation runs during module initialization. Database URL syntax does not establish credentials, connectivity, or migration state. The server awaits the startup database check before listening; failure exits with code 1. `/health` returns HTTP liveness without querying the database and cannot establish ongoing database readiness.

Unresolved deployment review findings:

- `PORT` has no explicit integer/range constraint in the application validator.
- Omitted `NODE_ENV` defaults to `development`; no separate production validation branch exists.
- Prisma CLI is a backend devDependency and is invoked by `start`. Confirm that the production installation policy makes the intended CLI available at startup; this audit does not change dependency placement or commands.
- Actual Railway/Vercel settings, installation policy, monitoring endpoint, and runtime behavior remain unverified while platform access is unavailable.

These findings do not establish implementation defects. No validation, dependency, health behavior, or deployment-platform change is implied.

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
