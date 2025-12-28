import { useCallback, useEffect, useState } from 'react';
import { getElectronAPI } from '@/lib/electron';
import type { PersonaDescriptor } from '@automaker/types';

export function useBmadPersonas(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [personas, setPersonas] = useState<PersonaDescriptor[]>([]);
  const [bundleVersion, setBundleVersion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);
    try {
      const api = getElectronAPI();
      if (!api.bmad) {
        setPersonas([]);
        setBundleVersion(null);
        return;
      }

      const result = await api.bmad.listPersonas();
      if (result.success && result.personas) {
        setPersonas(result.personas);
        setBundleVersion(result.bundleVersion ?? null);
      } else {
        setPersonas([]);
        setBundleVersion(null);
        setError(result.error || 'Failed to load BMAD personas');
      }
    } catch (e) {
      setPersonas([]);
      setBundleVersion(null);
      setError(e instanceof Error ? e.message : 'Failed to load BMAD personas');
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return { personas, bundleVersion, isLoading, error, reload: load };
}
