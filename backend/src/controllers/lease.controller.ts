import { Request, Response } from "express";
import {
  getAllLeases,
  getLeaseById,
  createLease,
  updateLease,
  deleteLease,
  findActiveLeaseByUnit,
} from "../services/lease.service";
import { prisma } from "../lib/prisma";
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

    // Rule 2: Property must exist and belong to user (ownership check)
    const property = await prisma.property.findFirst({
      where: {
        id: validatedData.propertyId,
        userId,
        deletedAt: null,
      },
    });

    if (!property) {
      throw createError("Property not found", 404);
    }

    // Rule 3: Unit must exist
    const unit = await prisma.unit.findUnique({
      where: { id: validatedData.unitId },
    });

    if (!unit) {
      throw createError("Unit not found", 404);
    }

    // Rule 4: Tenant must exist
    const tenant = await prisma.tenant.findUnique({
      where: { id: validatedData.tenantId },
    });

    if (!tenant) {
      throw createError("Tenant not found", 404);
    }

    // Rule 5: Prevent multiple active leases on the same unit
    if (validatedData.isActive) {
      const activeLease = await findActiveLeaseByUnit(
        validatedData.unitId,
        userId,
      );

      if (activeLease) {
        throw createError("Unit already has an active lease", 409);
      }
    }

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

    // Pass userId to service for ownership verification
    const lease = await createLease(userId, leaseData);

    await createAuditLog(userId, "CREATE_LEASE", "Lease", lease.id, {
      propertyId: lease.propertyId,
      unitId: lease.unitId,
      tenantId: lease.tenantId,
      monthlyRent: Number(lease.monthlyRent),
      startDate: lease.startDate,
      endDate: lease.endDate,
      isActive: lease.isActive,
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

    // If propertyId is being updated, verify it exists and belongs to user
    if (validatedData.propertyId) {
      const property = await prisma.property.findFirst({
        where: {
          id: validatedData.propertyId,
          userId,
          deletedAt: null,
        },
      });

      if (!property) {
        throw createError("Property not found", 404);
      }
    }

    // If unitId is being updated, verify it exists
    if (validatedData.unitId) {
      const unit = await prisma.unit.findUnique({
        where: { id: validatedData.unitId },
      });

      if (!unit) {
        throw createError("Unit not found", 404);
      }
    }

    // If tenantId is being updated, verify it exists
    if (validatedData.tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: validatedData.tenantId },
      });

      if (!tenant) {
        throw createError("Tenant not found", 404);
      }
    }

    // Rule 5: Prevent multiple active leases on the same unit
    if (validatedData.isActive && validatedData.unitId) {
      const activeLease = await findActiveLeaseByUnit(
        validatedData.unitId,
        userId,
      );

      if (activeLease && activeLease.id !== leaseId) {
        throw createError("Unit already has an active lease", 409);
      }
    }

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
        isActive: existingLease.isActive,
      },
      newData: {
        propertyId: lease.propertyId,
        unitId: lease.unitId,
        tenantId: lease.tenantId,
        monthlyRent: Number(lease.monthlyRent),
        startDate: lease.startDate,
        endDate: lease.endDate,
        isActive: lease.isActive,
      },
    });

    return res.status(200).json(lease);
  },
);

// ============================================
// DELETE LEASE (Soft Delete)
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
      isActive: existingLease.isActive,
      deletedAt: new Date().toISOString(),
    });

    await deleteLease(leaseId, userId);
    return res.status(204).send();
  },
);
