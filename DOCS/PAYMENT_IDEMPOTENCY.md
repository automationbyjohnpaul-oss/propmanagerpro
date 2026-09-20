# Payment creation idempotency - D-039

Date: September 19, 2026.

Status: backend and compatible frontend recovery implemented locally; uncommitted. Migration applied ONLY to localhost:5432/propmanagerpro_test, Prisma Client regenerated. Automated checks pass; real-browser acceptance and deployment review remain pending. PROJECT_STATE.md owns operational status.

## Scope and evidence

Payment creation only. D-038 atomicity is committed at `28a2a6d` (82/82 backend tests and backend source type check passed at that checkpoint). No active-lease requirement, refund workflow, payment status transitions, or broad payment uniqueness is introduced.

A local experiment on Prisma 6.19.3/PostgreSQL 18.6 used independent clients and the existing User email unique constraint. It observed blocking through `pg_blocking_pids` before releasing the first transaction. Commit, rollback, and 1500ms lock timeout were exercised through both model and parameterized raw inserts; all six cases passed and their UUID-scoped fixtures were removed. Model unique conflicts expose P2002 with target fields, but model lock timeout exposes an unknown-request error with SQLSTATE only in its message. Raw inserts expose P2010 with structured `meta.code` 23505 or 55P03. This is evidence about error transport, not payment idempotency coverage or production verification.

## Request and fingerprint contract

Require a UUID `Idempotency-Key` for POST payment creation; missing/malformed keys return 400. Ownership always comes from authenticated `req.userId`. Distinct keys permit identical legitimate payments. Backend and frontend must be released compatibly; old keyless clients will be rejected once enforcement ships.

Version 1 fingerprint: SHA-256 of a deterministic fixed-order representation of validated accepted fields. Exclude discarded unknown fields. Do not hash raw JSON property order or current payment state.

| Field | Rule |
| --- | --- |
| amount | Canonical decimal string of the validated numeric input, no rounding; no new currency precision policy |
| paymentDate | Tagged omitted state, or tagged UTC ISO timestamp |
| status | Resolve omission to pending, as today |
| method, leaseId, tenantId | Exact validated values |
| reference, notes | Preserve whitespace; tag omission separately from empty string |

The date default has been removed from the Zod create validator: validation replaces req.body, so omission now survives parsing. Service resolves the omitted date only after the claim. An omitted date versus an explicit timestamp equal to the first resolved date is a payload mismatch. Invalid values remain subject to existing validation. Historical fingerprint versions must remain available while their records exist; unsupported versions stop with an integrity error, not a new creation.

## Persistence and transaction order

PaymentCreateRequest has composite primary key `(userId, requestKey)`, fingerprint/version, nullable unique paymentId, nullable responseStatus/responseBody, and createdAt. User and Payment foreign keys use ON DELETE RESTRICT. No automatic expiry, backfill, or modification to existing payment columns. Existing payments can lack a creation request.

The completion fields are nullable to support a claim before payment creation. The schema does not enforce complete-at-commit; the workflow must finalize and verify all fields before returning from the transaction. The foreign keys also do not prove that the request user owns the linked payment; service authorization remains necessary.

1. Authenticate, validate syntax/key and build fingerprint before the transaction.
2. Start transaction; read current_setting('lock_timeout').
3. Set short transaction-local timeout with parameterized set_config(..., true).
4. First data write: parameterized raw request-record INSERT, omitting completion fields.
5. On successful claim, restore the captured timeout with transaction-local set_config. TO DEFAULT is not equivalent to restoring a session override.
6. Run existing ownership/relationship/business checks with the same client.
7. Create payment and CREATE_PAYMENT audit with that client.
8. Store JSON-serialized original 201 response and payment link; verify completeness, then commit.
9. Send response only after commit.

