import { prisma } from "../lib/prisma";

export async function getAllTenants() {
  return prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getTenantById(id: string) {
  return prisma.tenant.findUnique({
    where: { id },
  });
}

export async function createTenant(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  emergencyContact?: string;
}) {
  return prisma.tenant.create({ data });
}

export async function updateTenant(
  id: string,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    emergencyContact?: string;
  },
) {
  return prisma.tenant.update({
    where: { id },
    data,
  });
}

export async function deleteTenant(id: string) {
  return prisma.tenant.delete({
    where: { id },
  });
}
