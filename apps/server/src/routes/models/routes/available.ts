/**
 * GET /available endpoint - Get available models
 */

import type { Request, Response } from 'express';
import { ProviderFactory } from '../../../providers/provider-factory.js';
import type { ModelDefinition } from '../../../providers/types.js';
import { getErrorMessage, logError } from '../common.js';

function normalizeBaseUrl(raw?: string): string {
  const value = (raw || '').trim();
  if (!value) return 'http://localhost:11434';
  const withProtocol =
    value.startsWith('http://') || value.startsWith('https://') ? value : `http://${value}`;
  return withProtocol.replace(/\/+$/, '');
}

async function getOllamaInstalledModels(): Promise<ModelDefinition[]> {
  const baseUrl = normalizeBaseUrl(
    process.env.AUTOMAKER_OLLAMA_BASE_URL || process.env.OLLAMA_HOST
  );
  try {
    const timeoutMs = 1500;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let resp: globalThis.Response;
    try {
      resp = await fetch(`${baseUrl}/api/tags`, { method: 'GET', signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (!resp.ok) return [];

    const data = (await resp.json()) as { models?: Array<{ name?: unknown }> };
    const names = Array.isArray(data.models)
      ? data.models
          .map((m) => (typeof m?.name === 'string' ? m.name : null))
          .filter((n): n is string => !!n)
      : [];

    return names.map((name) => ({
      id: `ollama:${name}`,
      name: `Ollama ${name}`,
      modelString: `ollama:${name}`,
      provider: 'ollama',
      description: 'Installed locally in Ollama',
      supportsVision: false,
      supportsTools: true,
      tier: 'basic' as const,
    }));
  } catch {
    return [];
  }
}

export function createAvailableHandler() {
  return async (_req: Request, res: Response): Promise<void> => {
    try {
      const providerModels = ProviderFactory.getAllAvailableModels();
      const ollamaInstalled = await getOllamaInstalledModels();

      const byId = new Map<string, ModelDefinition>();
      for (const model of [...providerModels, ...ollamaInstalled]) {
        byId.set(model.id, model);
      }

      const models = Array.from(byId.values());

      res.json({ success: true, models });
    } catch (error) {
      logError(error, 'Get available models failed');
      res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
  };
}
