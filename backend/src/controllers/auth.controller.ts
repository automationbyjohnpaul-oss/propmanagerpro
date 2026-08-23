import { Request, Response } from "express";
import { registerUser, loginUser } from "../services/auth.service";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { logError } from "../lib/errorLogger";

export async function register(req: Request, res: Response) {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.flatten(),
    });
  }

  try {
    const result = await registerUser(validation.data);
    return res.status(201).json(result);
  } catch (error: any) {
    logError(error, {
      location: "auth.controller.register",
      method: req.method,
      path: req.originalUrl,
    });

    if (error.message === "Email already registered") {
      return res.status(409).json({ message: error.message });
    }

    return res.status(500).json({ message: "Registration failed" });
  }
}

export async function login(req: Request, res: Response) {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.flatten(),
    });
  }

  try {
    const result = await loginUser(validation.data);
    return res.status(200).json(result);
  } catch (error: any) {
    logError(error, {
      location: "auth.controller.login",
      method: req.method,
      path: req.originalUrl,
    });

    if (error.message === "Invalid email or password") {
      return res.status(401).json({ message: error.message });
    }

    return res.status(500).json({ message: "Login failed" });
  }
}
