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

  // Settings routes - use POST with projectPath in body to avoid URL encoding issues
  // (paths with slashes like /home/user/project don't work well in URL params)
  router.post('/settings/get', createGetSettingsHandler(settingsService));
  router.post('/settings/update', createUpdateSettingsHandler(settingsService));
  router.post('/settings/allow-scripts', createAllowScriptsHandler(settingsService));

  // Approval routes
  router.get('/approval/pending', createGetPendingHandler());
  router.post('/approval/:requestId', createSubmitDecisionHandler(settingsService));
  router.get('/approval/stream', createStreamHandler());

  // Audit routes - use POST with projectPath in body
  router.post('/audit/get', createGetAuditLogHandler(settingsService));

  return router;
}
