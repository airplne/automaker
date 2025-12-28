# PRP: Verify npm Security Guardrails Implementation

## Context

The Claude team has implemented comprehensive npm security guardrails for AutoMaker. This PRP is for the Codex team to verify all reported changes are correct, complete, and secure.

---

## Reported Implementation Summary

| Component          | Files                                                             | Description                                |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------ |
| Types              | `libs/types/src/npm-security.ts`                                  | Interfaces, default settings               |
| Command Classifier | `apps/server/src/lib/npm-command-classifier.ts`                   | Detects npm/pnpm/yarn/bun, classifies risk |
| Policy Engine      | `apps/server/src/lib/npm-security-policy.ts`                      | Enforcement layer                          |
| Settings Service   | `apps/server/src/services/settings-service.ts`                    | Per-project policy + audit logging         |
| Terminal Hardening | `apps/server/src/services/terminal-service.ts`                    | Secure env vars injected                   |
| API Routes         | `apps/server/src/routes/npm-security/`                            | Settings, approval, audit endpoints        |
| UI Settings        | `apps/ui/src/components/views/settings-view/npm-security/`        | Policy configuration                       |
| Approval Dialog    | `apps/ui/src/components/dialogs/npm-security-approval-dialog.tsx` | User approval flow                         |
| Tests              | `apps/server/tests/unit/lib/npm-*.test.ts`                        | 64 tests (60 passing, 4 define API)        |
| Docs               | `docs/security/`                                                  | 8 documentation files                      |

---

## Verification Tasks

### Phase 1: File Existence Check (Agents 1-3)

#### Agent 1: Verify New Type Definitions

```bash
# Check npm-security.ts exists with required exports
ls -la libs/types/src/npm-security.ts

# Verify key interfaces exist
rg -n "export (type|interface|const) (NpmSecuritySettings|ClassifiedCommand|NpmSecurityApprovalRequest|NpmSecurityAuditEntry|DEFAULT_NPM_SECURITY_SETTINGS)" libs/types/src/npm-security.ts
```

**Expected:**

- File exists
- Contains exported types/interfaces for settings, command classification, approvals, and audit entries (at minimum: `NpmSecuritySettings`, `ClassifiedCommand`, `NpmSecurityApprovalRequest`, `NpmSecurityAuditEntry`)
- Contains exported default settings constant (`DEFAULT_NPM_SECURITY_SETTINGS`)

Verify default settings:

```bash
rg -n "DEFAULT_NPM_SECURITY_SETTINGS" libs/types/src/npm-security.ts
```

---

#### Agent 2: Verify Server-Side New Files

```bash
# Command classifier
ls -la apps/server/src/lib/npm-command-classifier.ts
rg -n "detectPackageManager|classifyCommand|rewriteInstallCommand|hasIgnoreScriptsFlag" apps/server/src/lib/npm-command-classifier.ts | head -20

# Policy engine
ls -la apps/server/src/lib/npm-security-policy.ts
rg -n "NpmSecuritySettings|createNpmSecurityEnforcer|enforcePolicy|getSecureNpmEnvironment" apps/server/src/lib/npm-security-policy.ts | head -20

# API routes directory
ls -la apps/server/src/routes/npm-security/
```

**Expected:**

- `npm-command-classifier.ts` exists with classification functions
- `npm-security-policy.ts` exists with enforcement functions
- `npm-security/` directory with route files (index.ts, settings.ts, approval.ts, audit.ts or similar)

---

#### Agent 3: Verify UI New Files

```bash
# Settings page
ls -la apps/ui/src/components/views/settings-view/npm-security/

# Approval dialog
ls -la apps/ui/src/components/dialogs/npm-security-approval-dialog.tsx

# Hook
ls -la apps/ui/src/hooks/use-npm-security-events.ts
```

**Expected:**

- `npm-security/index.tsx` exists
- `npm-security-approval-dialog.tsx` exists
- `use-npm-security-events.ts` hook exists

---

### Phase 2: Modified Files Check (Agents 4-7)

#### Agent 4: Verify Claude Provider Integration

```bash
rg -n "createNpmSecurityEnforcer|DEFAULT_NPM_SECURITY_SETTINGS|beforeBashExecution|npmSecurityPolicy" apps/server/src/providers/claude-provider.ts | head -40
```

**Expected:**

- Policy engine imported or used
- Security checks integrated into command execution flow

```bash
rg -n "SettingsService|new ClaudeProvider\\(settingsService\\)" apps/server/src/providers/provider-factory.ts | head -20
```

**Expected:**

- Settings service injection for npm security

---

#### Agent 5: Verify Settings Service Extension

```bash
rg -n "npmSecurity\\b|NpmSecuritySettings|getNpmSecuritySettings|updateNpmSecuritySettings|logNpmSecurityAudit|getNpmSecurityAuditLog" apps/server/src/services/settings-service.ts | head -40
```

**Expected:**

- Methods for getting/setting npm security policy
- Audit logging method
- Integration with project settings

---

#### Agent 6: Verify Terminal Service Hardening

