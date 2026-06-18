import { Router } from "express";
import {
  getPayments,
  getPayment,
  createPaymentHandler,
  updatePaymentHandler,
} from "../controllers/payment.controller";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getPayments));
router.get("/:id", asyncHandler(getPayment));
router.post("/", asyncHandler(createPaymentHandler));
router.put("/:id", asyncHandler(updatePaymentHandler));

export default router;
