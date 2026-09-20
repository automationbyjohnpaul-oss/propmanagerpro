# Payment verification - September 19, 2026

Latest checkpoint: full backend `npm test` passes 120/120 across 9 files, including 41 payment HTTP/database cases and 2 real-application CORS tests for Idempotency-Key preflight/Retry-After exposure. Backend source TypeScript passes. From frontend, `npm run test:payments` passes 25/25 Node tests, targeted lint of changed frontend files passes, and `npm run build` passes including TypeScript.

The frontend test runner uses existing TypeScript and Node (no new dependencies), compiles recovery/API modules into a guarded temporary directory, then tests mocked fetch, storage and lock coordination. Cases cover lost responses, module reload without submission, no expiry, exact retry payload/key, storage failures/corruption, malformed success, account changes/401, concurrent actions, blocked integrity/mismatch responses, explicit reconciliation and stale resolution markers. These tests do not run a browser or prove browser Web Locks behavior.

Required next acceptance pass in a real browser against an isolated local test backend: submit then lose the response; reload/restart and confirm no automatic POST; retry and check one payment/audit; use two tabs concurrently; switch accounts/logout and restore the original attempt; test disabled/full storage; observe 503 countdown; resolve a definitively rejected attempt and submit corrected details as a deliberate new payment. Verify mobile layout and keyboard interaction. Keep production data out of this pass.

The backend-only checkpoint below is historical evidence preceding the CORS addition:

Full backend `npm test`: 118/118 tests across 8 files. `tests/integration/payment.controller.test.ts` contains 41 HTTP/database cases, including actual blocked concurrent requests, rollback/replay, corruption, current-access denial and fingerprint semantics. See [contract matrix and evidence limits](PAYMENT_IDEMPOTENCY.md#backend-regression-evidence). Backend source and the integration test also passed TypeScript checks.

Run from backend against the guarded localhost/propmanagerpro_test database; its 15 migrations include payment_create_requests. `npm run test:unit` excludes the integration file and is not sufficient for this feature. The HTTP harness supplies authenticated identity; JWT, frontend recovery and production are not established by these results. The Vite module-format warning remains.

The following smoke-test notes are historical, not fresh verification for this change:

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