```bash
rg -n "npm.*security\|--ignore-scripts\|NPM_CONFIG\|secure.*env" apps/server/src/services/terminal-service.ts | head -20
```

**Expected:**

- Secure environment variables injected
- `--ignore-scripts` flag handling
- Environment variable injection for npm/pnpm/yarn/bun

---

#### Agent 7: Verify UI Store and Root Integration

```bash
# App store integration
rg -n "npmSecurity\|approval.*dialog\|pendingApproval" apps/ui/src/store/app-store.ts | head -20

# Root integration for global dialog
rg -n "NpmSecurityApprovalDialog\|npm.*security" apps/ui/src/routes/__root.tsx | head -10

# Settings extension
rg -n "npmSecurity\\b|NpmSecuritySettings" libs/types/src/settings.ts | head -20
```

**Expected:**

- App store has approval state management
- Root renders approval dialog globally
- ProjectSettings type extended with npm security

---

### Phase 3: Test Verification (Agents 8-10)

#### Agent 8: Verify Test Files Exist

```bash
ls -la apps/server/tests/unit/lib/npm-command-classifier.test.ts
ls -la apps/server/tests/unit/lib/npm-security-policy.test.ts

# Count test cases
rg -c "it\(|test\(" apps/server/tests/unit/lib/npm-command-classifier.test.ts
rg -c "it\(|test\(" apps/server/tests/unit/lib/npm-security-policy.test.ts
```

**Expected:**

- Both test files exist
- Combined ~64 tests (or close to reported count)

---

#### Agent 9: Run Tests and Check Results

```bash
npm run test:run --workspace=apps/server -- tests/unit/lib/npm-command-classifier.test.ts tests/unit/lib/npm-security-policy.test.ts
```

**Expected:**

- Tests run
- 0 failures (if any failures exist, capture them and treat as a verification FAIL)

If failures, capture details:

```bash
npm run test:run --workspace=apps/server -- tests/unit/lib/npm-*.test.ts
```

---

#### Agent 10: Full Test Suite Verification

```bash
npm run test:run --workspace=apps/server
```

**Expected:**

- All 737+ tests still pass (existing tests not broken)
- New npm security tests included in count

---

### Phase 4: Documentation Verification (Agents 11-12)

#### Agent 11: Verify Documentation Files

```bash
ls -la docs/security/
wc -l docs/security/*.md 2>/dev/null | tail -5
```

**Expected:**

- 8 documentation files exist
- Approximately 2,595 lines total (as reported)

Verify key docs:

```bash
ls docs/security/README* docs/security/*overview* docs/security/*policy* 2>/dev/null
```

---

#### Agent 12: Verify README Security Section

```bash
ls -la docs/security/README-security-section.md
head -50 docs/security/README-security-section.md
```

**Expected:**

- Ready-to-add README section exists
- Documents the three policy modes (Strict, Prompt, Allow)

---

### Phase 5: Build Verification (Agents 13-15)

#### Agent 13: Types Package Build

```bash
npm run build --workspace=libs/types 2>&1 | tail -20
```

**Expected:**

- Build passes
- No TypeScript errors in npm-security.ts

---

#### Agent 14: Server Build

```bash
npm run build --workspace=apps/server 2>&1 | tail -20
```

**Expected:**

- Build passes
- All new files compile without errors

---

#### Agent 15: UI Build

```bash
npm run build --workspace=apps/ui 2>&1 | tail -20
```

**Expected:**

- Build passes
- Approval dialog and settings page compile

---

### Phase 6: Security Logic Verification (Agents 16-18)

#### Agent 16: Verify Command Classification Logic

```bash
# Check all package managers are handled
rg -n "npm|pnpm|yarn|bun" apps/server/src/lib/npm-command-classifier.ts | head -30

# Check risk levels
rg -n "high.*risk|low.*risk|RiskLevel" apps/server/src/lib/npm-command-classifier.ts | head -10
```

**Expected:**

- npm, pnpm, yarn, bun all detected
- Risk levels defined (high for npx/exec/dlx, lower for install)

---

#### Agent 17: Verify Policy Modes

```bash
rg -n "strict|prompt|allow" apps/server/src/lib/npm-security-policy.ts | head -20
```

**Expected:**

- Three modes: `strict`, `prompt`, `allow`
- Different behavior for each mode

Verify --ignore-scripts injection:

```bash
rg -n "ignore-scripts" apps/server/src/lib/npm-security-policy.ts apps/server/src/services/terminal-service.ts | head -10
```

---

#### Agent 18: Verify Audit Logging

```bash
rg -n "audit|\.jsonl|logNpmSecurityAudit" apps/server/src/services/settings-service.ts apps/server/src/lib/npm-security-policy.ts | head -20
```

**Expected:**

- Audit entries logged to `.automaker/npm-security-audit.jsonl`
- Logging on security decisions (block, allow, prompt)

---

### Phase 7: API Endpoints Verification (Agent 19)

#### Agent 19: Verify API Route Structure

```bash
# List route files
find apps/server/src/routes/npm-security -name "*.ts" -type f

# Check route registration
rg -n "createNpmSecurityRoutes|/api/npm-security" apps/server/src/index.ts | head -20

# Verify endpoint handlers exist
rg -n "router\.(get|post|put|delete)" apps/server/src/routes/npm-security/*.ts | head -20
```

