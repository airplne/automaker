# PRP: Verify npm Security Vulnerability Fixes

## Context

The Claude team reports all 4 security vulnerabilities have been fixed with 851/851 tests passing. This PRP performs comprehensive verification of all claimed fixes.

**Claude Team Claims:**

| Priority    | Issue                            | Claimed Status | Tests |
| ----------- | -------------------------------- | -------------- | ----- |
| P0 CRITICAL | Credential Sanitization          | FIXED          | 10/10 |
| P1 HIGH     | Policy Validation + Auto-Correct | FIXED          | 5/5   |
| P2 MEDIUM   | Prompt Mode High-Risk Handling   | FIXED          | 8/8   |
| P3 LOW      | Console.log Redaction            | FIXED          | N/A   |

**Build Status Claimed:** All passing, 0 lint errors, 851/851 tests

---

## Phase 1: Build/Test/Lint Verification (Agents 1-3)

### Agent 1: Full Build Verification

```bash
# Clean build all workspaces
npm run build --workspace=libs/types 2>&1 | tail -10
echo "Exit code: $?"

npm run build --workspace=apps/server 2>&1 | tail -10
echo "Exit code: $?"

npm run build --workspace=apps/ui 2>&1 | tail -10
echo "Exit code: $?"
```

**Expected:** All exit with 0, no TypeScript errors

---

### Agent 2: Full Test Suite

```bash
npm run test:run --workspace=apps/server 2>&1 | tail -40
```

**Expected:** 851/851 pass (or more if additional tests added)

Run npm security specific tests:

```bash
npm run test:run --workspace=apps/server -- tests/unit/lib/npm-security-policy.test.ts 2>&1 | tail -30
npm run test:run --workspace=apps/server -- tests/unit/lib/npm-command-classifier.test.ts 2>&1 | tail -20
```

**Expected:**

- npm-security-policy.test.ts: 50+ tests (was 21, now 50 with 29 new)
- npm-command-classifier.test.ts: 31 tests

---

### Agent 3: Lint Verification

```bash
npm run lint --workspace=apps/server 2>&1 | tail -10
npm run lint --workspace=apps/ui 2>&1 | tail -10
```

**Expected:** 0 errors for both (warnings acceptable)

---

## Phase 2: P0 CRITICAL - Credential Sanitization (Agents 4-6)

### Agent 4: Verify sanitizeCommandForLogging Function Exists

```bash
# Check function exists in npm-security-policy.ts
rg -A 15 "export function sanitizeCommandForLogging" apps/server/src/lib/npm-security-policy.ts
```

**Verify:**

- [ ] Function exists and is exported
- [ ] Regex pattern matches: `KEY|TOKEN|SECRET|PASSWORD|AUTH|CREDENTIAL`
- [ ] Returns redacted string with `***REDACTED***`

---

### Agent 5: Verify Sanitization Applied in settings-service.ts

```bash
# Check sanitization is called before logging
rg -B 5 -A 10 "logNpmSecurityAudit" apps/server/src/services/settings-service.ts | head -40

# Verify import exists
rg "sanitizeCommandForLogging" apps/server/src/services/settings-service.ts
```

**Verify:**

- [ ] `sanitizeCommandForLogging` is imported
- [ ] Called on `command` before writing to audit log
- [ ] Audit entry uses sanitized command, not raw

---

### Agent 6: Verify P0 Test Coverage

```bash
# Find sanitization tests
rg -B 2 -A 15 "sanitizeCommandForLogging" apps/server/tests/unit/lib/npm-security-policy.test.ts
```

**Verify tests exist for:**

- [ ] API_KEY=value redaction
- [ ] Multiple secrets in one command
- [ ] Normal commands preserved unchanged
- [ ] ANTHROPIC_API_KEY redaction
- [ ] Case insensitivity (api_key vs API_KEY)
- [ ] Edge cases (no secrets, empty string)

---

## Phase 3: P1 HIGH - Policy Validation (Agents 7-9)

### Agent 7: Verify validateAndCorrectNpmSecuritySettings Function

