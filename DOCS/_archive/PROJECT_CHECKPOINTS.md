markdown

# Project Checkpoints

## CP-001 — Stable Localhost Baseline

**Status:** ✅ COMPLETE
**Date:** 2026-06-15

### Completed

- ✅ Server-driven UI architecture
- ✅ Cache layer removed
- ✅ Auto-create units on property creation
- ✅ Soft delete (archive/restore) verified
- ✅ Performance baseline established
- ✅ Debug instrumentation cleaned

### Architecture Locked

- Server = Source of Truth
- Client = UI only
- Mutations = `router.refresh()`
- No custom cache

### Git Tag

````bash
git tag cp-001-stable
Next: CP-002 — Production Deployment Ready
Status: ⬜ Pending

Goals:

Railway deployment

Environment variables

Production build verification

text

---

## Document 4: `docs/TESTING.md`

```markdown
# Testing Documentation

## Verified Flows

### Property Creation

1. Create property with `unitCount=3`
2. Units auto-created ✅
3. Property appears immediately in list ✅

### Lease Creation

1. Select property
2. Unit dropdown shows units instantly ✅
3. Create lease successfully ✅

### Archive/Restore

1. Click Archive button → confirmation dialog ✅
2. Property disappears from list ✅
3. Restore API call → property reappears ✅

### Debug Cleanup

No `console.time`, `console.timeEnd`, or `DASHBOARD_LOAD` logs remain.

## Smoke Test Status: ✅ PASS
````
