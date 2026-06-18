import { Request, Response, NextFunction } from "express";

/**
 * Async handler wrapper for Express route handlers.
 * Automatically catches errors and passes them to the global error middleware.
 *
 * Usage:
 * router.get("/", asyncHandler(getProperties));
 * router.post("/", asyncHandler(createPropertyHandler));
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
