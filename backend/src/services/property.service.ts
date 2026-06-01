import { prisma } from "../lib/prisma";

export async function getAllProperties(userId: string) {
  return prisma.property.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPropertyById(id: string, userId: string) {
  return prisma.property.findFirst({
    where: { id, userId },
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
  return prisma.property.create({ data });
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
    where: { id, userId },
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
    where: { id, userId },
  });

  if (!property) {
    throw new Error("Property not found");
  }

  return prisma.property.delete({
    where: { id },
  });
}
