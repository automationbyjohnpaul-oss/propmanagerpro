import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";

if (!JWT_SECRET || JWT_SECRET === "dev-secret-change-in-production") {
  console.warn(
    "⚠️  Using default JWT_SECRET. Set JWT_SECRET environment variable for production.",
  );
}

const SALT_ROUNDS = 10;

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
    },
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" },
  );

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  };
}

export async function loginUser(data: { email: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const valid = await bcrypt.compare(data.password, user.password);

  if (!valid) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" },
  );

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  };
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
}
