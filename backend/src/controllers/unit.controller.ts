import { Request, Response } from "express";
import {
  getAllUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit,
} from "../services/unit.service";
import {
  createUnitSchema,
  updateUnitSchema,
} from "../validators/unit.validator";
import { prisma } from "../lib/prisma";

// ✅ UPDATED: getUnits now REQUIRES propertyId query parameter
export async function getUnits(req: Request, res: Response) {
  try {
    const userId = (req as any).userId!;
    const { propertyId } = req.query;

    // STRICT: propertyId is REQUIRED
    if (!propertyId || typeof propertyId !== "string") {
      return res.status(400).json({
        message: "propertyId query parameter is required",
      });
    }

    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: { id: propertyId, userId },
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const units = await prisma.unit.findMany({
      where: { propertyId },
      orderBy: { unitNumber: "asc" },
    });

    res.status(200).json(units);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch units" });
  }
}

export async function getUnit(req: Request, res: Response) {
  try {
    const userId = (req as any).userId!;
    const unit = await getUnitById(req.params.id as string, userId);

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    return res.status(200).json(unit);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch unit" });
  }
}

export async function createUnitHandler(req: Request, res: Response) {
  const userId = (req as any).userId!;
  const validation = createUnitSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.flatten(),
    });
  }

  const property = await prisma.property.findUnique({
    where: { id: validation.data.propertyId },
  });

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  // Verify the property belongs to the authenticated user
  if (property.userId !== userId) {
    return res.status(403).json({ message: "You don't own this property" });
  }

  try {
    const unit = await createUnit(validation.data);
    return res.status(201).json(unit);
  } catch (error: any) {
    console.error(error);

    if (error?.code === "P2002") {
      return res.status(409).json({
        message: "A unit with this number already exists in this property",
      });
    }

    return res.status(500).json({ message: "Failed to create unit" });
  }
}

export async function updateUnitHandler(req: Request, res: Response) {
  const userId = (req as any).userId!;
  const existingUnit = await getUnitById(req.params.id as string, userId);

  if (!existingUnit) {
    return res.status(404).json({ message: "Unit not found" });
  }

  const validation = updateUnitSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.flatten(),
    });
  }

  const property = await prisma.property.findUnique({
    where: { id: validation.data.propertyId },
  });

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  // Verify the property belongs to the authenticated user
  if (property.userId !== userId) {
    return res.status(403).json({ message: "You don't own this property" });
  }

  try {
    const unit = await updateUnit(
      req.params.id as string,
      userId,
      validation.data,
    );
    return res.status(200).json(unit);
  } catch (error: any) {
    console.error(error);

    if (error?.code === "P2002") {
      return res.status(409).json({
        message: "A unit with this number already exists in this property",
      });
    }

    return res.status(500).json({ message: "Failed to update unit" });
  }
}

export async function deleteUnitHandler(req: Request, res: Response) {
  const userId = (req as any).userId!;
  const existingUnit = await getUnitById(req.params.id as string, userId);

  if (!existingUnit) {
    return res.status(404).json({ message: "Unit not found" });
  }

  try {
    await deleteUnit(req.params.id as string, userId);
    return res.status(204).send();
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete unit" });
  }
}

// ✅ REMOVED: generateUnits function (no longer needed)