```bash
# Check validation function exists
rg -A 20 "export function validateAndCorrectNpmSecuritySettings\|validateNpmSecuritySettings" apps/server/src/lib/npm-security-policy.ts
```

**Verify:**

- [ ] Function exists and is exported
- [ ] Checks for `strict` + `allowInstallScripts: true` combination
- [ ] Auto-corrects to `allowInstallScripts: false`
- [ ] Logs warning (not throws error)
- [ ] Returns corrected settings

---

### Agent 8: Verify Validation Applied on Settings Update

```bash
# Check validation in settings route
rg -B 3 -A 10 "validateAndCorrectNpmSecuritySettings\|validateNpmSecuritySettings" apps/server/src/routes/npm-security/

# Check validation in createNpmSecurityEnforcer
rg -B 3 -A 10 "validateAndCorrectNpmSecuritySettings\|validateNpmSecuritySettings" apps/server/src/lib/npm-security-policy.ts
```

**Verify:**

- [ ] Validation called in settings update route
- [ ] Validation called in createNpmSecurityEnforcer (or enforcePolicy)
- [ ] No code path bypasses validation

---

### Agent 9: Verify P1 Test Coverage

```bash
rg -B 2 -A 15 "strict.*allowInstallScripts\|allowInstallScripts.*strict\|auto-correct\|validateAndCorrect" apps/server/tests/unit/lib/npm-security-policy.test.ts
```

**Verify tests exist for:**

- [ ] Strict + allowInstallScripts: true → auto-corrected
- [ ] Warning logged on correction
- [ ] Valid strict config (allowInstallScripts: false) unchanged
- [ ] Prompt + allowInstallScripts: true allowed (no correction)
- [ ] Allow + allowInstallScripts: true allowed (no correction)

---

## Phase 4: P2 MEDIUM - Prompt Mode High-Risk Handling (Agents 10-12)

### Agent 10: Verify Prompt Mode Handles High-Risk Commands

```bash
# Check enforcePolicy for prompt mode handling
sed -n '130,200p' apps/server/src/lib/npm-security-policy.ts

# Look for prompt mode + high-risk handling
rg -A 20 "prompt.*high.*risk\|isExecuteCommand.*prompt\|onApprovalRequired" apps/server/src/lib/npm-security-policy.ts
```

**Verify:**

- [ ] Prompt mode has distinct code path from strict
- [ ] High-risk execute commands (npx, dlx, bunx) trigger `onApprovalRequired`
- [ ] User can approve (returns allowed: true)
- [ ] User can deny (returns allowed: false)
- [ ] Both decisions are audit logged

---

### Agent 11: Verify isExecuteCommand Detection

```bash
# Check execute command classification
rg -B 5 -A 10 "isExecuteCommand\|executeCommand\|npx\|dlx\|bunx" apps/server/src/lib/npm-command-classifier.ts | head -50
```

**Verify:**

- [ ] `npx` classified as execute command
- [ ] `pnpm dlx` classified as execute command
- [ ] `yarn dlx` classified as execute command
- [ ] `bunx` classified as execute command
- [ ] All marked as high-risk

---

### Agent 12: Verify P2 Test Coverage

```bash
rg -B 2 -A 15 "prompt.*npx\|npx.*prompt\|high-risk.*execute\|execute.*high-risk\|approval.*prompt\|prompt.*approval" apps/server/tests/unit/lib/npm-security-policy.test.ts
```

**Verify tests exist for:**

- [ ] npx command triggers approval in prompt mode
- [ ] pnpm dlx triggers approval in prompt mode
- [ ] yarn dlx triggers approval in prompt mode
- [ ] bunx triggers approval in prompt mode
- [ ] User approve → command allowed
- [ ] User deny → command blocked
- [ ] Audit log on approve
- [ ] Audit log on deny

---

## Phase 5: P3 LOW - Console.log Redaction (Agents 13-14)

### Agent 13: Verify Console.log Gated Behind DEV

