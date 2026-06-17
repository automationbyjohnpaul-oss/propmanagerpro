import express from "express";
import cors from "cors";

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

const app = express();

// ============================================
// ENVIRONMENT VARIABLE VALIDATION (CRITICAL)
// ============================================
console.log("🔍 ENVIRONMENT CHECK:");
console.log("📡 JWT_SECRET:", !!process.env.JWT_SECRET);
console.log("📡 DATABASE_URL:", !!process.env.DATABASE_URL);
console.log("📡 FRONTEND_URL:", process.env.FRONTEND_URL || "NOT SET");
console.log("📡 PORT:", process.env.PORT || "NOT SET (default 4000)");
console.log("=================================");

// ============================================
// CORS
// ============================================
app.use(
  cors({
    origin: ["http://localhost:3000", process.env.FRONTEND_URL].filter(
      Boolean,
    ) as string[],
    credentials: true,
  }),
);

app.use(express.json());

// ============================================
// PUBLIC ROUTES
// ============================================

// Health check (must work even if auth fails)
app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);

// ============================================
// SAFETY WRAPPER FOR AUTH MIDDLEWARE
// ============================================
const safeAuth = (req: any, res: any, next: any) => {
  try {
    return authMiddleware(req, res, next);
  } catch (err) {
    console.error("❌ Auth middleware crash:", err);
    return res.status(500).json({
      message: "Authentication service temporarily unavailable",
      error: process.env.NODE_ENV === "development" ? String(err) : undefined,
    });
  }
};

// ============================================
// PROTECTED ROUTES (with safe auth wrapper)
// ============================================
app.use("/api/properties", safeAuth, propertyRoutes);
app.use("/api/units", safeAuth, unitRoutes);
app.use("/api/tenants", safeAuth, tenantRoutes);
app.use("/api/leases", safeAuth, leaseRoutes);
app.use("/api/payments", safeAuth, paymentRoutes);
app.use("/api/finance", safeAuth, financeAnalyticsRoutes);
app.use("/finance", safeAuth, financeRoutes);

// ============================================
// GLOBAL ERROR HANDLER (CATCH ALL)
// ============================================
app.use((err: any, req: any, res: any, next: any) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? String(err) : undefined,
  });
});

export default app;
