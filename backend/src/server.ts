import app from "./app";
import { env } from "./config/env";
import { runStartupChecks } from "./lib/startupHealth";
import { logger } from "./lib/logger";

const PORT = Number(env.PORT);

async function startServer() {
  try {
    await runStartupChecks();

    const server = app.listen(PORT, "0.0.0.0", () => {
      logger.info("=================================");
      logger.info("PropManager Pro Backend Started");
      logger.info(`Port: ${PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info("=================================");
    });

    server.on("error", (err: any) => {
      logger.error(err, "Server error");
    });

    process.on("SIGTERM", () => {
      logger.info("SIGTERM received. Shutting down...");
      server.close(() => process.exit(0));
    });
  } catch (error) {
    logger.error(error, "Startup health checks failed");
    process.exit(1);
  }
}

startServer();
