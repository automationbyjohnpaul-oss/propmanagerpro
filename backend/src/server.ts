import app from "./app";

const PORT = process.env.PORT || 4000;

/**
 * Start server
 */
const server = app.listen(PORT, () => {
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
