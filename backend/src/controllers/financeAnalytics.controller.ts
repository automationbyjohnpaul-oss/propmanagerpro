import { Request, Response } from "express";
import {
  getDashboardMetrics,
  getRevenueByProperty,
  getOutstandingRent,
} from "../services/financeAnalytics.service";

export async function getDashboard(req: Request, res: Response) {
  try {
    const dashboard = await getDashboardMetrics();
    return res.status(200).json(dashboard);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to fetch dashboard metrics" });
  }
}

export async function getRevenue(req: Request, res: Response) {
  try {
    const revenue = await getRevenueByProperty();
    return res.status(200).json(revenue);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch revenue data" });
  }
}

export async function getOutstanding(req: Request, res: Response) {
  try {
    const outstanding = await getOutstandingRent();
    return res.status(200).json(outstanding);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to fetch outstanding rent" });
  }
}
