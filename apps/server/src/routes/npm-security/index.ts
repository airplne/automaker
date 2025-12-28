/**
 * npm-security routes - HTTP API for npm security policy management
 *
 * Provides endpoints for:
 * - Reading and updating security policies
 * - Handling approval requests for install scripts
 * - Accessing audit logs
 */

import { Router } from 'express';
import type { SettingsService } from '../../services/settings-service.js';
import {
  createGetSettingsHandler,
  createUpdateSettingsHandler,
  createAllowScriptsHandler,
} from './routes/settings.js';
import {
  createGetPendingHandler,
  createSubmitDecisionHandler,
  createStreamHandler,
} from './routes/approval.js';
import { createGetAuditLogHandler } from './routes/audit.js';

// Re-export for use in policy engine
export { requestApproval } from './routes/approval.js';

export function createNpmSecurityRoutes(settingsService: SettingsService): Router {
  const router = Router();

  // Settings routes
  router.get('/settings/:projectPath(*)', createGetSettingsHandler(settingsService));
  router.put('/settings/:projectPath(*)', createUpdateSettingsHandler(settingsService));
  router.post(
    '/settings/:projectPath(*)/allow-scripts',
    createAllowScriptsHandler(settingsService)
  );

  // Approval routes
  router.get('/approval/pending', createGetPendingHandler());
  router.post('/approval/:requestId', createSubmitDecisionHandler(settingsService));
  router.get('/approval/stream', createStreamHandler());

  // Audit routes
  router.get('/audit/:projectPath(*)', createGetAuditLogHandler(settingsService));

  return router;
}
