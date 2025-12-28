# PRP: Final Verification of npm Security Fixes

## Context

The Claude team fixed all 6 blockers. Codex team verified builds/tests/lint pass. This PRP performs final Claude team verification with focus on:

1. Confirming all reported fixes at exact line numbers
2. Investigating the prompt mode enforcement concern
3. Manual UI verification
4. Security posture confirmation

---

## Codex Verification Summary (Claimed)

| Check          | Status       | Notes |
| -------------- | ------------ | ----- |
| Build (types)  | PASS         |       |
| Build (server) | PASS         |       |
| Build (UI)     | PASS         |       |
| Tests          | 822/822 PASS |       |
| Lint (server)  | 0 errors     |       |
| Lint (UI)      | 0 errors     |       |

**Reported Fix Locations:**

- `apps/server/src/providers/claude-provider.ts:63` — approval/audit wiring
- `apps/server/src/lib/npm-security-policy.ts:138` — policy updates
- `apps/ui/src/store/app-store.ts:2675` — UI approval endpoint/payload
- `apps/server/eslint.config.mjs:1` — server ESLint config
- `apps/ui/src/components/views/settings-view/npm-security/index.tsx:1` — UI rename/import fix

**Outstanding Concern:**

- Prompt mode may be strict-only at `npm-security-policy.ts:156`

---

## Verification Tasks

### Phase 1: Build/Test/Lint Confirmation (Agents 1-3)

#### Agent 1: Full Build Verification

```bash
npm run build --workspace=libs/types 2>&1 | tail -5
npm run build --workspace=apps/server 2>&1 | tail -5
npm run build --workspace=apps/ui 2>&1 | tail -5
echo "Exit codes: types=$?, server=$?, ui=$?"
```

**Expected:** All exit with 0, no errors

---

#### Agent 2: Full Test Suite

```bash
npm run test:run --workspace=apps/server 2>&1 | tail -30
```

**Expected:** 822/822 pass (or more if tests added)

Specifically verify npm security tests:

```bash
npm run test:run --workspace=apps/server -- tests/unit/lib/npm-security-policy.test.ts 2>&1 | tail -20
```

**Expected:** 21/21 pass (all 4 previously failing tests now pass)

---

#### Agent 3: Lint Verification

```bash
npm run lint --workspace=apps/server 2>&1 | tail -10
npm run lint --workspace=apps/ui 2>&1 | tail -10
```

**Expected:** 0 errors for both

---

### Phase 2: Fix Location Verification (Agents 4-8)

#### Agent 4: Verify claude-provider.ts Approval/Audit Wiring

```bash
sed -n '55,80p' apps/server/src/providers/claude-provider.ts
```

**Verify at/around line 63:**

- [ ] `onAuditLog` callback wired to `settingsService.logNpmSecurityAudit()`
- [ ] `onApprovalRequired` callback has real implementation (not TODO)
- [ ] No remaining TODO placeholders for approval/audit

```bash
rg -n "TODO.*approval|TODO.*audit" apps/server/src/providers/claude-provider.ts
```

**Expected:** No matches

---

#### Agent 5: Verify npm-security-policy.ts Policy Updates

```bash
sed -n '130,160p' apps/server/src/lib/npm-security-policy.ts
```

**Verify at/around line 138:**

- [ ] `allow` mode calls `onAuditLog` callback
- [ ] `prompt` mode calls `onApprovalRequired` callback for high-risk
- [ ] Logic is correct for all three modes

---

#### Agent 6: Verify UI Approval Endpoint/Payload

```bash
sed -n '2665,2690p' apps/ui/src/store/app-store.ts
```

**Verify at/around line 2675:**

- [ ] Endpoint matches server: `POST /api/npm-security/approval/:requestId`
- [ ] Payload uses `decision` (not `selectedOption`)
- [ ] `rememberChoice` field present

Cross-check with server:

```bash
rg -n "router\.post.*approval" apps/server/src/routes/npm-security/
```

**Expected:** Endpoints match

---

#### Agent 7: Verify ESLint Config Added

```bash
ls -la apps/server/eslint.config.mjs
head -20 apps/server/eslint.config.mjs
```

**Expected:** File exists with valid ESLint v9 config

---

#### Agent 8: Verify UI Import Fix

```bash
head -20 apps/ui/src/components/views/settings-view/npm-security/index.tsx
```

**Verify:**

- [ ] No duplicate `NpmSecuritySettings` declaration
- [ ] Import is clean (no redeclare issue)

---

### Phase 3: Prompt Mode Investigation (Agents 9-10)

**CRITICAL:** Codex noted concern that prompt mode may be strict-only at line 156.

#### Agent 9: Deep Dive on Prompt Mode Enforcement

```bash
# Read the full enforcePolicy function
rg -A 50 "async function enforcePolicy|enforcePolicy.*=.*async" apps/server/src/lib/npm-security-policy.ts | head -80

# Specifically check line 156 and surrounding context
sed -n '145,175p' apps/server/src/lib/npm-security-policy.ts
```

