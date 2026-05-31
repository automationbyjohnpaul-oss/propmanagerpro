import express from "express";
import cors from "cors";

import healthRoutes from "./routes/health.routes";
import financeRoutes from "./routes/finance.routes";
import propertyRoutes from "./routes/property.routes";
import unitRoutes from "./routes/unit.routes";
import tenantRoutes from "./routes/tenant.routes";
import leaseRoutes from "./routes/lease.routes";
import paymentRoutes from "./routes/payment.routes";
import financeAnalyticsRoutes from "./routes/financeAnalytics.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/finance", financeRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/leases", leaseRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/finance", financeAnalyticsRoutes);

export default app;
