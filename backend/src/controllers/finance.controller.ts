import { Request, Response } from "express";
import { getFinanceSummary } from "../services/finance.service";

export function financeSummary(_req: Request, res: Response) {
  const summary = getFinanceSummary();
  res.status(200).json(summary);
}
