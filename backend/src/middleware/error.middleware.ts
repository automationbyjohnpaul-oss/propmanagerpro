import { Request, Response, NextFunction } from "express";

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Enhanced logging for Railway
  console.error("❌ ERROR:", {
    message: err?.message || "Unknown error",
    code: err?.code,
    stack: err?.stack,
    path: req.originalUrl,
    method: req.method,
    statusCode: err?.statusCode || 500,
    timestamp: new Date().toISOString(),
  });

  // Determine status code
  const statusCode = err?.statusCode || 500;

  // Determine response message
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err?.message || "Something went wrong";

  // Send response
  res.status(statusCode).json({
    message: message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err?.stack,
      code: err?.code,
    }),
  });
}
