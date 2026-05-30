import { Request, Response } from "express";
import {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
} from "../services/tenant.service";
import {
  createTenantSchema,
  updateTenantSchema,
} from "../validators/tenant.validator";

export async function getTenants(req: Request, res: Response) {
  try {
    const tenants = await getAllTenants();
    res.status(200).json(tenants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch tenants" });
  }
}

export async function getTenant(req: Request, res: Response) {
  try {
    const tenant = await getTenantById(req.params.id);

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    return res.status(200).json(tenant);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch tenant" });
  }
}

export async function createTenantHandler(req: Request, res: Response) {
  const validation = createTenantSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.flatten(),
    });
  }

  try {
    const tenant = await createTenant(validation.data);
    return res.status(201).json(tenant);
  } catch (error: any) {
    console.error(error);

    if (error?.code === "P2002") {
      return res.status(409).json({
        message: "Tenant email already exists",
      });
    }

    return res.status(500).json({ message: "Failed to create tenant" });
  }
}

export async function updateTenantHandler(req: Request, res: Response) {
  const existingTenant = await getTenantById(req.params.id);

  if (!existingTenant) {
    return res.status(404).json({ message: "Tenant not found" });
  }

  const validation = updateTenantSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.flatten(),
    });
  }

  try {
    const tenant = await updateTenant(req.params.id, validation.data);
    return res.status(200).json(tenant);
  } catch (error: any) {
    console.error(error);

    if (error?.code === "P2002") {
      return res.status(409).json({
        message: "Tenant email already exists",
      });
    }

    return res.status(500).json({ message: "Failed to update tenant" });
  }
}

export async function deleteTenantHandler(req: Request, res: Response) {
  const existingTenant = await getTenantById(req.params.id);

  if (!existingTenant) {
    return res.status(404).json({ message: "Tenant not found" });
  }

  try {
    await deleteTenant(req.params.id);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete tenant" });
  }
}
