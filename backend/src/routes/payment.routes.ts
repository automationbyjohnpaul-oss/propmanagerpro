import { Router } from "express";
import {
  getPayments,
  getPayment,
  createPaymentHandler,
  updatePaymentHandler,
} from "../controllers/payment.controller";

const router = Router();

router.get("/", getPayments);
router.get("/:id", getPayment);
router.post("/", createPaymentHandler);
router.put("/:id", updatePaymentHandler);

export default router;
