import { Request, Response } from "express";
import {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  archiveProperty as archivePropertyService,
  restoreProperty as restorePropertyService,
} from "../services/property.service";
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
// GET PROPERTIES
// ============================================
export const getProperties = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const { status } = req.query;

    const where = {
      userId,
      ...(status === "archived"
        ? { deletedAt: { not: null } }
        : { deletedAt: null }),
    };

    const properties = await prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(properties);
  },
);

// ============================================
// GET SINGLE PROPERTY
// ============================================
export const getProperty = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const property = await getPropertyById(req.params.id as string, userId);

  if (!property) {
    throw createError("Property not found", 404);
  }

  return res.status(200).json(property);
});

// ============================================
// CREATE PROPERTY
// ============================================
export const createPropertyHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const property = await createProperty({
      ...req.body,
      userId: userId,
    });

    await createAuditLog(userId, "CREATE_PROPERTY", "Property", property.id, {
      name: property.name,
      address: property.address,
      unitCount: property.unitCount,
    });

    return res.status(201).json(property);
  },
);

// ============================================
// UPDATE PROPERTY
// ============================================
export const updatePropertyHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const propertyId = req.params.id as string;

    const existingProperty = await getPropertyById(propertyId, userId);

    if (!existingProperty) {
      throw createError("Property not found", 404);
    }

    const property = await updateProperty(propertyId, userId, req.body);

    await createAuditLog(userId, "UPDATE_PROPERTY", "Property", property.id, {
      updatedFields: Object.keys(req.body),
      previousData: {
        name: existingProperty.name,
        address: existingProperty.address,
        unitCount: existingProperty.unitCount,
      },
      newData: {
        name: property.name,
        address: property.address,
        unitCount: property.unitCount,
      },
    });

    return res.status(200).json(property);
  },
);

// ============================================
// ARCHIVE PROPERTY
// ============================================
export const archiveProperty = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    const property = await getPropertyById(id, userId);

    if (!property) {
      throw createError("Active property not found", 404);
    }

    const updated = await archivePropertyService(id, userId);

    await createAuditLog(userId, "ARCHIVE_PROPERTY", "Property", id, {
      name: property.name,
      address: property.address,
      unitCount: property.unitCount,
      archivedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      message: "Property archived successfully",
      property: updated,
    });
  },
);

// ============================================
// RESTORE PROPERTY
// ============================================
export const restoreProperty = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    const restored = await restorePropertyService(id, userId);

    await createAuditLog(userId, "RESTORE_PROPERTY", "Property", id, {
      name: restored.name,
      address: restored.address,
      unitCount: restored.unitCount,
      restoredAt: new Date().toISOString(),
    });

    return res.status(200).json({
      message: "Property restored successfully",
      property: restored,
    });
  },
);

// ============================================
// DELETE PROPERTY (Soft Delete)
// ============================================
export const deletePropertyHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : String(idParam);

    const property = await getPropertyById(id, userId);

    if (!property) {
      throw createError("Property not found", 404);
    }

    await deleteProperty(id, userId);

    await createAuditLog(userId, "DELETE_PROPERTY", "Property", id, {
      name: property.name,
      address: property.address,
      unitCount: property.unitCount,
      deletedAt: new Date().toISOString(),
    });

    return res.status(204).send();
  },
);
