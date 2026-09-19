import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "../../src/lib/prisma";
import paymentRouter from "../../src/routes/payment.routes";
import { errorMiddleware } from "../../src/middleware/error.middleware";
import * as auditService from "../../src/services/audit.service";

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

    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      Object.assign(req, { userId });
      next();
    });
    app.use("/payments", paymentRouter);
    app.use(errorMiddleware);
    await new Promise<void>((resolve, reject) => {
      server = app.listen(0, "127.0.0.1", resolve);
      server.once("error", reject);
    });
    baseUrl = `http://127.0.0.1:${(server!.address() as AddressInfo).port}`;
  });

  afterEach(() => vi.restoreAllMocks());

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((error) => error ? reject(error) : resolve());
        server!.closeAllConnections();
      });
    }
    // Only this suite's UUID-scoped fixtures in the guarded local test database.
    await prisma.auditLog.deleteMany({ where: { userId } });
    await prisma.payment.deleteMany({ where: { leaseId } });
    await prisma.lease.deleteMany({ where: { id: leaseId } });
    await prisma.tenant.deleteMany({ where: { id: tenantId } });
    await prisma.unit.deleteMany({ where: { id: unitId } });
    await prisma.property.deleteMany({ where: { id: propertyId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  function postPayment(reference: string, overrides: Record<string, unknown> = {}) {
    return fetch(`${baseUrl}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
});
