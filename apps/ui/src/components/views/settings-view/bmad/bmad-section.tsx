import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Puzzle, ArrowUpCircle, Download, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getElectronAPI, type BmadStatus } from '@/lib/electron';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BmadSectionProps {
  projectPath: string | null;
}

export function BmadSection({ projectPath }: BmadSectionProps) {
  const [status, setStatus] = useState<BmadStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [artifactsDir, setArtifactsDir] = useState('_bmad-output');
  const [scaffoldMethodology, setScaffoldMethodology] = useState(false);

  const artifactsSelectValue = useMemo(() => {
    if (artifactsDir === '.automaker/bmad-output') return artifactsDir;
    if (artifactsDir === '_bmad-output') return artifactsDir;
    return 'custom';
  }, [artifactsDir]);

  const loadStatus = useCallback(async () => {
    if (!projectPath) {
      setStatus(null);
      return;
    }

    setIsLoadingStatus(true);
    try {
      const api = getElectronAPI();
      const result = await api.bmad?.getStatus(projectPath);
      if (result?.success && result.status) {
        setStatus(result.status);
        setArtifactsDir(result.status.artifactsDir || '_bmad-output');
      } else {
        setStatus(null);
      }
    } catch (e) {
      console.error('[BMAD] Failed to load status:', e);
      setStatus(null);
    } finally {
      setIsLoadingStatus(false);
    }
  }, [projectPath]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleInitialize = async () => {
    if (!projectPath) return;

    setIsWorking(true);
    try {
      const api = getElectronAPI();
      const result = await api.bmad?.initialize(projectPath, {
        artifactsDir,
        scaffoldMethodology,
      });
      if (result?.success && result.status) {
        toast.success('BMAD initialized', {
          description: `Installed to _bmad/ • Artifacts: ${result.status.artifactsDir}`,
        });
        await loadStatus();
      } else {
        toast.error('Failed to initialize BMAD', { description: result?.error || 'Unknown error' });
      }
    } catch (e) {
      toast.error('Failed to initialize BMAD', {
        description: e instanceof Error ? e.message : 'Unknown error',
      });
    } finally {
      setIsWorking(false);
    }
  };

  const handleUpgrade = async () => {
    if (!projectPath) return;

    setIsWorking(true);
    try {
      const api = getElectronAPI();
      const result = await api.bmad?.upgrade(projectPath);
      if (result?.success && result.status) {
        toast.success('BMAD upgraded', {
          description: `Backed up to .automaker/bmad-backups/ • Now ${result.status.bundleVersion}`,
        });
        await loadStatus();
      } else {
        toast.error('Failed to upgrade BMAD', { description: result?.error || 'Unknown error' });
      }
    } catch (e) {
      toast.error('Failed to upgrade BMAD', {
        description: e instanceof Error ? e.message : 'Unknown error',
      });
    } finally {
      setIsWorking(false);
    }
  };

  if (!projectPath) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/70 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
            <Puzzle className="w-5 h-5 text-brand-500" />
          </div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">BMAD</h2>
        </div>
        <p className="text-sm text-muted-foreground">Select a project to manage BMAD settings.</p>
      </div>
    );
  }

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
            <Puzzle className="w-5 h-5 text-brand-500" />
          </div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">BMAD</h2>
        </div>
        <p className="text-sm text-muted-foreground/80 ml-12">
          Install BMAD workflows to <code>_bmad/</code> and configure git-friendly artifacts.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Status</p>
            {isLoadingStatus ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : status ? (
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>
                  Installed:{' '}
                  <span className="text-foreground">{status.installed ? 'Yes' : 'No'}</span>
                </p>
                <p>
                  Enabled: <span className="text-foreground">{status.enabled ? 'Yes' : 'No'}</span>
                </p>
                <p>
                  Version:{' '}
                  <span className="text-foreground">{status.installedVersion ?? 'unknown'}</span>{' '}
                  <span className="text-muted-foreground/70">(bundle: {status.bundleVersion})</span>
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Unavailable</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadStatus} disabled={isLoadingStatus}>
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleInitialize}
              disabled={isWorking || isLoadingStatus}
              data-testid="bmad-initialize-button"
            >
              <Download className="w-4 h-4 mr-2" />
              Initialize BMAD
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleUpgrade}
              disabled={!status?.needsUpgrade || isWorking || isLoadingStatus}
              data-testid="bmad-upgrade-button"
              title={
                status?.needsUpgrade
                  ? 'Backs up _bmad/ and artifacts before upgrading'
                  : 'No upgrade needed'
              }
            >
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              Upgrade
            </Button>
          </div>
        </div>

        {/* Artifacts */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-brand-500" />
            <Label className="text-foreground font-medium">Artifacts Directory</Label>
          </div>
          <Select
            value={artifactsSelectValue}
            onValueChange={(value) => {
              if (value === 'custom') return;
              setArtifactsDir(value);
            }}
          >
            <SelectTrigger className="h-9" data-testid="bmad-artifacts-dir-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_bmad-output">_bmad-output (default)</SelectItem>
              <SelectItem value=".automaker/bmad-output">
                .automaker/bmad-output (AutoMaker-managed)
              </SelectItem>
              <SelectItem value="custom">Custom…</SelectItem>
            </SelectContent>
          </Select>
          {artifactsSelectValue === 'custom' && (
            <Input
              value={artifactsDir}
              onChange={(e) => setArtifactsDir(e.target.value)}
              placeholder="e.g., _bmad-output"
              data-testid="bmad-artifacts-dir-input"
            />
          )}
          <p className="text-xs text-muted-foreground">
            Default follows BMAD conventions; <code>.automaker/</code> keeps artifacts
            AutoMaker-managed.
          </p>
        </div>

        {/* Scaffold */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
          <Checkbox
            id="bmad-scaffold-checkbox"
            checked={scaffoldMethodology}
            onCheckedChange={(value) => setScaffoldMethodology(Boolean(value))}
          />
          <div className="space-y-1">
            <Label htmlFor="bmad-scaffold-checkbox" className="text-foreground font-medium">
              Scaffold BMAD methodology
            </Label>
            <p className="text-xs text-muted-foreground">
              Optionally create starter backlog cards (PRD → Architecture → Epics → Stories).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
