import { logger } from "./logger";

export function logError(error: unknown, context?: Record<string, any>) {
  logger.error({
    message: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
    context,
  });
}
