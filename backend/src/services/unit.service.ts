import { prisma } from "../lib/prisma";

export async function getAllUnits() {
  return prisma.unit.findMany({
    orderBy: { createdAt: "desc" },
    include: { property: true },
  });
}

export async function getUnitById(id: string) {
  return prisma.unit.findUnique({
    where: { id },
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
  data: {
    unitNumber: string;
    bedrooms: number;
    bathrooms: number;
    squareFeet?: number;
    rentAmount: number;
    propertyId: string;
  },
) {
  return prisma.unit.update({
    where: { id },
    data,
  });
}

export async function deleteUnit(id: string) {
  return prisma.unit.delete({
    where: { id },
  });
}
