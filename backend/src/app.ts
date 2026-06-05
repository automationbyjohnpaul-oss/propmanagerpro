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

app.use(
  cors({
    origin: ["http://localhost:3000", process.env.FRONTEND_URL].filter(
      Boolean,
    ) as string[],
    credentials: true,
  }),
);
app.use(express.json());

// Public routes
app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);

// Protected routes
app.use("/api/properties", authMiddleware, propertyRoutes);
app.use("/api/units", authMiddleware, unitRoutes);
app.use("/api/tenants", authMiddleware, tenantRoutes);
app.use("/api/leases", authMiddleware, leaseRoutes);
app.use("/api/payments", authMiddleware, paymentRoutes);
app.use("/api/finance", authMiddleware, financeAnalyticsRoutes);
app.use("/finance", authMiddleware, financeRoutes);

export default app;