```bash
# Check the hook file
sed -n '20,40p' apps/ui/src/hooks/use-npm-security-events.ts

# Look for the DEV gate
rg -B 2 -A 5 "console\.log\|import\.meta\.env\.DEV" apps/ui/src/hooks/use-npm-security-events.ts
```

**Verify:**

- [ ] `console.log` is wrapped in `if (import.meta.env.DEV)` block
- [ ] OR `console.log` is removed entirely
- [ ] If kept, doesn't log `command.original` or full event
- [ ] Only logs event type or safe metadata

---

### Agent 14: Verify No Other Command Leaks

```bash
# Check for any console.log with event/command in npm security files
rg -n "console\.(log|warn|error).*event\|console\.(log|warn|error).*command" \
  apps/ui/src/components/dialogs/npm-security-approval-dialog.tsx \
  apps/ui/src/components/views/settings-view/npm-security/ \
  apps/ui/src/hooks/use-npm-security-events.ts
```

**Expected:** No matches, or all properly gated behind DEV

---

## Phase 6: Security Regression Testing (Agents 15-17)

### Agent 15: Verify Strict Mode Still Strict

```bash
# Check strict mode behavior unchanged
rg -A 15 "strict" apps/server/src/lib/npm-security-policy.ts | head -40

# Verify --ignore-scripts injection
rg -n "ignore-scripts\|ignoreScripts" apps/server/src/lib/npm-command-classifier.ts
```

**Verify:**

- [ ] Strict mode blocks ALL install scripts unconditionally
- [ ] `--ignore-scripts` flag added in strict mode
- [ ] No exceptions or bypasses in strict mode

---

### Agent 16: Verify No Bypass Conditions Added

```bash
# Check for debug/bypass flags
rg -n "BYPASS\|SKIP_SECURITY\|DEBUG.*=.*true\|DISABLE_SECURITY" \
  apps/server/src/lib/npm-security-policy.ts \
  apps/server/src/lib/npm-command-classifier.ts \
  apps/server/src/services/settings-service.ts

# Check for always-true conditions
rg -n "if.*true\s*\)\|if.*===.*true\s*\)" apps/server/src/lib/npm-security-policy.ts
```

**Expected:** No bypass conditions found

---

### Agent 17: Verify No New Network Calls

```bash
# Check for fetch/axios in security code
rg -n "fetch\(|axios\.|http\.|https\.\|WebSocket" \
  apps/server/src/lib/npm-security-policy.ts \
  apps/server/src/lib/npm-command-classifier.ts \
  apps/server/src/services/settings-service.ts
```

**Expected:** No external network calls in security code

---

## Phase 7: Context Handoff Accuracy (Agents 18-20)

### Agent 18: Verify BMAD Integration Claims

```bash
# Verify agentIds field exists in types
rg -n "agentIds" libs/types/src/feature.ts libs/types/src/settings.ts

# Verify ResolvedAgentCollab interface
rg -A 10 "interface ResolvedAgentCollab" libs/types/src/bmad.ts

# Verify multi-agent resolution
rg -n "resolveAgentCollab\|buildCollaborativePrompt" apps/server/src/services/bmad-persona-service.ts
```

**Verify context claims:**

- [ ] `agentIds?: string[]` exists in feature.ts
- [ ] `ResolvedAgentCollab` interface exists
- [ ] `resolveAgentCollab()` method exists
- [ ] Max 3 agents enforced

---

### Agent 19: Verify npm Security File Structure

```bash
# Verify all claimed files exist
ls -la libs/types/src/npm-security.ts
ls -la apps/server/src/lib/npm-command-classifier.ts
ls -la apps/server/src/lib/npm-security-policy.ts
ls -la apps/server/src/routes/npm-security/
ls -la apps/ui/src/components/dialogs/npm-security-approval-dialog.tsx
ls -la apps/ui/src/components/views/settings-view/npm-security/
ls -la apps/ui/src/hooks/use-npm-security-events.ts

# Count test files
wc -l apps/server/tests/unit/lib/npm-security-policy.test.ts
wc -l apps/server/tests/unit/lib/npm-command-classifier.test.ts
```

**Verify:**

