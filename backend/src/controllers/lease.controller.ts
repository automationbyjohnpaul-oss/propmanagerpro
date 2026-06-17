import { Request, Response } from "express";
import {
  getAllLeases,
  getLeaseById,
  createLease,
  updateLease,
  deleteLease,
  findActiveLeaseByUnit,
} from "../services/lease.service";
import {
  createLeaseSchema,
  updateLeaseSchema,
} from "../validators/lease.validator";
import { prisma } from "../lib/prisma";

export async function getLeases(req: Request, res: Response) {
  try {
    const userId = (req as any).userId!;
    const leases = await getAllLeases(userId);
    res.status(200).json(leases);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch leases" });
  }
}

export async function getLease(req: Request, res: Response) {
  try {
    const userId = (req as any).userId!;
    const lease = await getLeaseById(req.params.id as string, userId);

    if (!lease) {
      return res.status(404).json({ message: "Lease not found" });
    }

    return res.status(200).json(lease);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch lease" });
  }
}

export async function createLeaseHandler(req: Request, res: Response) {
  const userId = (req as any).userId!;
  const validation = createLeaseSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.flatten(),
    });
  }

  // Rule 2: Property must exist
  const property = await prisma.property.findUnique({
    where: { id: validation.data.propertyId },
  });

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  // Rule 3: Unit must exist
  const unit = await prisma.unit.findUnique({
    where: { id: validation.data.unitId },
  });

  if (!unit) {
    return res.status(404).json({ message: "Unit not found" });
  }

  // Rule 4: Tenant must exist
  const tenant = await prisma.tenant.findUnique({
    where: { id: validation.data.tenantId },
  });

  if (!tenant) {
    return res.status(404).json({ message: "Tenant not found" });
  }

  // Rule 5: Prevent multiple active leases on the same unit
  if (validation.data.isActive) {
    const activeLease = await findActiveLeaseByUnit(
      validation.data.unitId,
      userId,
    );

    if (activeLease) {
      return res.status(409).json({
        message: "Unit already has an active lease",
      });
    }
  }

  try {
    const lease = await createLease(validation.data);
    return res.status(201).json(lease);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create lease" });
  }
}

export async function updateLeaseHandler(req: Request, res: Response) {
  const userId = (req as any).userId!;
  const existingLease = await getLeaseById(req.params.id as string, userId);

  if (!existingLease) {
    return res.status(404).json({ message: "Lease not found" });
  }

  const validation = updateLeaseSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.flatten(),
    });
  }

  // Rule 2: Property must exist
  const property = await prisma.property.findUnique({
    where: { id: validation.data.propertyId },
  });

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  // Rule 3: Unit must exist
  const unit = await prisma.unit.findUnique({
    where: { id: validation.data.unitId },
  });

  if (!unit) {
    return res.status(404).json({ message: "Unit not found" });
  }

  // Rule 4: Tenant must exist
  const tenant = await prisma.tenant.findUnique({
    where: { id: validation.data.tenantId },
  });

  if (!tenant) {
    return res.status(404).json({ message: "Tenant not found" });
  }

  // Rule 5: Prevent multiple active leases on the same unit
  if (validation.data.isActive) {
    const activeLease = await findActiveLeaseByUnit(
      validation.data.unitId,
      userId,
    );

    if (activeLease && activeLease.id !== req.params.id) {
      return res.status(409).json({
        message: "Unit already has an active lease",
      });
    }
  }

  try {
    const lease = await updateLease(
      req.params.id as string,
      userId,
      validation.data,
    );
    return res.status(200).json(lease);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update lease" });
  }
}

export async function deleteLeaseHandler(req: Request, res: Response) {
  const userId = (req as any).userId!;
  const existingLease = await getLeaseById(req.params.id as string, userId);

  if (!existingLease) {
    return res.status(404).json({ message: "Lease not found" });
  }

  try {
    await deleteLease(req.params.id as string, userId);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete lease" });
  }
}
