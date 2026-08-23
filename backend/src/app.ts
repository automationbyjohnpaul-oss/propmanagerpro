import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";

import authRoutes from "./routes/auth.routes";
import healthRoutes from "./routes/health.routes";
import financeRoutes from "./routes/finance.routes";
import propertyRoutes from "./routes/property.routes";
import unitRoutes from "./routes/unit.routes";
import tenantRoutes from "./routes/tenant.routes";
import leaseRoutes from "./routes/lease.routes";
import paymentRoutes from "./routes/payment.routes";
import financeAnalyticsRoutes from "./routes/financeAnalytics.routes";
import { authMiddleware } from "./middleware/auth.middleware";
import { errorMiddleware } from "./middleware/error.middleware";
import { authLimiter, apiLimiter } from "./middleware/rateLimit.middleware";
import { env } from "./config/env";
import { logger } from "./lib/logger";

const app = express();

// Trust proxy (required for Railway)
app.set("trust proxy", 1);

// ============================================
// ENVIRONMENT VARIABLE VALIDATION
// ============================================
console.log("🔍 ENVIRONMENT CHECK:");
console.log("📡 JWT_SECRET:", !!env.JWT_SECRET);
console.log("📡 DATABASE_URL:", !!env.DATABASE_URL);
console.log("📡 FRONTEND_URL:", env.FRONTEND_URL || "NOT SET");
console.log("📡 PORT:", env.PORT);
console.log("📡 NODE_ENV:", env.NODE_ENV);
console.log("=================================");

// ============================================
// SECURITY HEADERS (Helmet)
// ============================================
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

// ============================================
// CORS
// ============================================
const corsOrigins =
  env.NODE_ENV === "production"
    ? [env.FRONTEND_URL]
    : ["http://localhost:3000", env.FRONTEND_URL];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));

// ============================================
// STRUCTURED REQUEST LOGGING
// ============================================
app.use(
  pinoHttp({
    logger,
  }),
);

// ============================================
// PUBLIC ROUTES
// ============================================

// Root route for Railway health check
app.get("/", (_req, res) => {
  res.status(200).json({
    status: "OK",
    service: "PropManager Pro Backend",
    env: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Health check (must work even if auth fails)
app.use("/health", healthRoutes);

// Auth routes with rate limiting
app.use("/api/auth", authLimiter, authRoutes);

// ============================================
// PROTECTED ROUTES
// ============================================
app.use("/api", apiLimiter);
app.use("/api/properties", authMiddleware, propertyRoutes);
app.use("/api/units", authMiddleware, unitRoutes);
app.use("/api/tenants", authMiddleware, tenantRoutes);
app.use("/api/leases", authMiddleware, leaseRoutes);
app.use("/api/payments", authMiddleware, paymentRoutes);
app.use("/api/finance", authMiddleware, financeAnalyticsRoutes);
app.use("/finance", authMiddleware, financeRoutes);

// ============================================
// GLOBAL ERROR HANDLER (MUST BE LAST)
// ============================================
app.use(errorMiddleware);

export default app;
