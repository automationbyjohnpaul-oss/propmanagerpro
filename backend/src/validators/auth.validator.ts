import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const jwtPayloadSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
});
