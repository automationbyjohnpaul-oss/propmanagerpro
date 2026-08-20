import { Request, Response } from "express";
import {
  getAllLeases,
  getLeaseById,
  createLease,
  updateLease,
  deleteLease,
  findActiveLeaseByUnit,
  activateLease,
  terminateLease,
  restoreLease,
  endLease,
} from "../services/lease.service";
import {
  createLeaseSchema,
  updateLeaseSchema,
} from "../validators/lease.validator";
import { createAuditLog } from "../services/audit.service";
import { asyncHandler } from "../middleware/asyncHandler";

// ============================================
// HELPERS
// ============================================

function getUserId(req: Request): string {
  return (req as any).userId;
}

function createError(message: string, statusCode: number) {
  const err = new Error(message) as any;
  err.statusCode = statusCode;
  return err;
}

// ============================================
// GET LEASES
// ============================================
export const getLeases = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const leases = await getAllLeases(userId);
  return res.status(200).json(leases);
});

// ============================================
// GET SINGLE LEASE
// ============================================
export const getLease = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const lease = await getLeaseById(req.params.id as string, userId);

  if (!lease) {
    throw createError("Lease not found", 404);
  }

  return res.status(200).json(lease);
});

// ============================================
// CREATE LEASE
// ============================================
export const createLeaseHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const validation = createLeaseSchema.safeParse(req.body);

    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      const error = new Error("Validation failed") as any;
      error.statusCode = 400;
      error.errors = errors;
      throw error;
    }

    const validatedData = validation.data;

    // Convert Date objects to ISO strings for Prisma
    const leaseData = {
      ...validatedData,
      startDate:
        validatedData.startDate instanceof Date
          ? validatedData.startDate.toISOString()
          : validatedData.startDate,
      endDate:
        validatedData.endDate instanceof Date
          ? validatedData.endDate.toISOString()
          : validatedData.endDate,
      signedAt:
        validatedData.signedAt instanceof Date
          ? validatedData.signedAt.toISOString()
          : validatedData.signedAt,
    };

    // Service handles all ownership and business rule checks
    const lease = await createLease(userId, leaseData);

    await createAuditLog(userId, "CREATE_LEASE", "Lease", lease.id, {
      propertyId: lease.propertyId,
      unitId: lease.unitId,
      tenantId: lease.tenantId,
      monthlyRent: Number(lease.monthlyRent),
      startDate: lease.startDate,
      endDate: lease.endDate,
      status: lease.status,
    });

    return res.status(201).json(lease);
  },
);

// ============================================
// UPDATE LEASE
// ============================================
export const updateLeaseHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const leaseId = req.params.id as string;

    const existingLease = await getLeaseById(leaseId, userId);

    if (!existingLease) {
      throw createError("Lease not found", 404);
    }

    const validation = updateLeaseSchema.safeParse(req.body);

    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      const error = new Error("Validation failed") as any;
      error.statusCode = 400;
      error.errors = errors;
      throw error;
    }

    const validatedData = validation.data;

    // Convert Date objects to ISO strings for Prisma
    const updateData: any = { ...validatedData };
    if (validatedData.startDate instanceof Date) {
      updateData.startDate = validatedData.startDate.toISOString();
    }
    if (validatedData.endDate instanceof Date) {
      updateData.endDate = validatedData.endDate.toISOString();
    }
    if (validatedData.signedAt instanceof Date) {
      updateData.signedAt = validatedData.signedAt.toISOString();
    }

    // Service handles all ownership and business rule checks
    const lease = await updateLease(leaseId, userId, updateData);

    await createAuditLog(userId, "UPDATE_LEASE", "Lease", lease.id, {
      updatedFields: Object.keys(req.body),
      previousData: {
        propertyId: existingLease.propertyId,
        unitId: existingLease.unitId,
        tenantId: existingLease.tenantId,
        monthlyRent: Number(existingLease.monthlyRent),
        startDate: existingLease.startDate,
        endDate: existingLease.endDate,
        status: existingLease.status,
      },
      newData: {
        propertyId: lease.propertyId,
        unitId: lease.unitId,
        tenantId: lease.tenantId,
        monthlyRent: Number(lease.monthlyRent),
        startDate: lease.startDate,
        endDate: lease.endDate,
        status: lease.status,
      },
    });

    return res.status(200).json(lease);
  },
);

// ============================================
// DELETE LEASE
// ============================================
export const deleteLeaseHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const leaseId = req.params.id as string;

    const existingLease = await getLeaseById(leaseId, userId);

    if (!existingLease) {
      throw createError("Lease not found", 404);
    }

    await createAuditLog(userId, "DELETE_LEASE", "Lease", existingLease.id, {
      propertyId: existingLease.propertyId,
      unitId: existingLease.unitId,
      tenantId: existingLease.tenantId,
      monthlyRent: Number(existingLease.monthlyRent),
      startDate: existingLease.startDate,
      endDate: existingLease.endDate,
      status: existingLease.status,
      deletedAt: new Date().toISOString(),
    });

    await deleteLease(leaseId, userId);
    return res.status(204).send();
  },
);

// ============================================
// ACTIVATE LEASE (PENDING → ACTIVE)
// ============================================
export const activateLeaseHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const leaseId = req.params.id as string;

    const existingLease = await getLeaseById(leaseId, userId);
    if (!existingLease) throw createError("Lease not found", 404);

    const lease = await activateLease(leaseId, userId);

    await createAuditLog(userId, "LEASE_ACTIVATED", "Lease", lease.id, {
      previousStatus: existingLease.status,
      newStatus: lease.status,
      unitId: lease.unitId,
      tenantId: lease.tenantId,
    });

    return res.status(200).json(lease);
  },
);

// ============================================
// TERMINATE LEASE (ACTIVE → TERMINATED)
// ============================================
export const terminateLeaseHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const leaseId = req.params.id as string;
    const { reason } = req.body;

    if (!reason || typeof reason !== "string") {
      throw createError("Termination reason is required", 400);
    }

    const existingLease = await getLeaseById(leaseId, userId);
    if (!existingLease) throw createError("Lease not found", 404);

    const lease = await terminateLease(leaseId, userId, reason);

    await createAuditLog(userId, "LEASE_TERMINATED", "Lease", lease.id, {
      previousStatus: existingLease.status,
      newStatus: lease.status,
      reason,
      unitId: lease.unitId,
      tenantId: lease.tenantId,
    });

    return res.status(200).json(lease);
  },
);

// ============================================
// RESTORE LEASE (TERMINATED → ACTIVE)
// ============================================
export const restoreLeaseHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const leaseId = req.params.id as string;

    const existingLease = await getLeaseById(leaseId, userId);
    if (!existingLease) throw createError("Lease not found", 404);

    const lease = await restoreLease(leaseId, userId);

    await createAuditLog(userId, "LEASE_RESTORED", "Lease", lease.id, {
      previousStatus: existingLease.status,
      newStatus: lease.status,
      unitId: lease.unitId,
      tenantId: lease.tenantId,
    });

    return res.status(200).json(lease);
  },
);

// ============================================
// END LEASE (ACTIVE → ENDED)
// ============================================
export const endLeaseHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const leaseId = req.params.id as string;

    const existingLease = await getLeaseById(leaseId, userId);
    if (!existingLease) throw createError("Lease not found", 404);

    const lease = await endLease(leaseId, userId);

    await createAuditLog(userId, "LEASE_ENDED", "Lease", lease.id, {
      previousStatus: existingLease.status,
      newStatus: lease.status,
      unitId: lease.unitId,
      tenantId: lease.tenantId,
    });

    return res.status(200).json(lease);
  },
);
