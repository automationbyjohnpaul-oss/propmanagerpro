// backend/src/controllers/payment.controller.ts
import { Request, Response } from "express";
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
} from "../services/payment.service";
import { createAuditLog } from "../services/audit.service";
import { asyncHandler } from "../middleware/asyncHandler";

// ============================================
// HELPERS
// ============================================

function getUserId(req: Request): string {
  return (req as any).userId;
}

function createError(message: string, statusCode: number) {
  const err = new Error(message) as any;
  err.statusCode = statusCode;
  return err;
}

// ============================================
// GET PAYMENTS
// ============================================
export const getPayments = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const payments = await getAllPayments(userId);
  return res.status(200).json(payments);
});

// ============================================
// GET SINGLE PAYMENT
// ============================================
export const getPayment = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const payment = await getPaymentById(req.params.id as string, userId);

  if (!payment) {
    throw createError("Payment not found", 404);
  }

  return res.status(200).json(payment);
});

// ============================================
// CREATE PAYMENT
// ============================================
export const createPaymentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const payment = await createPayment(userId, req.body);

    await createAuditLog(userId, "CREATE_PAYMENT", "Payment", payment.id, {
      amount: Number(payment.amount),
      method: payment.method,
      status: payment.status,
      leaseId: payment.leaseId,
      tenantId: payment.tenantId,
      paymentDate: payment.paymentDate,
    });

    return res.status(201).json(payment);
  },
);

// ============================================
// UPDATE PAYMENT
// ============================================
export const updatePaymentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const paymentId = req.params.id as string;

    // Get existing payment for audit
    const existingPayment = await getPaymentById(paymentId, userId);

    if (!existingPayment) {
      throw createError("Payment not found", 404);
    }

    // Store previous state for audit
    const previousState = {
      amount: Number(existingPayment.amount),
      method: existingPayment.method,
      status: existingPayment.status,
      leaseId: existingPayment.leaseId,
      tenantId: existingPayment.tenantId,
      paymentDate: existingPayment.paymentDate,
      reference: existingPayment.reference,
      notes: existingPayment.notes,
    };

    // Service will enforce all business rules
    const payment = await updatePayment(paymentId, userId, req.body);

    // Only log if update was successful
    await createAuditLog(userId, "UPDATE_PAYMENT", "Payment", payment.id, {
      updatedFields: Object.keys(req.body),
      previousData: previousState,
      newData: {
        amount: Number(payment.amount),
        method: payment.method,
        status: payment.status,
        leaseId: payment.leaseId,
        tenantId: payment.tenantId,
        paymentDate: payment.paymentDate,
        reference: payment.reference,
        notes: payment.notes,
      },
    });

    return res.status(200).json(payment);
  },
);

// REMOVED: deletePaymentHandler - payments should never be deleted
