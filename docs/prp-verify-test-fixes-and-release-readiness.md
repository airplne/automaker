# PRP: Verify Test Fixes and Release Readiness

**Status:** Pending Execution
**Created:** 2025-12-28
**Team:** Codex Team (final verification)
**Source:** Claude Team Fix Report
**Reference:** `docs/prp-fix-test-failures-and-wizard-markers.md`
**Priority:** P0 - Release Gate

---

## Context

Claude Dev Team reports all critical blockers fixed:

- **Issue 1:** npm-security tests (27 failures → 0)
- **Issue 2:** Wizard markers unreliable → now reliable

**Claimed results:**

- ✅ Build clean
- ✅ 935/935 tests passing
- ✅ No TypeScript errors
- ✅ Committed: `7b5487c`

**This PRP provides final verification before declaring release-ready.**

---

## Claimed Fixes Summary

### Issue 1: npm-security Tests (27 failures)

| File                                           | Claimed Fix                                |
| ---------------------------------------------- | ------------------------------------------ |
| `libs/types/src/npm-security.ts`               | Restored strict defaults                   |
| `apps/server/src/lib/npm-security-policy.ts`   | Added env var bypass, restored enforcement |
| `apps/server/src/services/terminal-service.ts` | Restored secure npm env vars (6 vars)      |
| `apps/server/src/providers/claude-provider.ts` | Re-enabled beforeBashExecution hook        |

### Issue 2: Wizard Markers

| File                                            | Claimed Fix                         |
| ----------------------------------------------- | ----------------------------------- |
| `apps/server/src/services/auto-mode-service.ts` | Always include WIZARD_SYSTEM_PROMPT |

### New Feature

**Environment Variable:** `AUTOMAKER_DISABLE_NPM_SECURITY=true` for dev bypass
**Documentation:** Added to `CLAUDE.md`

---

## Phase 1: Commit Verification

### 1.1 Verify Commit Exists

```bash
git log --oneline -1 | grep "7b5487c"
git show 7b5487c --stat
```

**Checklist:**

- [ ] Commit `7b5487c` exists
- [ ] Commit message mentions npm security + wizard markers
- [ ] Files modified match claimed changes

---

## Phase 2: npm-security Restoration Verification

### 2.1 Defaults Restored to Strict

```bash
rg "dependencyInstallPolicy.*:|allowInstallScripts.*:" \
  libs/types/src/npm-security.ts -A 1
```

**Expected:**

```typescript
dependencyInstallPolicy: 'strict',
allowInstallScripts: false,
```

**Checklist:**

- [ ] `dependencyInstallPolicy` is `'strict'`
- [ ] `allowInstallScripts` is `false`

### 2.2 Env Var Bypass Added

```bash
rg -n "AUTOMAKER_DISABLE_NPM_SECURITY" \
  apps/server/src/lib/npm-security-policy.ts -B 3 -A 10
```

**Expected:** Code checks env var and bypasses enforcement if set

**Checklist:**

- [ ] Env var check exists at top of `enforcePolicy()`
- [ ] Returns `allowed: true` when env var is `'true'`
- [ ] Logs warning when bypassed

### 2.3 Enforcement Logic Restored

```bash
# Check that the function is no longer a stub
wc -l apps/server/src/lib/npm-security-policy.ts

# Verify logic is back
rg -n "isHighRiskExecute|install.*command|requiresApproval" \
  apps/server/src/lib/npm-security-policy.ts | head -20
```

**Expected:**

- File is ~400-600 lines (not shortened)
- Real enforcement logic exists
- No large commented-out blocks

**Checklist:**

- [ ] File size reasonable (~400-600 lines)
- [ ] Enforcement logic present
- [ ] High-risk command handling exists
- [ ] Install command rewriting exists
- [ ] Approval workflow logic exists

### 2.4 Terminal Secure Env Restored

```bash
rg -n "getSecureNpmEnvironment|npm_config_ignore_scripts" \
  apps/server/src/services/terminal-service.ts -B 2 -A 10
```

**Expected:** Function returns 6 secure env vars

**Checklist:**

- [ ] `getSecureNpmEnvironment()` returns env object (not empty {})
- [ ] Includes `npm_config_ignore_scripts`
- [ ] Includes `npm_config_audit`
- [ ] Includes other secure npm vars
- [ ] Optionally gates on bypass env var

### 2.5 Claude Provider Hook Re-enabled

