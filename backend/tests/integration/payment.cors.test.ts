import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../../src/app";

// Exercise real application CORS; no fixture payment or authenticated request.
describe("Payment browser CORS contract", () => {
  let server: Server;
  let baseUrl: string;
  beforeAll(async () => {
    server = await new Promise<Server>((resolve, reject) => {
      const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
      listening.once("error", reject);
    });
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(async () => {
    if (!server) return;
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
      server.closeAllConnections();
    });
  });
  it("allows the idempotency request header in preflight", async () => {
    const response = await fetch(`${baseUrl}/api/payments`, { method: "OPTIONS", headers: {
      Origin: "http://localhost:3000", "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "authorization,content-type,idempotency-key",
    } });
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain("idempotency-key");
  });
  it("exposes Retry-After to the cross-origin frontend", async () => {
    const response = await fetch(`${baseUrl}/`, { headers: { Origin: "http://localhost:3000" } });
    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Expose-Headers")).toContain("Retry-After");
  });
});
