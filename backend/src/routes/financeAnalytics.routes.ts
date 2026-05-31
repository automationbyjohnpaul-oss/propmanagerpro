import { Router } from "express";
import {
  getDashboard,
  getRevenue,
  getOutstanding,
} from "../controllers/financeAnalytics.controller";

const router = Router();

router.get("/dashboard", getDashboard);
router.get("/revenue-by-property", getRevenue);
router.get("/outstanding-rent", getOutstanding);

export default router;