```bash
rg -n "beforeBashExecution|npmSecurityEnforcer" \
  apps/server/src/providers/claude-provider.ts
```

**Checklist:**

- [ ] `beforeBashExecution` hook exists
- [ ] Hook calls npm security enforcer
- [ ] Hook is wired into SDK options

---

## Phase 3: Wizard Marker Fix Verification

### 3.1 Wizard System Prompt Always Included

```bash
rg -n "WIZARD_SYSTEM_PROMPT|wizardSystemPrompt.*join" \
  apps/server/src/services/auto-mode-service.ts -B 3 -A 5
```

**Expected:** Wizard prompt concatenated with base system prompt

**Checklist:**

- [ ] Wizard turns use `[systemPrompt, WIZARD_SYSTEM_PROMPT].join()`
- [ ] Or similar pattern that ensures both prompts included
- [ ] Not conditional on `autoLoadClaudeMd`

---

## Phase 4: Build Verification

### 4.1 Full Build

```bash
npm run build
```

**Checklist:**

- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No build warnings (or acceptable)

### 4.2 Server Build Specifically

```bash
npm run build --workspace=apps/server
```

**Checklist:**

- [ ] Server builds cleanly
- [ ] No TypeScript errors in npm-security-policy.ts
- [ ] No TypeScript errors in terminal-service.ts

---

## Phase 5: Test Suite Verification

### 5.1 npm-security Policy Tests

```bash
npm run test:run --workspace=apps/server -- tests/unit/lib/npm-security-policy.test.ts --reporter=verbose
```

**Checklist:**

- [ ] All npm-security-policy tests pass
- [ ] No skipped or failing tests

### 5.2 npm-security Settings Tests

```bash
npm run test:run --workspace=apps/server -- tests/unit/services/npm-security-settings.test.ts --reporter=verbose
```

**Checklist:**

- [ ] All settings tests pass
- [ ] Default values tested correctly

### 5.3 Terminal Service Tests

```bash
npm run test:run --workspace=apps/server -- tests/unit/services/terminal-service.test.ts --reporter=verbose
```

**Checklist:**

- [ ] All terminal service tests pass
- [ ] Secure env tests pass

### 5.4 Wizard Tests

```bash
npm run test:run --workspace=apps/server -- tests/unit/services/auto-mode-wizard.test.ts --reporter=verbose
```

**Checklist:**

- [ ] All wizard tests pass
- [ ] 14/14 (or current count) passing

### 5.5 Full Server Test Suite

```bash
npm run test:run --workspace=apps/server
```

**Expected:** **935/935 tests passing** (or actual total count)

**Checklist:**

- [ ] All server tests pass
- [ ] **0 failures**
- [ ] Test count matches claim (935 or close)

### 5.6 Full Monorepo Test Suite

```bash
npm run test
```

**Checklist:**

- [ ] All packages pass tests
- [ ] No regressions anywhere

---

## Phase 6: Environment Variable Documentation

### 6.1 Verify Documentation Exists

```bash
rg -n "AUTOMAKER_DISABLE_NPM_SECURITY" CLAUDE.md README.md .env.example 2>/dev/null
```

**Checklist:**

- [ ] Env var documented in `CLAUDE.md` or similar
- [ ] Usage example provided
- [ ] Security warning included

---

## Phase 7: Wizard End-to-End Verification

### 7.1 Test Wizard with Default Settings

**Prerequisites:**

- [ ] AutoMaker server running
- [ ] NO custom env vars set (test with defaults)

**Test:**

```bash
# Create wizard feature
curl -X POST http://localhost:3008/api/features/create \
  -H "Content-Type: application/json" \
  -d '{
    "projectPath": "/home/aip0rt/Desktop/automaker",
    "feature": {
      "title": "Wizard Marker Test",
      "description": "Create a simple utility function with comprehensive documentation",
      "planningMode": "wizard",
      "requirePlanApproval": true,
      "model": "opus",
      "skipTests": true
    }
  }' | jq -r '.feature.id'

# Save ID
FEATURE_ID="<from above>"

# Run it
curl -X POST http://localhost:3008/api/auto-mode/run-feature \
  -H "Content-Type: application/json" \
  -d "{\"projectPath\":\"/home/aip0rt/Desktop/automaker\",\"featureId\":\"$FEATURE_ID\",\"useWorktrees\":false}"

# Wait ~10 seconds, check agent output
cat /home/aip0rt/Desktop/automaker/.automaker/features/$FEATURE_ID/agent-output.md | grep "\[WIZARD_QUESTION\]"
```

