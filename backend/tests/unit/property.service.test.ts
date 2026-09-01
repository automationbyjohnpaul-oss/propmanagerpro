import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../../src/lib/prisma";
import {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  archiveProperty,
  restoreProperty,
} from "../../src/services/property.service";

describe("Property Service", () => {
  let testUserId: string;
  let otherUserId: string;
  let testEmail: string;
  let otherUserEmail: string;

  beforeAll(async () => {
    const timestamp = Date.now();

    testEmail = `property-test-${timestamp}@example.com`;
    otherUserEmail = `property-other-${timestamp}@example.com`;

    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        password: "hashed",
        name: "Property Test User",
      },
    });

    const otherUser = await prisma.user.create({
      data: {
        email: otherUserEmail,
        password: "hashed",
        name: "Other Property User",
      },
    });

    testUserId = testUser.id;
    otherUserId = otherUser.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.user.delete({
        where: { id: testUserId },
      });
    }

    if (otherUserId) {
      await prisma.user.delete({
        where: { id: otherUserId },
      });
    }
  });

  it("should create a property and automatically create units", async () => {
    const property = await createProperty({
      name: "Test Property",
      address: "123 Test Street",
      city: "Test City",
      state: "TS",
      zip: "12345",
      unitCount: 3,
      userId: testUserId,
    });

    expect(property.userId).toBe(testUserId);
    expect(property.unitCount).toBe(3);

    const units = await prisma.unit.findMany({
      where: {
        propertyId: property.id,
      },
      orderBy: {
        unitNumber: "asc",
      },
    });

    expect(units).toHaveLength(3);
    expect(units.map((unit) => unit.unitNumber)).toEqual(["1", "2", "3"]);

    await prisma.property.delete({
      where: { id: property.id },
    });
  });

  it("should return only active properties belonging to the user", async () => {
    const property = await createProperty({
      name: "Active Property",
      address: "1 Active Street",
      city: "Test City",
      state: "TS",
      zip: "11111",
      unitCount: 0,
      userId: testUserId,
    });

    const otherProperty = await createProperty({
      name: "Other User Property",
      address: "2 Other Street",
      city: "Other City",
      state: "OS",
      zip: "22222",
      unitCount: 0,
      userId: otherUserId,
    });

    const properties = await getAllProperties(testUserId);

    expect(properties.some((item) => item.id === property.id)).toBe(true);
    expect(properties.some((item) => item.id === otherProperty.id)).toBe(
      false,
    );

    await prisma.property.delete({
      where: { id: property.id },
    });

    await prisma.property.delete({
      where: { id: otherProperty.id },
    });
  });

  it("should return only archived properties when status is archived", async () => {
    const activeProperty = await createProperty({
      name: "Active Filter Property",
      address: "12 Active Filter Street",
      city: "Filter City",
      state: "FS",
      zip: "12121",
      unitCount: 0,
      userId: testUserId,
    });

    const archivedProperty = await createProperty({
      name: "Archived Filter Property",
      address: "13 Archived Filter Street",
      city: "Filter City",
      state: "FS",
      zip: "13131",
      unitCount: 0,
      userId: testUserId,
    });

    await archiveProperty(archivedProperty.id, testUserId);

    const archivedProperties = await getAllProperties(testUserId, "archived");

    expect(
      archivedProperties.some((item) => item.id === archivedProperty.id),
    ).toBe(true);

    expect(
      archivedProperties.some((item) => item.id === activeProperty.id),
    ).toBe(false);

    await prisma.property.delete({
      where: { id: activeProperty.id },
    });

    await prisma.property.delete({
      where: { id: archivedProperty.id },
    });
  });

  it("should not return another user's property by ID", async () => {
    const property = await createProperty({
      name: "Private Property",
      address: "3 Private Street",
      city: "Private City",
      state: "PS",
      zip: "33333",
      unitCount: 0,
      userId: otherUserId,
    });

    const result = await getPropertyById(property.id, testUserId);

    expect(result).toBeNull();

    await prisma.property.delete({
      where: { id: property.id },
    });
  });

  it("should update a property belonging to the user", async () => {
    const property = await createProperty({
      name: "Before Update",
      address: "4 Update Street",
      city: "Update City",
      state: "US",
      zip: "44444",
      unitCount: 0,
      userId: testUserId,
    });

    const updated = await updateProperty(property.id, testUserId, {
      name: "After Update",
      address: "5 Updated Street",
      city: "Updated City",
      state: "US",
      zip: "55555",
      unitCount: 2,
    });

    expect(updated.name).toBe("After Update");
    expect(updated.address).toBe("5 Updated Street");
    expect(updated.unitCount).toBe(2);

    await prisma.property.delete({
      where: { id: property.id },
    });
  });

  it("should reject updating another user's property", async () => {
    const property = await createProperty({
      name: "Protected Property",
      address: "6 Protected Street",
      city: "Protected City",
      state: "PS",
      zip: "66666",
      unitCount: 0,
      userId: otherUserId,
    });

    await expect(
      updateProperty(property.id, testUserId, {
        name: "Unauthorized Update",
        address: "Unauthorized",
        city: "Unauthorized",
        state: "UA",
        zip: "00000",
        unitCount: 0,
      }),
    ).rejects.toThrow("Property not found");

    await prisma.property.delete({
      where: { id: property.id },
    });
  });

  it("should archive an active property", async () => {
    const property = await createProperty({
      name: "Archive Property",
      address: "7 Archive Street",
      city: "Archive City",
      state: "AS",
      zip: "77777",
      unitCount: 0,
      userId: testUserId,
    });

    const archived = await archiveProperty(property.id, testUserId);

    expect(archived.deletedAt).not.toBeNull();

    const activeProperties = await getAllProperties(testUserId);

    expect(activeProperties.some((item) => item.id === property.id)).toBe(
      false,
    );

    await prisma.property.delete({
      where: { id: property.id },
    });
  });

  it("should restore an archived property", async () => {
    const property = await createProperty({
      name: "Restore Property",
      address: "8 Restore Street",
      city: "Restore City",
      state: "RS",
      zip: "88888",
      unitCount: 0,
      userId: testUserId,
    });

    await archiveProperty(property.id, testUserId);

    const restored = await restoreProperty(property.id, testUserId);

    expect(restored.deletedAt).toBeNull();

    const activeProperties = await getAllProperties(testUserId);

    expect(activeProperties.some((item) => item.id === property.id)).toBe(true);

    await prisma.property.delete({
      where: { id: property.id },
    });
  });

  it("should reject restoring an active property", async () => {
    const property = await createProperty({
      name: "Already Active",
      address: "9 Active Street",
      city: "Active City",
      state: "AC",
      zip: "99999",
      unitCount: 0,
      userId: testUserId,
    });

    await expect(
      restoreProperty(property.id, testUserId),
    ).rejects.toThrow("Archived property not found");

    await prisma.property.delete({
      where: { id: property.id },
    });
  });

  it("should soft-delete a property without physically removing it", async () => {
    const property = await createProperty({
      name: "Delete Property",
      address: "10 Delete Street",
      city: "Delete City",
      state: "DS",
      zip: "10101",
      unitCount: 0,
      userId: testUserId,
    });

    const deleted = await deleteProperty(property.id, testUserId);

    expect(deleted.deletedAt).not.toBeNull();

    const stored = await prisma.property.findUnique({
      where: { id: property.id },
    });

    expect(stored).not.toBeNull();
    expect(stored?.deletedAt).not.toBeNull();

    await prisma.property.delete({
      where: { id: property.id },
    });
  });

  it("should reject deleting another user's property", async () => {
    const property = await createProperty({
      name: "Protected Delete",
      address: "11 Protected Street",
      city: "Protected City",
      state: "PD",
      zip: "11111",
      unitCount: 0,
      userId: otherUserId,
    });

    await expect(
      deleteProperty(property.id, testUserId),
    ).rejects.toThrow("Property not found");

    await prisma.property.delete({
      where: { id: property.id },
    });
  });
});
