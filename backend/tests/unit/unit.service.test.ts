import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../../src/lib/prisma";
import {
  createUnit,
  deleteUnit,
  hardDeleteUnit,
} from "../../src/services/unit.service";
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

// ============================================
// HARD DELETE TESTS
// ============================================

describe("Unit Service - Hard Delete", () => {
  let testUserId: string;
  let testPropertyId: string;

  beforeAll(async () => {
    const timestamp = Date.now();
    const testEmail = `unit-hard-delete-${timestamp}@example.com`;

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: "hashed",
        name: "Hard Delete Test User",
      },
    });
    testUserId = user.id;

    const property = await prisma.property.create({
      data: {
        name: "Hard Delete Test Property",
        address: "789 Test St",
        city: "Test City",
        state: "TS",
        zip: "12345",
        unitCount: 2,
        userId: testUserId,
      },
    });
    testPropertyId = property.id;
  });

  afterAll(async () => {
    if (testPropertyId) {
      await prisma.property.delete({ where: { id: testPropertyId } });
    }

    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
  });

  it("should hard delete a unit with no lease history", async () => {
    const unit = await createUnit(testUserId, {
      unitNumber: "HD-1",
      propertyId: testPropertyId,
      bedrooms: 1,
      bathrooms: 1,
      rentAmount: 1000,
    });

    const deleted = await hardDeleteUnit(unit.id, testUserId);

    expect(deleted.id).toBe(unit.id);

    const remaining = await prisma.unit.findUnique({
      where: { id: unit.id },
    });

    expect(remaining).toBeNull();
  });

  it("should reject hard delete when the unit has lease history", async () => {
    const unit = await createUnit(testUserId, {
      unitNumber: "HD-2",
      propertyId: testPropertyId,
      bedrooms: 1,
      bathrooms: 1,
      rentAmount: 1000,
    });

    const tenant = await prisma.tenant.create({
      data: {
        firstName: "Lease",
        lastName: "History",
        email: `lease-history-${Date.now()}@example.com`,
        userId: testUserId,
      },
    });

    const lease = await prisma.lease.create({
      data: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        monthlyRent: 1000,
        securityDeposit: 1000,
        status: "ACTIVE",
        propertyId: testPropertyId,
        unitId: unit.id,
        tenantId: tenant.id,
      },
    });

    await expect(hardDeleteUnit(unit.id, testUserId)).rejects.toThrow(
      ConflictError,
    );

    await expect(hardDeleteUnit(unit.id, testUserId)).rejects.toThrow(
      "Cannot delete unit with lease history. Archive it instead.",
    );

    await prisma.lease.delete({ where: { id: lease.id } });
    await prisma.tenant.delete({ where: { id: tenant.id } });
    await prisma.unit.delete({ where: { id: unit.id } });
  });

  it("should reject hard delete for a unit with ended lease history", async () => {
    const unit = await createUnit(testUserId, {
      unitNumber: "HD-3",
      propertyId: testPropertyId,
      bedrooms: 1,
      bathrooms: 1,
      rentAmount: 1000,
    });

    const tenant = await prisma.tenant.create({
      data: {
        firstName: "Ended",
        lastName: "Lease",
        email: `ended-lease-${Date.now()}@example.com`,
        userId: testUserId,
      },
    });

    const lease = await prisma.lease.create({
      data: {
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        monthlyRent: 1000,
        securityDeposit: 1000,
        status: "ENDED",
        propertyId: testPropertyId,
        unitId: unit.id,
        tenantId: tenant.id,
      },
    });

    await expect(hardDeleteUnit(unit.id, testUserId)).rejects.toThrow(
      ConflictError,
    );

    await prisma.lease.delete({ where: { id: lease.id } });
    await prisma.tenant.delete({ where: { id: tenant.id } });
    await prisma.unit.delete({ where: { id: unit.id } });
  });

  it("should allow hard delete when lease history belongs to another unit", async () => {
    const unitToDelete = await createUnit(testUserId, {
      unitNumber: "HD-4",
      propertyId: testPropertyId,
      bedrooms: 1,
      bathrooms: 1,
      rentAmount: 1000,
    });

    const otherUnit = await createUnit(testUserId, {
      unitNumber: "HD-5",
      propertyId: testPropertyId,
      bedrooms: 1,
      bathrooms: 1,
      rentAmount: 1000,
    });

    const tenant = await prisma.tenant.create({
      data: {
        firstName: "Other",
        lastName: "Unit",
        email: `other-unit-${Date.now()}@example.com`,
        userId: testUserId,
      },
    });

    const lease = await prisma.lease.create({
      data: {
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        monthlyRent: 1000,
        securityDeposit: 1000,
        status: "ENDED",
        propertyId: testPropertyId,
        unitId: otherUnit.id,
        tenantId: tenant.id,
      },
    });

    const deleted = await hardDeleteUnit(unitToDelete.id, testUserId);

    expect(deleted.id).toBe(unitToDelete.id);

    await prisma.lease.delete({ where: { id: lease.id } });
    await prisma.tenant.delete({ where: { id: tenant.id } });
    await prisma.unit.delete({ where: { id: otherUnit.id } });
  });

  it("should reject hard delete when the unit does not exist", async () => {
    await expect(hardDeleteUnit("non-existent-id", testUserId)).rejects.toThrow(
      "Unit not found",
    );
  });

  it("should reject hard delete for another user's unit", async () => {
    const otherUser = await prisma.user.create({
      data: {
        email: `hard-delete-other-${Date.now()}@example.com`,
        password: "hashed",
        name: "Other User",
      },
    });

    const otherProperty = await prisma.property.create({
      data: {
        name: "Other Property",
        address: "999 Other St",
        city: "Other City",
        state: "OS",
        zip: "67890",
        unitCount: 1,
        userId: otherUser.id,
      },
    });

    const otherUnit = await createUnit(otherUser.id, {
      unitNumber: "OTHER-1",
      propertyId: otherProperty.id,
      bedrooms: 1,
      bathrooms: 1,
      rentAmount: 1000,
    });

    await expect(hardDeleteUnit(otherUnit.id, testUserId)).rejects.toThrow(
      "Unit not found",
    );

    await prisma.unit.delete({ where: { id: otherUnit.id } });
    await prisma.property.delete({ where: { id: otherProperty.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });
});