**Checklist:**

- [ ] `[WIZARD_QUESTION]` marker appears in agent output
- [ ] Marker includes valid JSON with question/options
- [ ] Flow doesn't fallback to generic clarification

### 7.2 Test Multi-Turn Flow

**Answer first question:**

```bash
curl -X POST http://localhost:3008/api/auto-mode/wizard-answer \
  -H "Content-Type: application/json" \
  -d "{\"projectPath\":\"/home/aip0rt/Desktop/automaker\",\"featureId\":\"$FEATURE_ID\",\"questionId\":\"Q1\",\"answer\":\"comprehensive\"}"
```

**Wait ~10 seconds, check for Q2:**

```bash
cat /home/aip0rt/Desktop/automaker/.automaker/features/$FEATURE_ID/agent-output.md | tail -50
```

**Checklist:**

- [ ] Second `[WIZARD_QUESTION]` marker appears
- [ ] Or `[WIZARD_COMPLETE]` appears after 2+ questions
- [ ] Flow continues (doesn't end after first answer)

### 7.3 Verify Plan Incorporates Answers

**After wizard completes:**

```bash
cat /home/aip0rt/Desktop/automaker/.automaker/features/$FEATURE_ID/feature.json | jq '.planSpec' | head -30
```

**Checklist:**

- [ ] `planSpec` is not null
- [ ] Plan text references wizard answers
- [ ] Plan includes "Based on your selections" or similar

---

## Phase 8: Dev Bypass Functionality Test

### 8.1 Test Bypass Works

```bash
# Set bypass env var
export AUTOMAKER_DISABLE_NPM_SECURITY=true

# Restart server with bypass
npm run dev:server

# Check logs for warning
# Should see: "⚠️ FIREWALL DISABLED FOR DEVELOPMENT"
```

**Checklist:**

- [ ] Warning appears in logs
- [ ] npm commands allowed without restriction

### 8.2 Test Production Mode Still Enforces

```bash
# Unset bypass
unset AUTOMAKER_DISABLE_NPM_SECURITY

# Restart server
npm run dev:server

# npm commands should be restricted
```

**Checklist:**

- [ ] Firewall active without env var
- [ ] Strict mode enforced by default

---

## Acceptance Criteria

### Build & Tests

- [ ] `npm run build` passes
- [ ] `npm run build --workspace=apps/server` passes
- [ ] `npm run test` passes (all packages)
- [ ] `npm run test:run --workspace=apps/server` passes (**0 failures**)
- [ ] Test count is 935 (or documented if different)

### npm-security

- [ ] Defaults restored to strict
- [ ] Enforcement logic restored
- [ ] Env var bypass works
- [ ] 27 previously failing tests now pass
- [ ] No TypeScript errors

### Wizard Mode

- [ ] Markers appear reliably with defaults
- [ ] Multi-turn flow works (Q1 → Q2 → ... → Complete)
- [ ] Plan generated with wizard answers
- [ ] Approval flow works

### Documentation

- [ ] `AUTOMAKER_DISABLE_NPM_SECURITY` documented
- [ ] Security warning included

---

## Deliverables

Upon completion, provide:

1. **Test Results:**
   - Full test suite output
   - Confirmation of 935/935 (or actual count)
   - Breakdown by test file

2. **Build Output:**
   - Confirmation all packages build
   - No errors or warnings

3. **Wizard E2E Test:**
   - agent-output.md showing markers
   - feature.json showing planSpec with answers
   - Confirmation multi-turn works

4. **Commit Verification:**
   - `git show 7b5487c` output
   - List of files changed

5. **Issues Found (if any):**
   - Any discrepancies from Claude team claims
   - Any remaining bugs

---

## Sign-Off

| Phase                   | Completed By | Date | Status |
| ----------------------- | ------------ | ---- | ------ |
| Phase 1: Commit         |              |      |        |
| Phase 2: npm-security   |              |      |        |
| Phase 3: Wizard Markers |              |      |        |
| Phase 4: Build          |              |      |        |
| Phase 5: Tests          |              |      |        |
| Phase 6: Documentation  |              |      |        |
| Phase 7: Wizard E2E     |              |      |        |
| Phase 8: Dev Bypass     |              |      |        |

**Final Verdict:** [ ] RELEASE READY / [ ] ISSUES FOUND / [ ] BLOCKED

**Notes:**

```


```

---

_Generated by BMAD Party Mode - Final Release Verification_
