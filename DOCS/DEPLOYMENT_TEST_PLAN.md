# Deployment Smoke Test Plan — CP-002

## Test Flow

1. **Register** — `/register` → create account → redirect to login
2. **Login** — `/login` → enter credentials → redirect to dashboard
3. **Create Property** — Add property with `unitCount=3`
4. **Auto-create Units** — Verify units appear in Property Detail
5. **Create Lease** — Select property → units appear → create lease
6. **Archive Property** — Click Archive → confirm → disappears
7. **Restore Property** — API call → property reappears
8. **Logout** — Click logout → redirect to login

## Sign-off

- [ ] All tests pass
- [ ] No console errors
- [ ] Deployment ready
