# Release Checklist

## Database

- [ ] Migration created (`npx prisma migrate dev --name ...`)
- [ ] Migration committed to git
- [ ] Local migration tested (CRUD for affected entities)

## Backend

- [ ] Build succeeds (`npm run build`)
- [ ] Verification script passes (`.\scripts\verify-production.ps1`)

## Frontend

- [ ] Build succeeds (`npm run build`)
- [ ] Login works
- [ ] CRUD works for affected entities
- [ ] Logout works
- [ ] Protected routes redirect

## Deployment

- [ ] Railway backend healthy
- [ ] Vercel frontend healthy
- [ ] FRONTEND_URL matches Vercel domain

## Release

- [ ] Tag created (`git tag -a vX.Y.Z -m "..."`)
- [ ] Tag pushed (`git push origin vX.Y.Z`)
- [ ] Release notes written
