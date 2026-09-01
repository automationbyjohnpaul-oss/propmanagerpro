import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { prisma } from "../../src/lib/prisma";
import { ConflictError } from "../../src/lib/errors";
import {
  createLease,
  getLeaseById,
  activateLease,
  terminateLease,
  restoreLease,
  endLease,
} from "../../src/services/lease.service";

describe("Lease Service", () => {
  let testUserId: string;
  let testPropertyId: string;
  let testUnitId: string;
  let testTenantId: string;

  const timestamp = Date.now();
  const testEmail = `lease-test-${timestamp}@example.com`;
  const tenantEmail = `lease-tenant-${timestamp}@example.com`;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: "hashed",
        name: "Lease Test User",
      },
    });

    testUserId = user.id;

    // Create property
    const property = await prisma.property.create({
      data: {
        name: "Lease Test Property",
        address: "123 Lease Test St",
        city: "Test City",
        state: "TS",
        zip: "12345",
        unitCount: 1,
        userId: testUserId,
      },
    });

    testPropertyId = property.id;

    // Create unit
    const unit = await prisma.unit.create({
      data: {
        unitNumber: "1",
        bedrooms: 2,
        bathrooms: 1,
        rentAmount: 1000,
        propertyId: testPropertyId,
      },
    });

    testUnitId = unit.id;

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        firstName: "Lease",
        lastName: "Tenant",
        email: tenantEmail,
        userId: testUserId,
      },
    });

    testTenantId = tenant.id;
  });

  afterAll(async () => {
    // Explicit dependency-safe cleanup
    if (testUserId) {
      await prisma.lease.deleteMany({
        where: {
          property: {
            userId: testUserId,
          },
        },
      });

      await prisma.tenant.deleteMany({
        where: {
          userId: testUserId,
        },
      });

      await prisma.unit.deleteMany({
        where: {
          property: {
            userId: testUserId,
          },
        },
      });

      await prisma.property.deleteMany({
        where: {
          userId: testUserId,
        },
      });

      await prisma.user.delete({
        where: {
          id: testUserId,
        },
      });
    }
  });

  it("should create a PENDING lease", async () => {
    const lease = await createLease(testUserId, {
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2026-12-31T00:00:00.000Z",
      monthlyRent: 1000,
      securityDeposit: 1000,
      propertyId: testPropertyId,
      unitId: testUnitId,
      tenantId: testTenantId,
    });

    expect(lease).toBeDefined();
    expect(lease.status).toBe("PENDING");
    expect(lease.propertyId).toBe(testPropertyId);
    expect(lease.unitId).toBe(testUnitId);
    expect(lease.tenantId).toBe(testTenantId);
  });

  it("converts an ACTIVE-lease database constraint race into a conflict", async () => {
    const uniqueConstraintError = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      {
        code: "P2002",
        clientVersion: "test",
      },
    );
    const transactionSpy = vi
      .spyOn(prisma, "$transaction")
      .mockRejectedValueOnce(uniqueConstraintError);

    try {
      const error = await createLease(testUserId, {
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2026-12-31T00:00:00.000Z",
        monthlyRent: 1000,
        securityDeposit: 1000,
        status: "ACTIVE",
        propertyId: testPropertyId,
        unitId: testUnitId,
        tenantId: testTenantId,
      }).catch((error) => error);

      expect(error).toBeInstanceOf(ConflictError);
      expect(error).toMatchObject({
        name: "ConflictError",
        message: "Unit already has an active lease",
        statusCode: 409,
      });
    } finally {
      transactionSpy.mockRestore();
    }
  });

  it("should retrieve a lease belonging to the user", async () => {
    const lease = await prisma.lease.findFirst({
      where: {
        propertyId: testPropertyId,
        unitId: testUnitId,
        tenantId: testTenantId,
      },
    });

    expect(lease).not.toBeNull();

    if (!lease) {
      throw new Error("Test lease was not created");
    }

    const result = await getLeaseById(lease.id, testUserId);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(lease.id);
  });

  it("should not retrieve a lease belonging to another user", async () => {
    const lease = await prisma.lease.findFirst({
      where: {
        propertyId: testPropertyId,
        unitId: testUnitId,
        tenantId: testTenantId,
      },
    });

    expect(lease).not.toBeNull();

    if (!lease) {
      throw new Error("Test lease was not created");
    }

    const otherUser = await prisma.user.create({
      data: {
        email: `lease-unauthorized-${Date.now()}@example.com`,
        password: "hashed",
        name: "Unauthorized User",
      },
    });

    try {
      const result = await getLeaseById(lease.id, otherUser.id);

      expect(result).toBeNull();
    } finally {
      await prisma.user.delete({
        where: { id: otherUser.id },
      });
    }
  });

  it("should reject creation when property belongs to another user", async () => {
    const otherUser = await prisma.user.create({
      data: {
        email: `lease-other-${Date.now()}@example.com`,
        password: "hashed",
        name: "Other User",
      },
    });

    const otherProperty = await prisma.property.create({
      data: {
        name: "Other Property",
        address: "456 Other St",
        city: "Other City",
        state: "OS",
        zip: "67890",
        unitCount: 1,
        userId: otherUser.id,
      },
    });

    const otherUnit = await prisma.unit.create({
      data: {
        unitNumber: "1",
        bedrooms: 1,
        bathrooms: 1,
        rentAmount: 800,
        propertyId: otherProperty.id,
      },
    });

    await expect(
      createLease(testUserId, {
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2026-12-31T00:00:00.000Z",
        monthlyRent: 800,
        securityDeposit: 800,
        propertyId: otherProperty.id,
        unitId: otherUnit.id,
        tenantId: testTenantId,
      }),
    ).rejects.toThrow("Property not found");

    await prisma.unit.delete({ where: { id: otherUnit.id } });
    await prisma.property.delete({ where: { id: otherProperty.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });

  it("should reject creation when unit belongs to another property", async () => {
    const otherProperty = await prisma.property.create({
      data: {
        name: "Second Test Property",
        address: "789 Second St",
        city: "Test City",
        state: "TS",
        zip: "12346",
        unitCount: 1,
        userId: testUserId,
      },
    });

    const otherUnit = await prisma.unit.create({
      data: {
        unitNumber: "1",
        bedrooms: 1,
        bathrooms: 1,
        rentAmount: 900,
        propertyId: otherProperty.id,
      },
    });

    await expect(
      createLease(testUserId, {
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2026-12-31T00:00:00.000Z",
        monthlyRent: 900,
        securityDeposit: 900,
        propertyId: testPropertyId,
        unitId: otherUnit.id,
        tenantId: testTenantId,
      }),
    ).rejects.toThrow("Unit not found");

    await prisma.unit.delete({ where: { id: otherUnit.id } });
    await prisma.property.delete({ where: { id: otherProperty.id } });
  });

  it("should reject creation when tenant belongs to another user", async () => {
    const otherUser = await prisma.user.create({
      data: {
        email: `lease-tenant-owner-${Date.now()}@example.com`,
        password: "hashed",
        name: "Other Tenant Owner",
      },
    });

    const otherTenant = await prisma.tenant.create({
      data: {
        firstName: "Other",
        lastName: "Tenant",
        email: `other-tenant-${Date.now()}@example.com`,
        userId: otherUser.id,
      },
    });

    await expect(
      createLease(testUserId, {
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2026-12-31T00:00:00.000Z",
        monthlyRent: 1000,
        securityDeposit: 1000,
        propertyId: testPropertyId,
        unitId: testUnitId,
        tenantId: otherTenant.id,
      }),
    ).rejects.toThrow("Tenant not found");

    await prisma.tenant.delete({ where: { id: otherTenant.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });

  it("should reject creation of a second ACTIVE lease for the same unit", async () => {
    const firstLease = await createLease(testUserId, {
      startDate: "2027-01-01T00:00:00.000Z",
      endDate: "2027-12-31T00:00:00.000Z",
      monthlyRent: 1000,
      securityDeposit: 1000,
      status: "ACTIVE",
      propertyId: testPropertyId,
      unitId: testUnitId,
      tenantId: testTenantId,
    });

    await expect(
      createLease(testUserId, {
        startDate: "2028-01-01T00:00:00.000Z",
        endDate: "2028-12-31T00:00:00.000Z",
        monthlyRent: 1100,
        securityDeposit: 1100,
        status: "ACTIVE",
        propertyId: testPropertyId,
        unitId: testUnitId,
        tenantId: testTenantId,
      }),
    ).rejects.toThrow("Unit already has an active lease");

    await prisma.lease.delete({ where: { id: firstLease.id } });
  });

  it("should activate a PENDING lease", async () => {
    const lease = await createLease(testUserId, {
      startDate: "2029-01-01T00:00:00.000Z",
      endDate: "2029-12-31T00:00:00.000Z",
      monthlyRent: 1000,
      securityDeposit: 1000,
      propertyId: testPropertyId,
      unitId: testUnitId,
      tenantId: testTenantId,
    });

    expect(lease.status).toBe("PENDING");

    const activated = await activateLease(lease.id, testUserId);

    expect(activated.status).toBe("ACTIVE");

    await prisma.lease.delete({ where: { id: lease.id } });
  });

  it("should reject activation of a non-PENDING lease", async () => {
    const lease = await createLease(testUserId, {
      startDate: "2030-01-01T00:00:00.000Z",
      endDate: "2030-12-31T00:00:00.000Z",
      monthlyRent: 1000,
      securityDeposit: 1000,
      status: "ACTIVE",
      propertyId: testPropertyId,
      unitId: testUnitId,
      tenantId: testTenantId,
    });

    await expect(activateLease(lease.id, testUserId)).rejects.toThrow(
      "Cannot activate lease with status: ACTIVE",
    );

    await prisma.lease.delete({ where: { id: lease.id } });
  });

  it("should terminate an ACTIVE lease", async () => {
    const lease = await createLease(testUserId, {
      startDate: "2031-01-01T00:00:00.000Z",
      endDate: "2031-12-31T00:00:00.000Z",
      monthlyRent: 1000,
      securityDeposit: 1000,
      status: "ACTIVE",
      propertyId: testPropertyId,
      unitId: testUnitId,
      tenantId: testTenantId,
    });

    const terminated = await terminateLease(
      lease.id,
      testUserId,
      "Tenant requested early termination",
    );

    expect(terminated.status).toBe("TERMINATED");
    expect(terminated.terminatedAt).not.toBeNull();
    expect(terminated.terminationReason).toBe(
      "Tenant requested early termination",
    );

    await prisma.lease.delete({ where: { id: lease.id } });
  });

  it("should reject termination of a non-ACTIVE lease", async () => {
    const lease = await createLease(testUserId, {
      startDate: "2032-01-01T00:00:00.000Z",
      endDate: "2032-12-31T00:00:00.000Z",
      monthlyRent: 1000,
      securityDeposit: 1000,
      propertyId: testPropertyId,
      unitId: testUnitId,
      tenantId: testTenantId,
    });

    await expect(
      terminateLease(lease.id, testUserId, "Invalid transition"),
    ).rejects.toThrow("Cannot terminate lease with status: PENDING");

    await prisma.lease.delete({ where: { id: lease.id } });
  });

  it("should restore a TERMINATED lease to ACTIVE", async () => {
    const lease = await createLease(testUserId, {
      startDate: "2033-01-01T00:00:00.000Z",
      endDate: "2033-12-31T00:00:00.000Z",
      monthlyRent: 1000,
      securityDeposit: 1000,
      status: "ACTIVE",
      propertyId: testPropertyId,
      unitId: testUnitId,
      tenantId: testTenantId,
    });

    await terminateLease(
      lease.id,
      testUserId,
      "Temporary termination for test",
    );

    const restored = await restoreLease(lease.id, testUserId);

    expect(restored.status).toBe("ACTIVE");
    expect(restored.terminatedAt).toBeNull();
    expect(restored.terminationReason).toBeNull();

    await prisma.lease.delete({ where: { id: lease.id } });
  });

  it("should reject restoring a non-TERMINATED lease", async () => {
    const lease = await createLease(testUserId, {
      startDate: "2034-01-01T00:00:00.000Z",
      endDate: "2034-12-31T00:00:00.000Z",
      monthlyRent: 1000,
      securityDeposit: 1000,
      propertyId: testPropertyId,
      unitId: testUnitId,
      tenantId: testTenantId,
    });

    await expect(restoreLease(lease.id, testUserId)).rejects.toThrow(
      "Cannot restore lease with status: PENDING",
    );

    await prisma.lease.delete({ where: { id: lease.id } });
  });

  it("should end an ACTIVE lease", async () => {
    const lease = await createLease(testUserId, {
      startDate: "2035-01-01T00:00:00.000Z",
      endDate: "2035-12-31T00:00:00.000Z",
      monthlyRent: 1000,
      securityDeposit: 1000,
      status: "ACTIVE",
      propertyId: testPropertyId,
      unitId: testUnitId,
      tenantId: testTenantId,
    });

    const ended = await endLease(lease.id, testUserId);

    expect(ended.status).toBe("ENDED");

    await prisma.lease.delete({ where: { id: lease.id } });
  });

  it("should reject ending a non-ACTIVE lease", async () => {
    const lease = await createLease(testUserId, {
      startDate: "2036-01-01T00:00:00.000Z",
      endDate: "2036-12-31T00:00:00.000Z",
      monthlyRent: 1000,
      securityDeposit: 1000,
      propertyId: testPropertyId,
      unitId: testUnitId,
      tenantId: testTenantId,
    });

    await expect(endLease(lease.id, testUserId)).rejects.toThrow(
      "Cannot end lease with status: PENDING",
    );

    await prisma.lease.delete({ where: { id: lease.id } });
  });
});
