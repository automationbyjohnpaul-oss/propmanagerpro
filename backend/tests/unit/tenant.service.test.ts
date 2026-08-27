import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { createTenant, archiveTenant } from "../../src/services/tenant.service";
import { ConflictError } from "../../src/lib/errors";

describe("Tenant Service - Archive", () => {
  let testUserId: string;
  let testEmail: string;
  let testPropertyId: string;
  let testUnitId: string;

  beforeAll(async () => {
    const timestamp = Date.now();
    testEmail = `tenant-test-${timestamp}@example.com`;

    // Clean up any existing test data
    await prisma.user.deleteMany({ where: { email: testEmail } });

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: "hashed",
        name: "Test User",
      },
    });
    testUserId = user.id;

    // Create property
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

    // Create unit
    const unit = await prisma.unit.create({
      data: {
        unitNumber: "1",
        propertyId: testPropertyId,
        bedrooms: 1,
        bathrooms: 1,
        rentAmount: 1000,
      },
    });
    testUnitId = unit.id;
  });

  afterAll(async () => {
    // Clean up in dependency-safe order
    if (testUnitId) {
      await prisma.unit.delete({ where: { id: testUnitId } });
    }
    if (testPropertyId) {
      await prisma.property.delete({ where: { id: testPropertyId } });
    }
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
  });

  it("should archive tenant without active lease", async () => {
    const timestamp = Date.now();
    const tenant = await createTenant(
      {
        firstName: "Jane",
        lastName: "Smith",
        email: `jane-${timestamp}@example.com`,
      },
      testUserId,
    );

    const archived = await archiveTenant(tenant.id, testUserId);
    expect(archived.deletedAt).toBeDefined();
    expect(archived.deletedAt).not.toBeNull();

    // Clean up
    await prisma.tenant.delete({ where: { id: tenant.id } });
  });

  it("should throw ConflictError when tenant has active lease", async () => {
    const timestamp = Date.now();
    // Create a tenant
    const tenant = await createTenant(
      {
        firstName: "Active",
        lastName: "Tenant",
        email: `active-${timestamp}@example.com`,
      },
      testUserId,
    );

    // Create an active lease for this tenant
    const lease = await prisma.lease.create({
      data: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        monthlyRent: 1000,
        securityDeposit: 1000,
        status: "ACTIVE",
        propertyId: testPropertyId,
        unitId: testUnitId,
        tenantId: tenant.id,
      },
    });

    // Attempt to archive tenant with active lease
    const result = archiveTenant(tenant.id, testUserId);

    await expect(result).rejects.toThrow(ConflictError);
    await expect(result).rejects.toThrow(
      "Cannot archive tenant with active lease. End lease first.",
    );

    // Clean up - lease is deleted here, not in afterAll
    await prisma.lease.delete({ where: { id: lease.id } });
    await prisma.tenant.delete({ where: { id: tenant.id } });
  });

  it("should reject archive when tenant has ACTIVE lease with past endDate", async () => {
    const timestamp = Date.now();
    const tenant = await createTenant(
      {
        firstName: "PastEndDate",
        lastName: "Tenant",
        email: `past-enddate-${timestamp}@example.com`,
      },
      testUserId,
    );

    // Create an ACTIVE lease with endDate in the past
    const lease = await prisma.lease.create({
      data: {
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"), // Past date
        monthlyRent: 1000,
        securityDeposit: 1000,
        status: "ACTIVE",
        propertyId: testPropertyId,
        unitId: testUnitId,
        tenantId: tenant.id,
      },
    });

    const result = archiveTenant(tenant.id, testUserId);

    await expect(result).rejects.toThrow(ConflictError);
    await expect(result).rejects.toThrow(
      "Cannot archive tenant with active lease. End lease first.",
    );

    await prisma.lease.delete({ where: { id: lease.id } });
    await prisma.tenant.delete({ where: { id: tenant.id } });
  });

  it("should throw error when tenant not found", async () => {
    await expect(archiveTenant("non-existent-id", testUserId)).rejects.toThrow(
      "Tenant not found",
    );
  });

  it("should throw error when tenant belongs to another user", async () => {
    // Create another user
    const otherUser = await prisma.user.create({
      data: {
        email: `other-${Date.now()}@example.com`,
        password: "hashed",
        name: "Other User",
      },
    });

    // Create tenant for other user
    const otherTenant = await createTenant(
      {
        firstName: "Other",
        lastName: "User",
        email: `other-tenant-${Date.now()}@example.com`,
      },
      otherUser.id,
    );

    // Attempt to archive other user's tenant
    await expect(archiveTenant(otherTenant.id, testUserId)).rejects.toThrow(
      "Tenant not found",
    );

    // Clean up
    await prisma.tenant.delete({ where: { id: otherTenant.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });
});
