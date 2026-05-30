import { prisma } from "../lib/prisma";

export async function getAllProperties() {
  return prisma.property.findMany({
    orderBy: {
      createdAt: "desc",
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
}) {
  return prisma.property.create({
    data,
  });
}

export async function updateProperty(
  id: string,
  data: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    unitCount: number;
  },
) {
  return prisma.property.update({
    where: { id },
    data,
  });
}

export async function deleteProperty(id: string) {
  return prisma.property.delete({
    where: { id },
  });
}
