import { Response } from "express";
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
import { AuthRequest } from "../middleware/auth.middleware";

export async function getProperties(req: AuthRequest, res: Response) {
  try {
    const properties = await getAllProperties(req.userId!);
    res.status(200).json(properties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch properties" });
  }
}

export async function getProperty(req: AuthRequest, res: Response) {
  try {
    const property = await getPropertyById(
      req.params.id as string,
      req.userId!,
    );
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    return res.status(200).json(property);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch property" });
  }
}

export async function createPropertyHandler(req: AuthRequest, res: Response) {
  const validation = createPropertySchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.flatten(),
    });
  }

  try {
    const property = await createProperty({
      ...validation.data,
      userId: req.userId!,
    });
    return res.status(201).json(property);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create property" });
  }
}

export async function updatePropertyHandler(req: AuthRequest, res: Response) {
  const validation = updatePropertySchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.flatten(),
    });
  }

  try {
    const property = await updateProperty(
      req.params.id as string,
      req.userId!,
      validation.data,
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

export async function deletePropertyHandler(req: AuthRequest, res: Response) {
  try {
    await deleteProperty(req.params.id as string, req.userId!);
    return res.status(204).send();
  } catch (error: any) {
    console.error(error);
    if (error.message === "Property not found") {
      return res.status(404).json({ message: "Property not found" });
    }
    return res.status(500).json({ message: "Failed to delete property" });
  }
}
