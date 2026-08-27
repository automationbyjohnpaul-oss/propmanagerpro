import { prisma } from "../lib/prisma";
import { LeaseStatus } from "@prisma/client";

type CreateLeaseData = {
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status?: string;
  signedAt?: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
};

type UpdateLeaseData = {
  startDate?: string;
  endDate?: string;
  monthlyRent?: number;
  securityDeposit?: number;
  status?: string;
  signedAt?: string;
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
};

// ============================================
// GET ALL LEASES
// ============================================

export async function getAllLeases(userId: string) {
  return prisma.lease.findMany({
    where: {
      property: {
        userId,
      },
    },
    include: {
      property: true,
      unit: true,
      tenant: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// ============================================
// GET LEASE BY ID
// ============================================

export async function getLeaseById(id: string, userId: string) {
  return prisma.lease.findFirst({
    where: {
      id,
      property: {
        userId,
      },
    },
    include: {
      property: true,
      unit: true,
      tenant: true,
    },
  });
}

// ============================================
// FIND ACTIVE LEASE BY UNIT
// ============================================

export async function findActiveLeaseByUnit(unitId: string, userId: string) {
  return prisma.lease.findFirst({
    where: {
      unitId,
      status: "ACTIVE",
      property: {
        userId,
      },
    },
  });
}

// ============================================
// CREATE LEASE
// ============================================

export async function createLease(userId: string, data: CreateLeaseData) {
  return prisma.$transaction(async (tx) => {
    // ----------------------------------------
    // PROPERTY OWNERSHIP
    // ----------------------------------------

    const property = await tx.property.findFirst({
      where: {
        id: data.propertyId,
        userId,
        deletedAt: null,
      },
    });

    if (!property) {
      throw new Error("Property not found");
    }

    // ----------------------------------------
    // UNIT OWNERSHIP / PROPERTY CONSISTENCY
    // ----------------------------------------

    const unit = await tx.unit.findFirst({
      where: {
        id: data.unitId,
        propertyId: data.propertyId,
        deletedAt: null,
        property: {
          userId,
          deletedAt: null,
        },
      },
    });

    if (!unit) {
      throw new Error("Unit not found");
    }

    // ----------------------------------------
    // TENANT OWNERSHIP
    // ----------------------------------------

    const tenant = await tx.tenant.findFirst({
      where: {
        id: data.tenantId,
        userId,
        deletedAt: null,
      },
    });

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // ----------------------------------------
    // ACTIVE LEASE CONFLICT
    // ----------------------------------------

    if (data.status === "ACTIVE") {
      const conflictingLease = await tx.lease.findFirst({
        where: {
          unitId: data.unitId,
          status: "ACTIVE",
        },
      });

      if (conflictingLease) {
        throw new Error("Unit already has an active lease");
      }
    }

    // ----------------------------------------
    // CREATE
    // ----------------------------------------

    return tx.lease.create({
      data: {
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        monthlyRent: data.monthlyRent,
        securityDeposit: data.securityDeposit,
        status: (data.status as LeaseStatus) || "PENDING",
        signedAt: data.signedAt ? new Date(data.signedAt) : null,
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
  });
}

// ============================================
// UPDATE LEASE
// ============================================

export async function updateLease(
  id: string,
  userId: string,
  data: UpdateLeaseData,
) {
  return prisma.$transaction(async (tx) => {
    // ----------------------------------------
    // EXISTING LEASE OWNERSHIP
    // ----------------------------------------

    const existingLease = await tx.lease.findFirst({
      where: {
        id,
        property: {
          userId,
        },
      },
    });

    if (!existingLease) {
      throw new Error("Lease not found");
    }

    // ----------------------------------------
    // DETERMINE FINAL RELATIONSHIPS
    // ----------------------------------------

    const propertyId = data.propertyId ?? existingLease.propertyId;
    const unitId = data.unitId ?? existingLease.unitId;
    const tenantId = data.tenantId ?? existingLease.tenantId;

    // ----------------------------------------
    // DETERMINE FINAL DATES
    // ----------------------------------------

    const startDate = data.startDate
      ? new Date(data.startDate)
      : existingLease.startDate;

    const endDate = data.endDate
      ? new Date(data.endDate)
      : existingLease.endDate;

    if (endDate <= startDate) {
      throw new Error("End date must be after start date");
    }

    // ----------------------------------------
    // PROPERTY OWNERSHIP
    // ----------------------------------------

    const property = await tx.property.findFirst({
      where: {
        id: propertyId,
        userId,
        deletedAt: null,
      },
    });

    if (!property) {
      throw new Error("Property not found");
    }

    // ----------------------------------------
    // UNIT OWNERSHIP / PROPERTY CONSISTENCY
    // ----------------------------------------

    const unit = await tx.unit.findFirst({
      where: {
        id: unitId,
        propertyId,
        deletedAt: null,
        property: {
          userId,
          deletedAt: null,
        },
      },
    });

    if (!unit) {
      throw new Error("Unit not found");
    }

    // ----------------------------------------
    // TENANT OWNERSHIP
    // ----------------------------------------

    const tenant = await tx.tenant.findFirst({
      where: {
        id: tenantId,
        userId,
        deletedAt: null,
      },
    });

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // ----------------------------------------
    // ACTIVE LEASE CONFLICT
    // ----------------------------------------

    const finalStatus =
      data.status !== undefined
        ? (data.status as LeaseStatus)
        : existingLease.status;

    if (finalStatus === "ACTIVE") {
      const conflictingLease = await tx.lease.findFirst({
        where: {
          unitId,
          status: "ACTIVE",
          id: {
            not: id,
          },
        },
      });

      if (conflictingLease) {
        throw new Error("Unit already has an active lease");
      }
    }

    // ----------------------------------------
    // PREPARE UPDATE
    // ----------------------------------------

    const updateData: any = {
      ...data,
      propertyId,
      unitId,
      tenantId,
      startDate,
      endDate,
    };

    if (data.signedAt) {
      updateData.signedAt = new Date(data.signedAt);
    }

    if (data.status) {
      updateData.status = data.status as LeaseStatus;
    }

    // ----------------------------------------
    // UPDATE
    // ----------------------------------------

    return tx.lease.update({
      where: { id },
      data: updateData,
      include: {
        property: true,
        unit: true,
        tenant: true,
      },
    });
  });
}

// ============================================
// ACTIVATE LEASE
// PENDING -> ACTIVE
// ============================================

export async function activateLease(id: string, userId: string) {
  const lease = await prisma.lease.findFirst({
    where: {
      id,
      property: {
        userId,
      },
    },
  });

  if (!lease) {
    throw new Error("Lease not found");
  }

  if (lease.status !== "PENDING") {
    throw new Error(`Cannot activate lease with status: ${lease.status}`);
  }

  const conflicting = await prisma.lease.findFirst({
    where: {
      unitId: lease.unitId,
      status: "ACTIVE",
      id: {
        not: id,
      },
    },
  });

  if (conflicting) {
    throw new Error("Unit already has an active lease");
  }

  return prisma.lease.update({
    where: { id },
    data: {
      status: "ACTIVE",
    },
    include: {
      property: true,
      unit: true,
      tenant: true,
    },
  });
}

// ============================================
// TERMINATE LEASE
// ACTIVE -> TERMINATED
// ============================================

export async function terminateLease(
  id: string,
  userId: string,
  reason: string,
) {
  const lease = await prisma.lease.findFirst({
    where: {
      id,
      property: {
        userId,
      },
    },
  });

  if (!lease) {
    throw new Error("Lease not found");
  }

  if (lease.status !== "ACTIVE") {
    throw new Error(`Cannot terminate lease with status: ${lease.status}`);
  }

  return prisma.lease.update({
    where: { id },
    data: {
      status: "TERMINATED",
      terminatedAt: new Date(),
      terminationReason: reason,
    },
    include: {
      property: true,
      unit: true,
      tenant: true,
    },
  });
}

// ============================================
// RESTORE LEASE
// TERMINATED -> ACTIVE
// ============================================

export async function restoreLease(id: string, userId: string) {
  const lease = await prisma.lease.findFirst({
    where: {
      id,
      property: {
        userId,
      },
    },
  });

  if (!lease) {
    throw new Error("Lease not found");
  }

  if (lease.status !== "TERMINATED") {
    throw new Error(`Cannot restore lease with status: ${lease.status}`);
  }

  const conflicting = await prisma.lease.findFirst({
    where: {
      unitId: lease.unitId,
      status: "ACTIVE",
      id: {
        not: id,
      },
    },
  });

  if (conflicting) {
    throw new Error("Unit already has an active lease");
  }

  return prisma.lease.update({
    where: { id },
    data: {
      status: "ACTIVE",
      terminatedAt: null,
      terminationReason: null,
    },
    include: {
      property: true,
      unit: true,
      tenant: true,
    },
  });
}

// ============================================
// END LEASE
// ACTIVE -> ENDED
// ============================================

export async function endLease(id: string, userId: string) {
  const lease = await prisma.lease.findFirst({
    where: {
      id,
      property: {
        userId,
      },
    },
  });

  if (!lease) {
    throw new Error("Lease not found");
  }

  if (lease.status !== "ACTIVE") {
    throw new Error(`Cannot end lease with status: ${lease.status}`);
  }

  return prisma.lease.update({
    where: { id },
    data: {
      status: "ENDED",
    },
    include: {
      property: true,
      unit: true,
      tenant: true,
    },
  });
}
