// backend/src/routes/payment.routes.ts
import { Router } from "express";
import {
  getPayments,
  getPayment,
  createPaymentHandler,
  updatePaymentHandler,
} from "../controllers/payment.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { validate } from "../middleware/validate.middleware";
import {
  createPaymentSchema,
  updatePaymentSchema,
} from "../validators/payment.validator";

const router = Router();

// GET all payments
router.get("/", asyncHandler(getPayments));

// GET single payment
router.get("/:id", asyncHandler(getPayment));

// CREATE payment
router.post(
  "/",
  validate(createPaymentSchema),
  asyncHandler(createPaymentHandler),
);

// UPDATE payment (restricted by business rules)
router.put(
  "/:id",
  validate(updatePaymentSchema),
  asyncHandler(updatePaymentHandler),
);

// REMOVED: DELETE /:id - payments should never be deleted

export default router;
