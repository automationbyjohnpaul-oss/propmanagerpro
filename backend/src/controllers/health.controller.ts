import { Request, Response } from "express";

import { getHealthStatus } from "../services/health.service";

export function healthCheck(_req: Request, res: Response) {
  const health = getHealthStatus();

  res.status(200).json(health);
}
