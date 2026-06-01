import { Response } from "express";
import {
  getDashboardMetrics,
  getRevenueByProperty,
  getOutstandingRent,
} from "../services/financeAnalytics.service";
import { AuthRequest } from "../middleware/auth.middleware";

export async function getDashboard(req: AuthRequest, res: Response) {
  try {
    const dashboard = await getDashboardMetrics(req.userId!);
    return res.status(200).json(dashboard);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to fetch dashboard metrics" });
  }
}

export async function getRevenue(req: AuthRequest, res: Response) {
  try {
    const revenue = await getRevenueByProperty(req.userId!);
    return res.status(200).json(revenue);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch revenue data" });
  }
}

export async function getOutstanding(req: AuthRequest, res: Response) {
  try {
    const outstanding = await getOutstandingRent(req.userId!);
    return res.status(200).json(outstanding);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to fetch outstanding rent" });
  }
}
