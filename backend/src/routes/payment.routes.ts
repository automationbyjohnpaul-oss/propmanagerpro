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

router.get("/", asyncHandler(getPayments));
router.get("/:id", asyncHandler(getPayment));
router.post(
  "/",
  validate(createPaymentSchema),
  asyncHandler(createPaymentHandler),
);
router.put(
  "/:id",
  validate(updatePaymentSchema),
  asyncHandler(updatePaymentHandler),
);

export default router;
