# Migration Discipline

## Rules

1. **Never edit production first** — schema.prisma → migration → local → production
2. **Every schema change gets a migration** — commit migration + schema together
3. **Migration files are source code** — commit, review, never delete casually
4. **Test migration locally before push** — migrate dev → build → test CRUD
5. **Production uses `migrate deploy`** — never `migrate dev` in production
6. **Verify before tagging** — run verification suite + manual frontend test
7. **One change, one release** — small releases, easy to debug
8. **Check for circular dependencies** — "Can Entity A exist without Entity B?"
9. **Tags are recovery points** — tag every release

## Workflow

1. Design
2. Update schema.prisma
3. `npx prisma migrate dev --name ...`
4. Test locally (CRUD)
5. Commit migration + code
6. Push → Railway deploy
7. Run `.\scripts\verify-production.ps1`
8. Test frontend on Vercel
9. Tag release
10. Start next feature

## Layers (all must stay in sync)

- Prisma Schema (schema.prisma)
- Migration Files (prisma/migrations/)
- Database Schema (actual tables)
- Application Code (services/controllers)
