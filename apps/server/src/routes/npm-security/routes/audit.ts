/**
 * POST /audit/get endpoint - Get audit log for a project
 *
 * Uses POST with projectPath in body to avoid URL encoding issues
 * with paths containing slashes (e.g., /home/user/project).
 */

import type { Request, Response } from 'express';
import type { SettingsService } from '../../../services/settings-service.js';
import { getErrorMessage, logError } from '../common.js';

export function createGetAuditLogHandler(settingsService: SettingsService) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectPath, limit, since } = req.body as {
        projectPath?: string;
        limit?: number;
        since?: number;
      };

      if (!projectPath || typeof projectPath !== 'string') {
        res.status(400).json({
          success: false,
          error: 'projectPath is required in request body',
        });
        return;
      }

      const entries = await settingsService.getNpmSecurityAuditLog(projectPath, {
        limit: limit ?? 100,
        since: since,
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
