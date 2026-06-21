import { Request, Response } from "express";
import {
  getAllUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit,
  restoreUnit,
} from "../services/unit.service";
import { prisma } from "../lib/prisma";
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
// GET UNITS
// ============================================
export const getUnits = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { propertyId, status } = req.query;

  if (!propertyId || typeof propertyId !== "string") {
    throw createError("propertyId query parameter is required", 400);
  }

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      userId,
      deletedAt: null,
    },
  });

  if (!property) {
    throw createError("Property not found", 404);
  }

  const unitStatus = status === "archived" ? "archived" : "active";
  const units = await getAllUnits(userId, unitStatus, propertyId);

  return res.status(200).json(units);
});

// ============================================
// GET SINGLE UNIT
// ============================================
export const getUnit = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const unit = await getUnitById(req.params.id as string, userId);

  if (!unit) {
    throw createError("Unit not found", 404);
  }

  return res.status(200).json(unit);
});

// ============================================
// CREATE UNIT
// ============================================
export const createUnitHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const unit = await createUnit(userId, req.body);

    await createAuditLog(userId, "CREATE_UNIT", "Unit", unit.id, {
      unitNumber: unit.unitNumber,
      propertyId: unit.propertyId,
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      rentAmount: Number(unit.rentAmount),
      squareFeet: unit.squareFeet,
    });

    return res.status(201).json(unit);
  },
);

// ============================================
// UPDATE UNIT
// ============================================
export const updateUnitHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const unitId = req.params.id as string;

    const existingUnit = await getUnitById(unitId, userId);

    if (!existingUnit) {
      throw createError("Unit not found", 404);
    }

    const unit = await updateUnit(unitId, userId, req.body);

    await createAuditLog(userId, "UPDATE_UNIT", "Unit", unit.id, {
      updatedFields: Object.keys(req.body),
      previousData: {
        unitNumber: existingUnit.unitNumber,
        bedrooms: existingUnit.bedrooms,
        bathrooms: existingUnit.bathrooms,
        rentAmount: Number(existingUnit.rentAmount),
        squareFeet: existingUnit.squareFeet,
      },
      newData: {
        unitNumber: unit.unitNumber,
        bedrooms: unit.bedrooms,
        bathrooms: unit.bathrooms,
        rentAmount: Number(unit.rentAmount),
        squareFeet: unit.squareFeet,
      },
    });

    return res.status(200).json(unit);
  },
);

// ============================================
// ARCHIVE UNIT (Soft Delete)
// ============================================
export const archiveUnitHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const unitId = req.params.id as string;

    const existingUnit = await getUnitById(unitId, userId);

    if (!existingUnit) {
      throw createError("Unit not found", 404);
    }

    // Check for active leases
    const activeLease = await prisma.lease.findFirst({
      where: {
        unitId: unitId,
        status: "ACTIVE",
        endDate: { gt: new Date() },
      },
    });

    if (activeLease) {
      throw createError("Cannot archive unit with active lease", 409);
    }

    // Soft delete - set deletedAt
    await prisma.unit.update({
      where: { id: unitId },
      data: { deletedAt: new Date() },
    });

    await createAuditLog(userId, "ARCHIVE_UNIT", "Unit", unitId, {
      unitNumber: existingUnit.unitNumber,
      propertyId: existingUnit.propertyId,
      bedrooms: existingUnit.bedrooms,
      bathrooms: existingUnit.bathrooms,
      rentAmount: Number(existingUnit.rentAmount),
      archivedAt: new Date().toISOString(),
    });

    return res.status(200).json({ success: true });
  },
);

// ============================================
// RESTORE UNIT
// ============================================
export const restoreUnitHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    // Clear deletedAt
    await prisma.unit.update({
      where: { id },
      data: { deletedAt: null },
    });

    const restored = await getUnitById(id, userId);

    if (!restored) {
      throw createError("Unit not found after restore", 500);
    }

    await createAuditLog(userId, "RESTORE_UNIT", "Unit", restored.id, {
      unitNumber: restored.unitNumber,
      propertyId: restored.propertyId,
      bedrooms: restored.bedrooms,
      bathrooms: restored.bathrooms,
      rentAmount: Number(restored.rentAmount),
      restoredAt: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, unit: restored });
  },
);

// ============================================
// DELETE UNIT (Hard Delete - Use with caution)
// ============================================
export const deleteUnitHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const unitId = req.params.id as string;

    const existingUnit = await getUnitById(unitId, userId);

    if (!existingUnit) {
      throw createError("Unit not found", 404);
    }

    const leaseCount = await prisma.lease.count({
      where: { unitId: unitId },
    });

    if (leaseCount > 0) {
      throw createError(
        "Cannot delete unit with lease history. Archive it instead.",
        409,
      );
    }

    await deleteUnit(unitId, userId);

    await createAuditLog(userId, "DELETE_UNIT", "Unit", unitId, {
      unitNumber: existingUnit.unitNumber,
      propertyId: existingUnit.propertyId,
      bedrooms: existingUnit.bedrooms,
      bathrooms: existingUnit.bathrooms,
      rentAmount: Number(existingUnit.rentAmount),
      deletedAt: new Date().toISOString(),
      note: "Hard delete - use with caution",
    });

    return res.status(200).json({ success: true });
  },
);
