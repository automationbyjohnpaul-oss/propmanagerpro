import { Response } from "express";
import { Prisma } from "@prisma/client";
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
} from "../services/payment.service";
import {
  createPaymentSchema,
  updatePaymentSchema,
} from "../validators/payment.validator";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

export async function getPayments(req: AuthRequest, res: Response) {
  try {
    const payments = await getAllPayments(req.userId!);
    res.status(200).json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
}

export async function getPayment(req: AuthRequest, res: Response) {
  try {
    const payment = await getPaymentById(req.params.id as string, req.userId!);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    return res.status(200).json(payment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch payment" });
  }
}

export async function createPaymentHandler(req: AuthRequest, res: Response) {
  const validation = createPaymentSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.flatten(),
    });
  }

  // Rule: Lease must exist
  const lease = await prisma.lease.findUnique({
    where: { id: validation.data.leaseId },
  });

  if (!lease) {
    return res.status(404).json({ message: "Lease not found" });
  }

  // Rule: Tenant must exist
  const tenant = await prisma.tenant.findUnique({
    where: { id: validation.data.tenantId },
  });

  if (!tenant) {
    return res.status(404).json({ message: "Tenant not found" });
  }

  // Rule: Tenant must belong to the lease
  if (lease.tenantId !== validation.data.tenantId) {
    return res.status(409).json({
      message: "Tenant does not belong to this lease",
    });
  }

  try {
    const payment = await createPayment(validation.data);
    return res.status(201).json(payment);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create payment" });
  }
}

export async function updatePaymentHandler(req: AuthRequest, res: Response) {
  // If leaseId or tenantId are being changed, validate ownership
  if (req.body.leaseId || req.body.tenantId) {
    const leaseId = req.body.leaseId;
    const tenantId = req.body.tenantId;

    if (leaseId && tenantId) {
      // Both provided — validate full relationship
      const lease = await prisma.lease.findUnique({
        where: { id: leaseId },
      });

      if (!lease) {
        return res.status(404).json({ message: "Lease not found" });
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      if (lease.tenantId !== tenantId) {
        return res.status(409).json({
          message: "Tenant does not belong to this lease",
        });
      }
    } else if (leaseId) {
      // Only leaseId changed — validate it exists
      const lease = await prisma.lease.findUnique({
        where: { id: leaseId },
      });

      if (!lease) {
        return res.status(404).json({ message: "Lease not found" });
      }
    } else if (tenantId) {
      // Only tenantId changed — validate it exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
    }
  }

  const validation = updatePaymentSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.flatten(),
    });
  }

  try {
    const payment = await updatePayment(
      req.params.id as string,
      req.userId!,
      validation.data,
    );
    return res.status(200).json(payment);
  } catch (error: any) {
    console.error(error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ message: "Payment not found" });
    }

    return res.status(500).json({ message: "Failed to update payment" });
  }
}
