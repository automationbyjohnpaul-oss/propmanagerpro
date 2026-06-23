import { Request, Response } from "express";
import {
  getDashboardMetrics,
  getRevenueByProperty,
  getOutstandingRent,
} from "../services/financeAnalytics.service";

export async function getDashboard(req: Request, res: Response) {
  try {
    const userId = (req as any).userId!;
    const dashboard = await getDashboardMetrics(userId);
    return res.status(200).json(dashboard);
  } catch (error) {
    console.error(JSON.stringify(error, null, 2));
    return res
      .status(500)
      .json({ message: "Failed to fetch dashboard metrics" });
  }
}

export async function getRevenue(req: Request, res: Response) {
  try {
    const userId = (req as any).userId!;
    const revenue = await getRevenueByProperty(userId);
    return res.status(200).json(revenue);
  } catch (error) {
    console.error(JSON.stringify(error, null, 2));
    return res.status(500).json({ message: "Failed to fetch revenue data" });
  }
}

export async function getOutstanding(req: Request, res: Response) {
  try {
    const userId = (req as any).userId!;
    const outstanding = await getOutstandingRent(userId);
    return res.status(200).json(outstanding);
  } catch (error) {
    console.error(JSON.stringify(error, null, 2));
    return res
      .status(500)
      .json({ message: "Failed to fetch outstanding rent" });
  }
}
