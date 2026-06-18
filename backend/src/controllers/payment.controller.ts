import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
} from "../services/payment.service";
import { prisma } from "../lib/prisma";

export async function getPayments(req: Request, res: Response) {
  try {
    const userId = (req as any).userId!;
    const payments = await getAllPayments(userId);
    res.status(200).json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
}

export async function getPayment(req: Request, res: Response) {
  try {
    const userId = (req as any).userId!;
    const payment = await getPaymentById(req.params.id as string, userId);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    return res.status(200).json(payment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch payment" });
  }
}

export async function createPaymentHandler(req: Request, res: Response) {
  try {
    const { body } = req;
    // req.body is already validated by middleware

    // Rule: Lease must exist
    const lease = await prisma.lease.findUnique({
      where: { id: body.leaseId },
    });

    if (!lease) {
      return res.status(404).json({ message: "Lease not found" });
    }

    // Rule: Tenant must exist
    const tenant = await prisma.tenant.findUnique({
      where: { id: body.tenantId },
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // Rule: Tenant must belong to the lease
    if (lease.tenantId !== body.tenantId) {
      return res.status(409).json({
        message: "Tenant does not belong to this lease",
      });
    }

    const payment = await createPayment(body);
    return res.status(201).json(payment);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create payment" });
  }
}

export async function updatePaymentHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).userId!;
    const paymentId = req.params.id as string;
    const { body } = req;
    // req.body is already validated by middleware

    // If leaseId or tenantId are being changed, validate ownership
    if (body.leaseId || body.tenantId) {
      const leaseId = body.leaseId;
      const tenantId = body.tenantId;

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

    const payment = await updatePayment(paymentId, userId, body);
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
