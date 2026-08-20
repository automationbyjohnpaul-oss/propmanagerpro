// backend/tests/unit/payment.service.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../../src/lib/prisma";
import {
  createPayment,
  updatePayment,
  getPaymentById,
} from "../../src/services/payment.service";
import { PaymentStatus, PaymentMethod } from "@prisma/client";

describe("Payment Service", () => {
  let testUserId: string;
  let testLeaseId: string;
  let testTenantId: string;
  let testPropertyId: string;
  let testPaymentId: string;
  let testEmail: string;

  beforeAll(async () => {
    // Generate unique test data
    const timestamp = Date.now();
    testEmail = `test-${timestamp}@example.com`;

    // Clean up any existing test data
    await prisma.payment.deleteMany({
      where: {
        lease: {
          property: {
            user: {
              email: testEmail,
            },
          },
        },
      },
    });

    await prisma.lease.deleteMany({
      where: {
        property: {
          user: {
            email: testEmail,
          },
        },
      },
    });

    await prisma.tenant.deleteMany({
      where: {
        user: {
          email: testEmail,
        },
      },
    });

    await prisma.unit.deleteMany({
      where: {
        property: {
          user: {
            email: testEmail,
          },
        },
      },
    });

    await prisma.property.deleteMany({
      where: {
        user: {
          email: testEmail,
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: testEmail,
      },
    });

    // Create test user with unique email
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: "hashed",
        name: "Test User",
      },
    });
    testUserId = user.id;

    const property = await prisma.property.create({
      data: {
        name: "Test Property",
        address: "123 Test St",
        city: "Test City",
        state: "TS",
        zip: "12345",
        unitCount: 1,
        userId: testUserId,
      },
    });
    testPropertyId = property.id;

    const unit = await prisma.unit.create({
      data: {
        unitNumber: "1",
        propertyId: testPropertyId,
        bedrooms: 1,
        bathrooms: 1,
        rentAmount: 1000,
      },
    });

    const tenant = await prisma.tenant.create({
      data: {
        firstName: "John",
        lastName: "Doe",
        email: `john-${timestamp}@example.com`,
        userId: testUserId,
      },
    });
    testTenantId = tenant.id;

    const lease = await prisma.lease.create({
      data: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        monthlyRent: 1000,
        securityDeposit: 1000,
        propertyId: testPropertyId,
        unitId: unit.id,
        tenantId: testTenantId,
      },
    });
    testLeaseId = lease.id;
  });

  afterAll(async () => {
    // Clean up in dependency-safe order
    if (testLeaseId) {
      await prisma.payment.deleteMany({ where: { leaseId: testLeaseId } });
      await prisma.lease.delete({ where: { id: testLeaseId } });
    }
    if (testTenantId) {
      await prisma.tenant.delete({ where: { id: testTenantId } });
    }
    if (testPropertyId) {
      await prisma.unit.deleteMany({ where: { propertyId: testPropertyId } });
      await prisma.property.delete({ where: { id: testPropertyId } });
    }
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
  });

  it("1. PENDING payment can be updated", async () => {
    const payment = await createPayment(testUserId, {
      amount: 1000,
      paymentDate: new Date(),
      method: PaymentMethod.cash,
      status: PaymentStatus.pending,
      leaseId: testLeaseId,
      tenantId: testTenantId,
    });
    testPaymentId = payment.id;

    const updated = await updatePayment(payment.id, testUserId, {
      amount: 1100,
      notes: "Updated note",
    });

    expect(Number(updated.amount)).toBe(1100);
    expect(updated.notes).toBe("Updated note");
  });

  it("2. FAILED payment can be updated", async () => {
    const payment = await createPayment(testUserId, {
      amount: 1000,
      paymentDate: new Date(),
      method: PaymentMethod.cash,
      status: PaymentStatus.failed,
      leaseId: testLeaseId,
      tenantId: testTenantId,
    });

    const updated = await updatePayment(payment.id, testUserId, {
      amount: 1050,
      notes: "Retry payment",
    });

    expect(Number(updated.amount)).toBe(1050);
    expect(updated.status).toBe(PaymentStatus.failed);
  });

  it("3. COMPLETED payment update is rejected", async () => {
    const payment = await createPayment(testUserId, {
      amount: 1000,
      paymentDate: new Date(),
      method: PaymentMethod.cash,
      status: PaymentStatus.completed,
      leaseId: testLeaseId,
      tenantId: testTenantId,
    });

    await expect(
      updatePayment(payment.id, testUserId, {
        amount: 2000,
      }),
    ).rejects.toThrow("Completed payments cannot be modified");
  });

  it("4. REFUNDED payment update is rejected", async () => {
    // Create a valid payment first
    const payment = await createPayment(testUserId, {
      amount: 1000,
      paymentDate: new Date(),
      method: PaymentMethod.cash,
      status: PaymentStatus.completed,
      leaseId: testLeaseId,
      tenantId: testTenantId,
    });

    // Directly update the database to REFUNDED state (test fixture setup)
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.refunded },
    });

    // Now verify that updatePayment rejects updates to REFUNDED payments
    await expect(
      updatePayment(payment.id, testUserId, {
        notes: "Should fail",
      }),
    ).rejects.toThrow("Refunded payments cannot be modified");
  });

  it("5. Normal PUT cannot change status", async () => {
    const payment = await createPayment(testUserId, {
      amount: 1000,
      paymentDate: new Date(),
      method: PaymentMethod.cash,
      status: PaymentStatus.pending,
      leaseId: testLeaseId,
      tenantId: testTenantId,
    });

    await expect(
      updatePayment(payment.id, testUserId, {
        // @ts-expect-error - Testing forbidden field
        status: PaymentStatus.completed,
      }),
    ).rejects.toThrow("Cannot update immutable fields: status");
  });

  it("6. Normal PUT cannot change leaseId", async () => {
    const payment = await createPayment(testUserId, {
      amount: 1000,
      paymentDate: new Date(),
      method: PaymentMethod.cash,
      status: PaymentStatus.pending,
      leaseId: testLeaseId,
      tenantId: testTenantId,
    });

    await expect(
      updatePayment(payment.id, testUserId, {
        // @ts-expect-error - Testing forbidden field
        leaseId: "some-other-id",
      }),
    ).rejects.toThrow("Cannot update immutable fields: leaseId");
  });

  it("7. Normal PUT cannot change tenantId", async () => {
    const payment = await createPayment(testUserId, {
      amount: 1000,
      paymentDate: new Date(),
      method: PaymentMethod.cash,
      status: PaymentStatus.pending,
      leaseId: testLeaseId,
      tenantId: testTenantId,
    });

    await expect(
      updatePayment(payment.id, testUserId, {
        // @ts-expect-error - Testing forbidden field
        tenantId: "some-other-id",
      }),
    ).rejects.toThrow("Cannot update immutable fields: tenantId");
  });

  it("8. Normal PUT cannot change propertyId", async () => {
    const payment = await createPayment(testUserId, {
      amount: 1000,
      paymentDate: new Date(),
      method: PaymentMethod.cash,
      status: PaymentStatus.pending,
      leaseId: testLeaseId,
      tenantId: testTenantId,
    });

    await expect(
      updatePayment(payment.id, testUserId, {
        // @ts-expect-error - Testing forbidden field
        propertyId: "some-other-id",
      }),
    ).rejects.toThrow("Cannot update immutable fields: propertyId");
  });

  it("9. Normal PUT cannot change unitId", async () => {
    const payment = await createPayment(testUserId, {
      amount: 1000,
      paymentDate: new Date(),
      method: PaymentMethod.cash,
      status: PaymentStatus.pending,
      leaseId: testLeaseId,
      tenantId: testTenantId,
    });

    await expect(
      updatePayment(payment.id, testUserId, {
        // @ts-expect-error - Testing forbidden field
        unitId: "some-other-id",
      }),
    ).rejects.toThrow("Cannot update immutable fields: unitId");
  });

  it("10. DELETE endpoint no longer exists", async () => {
    // Verify the deletePayment function is not exported from the service
    const service = await import("../../src/services/payment.service");
    expect(service).not.toHaveProperty("deletePayment");
  });

  it("11. Ownership checks still work", async () => {
    const payment = await createPayment(testUserId, {
      amount: 1000,
      paymentDate: new Date(),
      method: PaymentMethod.cash,
      status: PaymentStatus.pending,
      leaseId: testLeaseId,
      tenantId: testTenantId,
    });

    // Try to update with wrong user
    const wrongUser = await prisma.user.create({
      data: {
        email: `wrong-${Date.now()}@example.com`,
        password: "hashed",
        name: "Wrong User",
      },
    });

    await expect(
      updatePayment(payment.id, wrongUser.id, {
        notes: "Should fail",
      }),
    ).rejects.toThrow("Payment not found or access denied");

    await prisma.user.delete({ where: { id: wrongUser.id } });
  });

  // Audit logging test removed - belongs in controller/integration tests
  // The service should not be responsible for creating audit logs

  it("12. Rejected updates do not create a successful mutation audit record", async () => {
    const payment = await createPayment(testUserId, {
      amount: 1000,
      paymentDate: new Date(),
      method: PaymentMethod.cash,
      status: PaymentStatus.completed,
      leaseId: testLeaseId,
      tenantId: testTenantId,
    });

    // This should fail
    await expect(
      updatePayment(payment.id, testUserId, {
        amount: 2000,
      }),
    ).rejects.toThrow("Completed payments cannot be modified");

    // Verify no UPDATE_PAYMENT audit record was created for this failed attempt
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        userId: testUserId,
        entityId: payment.id,
        action: "UPDATE_PAYMENT",
      },
      orderBy: { createdAt: "desc" },
    });

    // Failed updates should not create audit records
    // Any existing audit records should be from successful updates
    const recentFailedAttempt = auditLogs.find((log) => {
      const metadata = log.metadata as any;
      return metadata?.newData?.amount === 2000;
    });
    expect(recentFailedAttempt).toBeUndefined();
  });

  it("13. Cannot create a payment with REFUNDED status", async () => {
    await expect(
      createPayment(testUserId, {
        amount: 1000,
        paymentDate: new Date(),
        method: PaymentMethod.cash,
        status: PaymentStatus.refunded,
        leaseId: testLeaseId,
        tenantId: testTenantId,
      }),
    ).rejects.toThrow(
      "Cannot create a payment with REFUNDED status. Refunds are only available through the dedicated refund workflow.",
    );
  });

  it("14. Can create a payment with PENDING status", async () => {
    const payment = await createPayment(testUserId, {
      amount: 1000,
      paymentDate: new Date(),
      method: PaymentMethod.cash,
      status: PaymentStatus.pending,
      leaseId: testLeaseId,
      tenantId: testTenantId,
    });

    expect(payment.status).toBe(PaymentStatus.pending);
  });

  it("15. Can create a payment with COMPLETED status", async () => {
    const payment = await createPayment(testUserId, {
      amount: 1000,
      paymentDate: new Date(),
      method: PaymentMethod.cash,
      status: PaymentStatus.completed,
      leaseId: testLeaseId,
      tenantId: testTenantId,
    });

    expect(payment.status).toBe(PaymentStatus.completed);
  });

  it("16. Can create a payment with FAILED status", async () => {
    const payment = await createPayment(testUserId, {
      amount: 1000,
      paymentDate: new Date(),
      method: PaymentMethod.cash,
      status: PaymentStatus.failed,
      leaseId: testLeaseId,
      tenantId: testTenantId,
    });

    expect(payment.status).toBe(PaymentStatus.failed);
  });

  it("17. Default status is PENDING when not specified", async () => {
    const payment = await createPayment(testUserId, {
      amount: 1000,
      paymentDate: new Date(),
      method: PaymentMethod.cash,
      leaseId: testLeaseId,
      tenantId: testTenantId,
    });

    expect(payment.status).toBe(PaymentStatus.pending);
  });

  it("18. getPaymentById works with valid payment", async () => {
    const payment = await createPayment(testUserId, {
      amount: 1000,
      paymentDate: new Date(),
      method: PaymentMethod.cash,
      status: PaymentStatus.pending,
      leaseId: testLeaseId,
      tenantId: testTenantId,
    });

    const found = await getPaymentById(payment.id, testUserId);
    expect(found).toBeDefined();
    expect(found?.id).toBe(payment.id);
    expect(Number(found?.amount)).toBe(1000);
  });

  it("19. getPaymentById returns null for invalid payment", async () => {
    const found = await getPaymentById("non-existent-id", testUserId);
    expect(found).toBeNull();
  });

  it("20. getPaymentById returns null for payment not owned by user", async () => {
    const payment = await createPayment(testUserId, {
      amount: 1000,
      paymentDate: new Date(),
      method: PaymentMethod.cash,
      status: PaymentStatus.pending,
      leaseId: testLeaseId,
      tenantId: testTenantId,
    });

    const wrongUser = await prisma.user.create({
      data: {
        email: `another-${Date.now()}@example.com`,
        password: "hashed",
        name: "Another User",
      },
    });

    const found = await getPaymentById(payment.id, wrongUser.id);
    expect(found).toBeNull();

    await prisma.user.delete({ where: { id: wrongUser.id } });
  });
});
