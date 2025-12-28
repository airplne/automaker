# PRP: Update AutoMaker Fork While Preserving Security Guardrails

## Objective

Sync our AutoMaker fork with the upstream repository while:

1. Preserving ALL npm security guardrails we've implemented
2. Scanning incoming changes for malicious code, RATs, rootkits, supply chain attacks
3. Resolving merge conflicts in favor of security
4. Verifying security features work after merge

**Our Fork:** `https://github.com/airplne/automaker` (origin)
**Upstream:** `https://github.com/AutoMaker-Org/automaker` (upstream)
**Local:** Current working directory `/home/aip0rt/Desktop/automaker`

---

## CRITICAL: Security-First Merge

**Rules:**

1. NEVER auto-accept upstream changes to security files without review
2. SCAN all incoming code for malicious patterns
3. PRESERVE our npm security implementation completely
4. REJECT any upstream changes that weaken security
5. RE-RUN all security tests after merge

---

## Phase 1: Pre-Merge Assessment (Agents 1-4)

### Agent 1: Check Current State

```bash
# Current branch and status
git status
git branch -v

# Check for uncommitted changes
git diff --stat

# Verify we're on main
git rev-parse --abbrev-ref HEAD
```

**Action:** If uncommitted changes exist, commit or stash them first.

---

### Agent 2: Configure Remotes

```bash
# Check existing remotes
git remote -v

# Verify origin points to our fork
git remote get-url origin
# Expected: https://github.com/airplne/automaker (or git@github.com:airplne/automaker.git)

# Add upstream if not exists (AutoMaker-Org is the original repo)
git remote add upstream https://github.com/AutoMaker-Org/automaker.git 2>/dev/null || echo "upstream already exists"

# Verify upstream
git remote get-url upstream
# Expected: https://github.com/AutoMaker-Org/automaker.git

# Fetch upstream (this is where new changes come from)
git fetch upstream --tags
```

**Remote Configuration:**
| Remote | URL | Purpose |
|--------|-----|---------|
| origin | github.com/airplne/automaker | Our fork (push here) |
| upstream | github.com/AutoMaker-Org/automaker | Original repo (pull from here) |

---

### Agent 3: Assess Upstream Changes

```bash
# How far behind are we?
git rev-list --count HEAD..upstream/main

# List commits we're missing
git log --oneline HEAD..upstream/main | head -50

# Check for changes to security-sensitive files
git diff HEAD..upstream/main --stat -- \
  "apps/server/src/lib/npm-*" \
  "apps/server/src/routes/npm-security/" \
  "apps/server/src/services/settings-service.ts" \
  "apps/server/src/services/terminal-service.ts" \
  "apps/server/src/providers/claude-provider.ts" \
  "libs/types/src/npm-security.ts" \
  "libs/types/src/settings.ts"
```

**Document:**

- Number of commits behind
- Any changes to security-sensitive files
- Potential conflicts

---

### Agent 4: Identify Our Security Files

```bash
# List all our security-related files that MUST be preserved
echo "=== NPM Security Files ==="
ls -la libs/types/src/npm-security.ts
ls -la apps/server/src/lib/npm-command-classifier.ts
ls -la apps/server/src/lib/npm-security-policy.ts
ls -la apps/server/src/routes/npm-security/

echo "=== Security Tests ==="
ls -la apps/server/tests/unit/lib/npm-security-policy.test.ts
ls -la apps/server/tests/unit/lib/npm-command-classifier.test.ts

echo "=== UI Security Components ==="
ls -la apps/ui/src/components/dialogs/npm-security-approval-dialog.tsx
ls -la apps/ui/src/components/views/settings-view/npm-security/
ls -la apps/ui/src/hooks/use-npm-security-events.ts

echo "=== Security Docs ==="
ls -la docs/security/
```

---

## Phase 2: Malicious Code Scan on Upstream (Agents 5-10)

**CRITICAL:** Before merging, scan upstream changes for threats.

### Agent 5: Scan for Network Exfiltration

```bash
# Check new/modified files for outbound calls
git diff HEAD..upstream/main -- "*.ts" "*.tsx" "*.js" | \
  grep -E "fetch\(|axios\.|http\.|https\.|WebSocket|ws://|wss://" | head -30

# Check for new domains/IPs
git diff HEAD..upstream/main -- "*.ts" "*.tsx" | \
  grep -E "[a-z0-9]+\.(com|net|org|io|xyz)|(\d{1,3}\.){3}\d{1,3}" | head -20
```

**RED FLAG:** New external network calls to unknown domains

---

### Agent 6: Scan for Command Injection

```bash
# Check for exec/spawn additions
git diff HEAD..upstream/main -- "*.ts" | \
  grep -E "exec\(|execSync|spawn\(|spawnSync|child_process|eval\(|Function\(" | head -20

# Check for shell command construction
git diff HEAD..upstream/main -- "*.ts" | \
  grep -E "\`.*\\\$\{|\" \+ .*command|' \+ .*cmd" | head -20
```

