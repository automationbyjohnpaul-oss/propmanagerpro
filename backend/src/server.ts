import app from "./app";

const PORT = process.env.PORT || 4000;

/**
 * IMPORTANT: Railway requires 0.0.0.0 binding
 * This allows the container to accept external requests
 */
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("=================================");
  console.log("🚀 PropManager Pro Backend Started");
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("=================================");
});

/**
 * Handle startup errors
 */
server.on("error", (err: any) => {
  console.error("❌ Server error:", err);
});

/**
 * Graceful shutdown
 */
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down...");
  server.close(() => process.exit(0));
});
