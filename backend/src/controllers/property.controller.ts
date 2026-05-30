import { Request, Response } from "express";
import {
  getAllProperties,
  createProperty,
  updateProperty,
  deleteProperty,
} from "../services/property.service";
import {
  createPropertySchema,
  updatePropertySchema,
} from "../validators/property.validator";

export async function getProperties(req: Request, res: Response) {
  try {
    const properties = await getAllProperties();

    res.status(200).json(properties);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch properties",
    });
  }
}

export async function createPropertyHandler(req: Request, res: Response) {
  const validation = createPropertySchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.flatten(),
    });
  }

  try {
    const property = await createProperty(validation.data);

    return res.status(201).json(property);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to create property",
    });
  }
}

export async function updatePropertyHandler(req: Request, res: Response) {
  const validation = updatePropertySchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.flatten(),
    });
  }

  try {
    const property = await updateProperty(req.params.id, validation.data);

    return res.status(200).json(property);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to update property",
    });
  }
}

export async function deletePropertyHandler(req: Request, res: Response) {
  try {
    await deleteProperty(req.params.id);

    return res.status(204).send();
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to delete property",
    });
  }
}
