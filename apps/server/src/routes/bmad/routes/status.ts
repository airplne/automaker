import type { Request, Response } from 'express';
import type { SettingsService } from '../../../services/settings-service.js';
import { BmadService } from '../../../services/bmad-service.js';
import { getErrorMessage, logError } from '../common.js';

export function createStatusHandler(settingsService: SettingsService) {
  const bmadService = new BmadService(settingsService);

  return async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectPath } = req.body as { projectPath?: string };
      if (!projectPath || typeof projectPath !== 'string') {
        res.status(400).json({ success: false, error: 'projectPath is required' });
        return;
      }

      const status = await bmadService.getStatus(projectPath);
      res.json({ success: true, status });
    } catch (error) {
      logError(error, 'Get BMAD status failed');
      res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
  };
}