- [ ] All claimed files exist
- [ ] Test files have substantial test coverage

---

### Agent 20: Verify PRPs and Documentation

```bash
# Check PRPs exist
ls -la docs/prp-fix-npm-security-vulnerabilities.md
ls -la docs/prp-npm-security-audit-malicious-code.md
ls -la docs/prp-npm-security-fix-blockers.md
ls -la docs/verify-npm-security-guardrails-report.md

# Check security docs
ls -la docs/security/
wc -l docs/security/*.md
```

**Verify:**

- [ ] All mentioned PRPs exist
- [ ] Security docs directory has 8 files
- [ ] ~2595 lines in security docs

---

## Report Format

```
npm Security Vulnerability Fixes - Codex Verification Report

=== BUILD/TEST/LINT ===
Build (types): [PASS/FAIL]
Build (server): [PASS/FAIL]
Build (UI): [PASS/FAIL]
Tests: [X/851 pass]
Lint (server): [0 errors / X errors]
Lint (UI): [0 errors / X errors]

=== P0 CRITICAL: Credential Sanitization ===
sanitizeCommandForLogging function: [EXISTS/MISSING]
Applied in logNpmSecurityAudit: [YES/NO]
Regex pattern correct: [YES/NO]
Unit tests: [X/10 pass]
Test coverage verified: [YES/NO]

=== P1 HIGH: Policy Validation ===
validateAndCorrectNpmSecuritySettings function: [EXISTS/MISSING]
Auto-correct behavior: [WORKS/BROKEN]
Warning logged: [YES/NO]
Applied in settings route: [YES/NO]
Applied in enforcer: [YES/NO]
Unit tests: [X/5 pass]

=== P2 MEDIUM: Prompt Mode High-Risk ===
Prompt mode distinct from strict: [YES/NO]
High-risk commands trigger approval: [YES/NO]
npx handled: [YES/NO]
pnpm dlx handled: [YES/NO]
yarn dlx handled: [YES/NO]
bunx handled: [YES/NO]
Approve/deny works: [YES/NO]
Audit logging: [YES/NO]
Unit tests: [X/8 pass]

=== P3 LOW: Console.log ===
DEV gate implemented: [YES/NO]
Command not leaked: [VERIFIED/EXPOSED]
No other leaks found: [VERIFIED/FOUND]

=== SECURITY REGRESSION ===
Strict mode unchanged: [YES/NO]
No bypass conditions: [VERIFIED/FOUND]
No new network calls: [VERIFIED/FOUND]

=== CONTEXT HANDOFF ===
BMAD claims accurate: [YES/NO]
npm security files exist: [YES/NO]
PRPs exist: [YES/NO]
Documentation accurate: [YES/NO]

=== VERDICT ===
All fixes verified: [YES/NO]
Ready for PR: [YES/NO]
Outstanding issues: [NONE/LIST]
```

---

## Success Criteria

All must pass:

- [ ] All builds pass (types, server, UI)
- [ ] 851+ tests pass
- [ ] 0 lint errors
- [ ] P0: sanitizeCommandForLogging exists and applied
- [ ] P0: 10+ tests for credential sanitization
- [ ] P1: validateAndCorrectNpmSecuritySettings exists
- [ ] P1: Auto-correct works for strict + allowInstallScripts
- [ ] P1: 5+ tests for policy validation
- [ ] P2: Prompt mode requests approval for high-risk
- [ ] P2: npx/dlx/bunx all handled
- [ ] P2: 8+ tests for prompt mode
- [ ] P3: console.log gated behind DEV or removed
- [ ] Security: Strict mode still strict
- [ ] Security: No bypass conditions
- [ ] Security: No new network calls
- [ ] Context: All claimed files exist
- [ ] Context: All claimed functionality present

---

## Escalation

If ANY of the following are found, **STOP and report immediately**:

1. Security regressions (strict mode weakened)
2. Bypass conditions added
3. Tests failing
4. Credential sanitization not applied
5. New network calls in security code
6. P2 not actually fixed (npx still bypasses prompt mode)
