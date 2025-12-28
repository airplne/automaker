import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SettingsService } from '../../../src/services/settings-service';
import * as secureFs from '../../../src/lib/secure-fs';
import { getDataDir, getProjectSettingsPath } from '@automaker/platform';
import * as os from 'os';
import * as path from 'path';

// Mock secure-fs to avoid actual file operations
vi.mock('../../../src/lib/secure-fs', () => ({
  writeFile: vi.fn(),
  readFile: vi.fn(),
  rename: vi.fn(),
  unlink: vi.fn(),
  access: vi.fn(),
}));

describe('npm security settings', () => {
  let settingsService: SettingsService;
  let testDataDir: string;
  let testProjectPath: string;

  beforeEach(() => {
    // Use a temporary directory for testing
    testDataDir = path.join(os.tmpdir(), `automaker-test-${Date.now()}`);
    testProjectPath = path.join(os.tmpdir(), `test-project-${Date.now()}`);
    settingsService = new SettingsService(testDataDir);

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any mocks
    vi.clearAllMocks();
  });

  describe('getNpmSecuritySettings', () => {
    it('returns default settings when no project settings exist', async () => {
      // Mock file not found
      vi.mocked(secureFs.access).mockRejectedValue({ code: 'ENOENT' });
      vi.mocked(secureFs.readFile).mockRejectedValue({ code: 'ENOENT' });

      const settings = await settingsService.getProjectSettings(testProjectPath);

      expect(settings.npmSecurity).toBeDefined();
      expect(settings.npmSecurity?.dependencyInstallPolicy).toBe('strict');
      expect(settings.npmSecurity?.allowInstallScripts).toBe(false);
    });

    it('returns saved settings when they exist', async () => {
      const mockSettings = {
        version: 1,
        npmSecurity: {
          dependencyInstallPolicy: 'allow' as const,
          allowInstallScripts: true,
          allowedPackagesForRebuild: ['bcrypt'],
        },
      };

      vi.mocked(secureFs.readFile).mockResolvedValue(JSON.stringify(mockSettings));

      const settings = await settingsService.getProjectSettings(testProjectPath);

      expect(settings.npmSecurity?.dependencyInstallPolicy).toBe('allow');
      expect(settings.npmSecurity?.allowInstallScripts).toBe(true);
      expect(settings.npmSecurity?.allowedPackagesForRebuild).toEqual(['bcrypt']);
    });

    it('handles global settings fallback', async () => {
      // Mock no project settings
      vi.mocked(secureFs.readFile).mockImplementation((filePath: string) => {
        if (typeof filePath === 'string' && filePath.includes('.automaker')) {
          return Promise.reject({ code: 'ENOENT' });
        }
        // Global settings exist
        return Promise.resolve(
          JSON.stringify({
            version: 1,
            npmSecurity: {
              dependencyInstallPolicy: 'prompt' as const,
              allowInstallScripts: false,
              allowedPackagesForRebuild: [],
            },
          })
        );
      });

      const projectSettings = await settingsService.getProjectSettings(testProjectPath);

      // Project settings should use defaults since file doesn't exist
      expect(projectSettings.npmSecurity?.dependencyInstallPolicy).toBe('strict');
    });
  });

  describe('updateNpmSecuritySettings', () => {
    it('creates new settings when none exist', async () => {
      vi.mocked(secureFs.readFile).mockRejectedValue({ code: 'ENOENT' });
      vi.mocked(secureFs.writeFile).mockResolvedValue(undefined);
      vi.mocked(secureFs.rename).mockResolvedValue(undefined);

      await settingsService.updateProjectSettings(testProjectPath, {
        npmSecurity: {
          dependencyInstallPolicy: 'allow',
          allowInstallScripts: true,
          allowedPackagesForRebuild: [],
        },
      });

      expect(secureFs.writeFile).toHaveBeenCalled();
      expect(secureFs.rename).toHaveBeenCalled();
    });

    it('merges updates with existing settings', async () => {
      const existingSettings = {
        version: 1,
        npmSecurity: {
          dependencyInstallPolicy: 'strict' as const,
          allowInstallScripts: false,
          allowedPackagesForRebuild: ['bcrypt'],
        },
        theme: 'dark' as const,
      };

      vi.mocked(secureFs.readFile).mockResolvedValue(JSON.stringify(existingSettings));
      vi.mocked(secureFs.writeFile).mockResolvedValue(undefined);
      vi.mocked(secureFs.rename).mockResolvedValue(undefined);

      await settingsService.updateProjectSettings(testProjectPath, {
        npmSecurity: {
          dependencyInstallPolicy: 'prompt',
          allowInstallScripts: false,
          allowedPackagesForRebuild: ['bcrypt', 'node-sass'],
        },
      });

      // Verify the write was called with merged settings
      expect(secureFs.writeFile).toHaveBeenCalled();
      const writeCall = vi.mocked(secureFs.writeFile).mock.calls[0];
      const writtenData = JSON.parse(writeCall[1] as string);

      expect(writtenData.theme).toBe('dark'); // Preserved
      expect(writtenData.npmSecurity.dependencyInstallPolicy).toBe('prompt'); // Updated
      expect(writtenData.npmSecurity.allowedPackagesForRebuild).toEqual(['bcrypt', 'node-sass']); // Updated
    });

    it('validates policy values', async () => {
      vi.mocked(secureFs.readFile).mockRejectedValue({ code: 'ENOENT' });
      vi.mocked(secureFs.writeFile).mockResolvedValue(undefined);
      vi.mocked(secureFs.rename).mockResolvedValue(undefined);

      const validPolicies = ['strict', 'prompt', 'allow'] as const;

      for (const policy of validPolicies) {
        await settingsService.updateProjectSettings(testProjectPath, {
          npmSecurity: {
            dependencyInstallPolicy: policy,
            allowInstallScripts: false,
            allowedPackagesForRebuild: [],
          },
        });
      }

      expect(secureFs.writeFile).toHaveBeenCalledTimes(validPolicies.length);
    });

    it('handles atomic write failures gracefully', async () => {
      vi.mocked(secureFs.readFile).mockRejectedValue({ code: 'ENOENT' });
      vi.mocked(secureFs.writeFile).mockRejectedValue(new Error('Disk full'));
      vi.mocked(secureFs.unlink).mockResolvedValue(undefined);

      await expect(
        settingsService.updateProjectSettings(testProjectPath, {
          npmSecurity: {
            dependencyInstallPolicy: 'allow',
            allowInstallScripts: true,
            allowedPackagesForRebuild: [],
          },
        })
      ).rejects.toThrow('Disk full');

      // Should attempt cleanup
      expect(secureFs.unlink).toHaveBeenCalled();
    });
  });

  describe('npm security defaults', () => {
    it('uses secure defaults for new projects', async () => {
      vi.mocked(secureFs.readFile).mockRejectedValue({ code: 'ENOENT' });

      const settings = await settingsService.getProjectSettings(testProjectPath);

      expect(settings.npmSecurity?.dependencyInstallPolicy).toBe('strict');
      expect(settings.npmSecurity?.allowInstallScripts).toBe(false);
      expect(settings.npmSecurity?.allowedPackagesForRebuild).toEqual([]);
    });

    it('allows configuration of common safe packages', async () => {
      vi.mocked(secureFs.readFile).mockRejectedValue({ code: 'ENOENT' });
      vi.mocked(secureFs.writeFile).mockResolvedValue(undefined);
      vi.mocked(secureFs.rename).mockResolvedValue(undefined);

      const commonSafePackages = ['bcrypt', 'node-sass', 'canvas', 'sharp', 'sqlite3'];

      await settingsService.updateProjectSettings(testProjectPath, {
        npmSecurity: {
          dependencyInstallPolicy: 'strict',
          allowInstallScripts: false,
          allowedPackagesForRebuild: commonSafePackages,
        },
      });

      expect(secureFs.writeFile).toHaveBeenCalled();
      const writeCall = vi.mocked(secureFs.writeFile).mock.calls[0];
      const writtenData = JSON.parse(writeCall[1] as string);

      expect(writtenData.npmSecurity.allowedPackagesForRebuild).toEqual(commonSafePackages);
    });
  });

  describe('per-project configuration', () => {
    it('allows different settings per project', async () => {
      const project1Path = path.join(testProjectPath, 'project1');
      const project2Path = path.join(testProjectPath, 'project2');

      vi.mocked(secureFs.writeFile).mockResolvedValue(undefined);
      vi.mocked(secureFs.rename).mockResolvedValue(undefined);

      // Set different policies for each project
      vi.mocked(secureFs.readFile).mockImplementation((filePath: string) => {
        if (typeof filePath === 'string' && filePath.includes('project1')) {
          return Promise.resolve(
            JSON.stringify({
              version: 1,
              npmSecurity: { dependencyInstallPolicy: 'strict' },
            })
          );
        } else if (typeof filePath === 'string' && filePath.includes('project2')) {
          return Promise.resolve(
            JSON.stringify({
              version: 1,
              npmSecurity: { dependencyInstallPolicy: 'allow' },
            })
          );
        }
        return Promise.reject({ code: 'ENOENT' });
      });

      const settings1 = await settingsService.getProjectSettings(project1Path);
      const settings2 = await settingsService.getProjectSettings(project2Path);

      expect(settings1.npmSecurity?.dependencyInstallPolicy).toBe('strict');
      expect(settings2.npmSecurity?.dependencyInstallPolicy).toBe('allow');
    });
  });

  describe('migration and compatibility', () => {
    it('handles missing npmSecurity field in existing settings', async () => {
      const oldSettings = {
        version: 1,
        theme: 'dark',
        // npmSecurity is missing
      };

      vi.mocked(secureFs.readFile).mockResolvedValue(JSON.stringify(oldSettings));

      const settings = await settingsService.getProjectSettings(testProjectPath);

      // Should use defaults for npmSecurity
      expect(settings.npmSecurity?.dependencyInstallPolicy).toBe('strict');
      expect(settings.npmSecurity?.allowInstallScripts).toBe(false);
    });

    it('preserves other settings when updating npm security', async () => {
      const existingSettings = {
        version: 1,
        theme: 'dark' as const,
        useWorktrees: true,
        boardBackground: {
          imagePath: '/some/path.jpg',
          cardOpacity: 0.8,
        },
      };

      vi.mocked(secureFs.readFile).mockResolvedValue(JSON.stringify(existingSettings));
      vi.mocked(secureFs.writeFile).mockResolvedValue(undefined);
      vi.mocked(secureFs.rename).mockResolvedValue(undefined);

      await settingsService.updateProjectSettings(testProjectPath, {
        npmSecurity: {
          dependencyInstallPolicy: 'prompt',
          allowInstallScripts: false,
          allowedPackagesForRebuild: [],
        },
      });

      const writeCall = vi.mocked(secureFs.writeFile).mock.calls[0];
      const writtenData = JSON.parse(writeCall[1] as string);

      expect(writtenData.theme).toBe('dark');
      expect(writtenData.useWorktrees).toBe(true);
      expect(writtenData.boardBackground).toEqual(existingSettings.boardBackground);
      expect(writtenData.npmSecurity.dependencyInstallPolicy).toBe('prompt');
    });
  });
});
