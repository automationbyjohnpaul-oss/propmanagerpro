import { prisma } from "../lib/prisma";

export async function getAllTenants(userId: string) {
  return prisma.tenant.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      leases: {
        include: {
          unit: true,
          property: true,
        },
      },
    },
  });
}

export async function getTenantById(id: string, userId: string) {
  return prisma.tenant.findFirst({
    where: { id, userId },
    include: {
      leases: {
        include: {
          unit: true,
          property: true,
        },
      },
      payments: true,
    },
  });
}

export async function createTenant(
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    emergencyContact?: string;
  },
  userId: string,
) {
  return prisma.tenant.create({
    data: {
      ...data,
      userId,
    },
  });
}

export async function updateTenant(
  id: string,
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    emergencyContact?: string;
  },
) {
  const tenant = await prisma.tenant.findFirst({
    where: { id, userId },
  });

  if (!tenant) throw new Error("Tenant not found");

  return prisma.tenant.update({
    where: { id },
    data,
  });
}

export async function deleteTenant(id: string, userId: string) {
  const tenant = await prisma.tenant.findFirst({
    where: { id, userId },
  });

  if (!tenant) throw new Error("Tenant not found");

  return prisma.tenant.delete({
    where: { id },
  });
}
