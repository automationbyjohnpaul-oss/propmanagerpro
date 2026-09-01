import { prisma } from "../lib/prisma";

export async function getAllProperties(
  userId: string,
  status: "active" | "archived" = "active",
) {
  return prisma.property.findMany({
    where: {
      userId,
      ...(status === "archived"
        ? { deletedAt: { not: null } }
        : { deletedAt: null }),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPropertyById(id: string, userId: string) {
  return prisma.property.findFirst({
    where: {
      id,
      userId,
      deletedAt: null,
    },
    include: {
      units: { orderBy: { unitNumber: "asc" } },
    },
  });
}

export async function createProperty(data: {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  unitCount: number;
  userId: string;
}) {
  return await prisma.$transaction(async (tx) => {
    // 1. Create property
    const property = await tx.property.create({
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        unitCount: data.unitCount,
        userId: data.userId,
      },
    });

    // 2. AUTO-CREATE UNITS
    if (data.unitCount > 0) {
      await tx.unit.createMany({
        data: Array.from({ length: data.unitCount }, (_, i) => ({
          unitNumber: String(i + 1),
          propertyId: property.id,
          bedrooms: 1,
          bathrooms: 1,
          rentAmount: 0,
        })),
      });
    }

    return property;
  });
}

export async function updateProperty(
  id: string,
  userId: string,
  data: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    unitCount: number;
  },
) {
  const property = await prisma.property.findFirst({
    where: { id, userId, deletedAt: null },
  });

  if (!property) {
    throw new Error("Property not found");
  }

  return prisma.property.update({
    where: { id },
    data,
  });
}

export async function deleteProperty(id: string, userId: string) {
  const property = await prisma.property.findFirst({
    where: { id, userId, deletedAt: null },
  });

  if (!property) {
    throw new Error("Property not found");
  }

  // ✅ SOFT DELETE (preserves audit history, prevents data loss)
  return prisma.property.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
}

// ============================================
// ARCHIVE PROPERTY
// ============================================
export async function archiveProperty(id: string, userId: string) {
  const property = await prisma.property.findFirst({
    where: {
      id,
      userId,
      deletedAt: null,
    },
  });

  if (!property) {
    throw new Error("Active property not found");
  }

  return prisma.property.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
}

// ============================================
// RESTORE PROPERTY
// ============================================
export async function restoreProperty(id: string, userId: string) {
  const property = await prisma.property.findFirst({
    where: {
      id,
      userId,
      deletedAt: { not: null },
    },
  });

  if (!property) {
    throw new Error("Archived property not found");
  }

  return prisma.property.update({
    where: { id },
    data: {
      deletedAt: null,
    },
  });
}
