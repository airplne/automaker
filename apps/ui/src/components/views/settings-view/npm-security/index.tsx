import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { Shield, AlertTriangle, Check, Info, ShieldOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NpmSecuritySettings } from '@automaker/types';

// Default settings for development mode - security disabled
const DEFAULT_SETTINGS: NpmSecuritySettings = {
  dependencyInstallPolicy: 'allow',
  allowInstallScripts: true,
  allowedPackagesForRebuild: [],
  enableAuditLog: true,
  auditLogRetentionDays: 30,
};

// Get server URL - same pattern as http-api-client
const getServerUrl = (): string => {
  if (typeof window !== 'undefined') {
    const envUrl = import.meta.env.VITE_SERVER_URL;
    if (envUrl) return envUrl;
  }
  return 'http://localhost:3008';
};

// Get API key for authentication
const getApiKey = (): string | null => {
  if (typeof window !== 'undefined') {
    return import.meta.env.VITE_AUTOMAKER_API_KEY || null;
  }
  return null;
};

const getHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const apiKey = getApiKey();
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }
  return headers;
};

export function NpmSecuritySettingsView() {
  const { currentProject } = useAppStore();
  const [settings, setSettings] = useState<NpmSecuritySettings | null>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Check if security is effectively disabled (Allow mode with scripts enabled)
  const isSecurityDisabled =
    settings?.dependencyInstallPolicy === 'allow' && settings?.allowInstallScripts;

  const fetchSettings = useCallback(async () => {
    if (!currentProject?.path) return;

    setLoading(true);
    try {
      const serverUrl = getServerUrl();
      const response = await fetch(`${serverUrl}/api/npm-security/settings/get`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ projectPath: currentProject.path }),
      });
      const data = await response.json();
      if (data.success) {
        // Merge fetched settings with defaults, preferring defaults for development
        setSettings({ ...DEFAULT_SETTINGS, ...data.data });
      } else {
        // If fetch fails, use defaults
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Failed to fetch npm security settings:', error);
      // On error, use defaults
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, [currentProject?.path]);

  const updateSettings = useCallback(
    async (updates: Partial<NpmSecuritySettings>) => {
      if (!currentProject?.path) return;

      setSaving(true);
      try {
        const serverUrl = getServerUrl();
        const response = await fetch(`${serverUrl}/api/npm-security/settings/update`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ projectPath: currentProject.path, ...updates }),
        });
        const data = await response.json();
        if (data.success) {
          setSettings(data.data);
        } else {
          console.error('Failed to update npm security settings:', data.error);
        }
      } catch (error) {
        console.error('Failed to update npm security settings:', error);
      } finally {
        setSaving(false);
      }
    },
    [currentProject?.path]
  );

  useEffect(() => {
    if (currentProject?.path) {
      fetchSettings();
    } else {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
    }
  }, [currentProject?.path, fetchSettings]);

  if (!currentProject) {
    return (
      <div
        className={cn(
          'rounded-2xl overflow-hidden',
          'border border-border/50',
          'bg-gradient-to-br from-card/90 via-card/70 to-card/80 backdrop-blur-xl',
          'shadow-sm shadow-black/5'
        )}
      >
        <div className="p-6 border-b border-border/50 bg-gradient-to-r from-transparent via-accent/5 to-transparent">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 flex items-center justify-center border border-brand-500/20">
              <Shield className="w-5 h-5 text-brand-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">npm Security</h2>
          </div>
          <p className="text-sm text-muted-foreground/80 ml-12">
            Configure how Automaker handles npm package installation and execution.
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Info className="h-4 w-4" />
            <span className="text-sm">Select a project to configure npm security settings</span>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-2xl overflow-hidden',
          'border border-border/50',
          'bg-gradient-to-br from-card/90 via-card/70 to-card/80 backdrop-blur-xl',
          'shadow-sm shadow-black/5'
        )}
      >
        <div className="p-6 border-b border-border/50 bg-gradient-to-r from-transparent via-accent/5 to-transparent">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 flex items-center justify-center border border-brand-500/20">
              <Shield className="w-5 h-5 text-brand-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">npm Security</h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden',
        'border',
        isSecurityDisabled ? 'border-red-500/50' : 'border-border/50',
        'bg-gradient-to-br from-card/90 via-card/70 to-card/80 backdrop-blur-xl',
        'shadow-sm shadow-black/5'
      )}
    >
      <div
        className={cn(
          'p-6 border-b bg-gradient-to-r',
          isSecurityDisabled
            ? 'border-red-500/30 from-red-500/10 via-red-500/5 to-transparent'
            : 'border-border/50 from-transparent via-accent/5 to-transparent'
        )}
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center border',
              isSecurityDisabled
                ? 'bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/20'
                : 'bg-gradient-to-br from-brand-500/20 to-brand-600/10 border-brand-500/20'
            )}
          >
            {isSecurityDisabled ? (
              <ShieldOff className="w-5 h-5 text-red-500" />
            ) : (
              <Shield className="w-5 h-5 text-brand-500" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground tracking-tight">npm Security</h2>
            {isSecurityDisabled && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
                DISABLED
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground/80 ml-12">
          Configure how Automaker handles npm package installation and execution for this project.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Development Mode Banner - shown when security is disabled */}
        {isSecurityDisabled && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex gap-3">
            <ShieldOff className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-400">Security disabled for development</p>
              <p className="text-sm text-muted-foreground">
                npm firewall is currently OFF. All install scripts and commands are allowed without
                prompting. Enable Strict mode for production or untrusted codebases.
              </p>
            </div>
          </div>
        )}

        {/* Warning Banner - shown when security is enabled */}
        {!isSecurityDisabled && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Supply Chain Security</p>
              <p className="text-sm text-muted-foreground">
                npm packages can execute arbitrary code during installation via lifecycle scripts.
                We strongly recommend keeping strict mode enabled and running agents in Docker/VM
                for untrusted repositories.
              </p>
            </div>
          </div>
        )}

        {/* Policy Selection */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Dependency Install Policy</h3>
          <div className="space-y-2">
            {[
              {
                value: 'strict',
                label: 'Strict (Recommended)',
                description:
                  'Block lifecycle scripts by default. Require explicit approval for high-risk commands (npx, etc.).',
              },
              {
                value: 'prompt',
                label: 'Prompt',
                description:
                  'Ask for approval before running install scripts or high-risk commands.',
              },
              {
                value: 'allow',
                label: 'Allow (Not Recommended)',
                description:
                  'Allow all install scripts and commands without prompting. Use only for trusted projects.',
              },
            ].map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  (settings?.dependencyInstallPolicy ?? 'allow') === option.value
                    ? 'border-brand-500 bg-brand-500/5'
                    : 'border-border hover:border-brand-500/50'
                )}
              >
                <input
                  type="radio"
                  name="policy"
                  value={option.value}
                  checked={(settings?.dependencyInstallPolicy ?? 'allow') === option.value}
                  onChange={() =>
                    updateSettings({
                      dependencyInstallPolicy: option.value as 'strict' | 'prompt' | 'allow',
                    })
                  }
                  className="mt-1 accent-brand-500"
                  disabled={saving}
                />
                <div className="flex-1">
                  <span className="font-medium text-sm">{option.label}</span>
                  <p className="text-sm text-muted-foreground mt-0.5">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Quick Toggles */}
        <div className="space-y-4 pt-4 border-t border-border/50">
          <h3 className="text-sm font-medium">Quick Settings</h3>

          <label className="flex items-start justify-between gap-4 cursor-pointer">
            <div className="flex-1">
              <span className="font-medium text-sm">Allow Install Scripts</span>
              <p className="text-sm text-muted-foreground mt-0.5">
                When enabled, npm/pnpm/yarn install commands will run lifecycle scripts.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings?.allowInstallScripts ?? true}
              onChange={(e) => updateSettings({ allowInstallScripts: e.target.checked })}
              disabled={saving}
              className="h-5 w-5 mt-0.5 accent-brand-500"
            />
          </label>

          <label className="flex items-start justify-between gap-4 cursor-pointer">
            <div className="flex-1">
              <span className="font-medium text-sm">Enable Audit Log</span>
              <p className="text-sm text-muted-foreground mt-0.5">
                Log all npm security policy decisions for review.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings?.enableAuditLog ?? true}
              onChange={(e) => updateSettings({ enableAuditLog: e.target.checked })}
              disabled={saving}
              className="h-5 w-5 mt-0.5 accent-brand-500"
            />
          </label>
        </div>

        {/* What's Protected Info */}
        <div className="space-y-3 pt-4 border-t border-border/50">
          <h3 className="text-sm font-medium">What's Protected</h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">npm install</code>,{' '}
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">pnpm install</code>,{' '}
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">yarn install</code> -
                scripts blocked
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">npx</code>,{' '}
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">pnpm dlx</code>,{' '}
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">yarn dlx</code>,{' '}
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">bunx</code> - requires
                approval
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">
                Terminal sessions - secure npm environment by default
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Alias for backward compatibility with settings-view.tsx import
export { NpmSecuritySettingsView as NpmSecuritySettings };
export default NpmSecuritySettingsView;
