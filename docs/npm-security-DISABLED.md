# npm Security Guardrails - TEMPORARILY DISABLED

**Status:** DISABLED for development/testing
**Date:** 2025-12-28
**Reason:** Development convenience - temporary deactivation

---

## 1. What Was Disabled and Where

The npm security guardrails have been **disabled by default** through configuration changes. The security infrastructure (code, routes, UI) remains intact but is configured to allow all operations without blocking or prompting.

### Default Settings Changed

**File:** `/home/aip0rt/Desktop/automaker/libs/types/src/npm-security.ts`
**Lines 174-180:**

```typescript
export const DEFAULT_NPM_SECURITY_SETTINGS: NpmSecuritySettings = {
  dependencyInstallPolicy: 'allow', // Was: 'strict'
  allowInstallScripts: true, // Was: false
  allowedPackagesForRebuild: [],
  enableAuditLog: true,
  auditLogRetentionDays: 30,
};
```

### What This Means

| Setting                   | Current (Disabled) | Secure Default |
| ------------------------- | ------------------ | -------------- |
| `dependencyInstallPolicy` | `'allow'`          | `'strict'`     |
| `allowInstallScripts`     | `true`             | `false`        |

With these settings:

- **All npm install commands** run with lifecycle scripts enabled (no `--ignore-scripts` flag)
- **High-risk execute commands** (`npx`, `bunx`, `pnpm dlx`, etc.) run without approval prompts
- **No blocking** of potentially dangerous package manager operations
- **Audit logging** remains enabled (still tracks security events)

---

## 2. How to Re-Enable Security

### Option A: Change Default Settings (Recommended for Production)

Edit `/home/aip0rt/Desktop/automaker/libs/types/src/npm-security.ts`:

```typescript
export const DEFAULT_NPM_SECURITY_SETTINGS: NpmSecuritySettings = {
  dependencyInstallPolicy: 'strict', // Block by default
  allowInstallScripts: false, // Disable lifecycle scripts
  allowedPackagesForRebuild: [],
  enableAuditLog: true,
  auditLogRetentionDays: 30,
};
```

### Option B: Per-Project Configuration (UI)

1. Open Automaker
2. Go to **Settings > npm Security**
3. Change **Dependency Install Policy** to:
   - **Strict (Recommended)**: Block lifecycle scripts, require approval for high-risk commands
   - **Prompt**: Ask before running install scripts or high-risk commands
4. Uncheck **Allow Install Scripts**

### Option C: Per-Project Configuration (File)

Edit `{projectPath}/.automaker/settings.json`:

```json
{
  "version": 1,
  "npmSecurity": {
    "dependencyInstallPolicy": "strict",
    "allowInstallScripts": false,
    "allowedPackagesForRebuild": [],
    "enableAuditLog": true,
    "auditLogRetentionDays": 30
  }
}
```

---

## 3. Security Implications

### Current State (DISABLED)

With security disabled, the following risks exist:

| Risk                      | Description                                                                                                                      | Severity |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **Supply Chain Attacks**  | Malicious npm packages can execute arbitrary code during `npm install` via lifecycle scripts (`preinstall`, `postinstall`, etc.) | **HIGH** |
| **Remote Code Execution** | Commands like `npx malicious-package` execute code directly from npm registry without review                                     | **HIGH** |
| **Data Exfiltration**     | Install scripts can access filesystem, environment variables, and network                                                        | **HIGH** |
| **System Modification**   | Scripts can modify system files, install backdoors, or create persistent access                                                  | **HIGH** |

### What Security Guardrails Protect Against

When enabled (`strict` mode), the guardrails:

1. **Block lifecycle scripts** by rewriting install commands with `--ignore-scripts`
2. **Require approval** for high-risk execute commands (`npx`, `bunx`, `pnpm dlx`, `yarn dlx`)
3. **Audit log** all security-relevant events for review
4. **Validate commands** before execution in terminal sessions

### Recommendations

- **Development:** Current disabled state is acceptable for trusted projects
- **Production:** Re-enable strict mode before deploying
- **Untrusted Repos:** Always use Docker/VM isolation when working with untrusted code
- **Before Merge:** Re-enable security before merging to main/production branches

---

## 4. Files Modified

### Primary Configuration File

| File                                                            | Change                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------- |
| `/home/aip0rt/Desktop/automaker/libs/types/src/npm-security.ts` | `DEFAULT_NPM_SECURITY_SETTINGS` changed to `allow` mode |

### Files That Read This Configuration

These files consume the default settings and will reflect the disabled state:

| File                                                                                               | Description                                            |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `/home/aip0rt/Desktop/automaker/libs/types/src/settings.ts`                                        | Imports and re-exports `DEFAULT_NPM_SECURITY_SETTINGS` |
| `/home/aip0rt/Desktop/automaker/libs/types/src/index.ts`                                           | Public type exports                                    |
| `/home/aip0rt/Desktop/automaker/apps/server/src/types/settings.ts`                                 | Server-side re-exports                                 |
| `/home/aip0rt/Desktop/automaker/apps/server/src/services/settings-service.ts`                      | Uses defaults when no project settings exist           |
| `/home/aip0rt/Desktop/automaker/apps/server/src/lib/npm-security-policy.ts`                        | Policy enforcement engine                              |
| `/home/aip0rt/Desktop/automaker/apps/ui/src/components/views/settings-view/npm-security/index.tsx` | UI default display                                     |

### Complete npm Security File Inventory

The security infrastructure remains fully intact. See `/home/aip0rt/Desktop/automaker/docs/npm-security-files-inventory.md` for a complete list of all 31 files (23 source + 8 documentation).

---

## 5. Quick Reference

### To Restore Security

```bash
# Option 1: Edit the source file
# Change in libs/types/src/npm-security.ts:
#   dependencyInstallPolicy: 'strict'
#   allowInstallScripts: false

# Option 2: Use the UI
# Settings > npm Security > Strict mode
```

### To Verify Current State

```bash
# Check default settings
grep -A5 "DEFAULT_NPM_SECURITY_SETTINGS" libs/types/src/npm-security.ts
```

### To Test Security (When Enabled)

```bash
# These should trigger approval prompts in strict mode:
npx some-package
npm install some-package  # Should add --ignore-scripts

# Check audit log:
cat {projectPath}/.automaker/npm-security-audit.jsonl
```

---

## 6. Related Documentation

- `/home/aip0rt/Desktop/automaker/docs/npm-security-files-inventory.md` - Complete file inventory
- `/home/aip0rt/Desktop/automaker/docs/npm-security-merge-checklist.md` - Merge preservation checklist
- `/home/aip0rt/Desktop/automaker/docs/security/` - Security documentation directory

---

**WARNING:** Remember to re-enable npm security before production deployment or when working with untrusted code repositories.
