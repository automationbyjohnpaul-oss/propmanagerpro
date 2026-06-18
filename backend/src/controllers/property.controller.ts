import { Request, Response } from "express";
import {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
} from "../services/property.service";
import {
  createPropertySchema,
  updatePropertySchema,
} from "../validators/property.validator";
import { prisma } from "../lib/prisma";

export async function getProperties(req: Request, res: Response) {
  try {
    const userId = (req as any).userId!;
    const { status } = req.query; // 'active', 'archived', or undefined

    // Build where clause based on status
    if (status === "archived") {
      // Show archived properties only
      const properties = await prisma.property.findMany({
        where: {
          userId,
          deletedAt: { not: null },
        },
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json(properties);
    } else {
      // Default: show active properties only (not archived)
      const properties = await prisma.property.findMany({
        where: {
          userId,
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json(properties);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch properties" });
  }
}

export async function getProperty(req: Request, res: Response) {
  try {
    const userId = (req as any).userId!;
    const property = await getPropertyById(req.params.id as string, userId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    return res.status(200).json(property);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch property" });
  }
}

export async function createPropertyHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).userId!;
    // req.body is already validated by middleware
    const property = await createProperty({
      ...req.body,
      userId: userId,
    });
    return res.status(201).json(property);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create property" });
  }
}

export async function updatePropertyHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).userId!;
    // req.body is already validated by middleware
    const property = await updateProperty(
      req.params.id as string,
      userId,
      req.body,
    );
    return res.status(200).json(property);
  } catch (error: any) {
    console.error(error);
    if (error.message === "Property not found") {
      return res.status(404).json({ message: "Property not found" });
    }
    return res.status(500).json({ message: "Failed to update property" });
  }
}

// ============================================
// ARCHIVE — Soft Delete
// Only active properties (deletedAt: null) can be archived
// ============================================
export async function archiveProperty(req: Request, res: Response) {
  try {
    const userId = (req as any).userId!;
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    // Only active properties can be archived
    const property = await prisma.property.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!property) {
      return res.status(404).json({ message: "Active property not found" });
    }

    const updated = await prisma.property.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return res.status(200).json({
      message: "Property archived successfully",
      property: updated,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to archive property" });
  }
}

// ============================================
// RESTORE — Undo Soft Delete
// NO deletedAt filter in query — must find archived property
// Then validate it's actually archived before restoring
// ============================================
export async function restoreProperty(req: Request, res: Response) {
  try {
    const userId = (req as any).userId!;
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    // NO deletedAt filter — find property regardless of state
    const property = await prisma.property.findFirst({
      where: { id, userId },
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Verify it's actually archived
    if (!property.deletedAt) {
      return res.status(400).json({ message: "Property is not archived" });
    }

    const restored = await prisma.property.update({
      where: { id },
      data: { deletedAt: null },
    });

    return res.status(200).json({
      message: "Property restored successfully",
      property: restored,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to restore property" });
  }
}

// ❌ Hard delete endpoint removed — per soft delete architecture
// Use archiveProperty instead
