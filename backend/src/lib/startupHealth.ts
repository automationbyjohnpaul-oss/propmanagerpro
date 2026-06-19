import { prisma } from "./prisma";
import { logger } from "./logger";

export async function runStartupChecks() {
  logger.info("Running startup health checks...");

  await prisma.$queryRaw`SELECT 1`;

  logger.info("Database connection successful");
  logger.info("Startup health checks passed");
}
