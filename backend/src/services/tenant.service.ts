import { prisma } from "../lib/prisma";

export async function getAllTenants(userId: string, status?: string) {
  const where: any = { userId };

  if (status === "archived") {
    where.deletedAt = { not: null };
  } else {
    where.deletedAt = null;
  }

  const tenants = await prisma.tenant.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      leases: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
    },
  });

  return tenants.map((tenant) => ({
    ...tenant,
    hasActiveLease: tenant.leases.length > 0,
    activeLeaseCount: tenant.leases.length,
    leases: undefined,
  }));
}

export async function getTenantById(id: string, userId: string) {
  const tenant = await prisma.tenant.findFirst({
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

  if (!tenant) return null;

  return {
    ...tenant,
    hasActiveLease: tenant.leases.some((l) => l.status === "ACTIVE"),
    activeLeaseCount: tenant.leases.filter((l) => l.status === "ACTIVE").length,
  };
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

export async function archiveTenant(id: string, userId: string) {
  const tenant = await prisma.tenant.findFirst({
    where: { id, userId, deletedAt: null },
  });

  if (!tenant) throw new Error("Tenant not found");

  return prisma.tenant.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function restoreTenant(id: string, userId: string) {
  const tenant = await prisma.tenant.findFirst({
    where: { id, userId, deletedAt: { not: null } },
  });

  if (!tenant) throw new Error("Tenant not found");

  return prisma.tenant.update({
    where: { id },
    data: { deletedAt: null },
  });
}

export async function deleteTenant(id: string, userId: string) {
  const tenant = await prisma.tenant.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  // NEVER hard-delete a tenant with lease history.
  const leaseCount = await prisma.lease.count({
    where: { tenantId: id },
  });

  if (leaseCount > 0) {
    throw new Error(
      "Cannot delete tenant with lease history. Archive the tenant instead.",
    );
  }

  return prisma.tenant.delete({
    where: { id },
  });
}
