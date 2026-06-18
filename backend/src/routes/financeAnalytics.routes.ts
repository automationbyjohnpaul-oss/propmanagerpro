import { Router } from "express";
import {
  getDashboard,
  getRevenue,
  getOutstanding,
} from "../controllers/financeAnalytics.controller";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.get("/dashboard", asyncHandler(getDashboard));
router.get("/revenue", asyncHandler(getRevenue));
router.get("/outstanding", asyncHandler(getOutstanding));

export default router;
