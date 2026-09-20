import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../../src/lib/prisma";
import paymentRouter from "../../src/routes/payment.routes";
import { errorMiddleware } from "../../src/middleware/error.middleware";
import * as auditService from "../../src/services/audit.service";
import * as paymentService from "../../src/services/payment.service";
import * as requestService from "../../src/services/paymentRequest.service";
import * as errorLogger from "../../src/lib/errorLogger";

// Real routes, validation, controller, services, error middleware and PostgreSQL.
// Authentication is supplied by this harness; JWT verification is outside scope.
describe("Payment creation HTTP/database atomicity", () => {
  const userId = randomUUID();
  const propertyId = randomUUID();
  const tenantId = randomUUID();
  const unitId = randomUUID();
  const leaseId = randomUUID();
  let server: Server | undefined;
  let baseUrl: string;
  const originalCreateAuditLog = auditService.createAuditLog;
  const originalCreatePayment = paymentService.createPayment;
  const originalComplete = requestService.completePaymentRequest;
  const otherUserId = randomUUID();
  const otherPropertyId = randomUUID();
  const otherTenantId = randomUUID();
  const otherUnitId = randomUUID();
  const otherLeaseId = randomUUID();

  beforeAll(async () => {
    await prisma.user.create({
      data: { id: userId, email: `atomicity-${userId}@example.com`, password: "hashed", name: "Atomicity test" },
    });
    await prisma.property.create({
      data: { id: propertyId, name: "Atomicity test", address: "1 Test Street", city: "Test", state: "TS", zip: "12345", unitCount: 1, userId },
    });
    await prisma.unit.create({
      data: { id: unitId, unitNumber: "1", propertyId, bedrooms: 1, bathrooms: 1, rentAmount: 1000 },
    });
    await prisma.tenant.create({
      data: { id: tenantId, firstName: "Test", lastName: "Tenant", email: `tenant-${tenantId}@example.com`, userId },
    });
    await prisma.lease.create({
      data: { id: leaseId, propertyId, unitId, tenantId, startDate: new Date("2026-01-01"), endDate: new Date("2027-01-01"), monthlyRent: 1000, securityDeposit: 1000 },
    });

    await prisma.user.create({ data: { id: otherUserId, email: `atomicity-${otherUserId}@example.com`, password: "hashed", name: "Other owner" } });
    await prisma.property.create({ data: { id: otherPropertyId, name: "Other property", address: "2 Test St", city: "Test", state: "TS", zip: "12345", unitCount: 1, userId: otherUserId } });
    await prisma.unit.create({ data: { id: otherUnitId, unitNumber: "1", propertyId: otherPropertyId, bedrooms: 1, bathrooms: 1, rentAmount: 1000 } });
    await prisma.tenant.create({ data: { id: otherTenantId, firstName: "Other", lastName: "Tenant", email: `tenant-${otherTenantId}@example.com`, userId: otherUserId } });
    await prisma.lease.create({ data: { id: otherLeaseId, propertyId: otherPropertyId, unitId: otherUnitId, tenantId: otherTenantId, startDate: new Date("2026-01-01"), endDate: new Date("2027-01-01"), monthlyRent: 1000, securityDeposit: 1000 } });

    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      // Test-only identity switch, not an application authentication mechanism.
      Object.assign(req, { userId: req.get("X-Test-Owner") === "other" ? otherUserId : userId });
      next();
    });
    app.use("/payments", paymentRouter);
    app.use(errorMiddleware);
    await new Promise<void>((resolve, reject) => {
      server = app.listen(0, "127.0.0.1", () => resolve());
      server.once("error", reject);
    });
    baseUrl = `http://127.0.0.1:${(server!.address() as AddressInfo).port}`;
  });

  afterEach(() => vi.restoreAllMocks());
  beforeEach(() => vi.spyOn(errorLogger, "logError").mockImplementation(() => {}));

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((error) => error ? reject(error) : resolve());
        server!.closeAllConnections();
      });
    }
    // Only this suite's UUID-scoped fixtures in the guarded local test database.
    await prisma.paymentCreateRequest.deleteMany({ where: { userId: otherUserId } });
    await prisma.auditLog.deleteMany({ where: { userId: otherUserId } });
    await prisma.payment.deleteMany({ where: { leaseId: otherLeaseId } });
    await prisma.lease.deleteMany({ where: { id: otherLeaseId } });
    await prisma.tenant.deleteMany({ where: { id: otherTenantId } });
    await prisma.unit.deleteMany({ where: { id: otherUnitId } });
    await prisma.property.deleteMany({ where: { id: otherPropertyId } });
    await prisma.user.deleteMany({ where: { id: otherUserId } });
    await prisma.paymentCreateRequest.deleteMany({ where: { userId } });
    await prisma.auditLog.deleteMany({ where: { userId } });
    await prisma.payment.deleteMany({ where: { leaseId } });
    await prisma.lease.deleteMany({ where: { id: leaseId } });
    await prisma.tenant.deleteMany({ where: { id: tenantId } });
    await prisma.unit.deleteMany({ where: { id: unitId } });
    await prisma.property.deleteMany({ where: { id: propertyId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  function postPayment(reference: string, overrides: Record<string, unknown> = {}, key: string | null = randomUUID(), other = false) {
    return fetch(`${baseUrl}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(key === null ? {} : { "Idempotency-Key": key }), ...(other ? { "X-Test-Owner": "other" } : {}) },
      body: JSON.stringify({ amount: 1000, method: "cash", status: "completed", leaseId, tenantId, reference, ...overrides }),
    });
  }

  it("returns 201 only with both payment and matching audit committed", async () => {
    const response = await postPayment(randomUUID());
    const body = await response.json();
    expect(response.status).toBe(201);
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: body.id } });
    expect(Number(payment.amount)).toBe(1000);
    expect(payment.status).toBe("completed");
    expect(body.lease.id).toBe(leaseId);
    expect(body.tenant.id).toBe(tenantId);
    const audits = await prisma.auditLog.findMany({ where: { userId, entityId: payment.id } });
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({ action: "CREATE_PAYMENT", entity: "Payment" });
    expect(audits[0].metadata).toMatchObject({ amount: 1000, method: "cash", status: "completed", leaseId, tenantId, paymentDate: payment.paymentDate.toISOString() });
  });

  it("returns 500 and rolls back the payment when the audit insert fails", async () => {
    const reference = randomUUID();
    let attemptedPaymentId: string | undefined;
    const spy = vi.spyOn(auditService, "createAuditLog").mockImplementationOnce(async (...args) => {
      attemptedPaymentId = args[3];
      // Force a real foreign-key failure in the audit write, using its supplied client.
      const [, action, entity, entityId, metadata, tx] = args;
      return originalCreateAuditLog(randomUUID(), action, entity, entityId, metadata, tx);
    });
    const response = await postPayment(reference);
    await response.json();
    expect(response.status).toBe(500);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(attemptedPaymentId).toBeDefined();
    expect(await prisma.payment.count({ where: { leaseId, reference } })).toBe(0);
    expect(await prisma.auditLog.count({ where: { entityId: attemptedPaymentId! } })).toBe(0);
  });

  it("rolls back both writes when an error occurs after the audit insert", async () => {
    const reference = randomUUID();
    let attemptedPaymentId: string | undefined;
    vi.spyOn(auditService, "createAuditLog").mockImplementationOnce(async (...args) => {
      attemptedPaymentId = args[3];
      await originalCreateAuditLog(...args);
      throw new Error("Injected failure after audit insert");
    });
    const response = await postPayment(reference);
    await response.json();
    expect(response.status).toBe(500);
    expect(attemptedPaymentId).toBeDefined();
    expect(await prisma.payment.count({ where: { leaseId, reference } })).toBe(0);
    expect(await prisma.auditLog.count({ where: { entityId: attemptedPaymentId! } })).toBe(0);
  });

  it("does not write payment or audit when lease access is rejected", async () => {
    const reference = randomUUID();
    const spy = vi.spyOn(auditService, "createAuditLog");
    const response = await postPayment(reference, { leaseId: randomUUID() });
    await response.json();
    expect(response.ok).toBe(false);
    expect(spy).not.toHaveBeenCalled();
    expect(await prisma.payment.count({ where: { reference } })).toBe(0);
  });

  it("preserves request validation before payment and audit writes", async () => {
    const reference = randomUUID();
    const spy = vi.spyOn(auditService, "createAuditLog");
    const response = await postPayment(reference, { amount: -1 });
    await response.json();
    expect(response.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
    expect(await prisma.payment.count({ where: { leaseId, reference } })).toBe(0);
  });

  it("replays the original result for the same key and omitted date without another payment or audit", async () => {
    const key = randomUUID();
    const reference = randomUUID();
    const first = await postPayment(reference, {}, key);
    const body = await first.json();
    expect(first.status).toBe(201);
    const second = await postPayment(reference, {}, key);
    expect(second.status).toBe(201);
    expect(await second.json()).toEqual(body);
    expect(await prisma.payment.count({ where: { leaseId, reference } })).toBe(1);
    expect(await prisma.auditLog.count({ where: { userId, entityId: body.id } })).toBe(1);
    const request = await prisma.paymentCreateRequest.findUniqueOrThrow({ where: { userId_requestKey: { userId, requestKey: key } } });
    expect(request.paymentId).toBe(body.id);
    expect(request.responseStatus).toBe(201);
    expect(request.responseBody).toEqual(body);
  });

  it("rejects same-key changed details without creating another payment", async () => {
    const key = randomUUID();
    const reference = randomUUID();
    await (await postPayment(reference, {}, key)).json();
    const response = await postPayment(reference, { amount: 1001 }, key);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "IDEMPOTENCY_PAYLOAD_MISMATCH" });
    expect(await prisma.payment.count({ where: { leaseId, reference } })).toBe(1);
  });

  it("rejects a missing idempotency key before any write", async () => {
    const reference = randomUUID();
    const response = await postPayment(reference, {}, null);
    expect(response.status).toBe(400);
    await response.json();
    expect(await prisma.payment.count({ where: { leaseId, reference } })).toBe(0);
  });

  it("allows distinct keys for otherwise identical legitimate payments", async () => {
    const reference = randomUUID();
    const input = { paymentDate: "2026-09-19T00:00:00.000Z" };
    const first = await (await postPayment(reference, input)).json();
    const second = await (await postPayment(reference, input)).json();
    expect(second.id).not.toBe(first.id);
    expect(await prisma.payment.count({ where: { leaseId, reference } })).toBe(2);
  });

  it("scopes the same key to each owner and never replays the other owner's result", async () => {
    const key = randomUUID();
    const reference = randomUUID();
    const first = await (await postPayment(reference, {}, key)).json();
    const other = await postPayment(reference, { leaseId: otherLeaseId, tenantId: otherTenantId }, key, true);
    const second = await other.json();
    expect(other.status).toBe(201);
    expect(second.id).not.toBe(first.id);
    expect(second.tenant.userId).toBe(otherUserId);
    const wrongOwner = await postPayment(reference, {}, key, true);
    expect(wrongOwner.status).toBe(409);
    expect(await wrongOwner.json()).not.toHaveProperty("id");
    expect(await prisma.paymentCreateRequest.count({ where: { requestKey: key } })).toBe(2);
  });

  it("treats an omitted date and the original resolved timestamp as different details", async () => {
    const key = randomUUID();
    const reference = randomUUID();
    const first = await (await postPayment(reference, {}, key)).json();
    const replay = await postPayment(reference, { paymentDate: first.paymentDate }, key);
    expect(replay.status).toBe(409);
    expect(await replay.json()).toMatchObject({ code: "IDEMPOTENCY_PAYLOAD_MISMATCH" });
  });

  it("normalizes explicit date instants, numbers and default status, and ignores discarded fields", async () => {
    const key = randomUUID();
    const reference = randomUUID();
    const first = await (await postPayment(reference, { paymentDate: "2026-09-19T00:00:00Z", status: undefined, amount: 1000.0 }, key)).json();
    const replay = await postPayment(reference, { paymentDate: "2026-09-19T01:00:00+01:00", status: "pending", ignored: "discarded" }, key.toUpperCase());
    expect(replay.status).toBe(201);
    expect(await replay.json()).toEqual(first);
  });

  it.each([
    [{ notes: undefined }, { notes: "" }],
    [{ notes: "note" }, { notes: " note " }],
    [{ reference: undefined }, { reference: "" }],
    [{ reference: "ref" }, { reference: "ref " }],
    [{ amount: 0.3 }, { amount: 0.1 + 0.2 }],
  ])("preserves exact accepted-field semantics without trimming or rounding (%j)", async (initial, changed) => {
    const key = randomUUID();
    const reference = randomUUID();
    expect((await postPayment(reference, initial, key)).status).toBe(201);
    const response = await postPayment(reference, changed, key);
    expect(response.status).toBe(409);
    await response.json();
  });

  it("rejects malformed keys and invalid input without claiming a key", async () => {
    const reference = randomUUID();
    const badKey = await postPayment(reference, {}, "not-a-uuid");
    expect(badKey.status).toBe(400);
    expect(await badKey.json()).toMatchObject({ code: "IDEMPOTENCY_KEY_INVALID" });
    const key = randomUUID();
    const badData = await postPayment(reference, { amount: -1 }, key);
    expect(badData.status).toBe(400);
    await badData.json();
    expect(await prisma.paymentCreateRequest.count({ where: { userId, requestKey: key } })).toBe(0);
  });

  it("claims before business writes and releases the key on wrong-owner or tenant rejection", async () => {
    const key = randomUUID();
    const reference = randomUUID();
    vi.spyOn(paymentService, "createPayment").mockImplementationOnce(async (...args) => {
      expect(await args[2]!.paymentCreateRequest.count({ where: { userId, requestKey: key } })).toBe(1);
      expect(await args[2]!.payment.count({ where: { leaseId, reference } })).toBe(0);
      return originalCreatePayment(...args);
    });
    expect((await postPayment(reference, { leaseId: otherLeaseId }, key)).status).toBe(500);
    expect(await prisma.paymentCreateRequest.count({ where: { userId, requestKey: key } })).toBe(0);
    expect((await postPayment(reference, { tenantId: otherTenantId }, key)).status).toBe(500);
    expect(await prisma.paymentCreateRequest.count({ where: { userId, requestKey: key } })).toBe(0);
    const mismatchTenant = randomUUID();
    try {
      await prisma.tenant.create({ data: { id: mismatchTenant, firstName: "Mismatch", lastName: "Tenant", email: `mismatch-${mismatchTenant}@example.com`, userId } });
      expect((await postPayment(reference, { tenantId: mismatchTenant }, key)).status).toBe(500);
      expect(await prisma.paymentCreateRequest.count({ where: { userId, requestKey: key } })).toBe(0);
    } finally { await prisma.tenant.deleteMany({ where: { id: mismatchTenant } }); }
    expect((await postPayment(reference, {}, key)).status).toBe(201);
  });

  it.each(["audit", "finalization"])("rolls back all three records on %s failure and permits same-key recovery", async failure => {
    const key = randomUUID();
    const reference = randomUUID();
    if (failure === "audit") {
      vi.spyOn(auditService, "createAuditLog").mockImplementationOnce(async (...args) => {
        await originalCreateAuditLog(...args);
        throw new Error("Injected audit failure");
      });
    } else {
      vi.spyOn(requestService, "completePaymentRequest").mockImplementationOnce(async (...args) => {
        // A malformed stored response must fail finalization, rolling back audit/payment too.
        const [tx, owner, requestKey, paymentId] = args;
        return originalComplete(tx, owner, requestKey, paymentId, {});
      });
    }
    const auditCount = await prisma.auditLog.count({ where: { userId } });
    const failureResponse = await postPayment(reference, {}, key);
    expect(failureResponse.status).toBe(500);
    if (failure === "finalization") expect(await failureResponse.json()).toMatchObject({ code: "IDEMPOTENCY_RECORD_INCOMPLETE" });
    else await failureResponse.json();
    expect(await prisma.paymentCreateRequest.count({ where: { userId, requestKey: key } })).toBe(0);
    expect(await prisma.payment.count({ where: { leaseId, reference } })).toBe(0);
    expect(await prisma.auditLog.count({ where: { userId } })).toBe(auditCount);
    expect((await postPayment(reference, {}, key)).status).toBe(201);
  });

  it.each(["archived", "reassigned"])("denies replay when the property is %s without replacement creation", async change => {
    const key = randomUUID();
    const reference = randomUUID();
    const first = await (await postPayment(reference, {}, key)).json();
    try {
      await prisma.property.update({ where: { id: propertyId }, data: change === "archived" ? { deletedAt: new Date() } : { userId: otherUserId } });
      const response = await postPayment(reference, {}, key);
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({ code: "PAYMENT_NOT_FOUND" });
      expect(await prisma.payment.count({ where: { leaseId, reference } })).toBe(1);
      expect(await prisma.auditLog.count({ where: { entityId: first.id } })).toBe(1);
    } finally { await prisma.property.update({ where: { id: propertyId }, data: { userId, deletedAt: null } }); }
  });

  it("replays the historical response after a permitted edit and a changed lease status", async () => {
    const key = randomUUID();
    const reference = randomUUID();
    const first = await (await postPayment(reference, { status: "pending" }, key)).json();
    await paymentService.updatePayment(first.id, userId, { reference: "corrected" });
    try {
      await prisma.lease.update({ where: { id: leaseId }, data: { status: "ENDED" } });
      const response = await postPayment(reference, { status: "pending" }, key);
      expect(response.status).toBe(201);
      expect(await response.json()).toEqual(first);
      expect((await prisma.payment.findUniqueOrThrow({ where: { id: first.id } })).reference).toBe("corrected");
      expect(await prisma.auditLog.count({ where: { entityId: first.id } })).toBe(1);
    } finally { await prisma.lease.update({ where: { id: leaseId }, data: { status: "PENDING" } }); }
  });

  it.each(["paymentId", "responseStatus", "bodyNull", "bodyJsonNull", "bodyEmpty", "bodyId", "bodyFields", "fingerprint"])("fails closed for corrupted committed record: %s", async corruption => {
    const key = randomUUID();
    const reference = randomUUID();
    const first = await (await postPayment(reference, {}, key)).json();
    const data: Prisma.PaymentCreateRequestUpdateInput =
      corruption === "paymentId" ? { payment: { disconnect: true } } :
      corruption === "responseStatus" ? { responseStatus: null } :
      corruption === "bodyNull" ? { responseBody: Prisma.DbNull } :
      corruption === "bodyJsonNull" ? { responseBody: Prisma.JsonNull } :
      corruption === "bodyEmpty" ? { responseBody: {} } :
      corruption === "bodyId" ? { responseBody: { ...first, id: randomUUID() } } :
      corruption === "bodyFields" ? { responseBody: { id: first.id } } :
      { requestFingerprint: "invalid" };
    await prisma.paymentCreateRequest.update({ where: { userId_requestKey: { userId, requestKey: key } }, data });
    // Changed details must not mask record corruption as an ordinary conflict.
    const response = await postPayment(reference, { amount: 1001 }, key);
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ code: "IDEMPOTENCY_RECORD_INCOMPLETE" });
    expect(await prisma.payment.count({ where: { leaseId, reference } })).toBe(1);
    expect(await prisma.auditLog.count({ where: { entityId: first.id } })).toBe(1);
    expect(errorLogger.logError).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ code: "IDEMPOTENCY_RECORD_INCOMPLETE", phase: "replay" }));
  });

  it("rejects unsupported fingerprint versions without a new payment", async () => {
    const key = randomUUID();
    const reference = randomUUID();
    await (await postPayment(reference, {}, key)).json();
    await prisma.paymentCreateRequest.update({ where: { userId_requestKey: { userId, requestKey: key } }, data: { fingerprintVersion: 99 } });
    const response = await postPayment(reference, {}, key);
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ code: "IDEMPOTENCY_FINGERPRINT_VERSION_UNSUPPORTED" });
    expect(await prisma.payment.count({ where: { leaseId, reference } })).toBe(1);
  });

  it("fails closed when the committed record cannot be found after a claim conflict", async () => {
    const key = randomUUID();
    const reference = randomUUID();
    await (await postPayment(reference, {}, key)).json();
    vi.spyOn(prisma.paymentCreateRequest, "findUnique").mockResolvedValueOnce(null);
    const response = await postPayment(reference, {}, key);
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ code: "IDEMPOTENCY_RECORD_MISSING" });
    expect(await prisma.payment.count({ where: { leaseId, reference } })).toBe(1);
  });

  function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(done => { resolve = done; });
    return { promise, resolve };
  }

  async function waitForBlockedRequest(holderPid: number) {
    for (let attempt = 0; attempt < 75; attempt++) {
      const [result] = await prisma.$queryRaw<{ blocked: boolean }[]>`
        SELECT EXISTS (
          SELECT 1 FROM pg_stat_activity
          WHERE ${holderPid}::int = ANY(pg_blocking_pids(pid))
        ) AS blocked
      `;
      if (result.blocked) return;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error("Did not observe contender blocked on the holder");
  }

  it.each(["commit", "rollback", "timeout"])("handles an actually blocked duplicate when the first request outcome is %s", async outcome => {
    const key = randomUUID();
    const reference = randomUUID();
    const ready = deferred<number>();
    const release = deferred<void>();
    vi.spyOn(paymentService, "createPayment").mockImplementationOnce(async (...args) => {
      const payment = await originalCreatePayment(...args);
      const [backend] = await args[2]!.$queryRaw<{ pid: number }[]>`SELECT pg_backend_pid() AS pid`;
      ready.resolve(backend.pid);
      await release.promise;
      if (outcome === "rollback") throw new Error("Intentional first-request rollback");
      return payment;
    });
    const first = postPayment(reference, {}, key);
    let second: Promise<globalThis.Response> | undefined;
    try {
      const pid = await Promise.race([ready.promise, first.then(() => { throw new Error("First request ended before barrier"); })]);
      second = postPayment(reference, {}, key);
      await waitForBlockedRequest(pid);
      if (outcome === "timeout") {
        const timedOut = await second;
        expect(timedOut.status).toBe(503);
        expect(timedOut.headers.get("Retry-After")).toBe("2");
        expect(await timedOut.json()).toMatchObject({ code: "IDEMPOTENCY_CLAIM_TIMEOUT" });
        expect(await prisma.paymentCreateRequest.count({ where: { userId, requestKey: key } })).toBe(0);
      }
      release.resolve();
      const firstResponse = await first;
      const firstBody = await firstResponse.json();
      const secondResponse = outcome === "timeout" ? await postPayment(reference, {}, key) : await second;
      const secondBody = await secondResponse.json();
      expect(firstResponse.status).toBe(outcome === "rollback" ? 500 : 201);
      expect(secondResponse.status).toBe(201);
      if (outcome !== "rollback") expect(secondBody).toEqual(firstBody);
      expect(await prisma.payment.count({ where: { leaseId, reference } })).toBe(1);
      expect(await prisma.paymentCreateRequest.count({ where: { userId, requestKey: key } })).toBe(1);
      expect(await prisma.auditLog.count({ where: { entityId: secondBody.id } })).toBe(1);
    } finally {
      release.resolve();
      await Promise.allSettled([first, ...(second ? [second] : [])]);
    }
  }, 15_000);

  it("preserves the previous timeout after claim and the session setting after rollback", async () => {
    const url = new URL(process.env.DATABASE_URL!);
    expect(url.hostname).toBe("localhost");
    expect(url.pathname).toBe("/propmanagerpro_test");
    url.searchParams.set("connection_limit", "1");
    const client = new PrismaClient({ datasources: { db: { url: url.toString() } } });
    const key = randomUUID();
    const marker = new Error("Rollback timeout fixture");
    try {
      await client.$queryRaw`SELECT set_config('lock_timeout', '7s', false)`;
      await expect(client.$transaction(async tx => {
        await requestService.claimPaymentRequest(tx, userId, key, "a".repeat(64));
        const [setting] = await tx.$queryRaw<{ value: string }[]>`SELECT current_setting('lock_timeout') AS value`;
        expect(setting.value).toBe("7s");
        throw marker;
      })).rejects.toBe(marker);
      const [setting] = await client.$queryRaw<{ value: string }[]>`SELECT current_setting('lock_timeout') AS value`;
      expect(setting.value).toBe("7s");
      expect(await prisma.paymentCreateRequest.count({ where: { userId, requestKey: key } })).toBe(0);
    } finally { await client.$disconnect(); }
  });

  it("does not classify a later write's 55P03 as claim contention", async () => {
    const key = randomUUID();
    const reference = randomUUID();
    vi.spyOn(auditService, "createAuditLog").mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("Later lock failure", { code: "P2010", clientVersion: Prisma.prismaVersion.client, meta: { code: "55P03" } }));
    const response = await postPayment(reference, {}, key);
    expect(response.status).toBe(500);
    expect(response.headers.get("Retry-After")).toBeNull();
    expect(await response.json()).not.toMatchObject({ code: "IDEMPOTENCY_CLAIM_TIMEOUT" });
    expect(await prisma.paymentCreateRequest.count({ where: { userId, requestKey: key } })).toBe(0);
    expect(await prisma.payment.count({ where: { leaseId, reference } })).toBe(0);
  });

  it("preserves foreign-key claim errors instead of treating them as a duplicate", async () => {
    await expect(prisma.$transaction(tx => requestService.claimPaymentRequest(tx, randomUUID(), randomUUID(), "a".repeat(64))))
      .rejects.toMatchObject({ code: "P2010", meta: { code: "23503" } });
  });

  it("retains legacy payments without a request and enforces provenance foreign keys and uniqueness", async () => {
    const legacy = await paymentService.createPayment(userId, { amount: 1, method: "cash", leaseId, tenantId });
    expect(await prisma.paymentCreateRequest.count({ where: { paymentId: legacy.id } })).toBe(0);
    const key = randomUUID();
    const first = await (await postPayment(randomUUID(), {}, key)).json();
    // PostgreSQL 18 RESTRICT may surface as an unknown Prisma error (SQLSTATE 23001).
    // Assert the persistence invariant rather than relying on that error mapping.
    await expect(prisma.payment.delete({ where: { id: first.id } })).rejects.toBeInstanceOf(Error);
    expect(await prisma.payment.findUnique({ where: { id: first.id } })).not.toBeNull();
    await expect(prisma.user.delete({ where: { id: userId } })).rejects.toBeInstanceOf(Error);
    expect(await prisma.user.findUnique({ where: { id: userId } })).not.toBeNull();
    await expect(prisma.paymentCreateRequest.create({ data: { userId, requestKey: randomUUID(), fingerprintVersion: 1, requestFingerprint: "a".repeat(64), paymentId: first.id } })).rejects.toMatchObject({ code: "P2002" });
  });
});
