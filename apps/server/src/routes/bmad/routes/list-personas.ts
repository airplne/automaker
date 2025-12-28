import type { Request, Response } from 'express';
import type { SettingsService } from '../../../services/settings-service.js';
import { BmadService } from '../../../services/bmad-service.js';
import { getErrorMessage, logError } from '../common.js';

export function createListPersonasHandler(settingsService: SettingsService) {
  const bmadService = new BmadService(settingsService);

  return async (_req: Request, res: Response): Promise<void> => {
    try {
      const { bundleVersion, personas } = await bmadService.listPersonas();
      res.json({ success: true, bundleVersion, personas });
    } catch (error) {
      logError(error, 'List BMAD personas failed');
      res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
  };
}
