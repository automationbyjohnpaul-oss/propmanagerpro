import { prisma } from "../lib/prisma";

export async function getAllUnits(userId: string) {
  return prisma.unit.findMany({
    where: {
      property: {
        userId,
        deletedAt: null, // 👈 Add this
      },
    },
    orderBy: { createdAt: "desc" },
    include: { property: true },
  });
}

export async function getUnitById(id: string, userId: string) {
  return prisma.unit.findFirst({
    where: {
      id,
      property: {
        userId,
        deletedAt: null, // 👈 Add this
      },
    },
    include: { property: true },
  });
}

export async function createUnit(data: {
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  rentAmount: number;
  propertyId: string;
}) {
  // First check if the property exists and is not deleted
  const property = await prisma.property.findFirst({
    where: {
      id: data.propertyId,
      deletedAt: null,
    },
  });

  if (!property) {
    throw new Error(
      "Cannot create unit: Property not found or has been deleted",
    );
  }

  return prisma.unit.create({ data });
}

export async function updateUnit(
  id: string,
  userId: string,
  data: {
    unitNumber: string;
    bedrooms: number;
    bathrooms: number;
    squareFeet?: number;
    rentAmount: number;
    propertyId: string;
  },
) {
  const unit = await prisma.unit.findFirst({
    where: {
      id,
      property: {
        userId,
        deletedAt: null, // 👈 Add this
      },
    },
  });
  if (!unit) throw new Error("Unit not found");

  return prisma.unit.update({ where: { id }, data });
}

export async function deleteUnit(id: string, userId: string) {
  const unit = await prisma.unit.findFirst({
    where: {
      id,
      property: {
        userId,
        deletedAt: null, // 👈 Add this
      },
    },
  });
  if (!unit) throw new Error("Unit not found");

  return prisma.unit.delete({ where: { id } });
}
