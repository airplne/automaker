# NPM Security Merge Verification Checklist

**Date:** 2025-12-28
**Purpose:** Quick checklist to verify npm security files after upstream merge

---

## Pre-Merge Backup

- [ ] Create backup branch: `git branch backup/npm-security-20251228`
- [ ] Verify backup branch created: `git branch --list backup/npm-security-*`
- [ ] Document current commit: `git log -1 --oneline`

---

## File Preservation Checklist

### Type Definitions (3 files)

- [ ] libs/types/src/npm-security.ts (180 lines)
- [ ] libs/types/src/settings.ts (contains NpmSecuritySettings import)
- [ ] libs/types/src/index.ts (lines 128-129: npm-security exports)

### Server Core (2 files)

- [ ] apps/server/src/lib/npm-command-classifier.ts (328 lines)
- [ ] apps/server/src/lib/npm-security-policy.ts (574 lines)

### API Routes (5 files)

- [ ] apps/server/src/routes/npm-security/index.ts (47 lines)
- [ ] apps/server/src/routes/npm-security/common.ts (29 lines)
- [ ] apps/server/src/routes/npm-security/routes/approval.ts (105 lines)
- [ ] apps/server/src/routes/npm-security/routes/audit.ts (29 lines)
- [ ] apps/server/src/routes/npm-security/routes/settings.ts (85 lines)

### Service Integrations (4 files)

- [ ] apps/server/src/index.ts (lines 53, 157)
- [ ] apps/server/src/services/settings-service.ts (npm-security methods)
- [ ] apps/server/src/services/terminal-service.ts (security hardening)
- [ ] apps/server/src/types/settings.ts (line 25)

### Tests (3 files)

- [ ] apps/server/tests/unit/lib/npm-security-policy.test.ts (802 lines)
- [ ] apps/server/tests/unit/lib/npm-command-classifier.test.ts (195 lines)
- [ ] apps/server/tests/unit/services/npm-security-settings.test.ts (305 lines)

### UI Components (3 files)

- [ ] apps/ui/src/components/dialogs/npm-security-approval-dialog.tsx (161 lines)
- [ ] apps/ui/src/components/views/settings-view/npm-security/index.tsx (284 lines)
- [ ] apps/ui/src/hooks/use-npm-security-events.ts (62 lines)

### UI Integrations (2 files)

- [ ] apps/ui/src/components/views/settings-view.tsx (lines 22, 161-162)
- [ ] apps/ui/src/components/views/settings-view/api-keys/security-notice.tsx (21 lines)

### Documentation (8 files)

- [ ] docs/security/README.md
- [ ] docs/security/QUICK-REFERENCE.md
- [ ] docs/security/DOCUMENTATION-SUMMARY.md
- [ ] docs/security/code-examples.md
- [ ] docs/security/implementation-checklist.md
- [ ] docs/security/jsdoc-patterns.md
- [ ] docs/security/npm-supply-chain.md
- [ ] docs/security/README-security-section.md

---

## Integration Point Verification

### Server Index (apps/server/src/index.ts)

- [ ] Line 53: `import { createNpmSecurityRoutes } from './routes/npm-security/index.js';`
- [ ] Line 157: `app.use('/api/npm-security', createNpmSecurityRoutes(settingsService));`

### Settings Service (apps/server/src/services/settings-service.ts)

- [ ] Line 12: Import sanitizeCommandForLogging
- [ ] Lines 361-365: Deep merge npm security settings
- [ ] Method exists: `getNpmSecuritySettings(projectPath: string)`
- [ ] Method exists: `updateNpmSecuritySettings(projectPath: string, updates: Partial<NpmSecuritySettings>)`

### Terminal Service (apps/server/src/services/terminal-service.ts)

- [ ] Line 289: Applies npm security hardening
- [ ] Line 300: Logging npm security hardening

### Settings View (apps/ui/src/components/views/settings-view.tsx)

- [ ] Line 22: `import { NpmSecuritySettings } from './settings-view/npm-security';`
- [ ] Lines 161-162: `case 'npm-security': return <NpmSecuritySettings />;`

### Type Exports (libs/types/src/index.ts)

- [ ] Line 128: Export NpmSecuritySettings types
- [ ] Line 129: Export DEFAULT_NPM_SECURITY_SETTINGS

---

## Build & Test Verification

### TypeScript Compilation

- [ ] Run: `npm run build` (should succeed with no errors)
- [ ] Check: No TypeScript errors related to npm-security types

### Unit Tests

- [ ] Run: `npm test npm-security-policy.test.ts`
- [ ] Run: `npm test npm-command-classifier.test.ts`
- [ ] Run: `npm test npm-security-settings.test.ts`
- [ ] All tests pass

### Integration Tests

- [ ] Settings service integration tests pass
- [ ] Terminal service tests pass (if applicable)

---

## Runtime Verification

### API Endpoints

- [ ] GET /api/npm-security/settings responds
- [ ] PUT /api/npm-security/settings accepts updates
- [ ] POST /api/npm-security/approval works
- [ ] GET /api/npm-security/audit returns data

### UI Verification

- [ ] Settings > NPM Security panel renders
- [ ] Can toggle security settings on/off
- [ ] Risk level dropdowns work
- [ ] Security approval dialog appears for high-risk commands

### Functional Tests

- [ ] Command classification works
- [ ] Policy enforcement blocks/allows commands correctly
- [ ] Audit log captures events
- [ ] Settings persist across restarts

---

## Line Count Verification

Run these commands to verify file integrity:

```bash
# Core files
wc -l libs/types/src/npm-security.ts  # Should be ~180
wc -l apps/server/src/lib/npm-command-classifier.ts  # Should be ~328
wc -l apps/server/src/lib/npm-security-policy.ts  # Should be ~574

# API Routes
wc -l apps/server/src/routes/npm-security/routes/*.ts  # Should total ~295
wc -l apps/server/src/routes/npm-security/*.ts  # Include index.ts and common.ts

# Tests
wc -l apps/server/tests/unit/lib/npm-security-policy.test.ts  # Should be ~802
wc -l apps/server/tests/unit/lib/npm-command-classifier.test.ts  # Should be ~195
wc -l apps/server/tests/unit/services/npm-security-settings.test.ts  # Should be ~305

# UI
wc -l apps/ui/src/components/dialogs/npm-security-approval-dialog.tsx  # Should be ~161
wc -l apps/ui/src/components/views/settings-view/npm-security/index.tsx  # Should be ~284
wc -l apps/ui/src/hooks/use-npm-security-events.ts  # Should be ~62
```

Expected totals (±10% tolerance):

- Core logic: 902 lines
- API routes: 295 lines
- Tests: 1,302 lines
- UI: 507 lines
- **Total source:** ~4,166 lines

---

## Rollback Plan

If verification fails:

1. **Restore from backup:**

   ```bash
   git checkout backup/npm-security-20251228
   ```

2. **Cherry-pick specific files:**

   ```bash
   git checkout backup/npm-security-20251228 -- libs/types/src/npm-security.ts
   git checkout backup/npm-security-20251228 -- apps/server/src/lib/npm-security-policy.ts
   # etc.
   ```

3. **Re-apply integrations manually:**
   - Review integration points in section above
   - Manually add imports and route registrations

---

## Sign-Off

- [ ] All 31 files verified present
- [ ] All integration points verified
- [ ] All tests passing
- [ ] UI rendering correctly
- [ ] API endpoints working
- [ ] Functional tests pass

**Verified by:** ********\_********
**Date:** ********\_********
**Commit:** ********\_********

---

**END OF CHECKLIST**
