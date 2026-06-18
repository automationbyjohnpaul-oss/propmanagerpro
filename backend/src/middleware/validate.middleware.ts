import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Validation middleware for Express routes using Zod.
 * Validates request body against a Zod schema and returns 400 if invalid.
 *
 * Usage:
 * router.post("/", validate(createPropertySchema), createPropertyHandler);
 */
export const validate = (schema: ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body against schema
      const validatedData = schema.parse(req.body);

      // Replace req.body with validated data (type-safe)
      req.body = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors for consistent response
        // error.issues is the correct property in Zod v3+
        const errors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        res.status(400).json({
          message: "Validation failed",
          errors: errors,
        });
        return;
      }

      // Pass other errors to global error handler
      next(error);
    }
  };
};