**Expected:**

- Routes registered in main router
- Endpoints for: settings (get/set), approval (submit), audit (read)

---

### Phase 8: UI ↔ Server Contract & Wiring Verification (Agents 20-21)

#### Agent 20: Verify UI Uses Real Server Endpoints

```bash
# List UI API calls for npm-security
rg -n "/api/npm-security/" apps/ui/src | head -n 200

# List server route paths
rg -n "router\\.(get|post|put)\\(" apps/server/src/routes/npm-security/index.ts
```

**Expected:**

- UI calls match server routes (no mismatched paths like `/approval/resolve` if server expects `/approval/:requestId`)

---

#### Agent 21: Verify ClaudeProvider Hooks Use Approval + Audit Plumbing

```bash
# Ensure ClaudeProvider does not contain TODO placeholders for approval/audit wiring
rg -n "TODO: Implement approval workflow|TODO: Implement audit logging" apps/server/src/providers/claude-provider.ts

# Ensure approval/audit callbacks are wired to real implementations (settings-service + requestApproval)
rg -n "requestApproval|logNpmSecurityAudit|getNpmSecuritySettings" apps/server/src/providers/claude-provider.ts apps/server/src/lib/npm-security-policy.ts | head -n 80
```

**Expected:**

- No TODO placeholders for core approval/audit behavior
- Approval callback routes through server approval mechanism (or equivalent) and audit callback persists to `.automaker/npm-security-audit.jsonl` via `SettingsService`

---

### Phase 9: Lint Check (Agent 22)

#### Agent 22: Full Lint Verification

```bash
npm run lint --workspace=apps/server 2>&1 | rg -ni "npm.*security\|error" | head -20
npm run lint --workspace=apps/ui 2>&1 | rg -ni "npm.*security\|error" | head -20
```

**Expected:**

- 0 lint errors in new files
- Warnings acceptable

---

## Report Format

```
npm Security Guardrails - Verification Report

=== FILE EXISTENCE ===
Types (npm-security.ts): [EXISTS/MISSING]
Command Classifier: [EXISTS/MISSING]
Policy Engine: [EXISTS/MISSING]
API Routes: [EXISTS/MISSING] - [X files]
UI Settings Page: [EXISTS/MISSING]
Approval Dialog: [EXISTS/MISSING]
Hook: [EXISTS/MISSING]
Tests: [EXISTS/MISSING] - [X test files]
Docs: [EXISTS/MISSING] - [X files, Y lines]

=== MODIFIED FILES ===
Claude Provider: [INTEGRATED/NOT FOUND]
Provider Factory: [INTEGRATED/NOT FOUND]
Settings Service: [EXTENDED/NOT FOUND]
Terminal Service: [HARDENED/NOT FOUND]
App Store: [INTEGRATED/NOT FOUND]
Root Route: [INTEGRATED/NOT FOUND]
Settings Types: [EXTENDED/NOT FOUND]

=== TESTS ===
npm-command-classifier.test.ts: [X tests]
npm-security-policy.test.ts: [X tests]
Test Results: [X/Y passing]
Full Suite: [737+/737+ passing]

=== BUILD ===
Types: [PASS/FAIL]
Server: [PASS/FAIL]
UI: [PASS/FAIL]

=== SECURITY LOGIC ===
Package Managers Detected: [npm, pnpm, yarn, bun]
Risk Levels: [DEFINED/MISSING]
Policy Modes: [strict, prompt, allow]
--ignore-scripts Injection: [IMPLEMENTED/MISSING]
Audit Logging: [IMPLEMENTED/MISSING]

=== API ENDPOINTS ===
Settings GET/SET: [EXISTS/MISSING]
Approval: [EXISTS/MISSING]
Audit: [EXISTS/MISSING]

=== LINT ===
Errors: [0/X]

=== OVERALL ===
Verification Status: [PASS/FAIL]

Issues Found:
1. [issue description]
2. [issue description]

Notes:
- Test "define API" issues: [resolved/still present]
- [any other observations]
```

---

## Success Criteria

- [ ] All 15+ new files exist and are correctly structured
- [ ] All 10+ modified files have required integrations
- [ ] npm security unit tests pass with 0 failures
- [ ] Full test suite still passes (737+)
- [ ] All builds pass (types, server, UI)
- [ ] Three policy modes implemented (strict, prompt, allow)
- [ ] --ignore-scripts injection works
- [ ] Audit logging to .jsonl implemented
- [ ] API endpoints registered and functional
- [ ] 0 lint errors
- [ ] 8 documentation files present

---

## Security-Specific Checks

The Codex team should also verify these security-critical behaviors:

1. **Default is Strict Mode**: Verify default policy blocks install scripts
2. **No Bypass Path**: Ensure policy can't be circumvented by malformed commands
3. **All Package Managers**: npm, pnpm, yarn, bun all handled identically
4. **Audit Immutability**: Audit log entries can't be tampered with easily
5. **Environment Isolation**: Secure env vars don't leak to non-npm commands
