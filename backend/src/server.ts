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
 * Graceful startup verification
 */
server.on("listening", () => {
  console.log("✅ Server is successfully listening for requests");
});

/**
 * Handle unexpected errors
 */
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:");
  console.error(err);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ UNHANDLED PROMISE REJECTION:");
  console.error(reason);
});

/**
 * Graceful shutdown (Railway / Docker safe)
 */
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed cleanly");
    process.exit(0);
  });
});
