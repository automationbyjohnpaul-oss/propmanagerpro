import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const schema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  FRONTEND_URL: z.string().url(),
});

export const env = schema.parse(process.env);