**RED FLAG:** New command execution or shell injection patterns

---

### Agent 7: Scan for Credential Access

```bash
# Check for API key/secret access
git diff HEAD..upstream/main -- "*.ts" "*.tsx" | \
  grep -E "API_KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL|process\.env\." | head -30

# Check for sensitive file access
git diff HEAD..upstream/main -- "*.ts" | \
  grep -E "\.env|\.ssh|id_rsa|\.npmrc|credentials" | head -20
```

**RED FLAG:** New credential access patterns

---

### Agent 8: Scan for Obfuscation

```bash
# Check for base64/encoded strings
git diff HEAD..upstream/main -- "*.ts" "*.tsx" | \
  grep -E "atob\(|btoa\(|Buffer\.from.*base64|fromCharCode" | head -20

# Check for hex escapes or long encoded strings
git diff HEAD..upstream/main -- "*.ts" | \
  grep -E "\\\\x[0-9a-f]{2}|\"[a-zA-Z0-9+/=]{100,}\"" | head -10
```

**RED FLAG:** Obfuscated or encoded executable code

---

### Agent 9: Scan for Supply Chain Attacks

```bash
# Check package.json changes
git diff HEAD..upstream/main -- "**/package.json" | head -100

# Check for new dependencies
git diff HEAD..upstream/main -- "**/package.json" | grep "^\+" | grep -v "version" | head -30

# Check for postinstall scripts
git diff HEAD..upstream/main -- "**/package.json" | grep -E "postinstall|preinstall|prepare" | head -10
```

**RED FLAG:** New suspicious dependencies or install scripts

---

### Agent 10: Scan for Backdoor Patterns

```bash
# Check for hidden bypass conditions
git diff HEAD..upstream/main -- "*.ts" | \
  grep -E "BYPASS|SKIP_SECURITY|DEBUG.*=.*true|DISABLE_CHECK" | head -20

# Check for time bombs
git diff HEAD..upstream/main -- "*.ts" | \
  grep -E "setTimeout|setInterval|new Date\(\).*>|getTime\(\).*>" | head -20

# Check for always-true conditions
git diff HEAD..upstream/main -- "*.ts" | \
  grep -E "if.*true\s*\)|if.*1.*===.*1" | head -10
```

**RED FLAG:** Hidden bypass conditions or time-delayed execution

---

## Phase 3: Safe Merge Execution (Agents 11-14)

### Agent 11: Create Backup Branch

```bash
# Create backup of current state
git branch backup-before-upstream-merge-$(date +%Y%m%d-%H%M%S)

# Verify backup
git branch | grep backup
```

---

### Agent 12: Merge Strategy Decision

Based on Phase 2 scan results, choose strategy:

**If NO red flags found:**

```bash
# Merge upstream with our changes taking priority on conflicts
git merge upstream/main --no-edit -X ours
```

**If CONFLICTS expected in security files:**

```bash
# Start merge, pause for manual resolution
git merge upstream/main --no-commit
```

**If RED FLAGS found:**

```bash
# DO NOT MERGE - Report findings and stop
echo "SECURITY THREAT DETECTED - MERGE ABORTED"
git merge --abort 2>/dev/null
```

---

### Agent 13: Handle Merge Conflicts

If conflicts occur in security files:

```bash
# Check for conflicts
git diff --name-only --diff-filter=U

# For EACH security file conflict, ALWAYS keep ours:
git checkout --ours apps/server/src/lib/npm-security-policy.ts
git checkout --ours apps/server/src/lib/npm-command-classifier.ts
git checkout --ours libs/types/src/npm-security.ts
git checkout --ours apps/server/src/services/settings-service.ts
git checkout --ours apps/server/src/providers/claude-provider.ts

# Add resolved files
git add -A
```

**RULE:** For security files, ALWAYS prefer our version.

---

### Agent 14: Complete Merge

```bash
# If merge was --no-commit, complete it
git commit -m "Merge upstream/main preserving npm security guardrails

- Synced with upstream AutoMaker
- Preserved all npm security features
- Resolved conflicts in favor of security

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# Verify merge completed
git log --oneline -5
```

---

## Phase 4: Post-Merge Security Verification (Agents 15-20)

### Agent 15: Verify Security Files Intact

```bash
# Check our security files still exist and have content
wc -l libs/types/src/npm-security.ts
wc -l apps/server/src/lib/npm-command-classifier.ts
wc -l apps/server/src/lib/npm-security-policy.ts

# Verify key functions exist
rg "sanitizeCommandForLogging" apps/server/src/lib/npm-security-policy.ts
rg "normalizeApprovalDecision" apps/server/src/lib/npm-security-policy.ts
rg "classifyCommand" apps/server/src/lib/npm-command-classifier.ts
```

---

### Agent 16: Build Verification

```bash
npm run build --workspace=libs/types 2>&1 | tail -10
npm run build --workspace=apps/server 2>&1 | tail -10
npm run build --workspace=apps/ui 2>&1 | tail -10
```

