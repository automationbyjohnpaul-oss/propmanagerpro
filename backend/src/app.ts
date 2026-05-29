import express from "express";
import cors from "cors";

import healthRoutes from "./routes/health.routes";
import financeRoutes from "./routes/finance.routes";

const app = express();

app.use(cors());

app.use(express.json());

app.use("/health", healthRoutes);
app.use("/finance", financeRoutes);

export default app;
