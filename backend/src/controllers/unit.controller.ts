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

export async function getUnits(req: Request, res: Response) {
  try {
    const units = await getAllUnits();
    res.status(200).json(units);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch units" });
  }
}

export async function getUnit(req: Request, res: Response) {
  try {
    const unit = await getUnitById(req.params.id);

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
  const existingUnit = await getUnitById(req.params.id);

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

  try {
    const unit = await updateUnit(req.params.id, validation.data);
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
  const existingUnit = await getUnitById(req.params.id);

  if (!existingUnit) {
    return res.status(404).json({ message: "Unit not found" });
  }

  try {
    await deleteUnit(req.params.id);
    return res.status(204).send();
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete unit" });
  }
}
