import { Request, Response, NextFunction } from "express";
import { logError } from "../lib/errorLogger";
import { env } from "../config/env";
import { PaymentRequestError } from "../lib/paymentRequestError";
import { ConflictError } from "../lib/errors";

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
    ...(err instanceof PaymentRequestError ? { code: err.code, phase: err.phase } : {}),
  });

  // These explicit messages/codes are safe in production and needed for recovery.
  if (err instanceof PaymentRequestError) {
    if (err.retryAfter !== undefined) res.setHeader("Retry-After", String(err.retryAfter));
    res.status(err.statusCode).json({ message: err.message, code: err.code });
    return;
  }

  if (err instanceof ConflictError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

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
      env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err?.message || "Internal Server Error",

    ...(env.NODE_ENV === "development" && {
      code: err?.code,
      stack: err?.stack,
    }),
  });
}
