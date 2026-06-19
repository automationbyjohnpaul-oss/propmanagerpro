import { prisma } from "../lib/prisma";

// ============================================
// GET ALL UNITS (FILTERED)
// ============================================
export async function getAllUnits(
  userId: string,
  status: "active" | "archived" = "active",
  propertyId?: string,
) {
  return prisma.unit.findMany({
    where: {
      deletedAt: status === "archived" ? { not: null } : null,

      property: {
        userId,
        deletedAt: null,

        ...(propertyId ? { id: propertyId } : {}),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      property: true,
    },
  });
}

// ============================================
// GET UNIT BY ID
// ============================================
export async function getUnitById(id: string, userId: string) {
  return prisma.unit.findFirst({
    where: {
      id,
      property: {
        userId,
        deletedAt: null,
      },
    },
    include: {
      property: true,
    },
  });
}

// ============================================
// CREATE UNIT (with transaction support)
// ============================================
export async function createUnit(
  userId: string,
  data: any,
  tx?: any, // 👈 Added transaction support
) {
  const client = tx || prisma;

  const property = await client.property.findFirst({
    where: {
      id: data.propertyId,
      userId,
      deletedAt: null,
    },
  });

  if (!property) {
    throw new Error("Property not found or access denied");
  }

  return client.unit.create({
    data,
    include: {
      property: true,
    },
  });
}

// ============================================
// UPDATE UNIT (with transaction support)
// ============================================
export async function updateUnit(
  id: string,
  userId: string,
  data: any,
  tx?: any, // 👈 Added transaction support
) {
  const client = tx || prisma;

  const unit = await client.unit.findFirst({
    where: {
      id,
      property: {
        userId,
        deletedAt: null,
      },
      deletedAt: null,
    },
  });

  if (!unit) {
    throw new Error("Unit not found");
  }

  return client.unit.update({
    where: { id },
    data,
    include: {
      property: true,
    },
  });
}

// ============================================
// SOFT DELETE (ARCHIVE) - with transaction support
// ============================================
export async function deleteUnit(
  id: string,
  userId: string,
  tx?: any, // 👈 Added transaction support
) {
  const client = tx || prisma;

  const unit = await client.unit.findFirst({
    where: {
      id,
      property: {
        userId,
        deletedAt: null,
      },
      deletedAt: null,
    },
  });

  if (!unit) {
    throw new Error("Unit not found");
  }

  return client.unit.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
    include: {
      property: true,
    },
  });
}

// ============================================
// RESTORE UNIT (with transaction support)
// ============================================
export async function restoreUnit(
  id: string,
  userId: string,
  tx?: any, // 👈 Added transaction support
) {
  const client = tx || prisma;

  const unit = await client.unit.findFirst({
    where: {
      id,
      deletedAt: { not: null },
      property: {
        userId,
        deletedAt: null,
      },
    },
  });

  if (!unit) {
    throw new Error("Archived unit not found");
  }

  return client.unit.update({
    where: { id },
    data: {
      deletedAt: null,
    },
    include: {
      property: true,
    },
  });
}

// ============================================
// HARD DELETE (Use with caution - with transaction support)
// ============================================
export async function hardDeleteUnit(
  id: string,
  userId: string,
  tx?: any, // 👈 Added transaction support
) {
  const client = tx || prisma;

  const unit = await client.unit.findFirst({
    where: {
      id,
      property: {
        userId,
        deletedAt: null,
      },
    },
  });

  if (!unit) {
    throw new Error("Unit not found");
  }

  // Check if unit has any leases
  const leaseCount = await client.lease.count({
    where: { unitId: id },
  });

  if (leaseCount > 0) {
    throw new Error(
      "Cannot delete unit with lease history. Archive it instead.",
    );
  }

  return client.unit.delete({
    where: { id },
  });
}