On error let the transaction roll back before any replay lookup. No network side effects or automatic server retry loop. Fresh client-driven requests retain the key and original details; every transaction repeats timeout setup. Initial proposed settings: claim lock_timeout 2 seconds, Prisma transaction timeout 10 seconds, Retry-After 2 seconds for claim timeout. These are local starting settings, not production performance evidence; deployment statement/transaction/proxy limits need checking. lock_timeout is per lock acquisition, not a total HTTP deadline.

Classify errors only at the claim INSERT. P2010/23505 triggers a user/key-scoped lookup after rollback; an absent record must not be treated as a replay or permission to create. Other unique constraints/errors remain distinct. P2010/55P03 at that insert means a lock wait failed, not proof of same-key contention. Errors setting/restoring timeout or during business writes do not become claim-timeout errors.

## Replay and response branches

After rollback, authenticate/scope lookup to the user. Verify completion and supported fingerprint version; verify current access through Payment -> Lease -> Property.userId with Property.deletedAt = null. Missing/inaccessible payment never causes replacement creation. Then compare fingerprint and return the stored response or conflict. Do not rerun creation eligibility on committed replay; no active-lease requirement is added.

| Condition | Response / browser action |
| --- | --- |
| Missing/malformed key | 400; no writes |
| Authorized matching completed request | Original 201/body; no new payment or audit |
| Changed accepted details | 409 IDEMPOTENCY_PAYLOAD_MISMATCH; preserve key/evidence |
| Claim lock timeout | 503 IDEMPOTENCY_CLAIM_TIMEOUT, Retry-After: 2; preserve key/details |
| Null/missing paymentId, responseStatus other than 201, null/malformed responseBody or mismatched response payment ID | 500 IDEMPOTENCY_RECORD_INCOMPLETE; investigation; no new submission/key |
| Unsupported fingerprint version | 500 IDEMPOTENCY_FINGERPRINT_VERSION_UNSUPPORTED; investigation; preserve attempt |
| Claim uniqueness error but no matching committed request | 500 IDEMPOTENCY_RECORD_MISSING; investigation; preserve attempt |
| Current access denied | 404; no replacement payment |
| Other database/transaction/connection failure | Existing appropriate error path; outcome may be uncertain, preserve attempt |

Replay returns creation-time state even if a permitted later edit changed the payment. Retrieve current state separately. Do not log full payment payloads, stored responses, or credentials in integrity diagnostics. Record the request correlation, phase, and error code; mismatch diagnostics are not successful financial mutation audit entries.

## Browser recovery and retention

The browser behavior below is implemented in paymentRecovery.ts and the payment creation page. Backend key enforcement must not be deployed independently of the compatible client. Automated recovery tests simulate browser primitives; real-browser acceptance remains pending.

Successful server request records persist with payment history, no TTL. Unresolved browser attempts persist under the user identity, including key, original submitted details and format version. Restore for review, never auto-submit, auto-expire, silently overwrite, or silently generate a replacement key. Persist before sending; if persistence fails, do not send an untracked attempt. Multiple tabs must not overwrite different unresolved attempts. A successful response must be valid before clearing recovery state (the current API client can resolve null on a malformed success body, so implementation must handle this).

Scope restored attempts to the signed-in user; never expose them to another account. Logout/401 must not silently discard unresolved evidence. Clear only on confirmed resolution or explicit reconciliation. Unknown network/commit outcomes retain the original immutable payload/key. Validation rejections require review/reconciliation before correction; no automatic replacement key is issued. Browser storage can be manually cleared and is not durable server provenance.

Implementation: one storage record per user/key, versioned immutable accepted fields, with no TTL. Existing unresolved records block a fresh attempt. Web Locks serialize preparation, fetch/retry and reconciliation per user across same-origin tabs; missing Web Locks or storage support fails before submission. This requires a supporting browser and secure context (HTTPS or trusted localhost); see [Web Locks request semantics](https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request). Different browsers/devices do not share local recovery. The server remains the authority for key uniqueness.

