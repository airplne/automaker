/**
 * Common utilities for npm-security routes
 */

import { createLogger } from '@automaker/utils';

const logger = createLogger('NpmSecurity');

type Logger = ReturnType<typeof createLogger>;

/**
 * Get error message from error object
 */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

/**
 * Create a logError function for a specific logger
 */
export function createLogError(logger: Logger) {
  return (error: unknown, context: string): void => {
    logger.error(`❌ ${context}:`, error);
  };
}

// Re-export logger for use in route handlers
export { logger };
export const logError = createLogError(logger);