**Expected:** All builds pass

---

### Agent 17: Security Test Suite

```bash
# Run ALL npm security tests
npm run test:run --workspace=apps/server -- tests/unit/lib/npm-security-policy.test.ts
npm run test:run --workspace=apps/server -- tests/unit/lib/npm-command-classifier.test.ts

# Full test suite
npm run test:run --workspace=apps/server 2>&1 | tail -40
```

**Expected:** 853+ tests pass, including all security tests

---

### Agent 18: Lint Verification

```bash
npm run lint --workspace=apps/server 2>&1 | tail -10
npm run lint --workspace=apps/ui 2>&1 | tail -10
```

**Expected:** 0 errors

---

### Agent 19: Security Regression Check

```bash
# Verify strict mode still blocks
rg -n "strict.*block|dependencyInstallPolicy.*strict" apps/server/src/lib/npm-security-policy.ts | head -10

# Verify no bypass conditions
rg -n "BYPASS|SKIP_SECURITY" apps/server/src/lib/npm-security-policy.ts

# Verify credential sanitization
rg -n "sanitizeCommandForLogging" apps/server/src/services/settings-service.ts

# Verify approval validation
rg -n "normalizeApprovalDecision" apps/server/src/lib/npm-security-policy.ts
```

---

### Agent 20: Final Security Audit

```bash
# Re-run full malicious code scan on merged codebase
rg -n "fetch\(|axios\." apps/server/src/lib/npm-*.ts
rg -n "exec\(|spawn\(" apps/server/src/lib/npm-*.ts
rg -n "eval\(|Function\(" apps/server/src/lib/npm-*.ts

# Verify no new external calls added to security code
rg -n "http://|https://" apps/server/src/lib/npm-security-policy.ts
```

**Expected:** No matches (security code has no network/exec calls)

---

## Phase 5: Push to Fork (Agent 21)

### Agent 21: Push Merged Changes to Our Fork

After all verification passes:

```bash
# Verify we're pushing to our fork (airplne/automaker), NOT upstream
git remote get-url origin
# MUST be: github.com/airplne/automaker

# Push to our fork
git push origin main

# Verify push succeeded
git log --oneline origin/main -3
```

**CRITICAL:**

- NEVER push to upstream (AutoMaker-Org)
- Only push to origin (airplne/automaker)
- Verify remote URL before pushing

---

## Rollback Procedure

If anything goes wrong:

```bash
# Find backup branch
git branch | grep backup-before-upstream

# Reset to backup
git reset --hard backup-before-upstream-merge-YYYYMMDD-HHMMSS

# Delete failed merge attempt
git branch -D failed-merge 2>/dev/null
```

---

## Report Format

```
AutoMaker Fork Update Report

=== PRE-MERGE ASSESSMENT ===
Commits behind upstream: [X]
Security file conflicts expected: [YES/NO]
Current branch: [main/other]

=== MALICIOUS CODE SCAN ===
Network exfiltration: [CLEAN/FOUND]
Command injection: [CLEAN/FOUND]
Credential access: [CLEAN/FOUND]
Obfuscation: [CLEAN/FOUND]
Supply chain: [CLEAN/FOUND]
Backdoor patterns: [CLEAN/FOUND]

Overall scan: [CLEAN/THREATS DETECTED]

=== MERGE EXECUTION ===
Strategy used: [ours/manual/aborted]
Conflicts resolved: [X files]
Security files preserved: [YES/NO]
Backup branch: [name]

=== POST-MERGE VERIFICATION ===
Security files intact: [YES/NO]
Key functions present:
  - sanitizeCommandForLogging: [YES/NO]
  - normalizeApprovalDecision: [YES/NO]
  - classifyCommand: [YES/NO]
  - enforcePolicy: [YES/NO]

Build (types): [PASS/FAIL]
Build (server): [PASS/FAIL]
Build (UI): [PASS/FAIL]
Tests: [X/853+ pass]
Lint: [0 errors / X errors]

Security regression: [NONE/FOUND]
Final audit: [CLEAN/CONCERNS]

=== VERDICT ===
Merge successful: [YES/NO]
Security preserved: [YES/NO]
Ready for use: [YES/NO]

Issues found:
[NONE or list]
```

---

## Success Criteria

ALL must pass:

- [ ] Malicious code scan: CLEAN
- [ ] Merge completed without losing security files
- [ ] All security functions present after merge
- [ ] Build passes (types, server, UI)
- [ ] 853+ tests pass
- [ ] 0 lint errors
- [ ] Security regression check: CLEAN
- [ ] Final audit: CLEAN

---

## Escalation

**STOP IMMEDIATELY and report if:**

1. Malicious code patterns detected in upstream
2. New suspicious dependencies added
3. Security files deleted or corrupted after merge
4. Tests fail after merge
5. New network calls added to security code
6. Obfuscated or encoded code found
7. Credential access patterns in new code

**In case of threats:** Do NOT push. Create incident report. Notify team.