**Verify:**

- [ ] Prompt mode (`settings.mode === 'prompt'`) has distinct behavior from strict
- [ ] High-risk commands in prompt mode call `onApprovalRequired`
- [ ] User can approve/deny in prompt mode (not auto-blocked)

---

#### Agent 10: Verify Prompt Mode Test Coverage

```bash
rg -B 2 -A 15 "prompt.*policy|with prompt" apps/server/tests/unit/lib/npm-security-policy.test.ts
```

**Verify tests exist for:**

- [ ] Prompt mode requires approval for high-risk commands
- [ ] Prompt mode blocks when user denies
- [ ] Prompt mode allows when user approves

Run the specific prompt tests:

```bash
npm run test:run --workspace=apps/server -- tests/unit/lib/npm-security-policy.test.ts -t "prompt"
```

**Expected:** All prompt-related tests pass

---

### Phase 4: Security Posture Check (Agents 11-12)

#### Agent 11: Verify Strict Mode Still Strict

```bash
# Check strict mode behavior hasn't weakened
rg -A 10 "strict" apps/server/src/lib/npm-security-policy.ts | head -30

# Verify --ignore-scripts injection still works
rg -n "ignore-scripts|ignoreScripts" apps/server/src/lib/npm-command-classifier.ts
```

**Expected:** Strict mode blocks ALL install scripts unconditionally

---

#### Agent 12: Final Security Scan

```bash
# No bypass conditions
rg -n "BYPASS|SKIP_SECURITY|DEBUG.*true" apps/server/src/lib/npm-security-policy.ts

# No external network calls
rg -n "fetch\(|axios|http\." apps/server/src/lib/npm-security-policy.ts

# No credential access
rg -n "API_KEY|TOKEN|SECRET" apps/server/src/lib/npm-security-policy.ts
```

**Expected:** All return no matches

---

### Phase 5: Manual UI Verification (Agent 13)

#### Agent 13: Document Manual Test Steps

**Test 1: Settings Page**

1. Start app: `npm run dev`
2. Open a project
3. Go to Settings → npm Security
4. Verify settings load from server
5. Toggle between strict/prompt/allow modes
6. Verify changes persist on refresh

**Test 2: Approval Flow (if prompt mode)**

1. Set mode to "prompt"
2. Trigger a high-risk command (e.g., via Auto Mode running `npx something`)
3. Verify approval dialog appears
4. Click "Allow" → verify command proceeds
5. Click "Deny" → verify command blocked
6. Check audit log at `{project}/.automaker/npm-security-audit.jsonl`

**Test 3: Strict Mode Enforcement**

1. Set mode to "strict"
2. Trigger an install command with postinstall script
3. Verify `--ignore-scripts` is automatically added
4. Verify audit log entry created

---

## Report Format

```
npm Security Fixes - Final Verification Report

=== BUILD/TEST/LINT ===
Build (types): [PASS/FAIL]
Build (server): [PASS/FAIL]
Build (ui): [PASS/FAIL]
Tests: [X/822 pass]
Lint (server): [0 errors / X errors]
Lint (ui): [0 errors / X errors]

=== FIX LOCATIONS VERIFIED ===
claude-provider.ts:63 (approval/audit wiring):
  - onAuditLog wired: [YES/NO]
  - onApprovalRequired implemented: [YES/NO]
  - TODOs remaining: [NONE/LIST]

npm-security-policy.ts:138 (policy updates):
  - allow mode logs: [YES/NO]
  - prompt mode requests approval: [YES/NO]

app-store.ts:2675 (UI endpoint):
  - Endpoint matches server: [YES/NO]
  - Payload format correct: [YES/NO]

eslint.config.mjs:
  - File exists: [YES/NO]
  - Valid config: [YES/NO]

npm-security/index.tsx (import fix):
  - No redeclare issue: [YES/NO]

=== PROMPT MODE INVESTIGATION ===
Prompt mode has distinct behavior: [YES/NO]
High-risk commands request approval: [YES/NO]
User can approve/deny: [YES/NO]
Prompt tests passing: [X/X]

Concern at line 156: [RESOLVED/STILL AN ISSUE]
Details: [explanation]

=== SECURITY POSTURE ===
Strict mode unchanged: [YES/NO]
No bypass conditions: [YES/NO]
No external network calls: [YES/NO]
No credential access: [YES/NO]

=== MANUAL UI TESTING ===
Settings page works: [PASS/PENDING]
Approval flow works: [PASS/PENDING]
Audit logging works: [PASS/PENDING]

=== VERDICT ===
Ready for PR: [YES/NO]

Outstanding Issues:
1. [issue or NONE]
```

---

## Success Criteria

- [ ] All builds pass
- [ ] 822/822 tests pass
- [ ] 0 lint errors
- [ ] All fix locations verified at reported line numbers
- [ ] Prompt mode investigation resolved (has distinct behavior OR documented limitation)
- [ ] Security posture confirmed (strict unchanged, no bypasses)
- [ ] Manual UI tests documented (can be pending for user to execute)
