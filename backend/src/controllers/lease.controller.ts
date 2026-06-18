import { Request, Response } from "express";
import {
  getAllLeases,
  getLeaseById,
  createLease,
  updateLease,
  deleteLease,
  findActiveLeaseByUnit,
} from "../services/lease.service";
import { prisma } from "../lib/prisma";
import {
  createLeaseSchema,
  updateLeaseSchema,
} from "../validators/lease.validator";

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
  try {
    const userId = (req as any).userId!;
    const validation = createLeaseSchema.safeParse(req.body);

    if (!validation.success) {
      // Format errors including refine errors
      const errors = validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return res.status(400).json({
        message: "Validation failed",
        errors: errors,
      });
    }

    const validatedData = validation.data;

    // Rule 2: Property must exist
    const property = await prisma.property.findUnique({
      where: { id: validatedData.propertyId },
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Rule 3: Unit must exist
    const unit = await prisma.unit.findUnique({
      where: { id: validatedData.unitId },
    });

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    // Rule 4: Tenant must exist
    const tenant = await prisma.tenant.findUnique({
      where: { id: validatedData.tenantId },
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // Rule 5: Prevent multiple active leases on the same unit
    if (validatedData.isActive) {
      const activeLease = await findActiveLeaseByUnit(
        validatedData.unitId,
        userId,
      );

      if (activeLease) {
        return res.status(409).json({
          message: "Unit already has an active lease",
        });
      }
    }

    // Convert Date objects to ISO strings for Prisma
    const leaseData = {
      ...validatedData,
      startDate:
        validatedData.startDate instanceof Date
          ? validatedData.startDate.toISOString()
          : validatedData.startDate,
      endDate:
        validatedData.endDate instanceof Date
          ? validatedData.endDate.toISOString()
          : validatedData.endDate,
      signedAt:
        validatedData.signedAt instanceof Date
          ? validatedData.signedAt.toISOString()
          : validatedData.signedAt,
    };

    const lease = await createLease(leaseData);
    return res.status(201).json(lease);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create lease" });
  }
}

export async function updateLeaseHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).userId!;
    const leaseId = req.params.id as string;

    const existingLease = await getLeaseById(leaseId, userId);

    if (!existingLease) {
      return res.status(404).json({ message: "Lease not found" });
    }

    const validation = updateLeaseSchema.safeParse(req.body);

    if (!validation.success) {
      // Format errors including refine errors
      const errors = validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return res.status(400).json({
        message: "Validation failed",
        errors: errors,
      });
    }

    const validatedData = validation.data;

    // If propertyId is being updated, verify it exists
    if (validatedData.propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: validatedData.propertyId },
      });

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
    }

    // If unitId is being updated, verify it exists
    if (validatedData.unitId) {
      const unit = await prisma.unit.findUnique({
        where: { id: validatedData.unitId },
      });

      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
    }

    // If tenantId is being updated, verify it exists
    if (validatedData.tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: validatedData.tenantId },
      });

      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
    }

    // Rule 5: Prevent multiple active leases on the same unit
    if (validatedData.isActive && validatedData.unitId) {
      const activeLease = await findActiveLeaseByUnit(
        validatedData.unitId,
        userId,
      );

      if (activeLease && activeLease.id !== leaseId) {
        return res.status(409).json({
          message: "Unit already has an active lease",
        });
      }
    }

    // Convert Date objects to ISO strings for Prisma
    const updateData: any = { ...validatedData };
    if (validatedData.startDate instanceof Date) {
      updateData.startDate = validatedData.startDate.toISOString();
    }
    if (validatedData.endDate instanceof Date) {
      updateData.endDate = validatedData.endDate.toISOString();
    }
    if (validatedData.signedAt instanceof Date) {
      updateData.signedAt = validatedData.signedAt.toISOString();
    }

    const lease = await updateLease(leaseId, userId, updateData);
    return res.status(200).json(lease);
  } catch (error: any) {
    console.error(error);

    if (error.message === "Lease not found") {
      return res.status(404).json({ message: "Lease not found" });
    }

    return res.status(500).json({ message: "Failed to update lease" });
  }
}

export async function deleteLeaseHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).userId!;
    const leaseId = req.params.id as string;

    const existingLease = await getLeaseById(leaseId, userId);

    if (!existingLease) {
      return res.status(404).json({ message: "Lease not found" });
    }

    await deleteLease(leaseId, userId);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete lease" });
  }
}
