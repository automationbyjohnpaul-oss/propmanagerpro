import { Request, Response } from "express";
import {
  getDashboardMetrics,
  getRevenueByProperty,
  getOutstandingRent,
} from "../services/financeAnalytics.service";
import { logError } from "../lib/errorLogger";

export async function getDashboard(req: Request, res: Response) {
  try {
    const userId = (req as any).userId!;
    const dashboard = await getDashboardMetrics(userId);
    return res.status(200).json(dashboard);
  } catch (error) {
    logError(error, {
      location: "financeAnalytics.controller.getDashboard",
      method: req.method,
      path: req.originalUrl,
      userId: (req as any).userId,
    });

    return res.status(500).json({
      message: "Failed to fetch dashboard metrics",
    });
  }
}

export async function getRevenue(req: Request, res: Response) {
  try {
    const userId = (req as any).userId!;
    const revenue = await getRevenueByProperty(userId);
    return res.status(200).json(revenue);
  } catch (error) {
    logError(error, {
      location: "financeAnalytics.controller.getRevenue",
      method: req.method,
      path: req.originalUrl,
      userId: (req as any).userId,
    });

    return res.status(500).json({ message: "Failed to fetch revenue data" });
  }
}

export async function getOutstanding(req: Request, res: Response) {
  try {
    const userId = (req as any).userId!;
    const outstanding = await getOutstandingRent(userId);
    return res.status(200).json(outstanding);
  } catch (error) {
    logError(error, {
      location: "financeAnalytics.controller.getOutstanding",
      method: req.method,
      path: req.originalUrl,
      userId: (req as any).userId,
    });

    return res
      .status(500)
      .json({ message: "Failed to fetch outstanding rent" });
  }
}
