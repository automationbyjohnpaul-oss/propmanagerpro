import { Request, Response } from "express";
import { getAllProperties, createProperty } from "../services/property.service";

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
  try {
    const property = await createProperty(req.body);

    res.status(201).json(property);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create property",
    });
  }
}
