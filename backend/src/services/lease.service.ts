import { prisma } from "../lib/prisma";

export async function getAllLeases(userId: string) {
  return prisma.lease.findMany({
    where: {
      property: {
        userId,
        deletedAt: null, // 👈 Add this
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      property: true,
      unit: true,
      tenant: true,
    },
  });
}

export async function getLeaseById(id: string, userId: string) {
  return prisma.lease.findFirst({
    where: {
      id,
      property: {
        userId,
        deletedAt: null, // 👈 Add this
      },
    },
    include: {
      property: true,
      unit: true,
      tenant: true,
    },
  });
}

export async function createLease(data: {
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  isActive: boolean;
  propertyId: string;
  unitId: string;
  tenantId: string;
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
      "Cannot create lease: Property not found or has been deleted",
    );
  }

  return prisma.lease.create({
    data: {
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      monthlyRent: data.monthlyRent,
      securityDeposit: data.securityDeposit,
      isActive: data.isActive,
      propertyId: data.propertyId,
      unitId: data.unitId,
      tenantId: data.tenantId,
    },
    include: {
      property: true,
      unit: true,
      tenant: true,
    },
  });
}

export async function updateLease(
  id: string,
  userId: string,
  data: {
    startDate?: string;
    endDate?: string;
    monthlyRent?: number;
    securityDeposit?: number;
    isActive?: boolean;
    propertyId?: string;
    unitId?: string;
    tenantId?: string;
  },
) {
  const lease = await prisma.lease.findFirst({
    where: {
      id,
      property: {
        userId,
        deletedAt: null, // 👈 Add this
      },
    },
  });

  if (!lease) throw new Error("Lease not found");

  // Build update data dynamically to handle optional date fields
  const updateData: any = { ...data };
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);

  return prisma.lease.update({
    where: { id },
    data: updateData,
    include: {
      property: true,
      unit: true,
      tenant: true,
    },
  });
}

export async function deleteLease(id: string, userId: string) {
  const lease = await prisma.lease.findFirst({
    where: {
      id,
      property: {
        userId,
        deletedAt: null, // 👈 Add this
      },
    },
  });

  if (!lease) throw new Error("Lease not found");

  return prisma.lease.delete({
    where: { id },
  });
}

export async function findActiveLeaseByUnit(unitId: string, userId: string) {
  return prisma.lease.findFirst({
    where: {
      unitId,
      isActive: true,
      property: {
        userId,
        deletedAt: null, // 👈 Add this
      },
    },
  });
}
