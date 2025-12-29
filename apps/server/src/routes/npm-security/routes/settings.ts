/**
 * POST /settings/get endpoint - Get npm security settings
 * POST /settings/update endpoint - Update npm security settings
 * POST /settings/allow-scripts endpoint - Toggle allow install scripts
 *
 * All endpoints use POST with projectPath in body to avoid URL encoding issues
 * with paths containing slashes (e.g., /home/user/project).
 */

import type { Request, Response } from 'express';
import type { SettingsService } from '../../../services/settings-service.js';
import { getErrorMessage, logError } from '../common.js';
import { validateAndCorrectNpmSecuritySettings } from '../../../lib/npm-security-policy.js';

export function createGetSettingsHandler(settingsService: SettingsService) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectPath } = req.body as { projectPath?: string };

      if (!projectPath || typeof projectPath !== 'string') {
        res.status(400).json({
          success: false,
          error: 'projectPath is required in request body',
        });
        return;
      }

      const settings = await settingsService.getNpmSecuritySettings(projectPath);
      res.json({ success: true, data: settings });
    } catch (error) {
      logError(error, 'Get npm security settings failed');
      res.status(500).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  };
}

export function createUpdateSettingsHandler(settingsService: SettingsService) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectPath, ...updates } = req.body as { projectPath?: string } & Record<
        string,
        unknown
      >;

      if (!projectPath || typeof projectPath !== 'string') {
        res.status(400).json({
          success: false,
          error: 'projectPath is required in request body',
        });
        return;
      }

      // Validate updates
      if (
        updates.dependencyInstallPolicy &&
        !['strict', 'prompt', 'allow'].includes(updates.dependencyInstallPolicy as string)
      ) {
        res.status(400).json({
          success: false,
          error: 'Invalid dependencyInstallPolicy. Must be: strict, prompt, or allow',
        });
        return;
      }

      // Get current settings to create a complete settings object
      const currentSettings = await settingsService.getNpmSecuritySettings(projectPath);

      // Merge updates with current settings
      const mergedSettings = { ...currentSettings, ...updates };

      // Validate and correct settings before saving
      const correctedSettings = validateAndCorrectNpmSecuritySettings(mergedSettings);

      const settings = await settingsService.updateNpmSecuritySettings(
        projectPath,
        correctedSettings
      );
      res.json({ success: true, data: settings });
    } catch (error) {
      logError(error, 'Update npm security settings failed');
      res.status(500).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  };
}

export function createAllowScriptsHandler(settingsService: SettingsService) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectPath, allow } = req.body as { projectPath?: string; allow?: boolean };

      if (!projectPath || typeof projectPath !== 'string') {
        res.status(400).json({
          success: false,
          error: 'projectPath is required in request body',
        });
        return;
      }

      await settingsService.setAllowInstallScripts(projectPath, allow === true);
      res.json({ success: true });
    } catch (error) {
      logError(error, 'Set allow install scripts failed');
      res.status(500).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  };
}
