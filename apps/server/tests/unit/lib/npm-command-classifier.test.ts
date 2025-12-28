import { describe, it, expect } from 'vitest';
import {
  classifyCommand,
  rewriteInstallCommand,
  hasIgnoreScriptsFlag,
  detectPackageManager,
} from '../../../src/lib/npm-command-classifier';

describe('npm-command-classifier', () => {
  describe('detectPackageManager', () => {
    it('detects npm commands', () => {
      expect(detectPackageManager('npm install')).toBe('npm');
      expect(detectPackageManager('npm ci')).toBe('npm');
      expect(detectPackageManager('npx jest')).toBe('npm');
    });

    it('detects pnpm commands', () => {
      expect(detectPackageManager('pnpm install')).toBe('pnpm');
      expect(detectPackageManager('pnpm dlx jest')).toBe('pnpm');
    });

    it('detects yarn commands', () => {
      expect(detectPackageManager('yarn install')).toBe('yarn');
      expect(detectPackageManager('yarn dlx jest')).toBe('yarn');
    });

    it('detects bun commands', () => {
      expect(detectPackageManager('bun install')).toBe('bun');
      expect(detectPackageManager('bunx jest')).toBe('bun');
    });

    it('returns unknown for non-package-manager commands', () => {
      expect(detectPackageManager('ls -la')).toBe('unknown');
      expect(detectPackageManager('git status')).toBe('unknown');
    });
  });

  describe('classifyCommand', () => {
    describe('install commands', () => {
      it('classifies npm install commands', () => {
        const result = classifyCommand('npm install');
        expect(result.type).toBe('install');
        expect(result.isInstallCommand).toBe(true);
        expect(result.packageManager).toBe('npm');
      });

      it('classifies npm ci commands', () => {
        const result = classifyCommand('npm ci');
        expect(result.type).toBe('install');
        expect(result.isInstallCommand).toBe(true);
      });

      it('classifies pnpm install commands', () => {
        const result = classifyCommand('pnpm install');
        expect(result.type).toBe('install');
        expect(result.packageManager).toBe('pnpm');
      });

      it('classifies yarn install commands', () => {
        const result = classifyCommand('yarn install');
        expect(result.type).toBe('install');
        expect(result.packageManager).toBe('yarn');
      });

      it('classifies bare yarn as install', () => {
        const result = classifyCommand('yarn');
        expect(result.type).toBe('install');
      });

      it('classifies bun install commands', () => {
        const result = classifyCommand('bun install');
        expect(result.type).toBe('install');
        expect(result.packageManager).toBe('bun');
      });
    });

    describe('high-risk execute commands', () => {
      it('classifies npx as high-risk', () => {
        const result = classifyCommand('npx jest');
        expect(result.type).toBe('high-risk-execute');
        expect(result.isHighRiskExecute).toBe(true);
        expect(result.riskLevel).toBe('high');
      });

      it('classifies npm exec as high-risk', () => {
        const result = classifyCommand('npm exec jest');
        expect(result.type).toBe('high-risk-execute');
        expect(result.isHighRiskExecute).toBe(true);
      });

      it('classifies pnpm dlx as high-risk', () => {
        const result = classifyCommand('pnpm dlx create-react-app my-app');
        expect(result.type).toBe('high-risk-execute');
        expect(result.isHighRiskExecute).toBe(true);
      });

      it('classifies yarn dlx as high-risk', () => {
        const result = classifyCommand('yarn dlx jest');
        expect(result.type).toBe('high-risk-execute');
      });

      it('classifies bunx as high-risk', () => {
        const result = classifyCommand('bunx jest');
        expect(result.type).toBe('high-risk-execute');
        expect(result.packageManager).toBe('bun');
      });
    });

    describe('script-run commands', () => {
      it('classifies npm run as script-run', () => {
        const result = classifyCommand('npm run build');
        expect(result.type).toBe('script-run');
        expect(result.isInstallCommand).toBe(false);
        expect(result.isHighRiskExecute).toBe(false);
      });

      it('classifies yarn run as script-run', () => {
        const result = classifyCommand('yarn run test');
        expect(result.type).toBe('script-run');
      });
    });

    describe('other commands', () => {
      it('classifies unrelated commands as other', () => {
        const result = classifyCommand('ls -la');
        expect(result.type).toBe('other');
        expect(result.packageManager).toBe('unknown');
      });

      it('classifies git commands as other', () => {
        const result = classifyCommand('git status');
        expect(result.type).toBe('other');
      });
    });
  });

  describe('hasIgnoreScriptsFlag', () => {
    it('detects --ignore-scripts flag', () => {
      expect(hasIgnoreScriptsFlag('npm install --ignore-scripts')).toBe(true);
      expect(hasIgnoreScriptsFlag('npm ci --ignore-scripts')).toBe(true);
    });

    it('returns false when flag is absent', () => {
      expect(hasIgnoreScriptsFlag('npm install')).toBe(false);
      expect(hasIgnoreScriptsFlag('npm ci')).toBe(false);
    });
  });

  describe('rewriteInstallCommand', () => {
    it('adds --ignore-scripts to npm install', () => {
      expect(rewriteInstallCommand('npm install')).toBe('npm install --ignore-scripts');
    });

    it('adds --ignore-scripts to npm ci', () => {
      expect(rewriteInstallCommand('npm ci')).toBe('npm ci --ignore-scripts');
    });

    it('adds --ignore-scripts to pnpm install', () => {
      expect(rewriteInstallCommand('pnpm install')).toBe('pnpm install --ignore-scripts');
    });

    it('adds --ignore-scripts to yarn install', () => {
      expect(rewriteInstallCommand('yarn install')).toBe('yarn install --ignore-scripts');
    });

    it('does not duplicate --ignore-scripts if already present', () => {
      expect(rewriteInstallCommand('npm install --ignore-scripts')).toBe(
        'npm install --ignore-scripts'
      );
    });

    it('preserves other flags', () => {
      expect(rewriteInstallCommand('npm install --production')).toContain('--production');
      expect(rewriteInstallCommand('npm install --production')).toContain('--ignore-scripts');
    });
  });

  describe('edge cases', () => {
    it('handles commands with environment variables', () => {
      const result = classifyCommand('CI=true npm install');
      expect(result.type).toBe('install');
    });

    it('handles commands with pipes', () => {
      const result = classifyCommand('npm install && npm test');
      // Should classify based on first command
      expect(result.type).toBe('install');
    });

    it('handles quoted package names', () => {
      const result = classifyCommand('npm install "lodash@^4.0.0"');
      expect(result.type).toBe('install');
    });
  });
});
