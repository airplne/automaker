# PRP: Upstream Merge Verification Protocol

**Status:** Pending Execution
**Created:** 2025-12-28
**Team:** Codex Team (verifies Claude Team's merge)
**Source:** Claude Team Security Scan Report
**Backup Branch:** `backup-before-upstream-merge-20251228-195800`

---

## DIRECTIVE FOR CLAUDE TEAM

**APPROVED: Proceed with merge immediately.**

Execute the following:

```bash
# 1. Execute merge with ours strategy
git merge upstream/main -X ours

# 2. If index.ts conflicts, merge BOTH route sets (security + upstream)

# 3. Build and test
npm run build
npm run test

# 4. Report results
```

**Do not wait for further approval. Continue with the merge and report back with results.**

---

---

## Context

The Claude team is merging upstream AutoMaker changes into our fork using the `-X ours` strategy. The upstream repository removed our npm-security feature, but we're preserving it while integrating new upstream features (Pipeline, Cursor CLI, MCP Server).

**Merge Strategy:** `git merge upstream/main -X ours`

**Goal:** Verify the merge preserved our security files AND integrated new upstream features correctly.

---

## Pre-Merge State (Reference)

| Metric                     | Value                                          |
| -------------------------- | ---------------------------------------------- |
| Fork Commit (before merge) | `c999c93`                                      |
| Backup Branch              | `backup-before-upstream-merge-20251228-195800` |
| Commits Behind Upstream    | 20                                             |
| Security Files to Preserve | 31 files (~6,833 lines)                        |

### Security Files Manifest

| Category      | Files | Key Paths                                                                 |
| ------------- | ----- | ------------------------------------------------------------------------- |
| Core Types    | 1     | `libs/types/src/npm-security.ts`                                          |
| Server Logic  | 2     | `apps/server/src/lib/npm-command-classifier.ts`, `npm-security-policy.ts` |
| API Routes    | 5     | `apps/server/src/routes/npm-security/*`                                   |
| Tests         | 3     | `apps/server/tests/**/npm-security*`                                      |
| UI Components | 3     | `apps/ui/src/components/**/npm-security*`                                 |
| Documentation | 8+    | `docs/*npm-security*`                                                     |

---

## Phase 1: Merge Execution Verification

### 1.1 Confirm Merge Completed

```bash
# Check current branch and recent commits
git log --oneline -10

# Verify merge commit exists
git log --oneline --merges -1
```

**Checklist:**

- [ ] Merge commit visible in log
- [ ] Branch is `main` (or expected target branch)
- [ ] No uncommitted changes (`git status` clean)

### 1.2 Confirm Upstream Integrated

```bash
# Check if upstream features exist
ls -la apps/server/src/services/pipeline* 2>/dev/null && echo "✅ Pipeline service exists"
rg -l "cursor" apps/server/src/providers/ && echo "✅ Cursor provider exists"
rg -l "mcp" apps/server/src/ && echo "✅ MCP references exist"
```

**Checklist:**

- [ ] Pipeline feature files present
- [ ] Cursor CLI integration present
- [ ] MCP Server support present

---

## Phase 2: Security Files Preservation

### 2.1 Core Security Files Exist

```bash
# Check all critical security files
ls -la libs/types/src/npm-security.ts
ls -la apps/server/src/lib/npm-command-classifier.ts
ls -la apps/server/src/lib/npm-security-policy.ts
ls -la apps/server/src/routes/npm-security/
```

**Checklist:**

- [ ] `libs/types/src/npm-security.ts` exists (~180 lines)
- [ ] `apps/server/src/lib/npm-command-classifier.ts` exists (~328 lines)
- [ ] `apps/server/src/lib/npm-security-policy.ts` exists (~574 lines)
- [ ] `apps/server/src/routes/npm-security/` directory exists with 5 files

### 2.2 Security Integration Points Preserved

```bash
# Check security is wired into core services
rg -n "npm.*security|npmSecurity" apps/server/src/providers/claude-provider.ts
rg -n "npm.*security|npmSecurity" apps/server/src/services/settings-service.ts
rg -n "npm.*security|npmSecurity" apps/server/src/services/terminal-service.ts
rg -n "npm.*security|npmSecurity|NpmSecurity" libs/types/src/settings.ts
```

**Checklist:**

- [ ] `claude-provider.ts` contains npm security enforcer
- [ ] `settings-service.ts` contains npm security methods
- [ ] `terminal-service.ts` contains secure env injection
- [ ] `settings.ts` contains npmSecurity type definitions

### 2.3 Security Routes Registered

```bash
# Check routes are registered in server index
rg -n "npm-security" apps/server/src/index.ts
```

**Checklist:**

- [ ] npm-security routes imported and registered in server

### 2.4 Count Security Files

```bash
# Count all security-related files
find . -type f \( -name "*npm-security*" -o -name "*npm_security*" \) \
  -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l

# List them
find . -type f \( -name "*npm-security*" -o -name "*npm_security*" \) \
  -not -path "*/node_modules/*" -not -path "*/.git/*"
```

**Expected:** At least 20+ files

**Checklist:**

- [ ] Security file count matches expected (~31 files or close)

---

## Phase 3: Conflict Resolution Verification

### 3.1 Verify Conflict Files Resolved Correctly

The following files had conflicts - verify they contain our security code:

```bash
# claude-provider.ts - should have security enforcer
rg -n "SecurityEnforcer|npmSecurity|securityPolicy" \
  apps/server/src/providers/claude-provider.ts | head -10

# settings-service.ts - should have npm security methods
rg -n "getNpmSecurityPolicy|setNpmSecurityPolicy|npmSecurity" \
  apps/server/src/services/settings-service.ts | head -10

# terminal-service.ts - should have secure env injection
rg -n "injectSecureEnv|npmSecurityEnv|securityContext" \
  apps/server/src/services/terminal-service.ts | head -10

# settings.ts - should have NpmSecurity types
rg -n "NpmSecurity|npmSecurityPolicy" \
  libs/types/src/settings.ts | head -10
```

**Checklist:**

- [ ] `claude-provider.ts`: Security enforcer code present
- [ ] `settings-service.ts`: npm security methods present
- [ ] `terminal-service.ts`: Secure env injection present
- [ ] `settings.ts`: NpmSecurity type definitions present

### 3.2 Server Index Routes Merged

```bash
# index.ts should have BOTH security routes AND new upstream routes
rg -n "npm-security|pipeline|cursor|mcp" apps/server/src/index.ts
```

**Checklist:**

- [ ] npm-security routes present
- [ ] Pipeline routes present (if upstream added them)
- [ ] No duplicate route registrations

---

## Phase 4: Build Verification

### 4.1 Server Builds

```bash
npm run build --workspace=apps/server
```

**Checklist:**

- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No missing imports

### 4.2 UI Builds

```bash
npm run build --workspace=apps/ui
```

**Checklist:**

- [ ] Build completes without errors
- [ ] No TypeScript errors

### 4.3 Types Package Builds

```bash
npm run build --workspace=libs/types
```

**Checklist:**

- [ ] Build completes without errors
- [ ] `NpmSecurity` types exported

---

## Phase 5: Test Suite Verification

### 5.1 Run Server Tests

```bash
npm run test:run --workspace=apps/server
```

**Checklist:**

- [ ] All tests pass
- [ ] No new failures introduced
- [ ] npm-security tests included and passing

### 5.2 Run Security-Specific Tests

```bash
npm run test:run --workspace=apps/server -- --grep "npm" --reporter=verbose
```

**Checklist:**

- [ ] npm-security test files execute
- [ ] All security tests pass

### 5.3 Run Full Test Suite

```bash
npm run test
```

**Checklist:**

- [ ] All packages pass tests
- [ ] No regressions

---

## Phase 6: Runtime Verification

### 6.1 Start Server

```bash
npm run dev:server
```

**Checklist:**

- [ ] Server starts without errors
- [ ] No security-related warnings

### 6.2 Test Security API Endpoint

```bash
export AUTOMAKER_BASE_URL=${AUTOMAKER_BASE_URL:-http://localhost:3008}

# Test npm-security route exists
curl -s "$AUTOMAKER_BASE_URL/api/npm-security/policy" | jq .
```

**Checklist:**

- [ ] Endpoint returns 200 (or appropriate auth response)
- [ ] Response structure matches expected schema
- [ ] No 404 (route not found)

### 6.3 Test New Upstream Features

```bash
# Test pipeline endpoint (if exists)
curl -s "$AUTOMAKER_BASE_URL/api/pipeline" | head -20

# Test models/providers includes cursor (if added)
curl -s "$AUTOMAKER_BASE_URL/api/models/providers" | jq '.providers | keys'
```

**Checklist:**

- [ ] New upstream features accessible
- [ ] No conflicts with security features

---

## Phase 7: Rollback Readiness

### 7.1 Verify Backup Branch Exists

```bash
git branch -a | grep "backup-before-upstream-merge"
```

**Checklist:**

- [ ] Backup branch exists and accessible

### 7.2 Document Rollback Command

If issues found, rollback with:

```bash
git reset --hard backup-before-upstream-merge-20251228-195800
```

---

## Deliverables

Upon completion, provide:

1. **Completed Checklist:** All boxes checked with pass/fail
2. **Build Output:** Confirmation of successful builds
3. **Test Results:** Pass/fail counts for all test suites
4. **API Samples:** Response from `/api/npm-security/policy`
5. **Discrepancies:** Any missing security files or broken integrations
6. **New Features Status:** Confirmation upstream features work

---

## Sign-Off

| Phase                          | Completed By | Date | Status |
| ------------------------------ | ------------ | ---- | ------ |
| Phase 1: Merge Execution       |              |      |        |
| Phase 2: Security Preservation |              |      |        |
| Phase 3: Conflict Resolution   |              |      |        |
| Phase 4: Build Verification    |              |      |        |
| Phase 5: Test Suite            |              |      |        |
| Phase 6: Runtime Verification  |              |      |        |
| Phase 7: Rollback Readiness    |              |      |        |

**Final Verdict:** [ ] VERIFIED / [ ] ISSUES FOUND / [ ] ROLLBACK REQUIRED

**Notes:**

```


```

---

_Generated by BMAD Party Mode - Winston (Architect), Amelia (Developer), Murat (Test Architect), John (PM)_
