import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  enforcePolicy,
  createNpmSecurityEnforcer,
  getSecureNpmEnvironment,
  sanitizeCommandForLogging,
  validateAndCorrectNpmSecuritySettings,
} from '../../../src/lib/npm-security-policy';
import type { NpmSecuritySettings } from '@automaker/types';

describe('npm-security-policy (firewall disabled)', () => {
  describe('getSecureNpmEnvironment', () => {
    it('returns an empty object', () => {
      expect(getSecureNpmEnvironment()).toEqual({});
    });
  });

  describe('enforcePolicy', () => {
    const mockCallbacks = {
      onApprovalRequired: vi.fn().mockResolvedValue('allow-once'),
      onAuditLog: vi.fn(),
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('always allows commands and emits an audit entry', async () => {
      const policy: NpmSecuritySettings = {
        dependencyInstallPolicy: 'strict',
        allowInstallScripts: false,
        allowedPackagesForRebuild: [],
        enableAuditLog: true,
        auditLogRetentionDays: 30,
      };

      const result = await enforcePolicy(
        'npx some-package',
        policy,
        '/test/project',
        mockCallbacks
      );

      expect(result.allowed).toBe(true);
      expect(result.requiresApproval).toBe(false);
      expect(mockCallbacks.onApprovalRequired).not.toHaveBeenCalled();
      expect(mockCallbacks.onAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'command-allowed' })
      );
    });
  });

  describe('createNpmSecurityEnforcer', () => {
    it('beforeBashExecution returns the original command', async () => {
      const policy: NpmSecuritySettings = {
        dependencyInstallPolicy: 'strict',
        allowInstallScripts: false,
        allowedPackagesForRebuild: [],
        enableAuditLog: true,
        auditLogRetentionDays: 30,
      };

      const callbacks = {
        onApprovalRequired: vi.fn().mockResolvedValue('cancel'),
        onAuditLog: vi.fn(),
      };

      const enforcer = createNpmSecurityEnforcer(policy, '/test/project', callbacks);
      const result = await enforcer.beforeBashExecution('npm install left-pad');

      expect(result).toBe('npm install left-pad');
      expect(callbacks.onApprovalRequired).not.toHaveBeenCalled();
      expect(callbacks.onAuditLog).toHaveBeenCalled();
    });

    it('canUseBashTool always returns true', async () => {
      const policy: NpmSecuritySettings = {
        dependencyInstallPolicy: 'strict',
        allowInstallScripts: false,
        allowedPackagesForRebuild: [],
        enableAuditLog: true,
        auditLogRetentionDays: 30,
      };
      const callbacks = {
        onApprovalRequired: vi.fn().mockResolvedValue('cancel'),
        onAuditLog: vi.fn(),
      };

      const enforcer = createNpmSecurityEnforcer(policy, '/test/project', callbacks);
      const result = await enforcer.canUseBashTool({ command: 'npx anything' });
      expect(result).toBe(true);
    });
  });

  describe('sanitizeCommandForLogging', () => {
    it('redacts secret-looking env values', () => {
      const input =
        'ANTHROPIC_API_KEY=sk-test npm_config_registry=https://registry.npmjs.org TOKEN=abc123';
      const output = sanitizeCommandForLogging(input);
      expect(output).toContain('ANTHROPIC_API_KEY=***REDACTED***');
      expect(output).toContain('TOKEN=***REDACTED***');
      expect(output).toContain('npm_config_registry=https://registry.npmjs.org');
    });
  });

  describe('validateAndCorrectNpmSecuritySettings', () => {
    it('still corrects strict + allowInstallScripts=true to allowInstallScripts=false', () => {
      const settings: NpmSecuritySettings = {
        dependencyInstallPolicy: 'strict',
        allowInstallScripts: true,
        allowedPackagesForRebuild: [],
        enableAuditLog: true,
        auditLogRetentionDays: 30,
      };

      const result = validateAndCorrectNpmSecuritySettings(settings);
      expect(result.dependencyInstallPolicy).toBe('strict');
      expect(result.allowInstallScripts).toBe(false);
    });
  });
});
