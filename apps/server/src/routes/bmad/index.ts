/**
 * BMAD routes - HTTP API for BMAD integration
 *
 * Provides endpoints for:
 * - Listing bundled BMAD personas
 * - Getting project BMAD status
 * - Initializing BMAD into a project (_bmad/)
 * - Upgrading BMAD with backups
 *
 * Mounted at /api/bmad in the main server.
 */

import { Router } from 'express';
import type { SettingsService } from '../../services/settings-service.js';
import { validatePathParams } from '../../middleware/validate-paths.js';
import { createListPersonasHandler } from './routes/list-personas.js';
import { createStatusHandler } from './routes/status.js';
import { createInitializeHandler } from './routes/initialize.js';
import { createUpgradeHandler } from './routes/upgrade.js';

export function createBmadRoutes(settingsService: SettingsService): Router {
  const router = Router();

  router.get('/personas', createListPersonasHandler(settingsService));
  router.post('/status', validatePathParams('projectPath'), createStatusHandler(settingsService));
  router.post(
    '/initialize',
    validatePathParams('projectPath'),
    createInitializeHandler(settingsService)
  );
  router.post('/upgrade', validatePathParams('projectPath'), createUpgradeHandler(settingsService));

  return router;
}