After a validated confirmation or explicit user reconciliation, write/read-back a minimal resolution marker before removing payment details. Markers have no expiry and win over stale payloads; malformed markers/payloads stop recovery for investigation. Integrity/version/mismatch errors and 400 rejection preserve a separate review-required flag; transient errors remain retryable with the same saved payload. The page never edits a saved attempt or automatically submits it. A 503 countdown reads Retry-After (exposed through CORS), then enables a manual retry. Reconciliation requires choosing an outcome and confirming records were checked and no request is still processing; it does not alter server payment data.

Frontend automated evidence: 25/25 Node recovery tests, targeted ESLint and production build (including types) pass. Backend now passes 120/120 tests across 9 files with the CORS additions. Actual browser restart/multi-tab behavior, mobile/keyboard UX and full JWT end-to-end remain acceptance work, not claims established by the simulated tests.

## Backend regression evidence

`backend/tests/integration/payment.controller.test.ts` now contains 41 passing tests covering the contract areas below. Full backend suite: 118/118 across 8 files; backend source and integration-test type checks passed. Three initial red cases established missing same-key/mismatch/key enforcement before implementation. Concurrent commit, rollback and timeout tests observe blocking via pg_blocking_pids before release; they do not assume contention from timing alone. Timeout restoration uses a dedicated single-connection client with a nondefault session setting. Corrupted-record and later-error classification branches use scoped failure injection; this is not a claim that every possible database failure was reproduced. JWT identity is supplied by the HTTP harness. No production or browser-recovery verification.

Migration was applied only after verifying the explicitly local database and single pending migration. Tests clean only their own UUID-scoped fixtures, removing request records before referenced payments/users. These checks use PostgreSQL 18.6/Prisma 6.19.3; model RESTRICT delete errors can be unknown-request errors (SQLSTATE 23001), so tests assert rejected deletes and retained records rather than an assumed P2003 mapping.

| ID | Case and required evidence |
| --- | --- |
| I01 | New key commits exactly one complete request, payment, audit; response matches stored JSON |
| I02 | Same user/key/details replays identical 201/body without new writes |
| I03 | Same key/changed details conflicts without mutations |
| I04 | New keys with identical fields create distinct legitimate payments |
| I05 | Same key across two owners is independent; no cross-user disclosure |
| I06 | Concurrent duplicate after first commit replays; counts remain one |
| I07 | First transaction rollback lets blocked claimant proceed; one final set of records |
| I08 | Held claim exceeds timeout; structured 503/Retry-After, no contender writes; same-key retry after first commit replays |
| I09 | Payment/audit/finalization failure rolls back request, payment and audit; key is reusable |
| I10 | Omitted date repeated replays original timestamp; omitted versus explicit conflicts |
| I11 | Equivalent explicit date instants and numeric representations match; whitespace and absent/empty rules behave as specified |
| I12 | Missing/malformed key and invalid input create no records |
| I13 | Wrong-owner/mismatched-tenant business rejection leaves no claim/payment/audit |
| I14 | Archived property or changed ownership denies replay without replacement |
| I15 | Later permitted payment edit leaves replay response original; no update/audit caused by replay |
| I16 | Inject each incomplete committed-record state; distinct integrity error, no writes |
| I17 | Unsupported fingerprint version or missing lookup after unique error fails closed |
| I18 | Nondefault timeout restored after successful claim; rollback restores connection setting; later lock errors not classified as claim contention |
| I19 | Claim errors other than expected codes retain normal error handling |
| I20 | Existing payment authorization, validation, immutability and D-038 atomicity regressions remain passing |
| I21 | Existing payments need no backfill; uniqueness/FK restrictions hold in the new table |

Frontend recovery verification is also required: reload/restart, lost response, multiple tabs, account switch/logout, storage failure, malformed success body, corrected definitive rejection, and explicit new legitimate payment. Do not call H1 idempotency complete on backend tests alone.
