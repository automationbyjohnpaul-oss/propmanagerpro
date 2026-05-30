import { prisma } from "../lib/prisma";

export async function getAllLeases() {
  return prisma.lease.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      property: true,
      unit: true,
      tenant: true,
    },
  });
}

export async function getLeaseById(id: string) {
  return prisma.lease.findUnique({
    where: { id },
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
  data: {
    startDate: string;
    endDate: string;
    monthlyRent: number;
    securityDeposit: number;
    isActive: boolean;
    propertyId: string;
    unitId: string;
    tenantId: string;
  },
) {
  return prisma.lease.update({
    where: { id },
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

export async function deleteLease(id: string) {
  return prisma.lease.delete({
    where: { id },
  });
}

export async function findActiveLeaseByUnit(unitId: string) {
  return prisma.lease.findFirst({
    where: {
      unitId,
      isActive: true,
    },
  });
}
