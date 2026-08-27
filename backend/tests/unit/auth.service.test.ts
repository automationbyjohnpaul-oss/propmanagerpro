import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { verifyToken } from "../../src/services/auth.service";
import { env } from "../../src/config/env";

describe("auth.service - verifyToken", () => {
  const validPayload = {
    userId: "user-123",
    email: "user@example.com",
    role: "USER",
  };

  it("accepts a valid JWT", () => {
    const token = jwt.sign(validPayload, env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const result = verifyToken(token);

    expect(result).toEqual(validPayload);
  });

  it("rejects a JWT with an invalid signature", () => {
    const token = jwt.sign(validPayload, "wrong-secret", {
      expiresIn: "7d",
    });

    expect(() => verifyToken(token)).toThrow();
  });

  it("rejects an expired JWT", () => {
    const token = jwt.sign(validPayload, env.JWT_SECRET, {
      expiresIn: -1,
    });

    expect(() => verifyToken(token)).toThrow();
  });

  it("rejects a JWT with an invalid payload", () => {
    const invalidPayload = {
      userId: 123,
      email: "user@example.com",
      role: "USER",
    };

    const token = jwt.sign(invalidPayload, env.JWT_SECRET, {
      expiresIn: "7d",
    });

    expect(() => verifyToken(token)).toThrow();
  });
});
