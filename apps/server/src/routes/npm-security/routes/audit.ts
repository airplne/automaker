/**
 * GET /audit/:projectPath endpoint - Get audit log for a project
 */

import type { Request, Response } from 'express';
import type { SettingsService } from '../../../services/settings-service.js';
import { getErrorMessage, logError } from '../common.js';

export function createGetAuditLogHandler(settingsService: SettingsService) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const projectPath = decodeURIComponent(req.params.projectPath);
      const { limit, since } = req.query;

      const entries = await settingsService.getNpmSecurityAuditLog(projectPath, {
        limit: limit ? parseInt(limit as string, 10) : 100,
        since: since ? parseInt(since as string, 10) : undefined,
      });

      res.json({ success: true, data: entries });
    } catch (error) {
      logError(error, 'Get npm security audit log failed');
      res.status(500).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  };
}
