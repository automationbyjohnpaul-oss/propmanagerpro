import { prisma } from "../lib/prisma";

export async function getAllUnits(userId: string) {
  return prisma.unit.findMany({
    where: { property: { userId } },
    orderBy: { createdAt: "desc" },
    include: { property: true },
  });
}

export async function getUnitById(id: string, userId: string) {
  return prisma.unit.findFirst({
    where: { id, property: { userId } },
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
    where: { id, property: { userId } },
  });
  if (!unit) throw new Error("Unit not found");

  return prisma.unit.update({ where: { id }, data });
}

export async function deleteUnit(id: string, userId: string) {
  const unit = await prisma.unit.findFirst({
    where: { id, property: { userId } },
  });
  if (!unit) throw new Error("Unit not found");

  return prisma.unit.delete({ where: { id } });
}
