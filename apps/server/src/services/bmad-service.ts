import fs from 'fs/promises';
import path from 'path';
import { BMAD_BUNDLE_VERSION, getBmadBundleDir } from '@automaker/bmad-bundle';
import {
  ensureAutomakerDir,
  getAutomakerDir,
  getContextDir,
  getFeaturesDir,
} from '@automaker/platform';
import type { SettingsService } from './settings-service.js';
import * as secureFs from '../lib/secure-fs.js';
import { BmadPersonaService } from './bmad-persona-service.js';
import { FeatureLoader } from './feature-loader.js';
import type { Feature, PersonaDescriptor } from '@automaker/types';

type BmadStatus = {
  enabled: boolean;
  artifactsDir: string;
  installed: boolean;
  installedVersion: string | null;
  bundleVersion: string;
  needsUpgrade: boolean;
};

function normalizeArtifactsDir(input: string | undefined | null): string {
  const trimmed = (input ?? '').trim();
  if (!trimmed) return '_bmad-output';

  // Disallow absolute paths and traversal; keep it project-relative for safety + portability.
  if (path.isAbsolute(trimmed) || trimmed.includes('..')) {
    return '_bmad-output';
  }

  return trimmed.replaceAll('\\', '/').replace(/^\/+/, '');
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await secureFs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyDirFromBundleToProject(srcDir: string, destDir: string): Promise<void> {
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  await secureFs.mkdir(destDir, { recursive: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirFromBundleToProject(srcPath, destPath);
    } else if (entry.isFile()) {
      const content = await fs.readFile(srcPath);
      await secureFs.writeFile(destPath, content);
    }
  }
}

async function copyDirWithinProject(srcDir: string, destDir: string): Promise<void> {
  const entries = (await secureFs.readdir(srcDir, { withFileTypes: true })) as any[];
  await secureFs.mkdir(destDir, { recursive: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirWithinProject(srcPath, destPath);
    } else if (entry.isFile()) {
      await secureFs.copyFile(srcPath, destPath);
    }
  }
}

async function patchBmadOutputPaths(projectPath: string, artifactsDir: string): Promise<void> {
  const normalizedArtifactsDir = normalizeArtifactsDir(artifactsDir);
  const replacement = `{project-root}/${normalizedArtifactsDir}`;

  const configFiles = [
    path.join(projectPath, '_bmad', 'core', 'config.yaml'),
    path.join(projectPath, '_bmad', 'bmm', 'config.yaml'),
    path.join(projectPath, '_bmad', 'bmm-executive', 'config.yaml'),
    path.join(projectPath, '_bmad', 'bmb', 'config.yaml'),
    path.join(projectPath, '_bmad', 'cis', 'config.yaml'),
    path.join(projectPath, '_bmad', '_memory', 'config.yaml'),
  ];

  for (const configPath of configFiles) {
    try {
      const raw = (await secureFs.readFile(configPath, 'utf-8')) as string;
      const updated = raw.replaceAll('{project-root}/_bmad-output', replacement);
      if (updated !== raw) {
        await secureFs.writeFile(configPath, updated, 'utf-8');
      }
    } catch {
      // Missing config is non-fatal; BMAD modules may vary.
    }
  }
}

async function ensureBmadContextFile(projectPath: string, status: BmadStatus): Promise<void> {
  const contextDir = getContextDir(projectPath);
  await secureFs.mkdir(contextDir, { recursive: true });

  const contextPath = path.join(contextDir, 'bmad.md');
  const content = `# BMAD Integration

BMAD is enabled for this project.

- BMAD install location: \`_bmad/\` (project root)
- Artifact directory: \`${status.artifactsDir}\` (relative to project root)
- Installed BMAD version: \`${status.installedVersion ?? 'unknown'}\`
- Bundled BMAD version: \`${status.bundleVersion}\`

Notes:
- Keep artifacts git-friendly (text-only, stable filenames).
- If you need a BMAD workflow, read it from \`_bmad/\` (if installed).
`;

  await secureFs.writeFile(contextPath, content, 'utf-8');
}

export class BmadService {
  private personaService = new BmadPersonaService();
  private featureLoader = new FeatureLoader();

  constructor(private settingsService: SettingsService) {}

  async listPersonas(): Promise<{ bundleVersion: string; personas: PersonaDescriptor[] }> {
    const personas = await this.personaService.listPersonas();
    return { bundleVersion: BMAD_BUNDLE_VERSION, personas };
  }

  async getStatus(projectPath: string): Promise<BmadStatus> {
    const projectSettings = await this.settingsService.getProjectSettings(projectPath);
    const enabled = projectSettings.bmad?.enabled === true;
    const artifactsDir = normalizeArtifactsDir(projectSettings.bmad?.artifactsDir);
    const installedVersion = projectSettings.bmad?.installedVersion ?? null;

    const installed = await exists(path.join(projectPath, '_bmad'));
    const bundleVersion = BMAD_BUNDLE_VERSION;
    const needsUpgrade = Boolean(
      installed && installedVersion && installedVersion !== bundleVersion
    );

    return {
      enabled,
      artifactsDir,
      installed,
      installedVersion,
      bundleVersion,
      needsUpgrade,
    };
  }

  async initializeProjectBmad(
    projectPath: string,
    options?: { artifactsDir?: string; scaffoldMethodology?: boolean }
  ): Promise<BmadStatus & { createdFeatures?: Feature[] }> {
    await ensureAutomakerDir(projectPath);

    const artifactsDir = normalizeArtifactsDir(options?.artifactsDir);

    // Enable BMAD + persist artifact location (hybrid approach)
    await this.settingsService.updateProjectSettings(projectPath, {
      bmad: {
        enabled: true,
        artifactsDir,
        installedVersion: (await this.getStatus(projectPath)).installedVersion ?? undefined,
      },
    });

    const statusBefore = await this.getStatus(projectPath);

    // Ensure artifact directory exists
    await secureFs.mkdir(path.join(projectPath, statusBefore.artifactsDir), { recursive: true });

    // Install BMAD bundle into project root if missing
    if (!statusBefore.installed) {
      const bundleDir = getBmadBundleDir();
      await copyDirFromBundleToProject(bundleDir, path.join(projectPath, '_bmad'));

      await patchBmadOutputPaths(projectPath, artifactsDir);

      await this.settingsService.updateProjectSettings(projectPath, {
        bmad: {
          enabled: true,
          artifactsDir,
          installedVersion: BMAD_BUNDLE_VERSION,
        },
      });
    } else {
      // Idempotent re-run: ensure config points to current artifactsDir
      await patchBmadOutputPaths(projectPath, artifactsDir);
    }

    const statusAfter = await this.getStatus(projectPath);
    await ensureBmadContextFile(projectPath, statusAfter);

    // Optional scaffolding (PRD → Architecture → Epics → Stories)
    let createdFeatures: Feature[] | undefined;
    if (options?.scaffoldMethodology) {
      createdFeatures = await this.scaffoldMethodology(projectPath);
    }

    return { ...statusAfter, createdFeatures };
  }

  async upgradeProjectBmad(projectPath: string): Promise<BmadStatus> {
    await ensureAutomakerDir(projectPath);

    const status = await this.getStatus(projectPath);
    if (!status.installed) {
      throw new Error('BMAD is not installed in this project. Run Initialize BMAD first.');
    }

    // Backup BOTH _bmad + artifacts dir
    const backupsDir = path.join(getAutomakerDir(projectPath), 'bmad-backups');
    await secureFs.mkdir(backupsDir, { recursive: true });
    const timestamp = new Date().toISOString().replaceAll(':', '-');
    const backupRoot = path.join(backupsDir, timestamp);
    await secureFs.mkdir(backupRoot, { recursive: true });

    const backupBmadDir = path.join(backupRoot, '_bmad');
    await copyDirWithinProject(path.join(projectPath, '_bmad'), backupBmadDir);

    const backupArtifactsDir = path.join(backupRoot, 'artifacts');
    const artifactsAbs = path.join(projectPath, status.artifactsDir);
    if (await exists(artifactsAbs)) {
      await copyDirWithinProject(artifactsAbs, backupArtifactsDir);
    }

    // Replace _bmad with current bundled version
    await secureFs.rm(path.join(projectPath, '_bmad'), { recursive: true, force: true });
    await copyDirFromBundleToProject(getBmadBundleDir(), path.join(projectPath, '_bmad'));
    await patchBmadOutputPaths(projectPath, status.artifactsDir);

    await this.settingsService.updateProjectSettings(projectPath, {
      bmad: {
        enabled: true,
        artifactsDir: status.artifactsDir,
        installedVersion: BMAD_BUNDLE_VERSION,
      },
    });

    const updatedStatus = await this.getStatus(projectPath);
    await ensureBmadContextFile(projectPath, updatedStatus);
    return updatedStatus;
  }

  private async scaffoldMethodology(projectPath: string): Promise<Feature[]> {
    await ensureAutomakerDir(projectPath);
    await secureFs.mkdir(getFeaturesDir(projectPath), { recursive: true });

    const cards: Array<Partial<Feature>> = [
      {
        title: 'BMAD: Product Requirements (PRD)',
        category: 'BMAD',
        description:
          'Create a PRD for this project (BMAD methodology). Include goals, users, scope, and acceptance criteria.',
        personaId: 'bmad:strategist-marketer',
        planningMode: 'spec',
        requirePlanApproval: true,
        priority: 1,
        status: 'backlog',
      },
      {
        title: 'BMAD: Architecture',
        category: 'BMAD',
        description:
          'Create an architecture document aligned to the PRD (BMAD methodology). Focus on boring, scalable decisions.',
        personaId: 'bmad:technologist-architect',
        planningMode: 'spec',
        requirePlanApproval: true,
        priority: 1,
        status: 'backlog',
      },
      {
        title: 'BMAD: Epics & Stories',
        category: 'BMAD',
        description:
          'Derive epics and user stories from the PRD + Architecture (BMAD methodology). Output actionable implementation stories.',
        personaId: 'bmad:strategist-marketer',
        planningMode: 'spec',
        requirePlanApproval: true,
        priority: 2,
        status: 'backlog',
      },
      {
        title: 'BMAD: Implementation Readiness Review',
        category: 'BMAD',
        description:
          'Validate that PRD, Architecture, and Stories are complete enough to implement. Identify risks and gaps.',
        personaId: 'bmad:technologist-architect',
        planningMode: 'lite',
        requirePlanApproval: true,
        priority: 2,
        status: 'backlog',
      },
    ];

    const created: Feature[] = [];
    for (const card of cards) {
      created.push(await this.featureLoader.create(projectPath, card));
    }

    return created;
  }
}
