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
```
