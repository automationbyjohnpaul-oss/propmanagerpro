import { Request, Response, NextFunction } from "express";
import { logError } from "../lib/errorLogger";

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  logError(err, {
    location: "error.middleware",
    method: req.method,
    path: req.originalUrl,
    userId: (req as any).userId,
  });

  // Prisma duplicate constraint
  if (err?.code === "P2002") {
    res.status(409).json({
      message: "Duplicate entry detected",
    });
    return;
  }

  // Prisma not found
  if (err?.code === "P2025") {
    res.status(404).json({
      message: "Record not found",
    });
    return;
  }

  const statusCode = err?.statusCode || 500;

  res.status(statusCode).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err?.message || "Internal Server Error",

    ...(process.env.NODE_ENV === "development" && {
      code: err?.code,
      stack: err?.stack,
    }),
  });
}
