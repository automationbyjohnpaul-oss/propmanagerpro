import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { createUnit, deleteUnit } from "../../src/services/unit.service";
import { ConflictError } from "../../src/lib/errors";

describe("Unit Service - Archive", () => {
  let testUserId: string;
  let testEmail: string;
  let testPropertyId: string;
  let testTenantId: string;

  beforeAll(async () => {
    const timestamp = Date.now();
    testEmail = `unit-test-${timestamp}@example.com`;

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

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        firstName: "John",
        lastName: "Doe",
        email: `tenant-${timestamp}@example.com`,
        userId: testUserId,
      },
    });
    testTenantId = tenant.id;
  });

  afterAll(async () => {
    // Clean up in dependency-safe order
    if (testTenantId) {
      await prisma.tenant.delete({ where: { id: testTenantId } });
    }
    if (testPropertyId) {
      await prisma.property.delete({ where: { id: testPropertyId } });
    }
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
  });

  it("should archive unit without active lease", async () => {
    const unit = await createUnit(testUserId, {
      unitNumber: "2",
      propertyId: testPropertyId,
      bedrooms: 1,
      bathrooms: 1,
      rentAmount: 1000,
    });

    const archived = await deleteUnit(unit.id, testUserId);
    expect(archived.deletedAt).toBeDefined();
    expect(archived.deletedAt).not.toBeNull();

    // Clean up
    await prisma.unit.delete({ where: { id: unit.id } });
  });

  it("should throw ConflictError when unit has active lease", async () => {
    // Create a unit
    const unit = await createUnit(testUserId, {
      unitNumber: "3",
      propertyId: testPropertyId,
      bedrooms: 1,
      bathrooms: 1,
      rentAmount: 1000,
    });

    // Create an active lease for this unit
    const lease = await prisma.lease.create({
      data: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        monthlyRent: 1000,
        securityDeposit: 1000,
        status: "ACTIVE",
        propertyId: testPropertyId,
        unitId: unit.id,
        tenantId: testTenantId,
      },
    });

    // Attempt to archive unit with active lease
    const result = deleteUnit(unit.id, testUserId);

    await expect(result).rejects.toThrow(ConflictError);
    await expect(result).rejects.toThrow(
      "Cannot archive unit with active lease",
    );

    // Clean up - lease is deleted here, not in afterAll
    await prisma.lease.delete({ where: { id: lease.id } });
    await prisma.unit.delete({ where: { id: unit.id } });
  });

  it("should throw error when unit not found", async () => {
    await expect(deleteUnit("non-existent-id", testUserId)).rejects.toThrow(
      "Unit not found",
    );
  });

  it("should throw error when unit belongs to another user", async () => {
    // Create another user
    const otherUser = await prisma.user.create({
      data: {
        email: `other-${Date.now()}@example.com`,
        password: "hashed",
        name: "Other User",
      },
    });

    // Create property for other user
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

    // Create unit for other user
    const otherUnit = await createUnit(otherUser.id, {
      unitNumber: "1",
      propertyId: otherProperty.id,
      bedrooms: 1,
      bathrooms: 1,
      rentAmount: 1000,
    });

    // Attempt to archive other user's unit
    await expect(deleteUnit(otherUnit.id, testUserId)).rejects.toThrow(
      "Unit not found",
    );

    // Clean up
    await prisma.unit.delete({ where: { id: otherUnit.id } });
    await prisma.property.delete({ where: { id: otherProperty.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });
});
