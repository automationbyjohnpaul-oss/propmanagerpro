import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Proper Express async handler with full compatibility
 * Fixes NextFunction optional mismatch in TS strict mode
 */
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
