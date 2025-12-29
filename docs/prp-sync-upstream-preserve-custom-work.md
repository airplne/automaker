# PRP: Sync Official AutoMaker Upstream - Preserve Custom Work

**Status:** Pending Execution
**Created:** 2025-12-28
**Team:** Claude Dev Team
**Priority:** P0 - Critical Pre-Review
**Complexity:** High (merge conflicts expected)

---

## Context

**Current State:**

- Fork: `https://github.com/airplne/automaker`
- Upstream: `https://github.com/AutoMaker-Org/automaker`
- Custom work implemented:
  1. BMAD Executive Suite (7 agents)
  2. Wizard Planning Mode
  3. npm-security guardrails (enabled by default; dev bypass available)
  4. Multiple bug fixes
- Fork has custom commits on `main` (verify via `git log --oneline -10`)

**Goal:** Pull latest changes from official AutoMaker repo while preserving ALL custom work.

**Risk:** High - merge conflicts expected between our custom BMAD work and upstream changes.

---

## Preflight Safety (MUST DO)

**Do not start a merge with a dirty working tree.**

```bash
# Confirm branch + clean state (including untracked files)
git rev-parse --abbrev-ref HEAD
git status --porcelain=v1 -b
```

**If `git status` shows ANYTHING besides the branch line:**

- Commit it, or stash it, or move it aside. Untracked files can block merges if upstream adds the same paths.

Also ensure you are starting from the latest fork `main`:

```bash
git fetch origin --prune
git checkout main
git pull --ff-only origin main
```

---

## Pre-Merge Assessment

### Step 1: Add Upstream Remote (if not exists)

```bash
# Check if upstream remote exists
git remote -v | grep AutoMaker-Org

# If not, add it
git remote add upstream https://github.com/AutoMaker-Org/automaker.git

# Fetch latest from upstream
git fetch upstream
```

### Step 2: Check How Far Behind We Are

```bash
# See commits we're missing
git log --oneline HEAD..upstream/main | head -50

# Count commits behind
git rev-list --count HEAD..upstream/main

# Check what files changed upstream
git diff HEAD upstream/main --stat | head -100
```

**Document:**

- [ ] Number of commits behind
- [ ] Major upstream changes identified
- [ ] Potential conflict files identified

### Step 3: Backup Current State

```bash
# Create backup branch
git branch backup-before-upstream-sync-$(date +%Y%m%d-%H%M%S)

# Verify backup created
git branch -a | grep backup-before-upstream-sync

# Record pre-merge SHA for rollback
git rev-parse HEAD
```

**Checklist:**

- [ ] Backup branch created
- [ ] Branch name recorded
- [ ] Pre-merge SHA recorded

---

## Custom Work to Preserve (CRITICAL)

### BMAD Executive Suite

**Files that MUST be preserved:**

```
_bmad/bmm-executive/ (entire directory)
libs/bmad-bundle/bundle/_bmad/bmm-executive/ (entire directory)
_bmad/_config/agent-manifest.csv (our version with 7 agents)
_bmad/_config/manifest.yaml (our version with bmm-executive)
_bmad/_config/files-manifest.csv (our version with bmm-executive hashes)
libs/bmad-bundle/bundle/_bmad/_config/* (our bundled versions)
libs/bmad-bundle/package.json (version 6.0.0-alpha.23)
libs/bmad-bundle/src/index.ts (version constant)
```

**Code integration points:**

```
apps/server/src/services/bmad-persona-service.ts (PUBLIC_PERSONA_IDS with 7 agents)
apps/server/src/services/bmad-service.ts (scaffolding with triad IDs)
apps/server/tests/unit/services/bmad-persona-service.test.ts (8 persona tests)
apps/ui/src/store/app-store.ts (DEFAULT_AI_PROFILES with 7 agents)
apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx (7 agents in picker)
apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx (executive grouping)
apps/ui/src/components/views/profiles-view/components/profile-form.tsx (executive grouping)
```

### Wizard Planning Mode

**Files that MUST be preserved:**

```
libs/types/src/settings.ts ('wizard' in PlanningMode)
libs/types/src/feature.ts (WizardState, WizardQuestion, WizardOption)
apps/ui/src/types/electron.d.ts (wizard event types)
apps/server/src/services/auto-mode-service.ts (wizard loop, markers, prompt)
apps/server/src/routes/auto-mode/routes/wizard-answer.ts
apps/server/src/routes/auto-mode/index.ts (wizard route registration)
apps/ui/src/components/dialogs/wizard-question-modal.tsx
apps/ui/src/components/views/board-view/shared/planning-mode-selector.tsx
apps/ui/src/lib/http-api-client.ts (wizardAnswer method)
apps/ui/src/hooks/use-auto-mode.ts (wizard event handling)
apps/ui/src/components/views/board-view.tsx (modal wiring)
apps/ui/src/components/views/settings-view/feature-defaults/feature-defaults-section.tsx
apps/server/tests/unit/services/auto-mode-wizard.test.ts
```

### npm-security Guardrails (Enabled + Dev Bypass)

**Files that MUST be preserved:**

```
libs/types/src/npm-security.ts (DEFAULT_NPM_SECURITY_SETTINGS strict defaults)
apps/server/src/lib/npm-command-classifier.ts (command classification)
apps/server/src/lib/npm-security-policy.ts (policy engine + AUTOMAKER_DISABLE_NPM_SECURITY bypass)
apps/server/src/services/terminal-service.ts (secure npm env + bypass)
apps/server/src/providers/claude-provider.ts (beforeBashExecution hook)
apps/server/src/routes/npm-security/index.ts (POST routes using projectPath in body)
apps/server/src/routes/npm-security/routes/settings.ts (req.body projectPath handling)
```

### Bug Fixes

**Files that MUST be preserved:**

```
apps/ui/src/store/app-store.ts (state initialization fixes)
apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx (Play icon import)
```

---

## Merge Strategy

### Recommended: Three-Way Merge with Conflict Resolution

```bash
# Merge upstream/main into our branch
git merge upstream/main --no-ff --no-commit
```

**This will:**

- ✅ Stop before committing (gives us chance to review)
- ✅ Show all conflicts
- ✅ Allow manual resolution

### Expected Conflicts

| File                       | Conflict Type | Resolution Strategy                                    |
| -------------------------- | ------------- | ------------------------------------------------------ |
| `auto-mode-service.ts`     | HIGH          | Keep OURS (has wizard mode)                            |
| `bmad-persona-service.ts`  | HIGH          | Keep OURS (has 7 agents)                               |
| `app-store.ts`             | MEDIUM        | Keep OURS (has executive profiles)                     |
| `package.json` / lockfiles | HIGH          | Merge carefully (upstream may delete `pnpm-lock.yaml`) |
| BMAD files                 | NONE          | Ours only (upstream doesn't have)                      |

### Conflict Resolution Protocol

**For each conflicting file:**

1. **Check if upstream has critical fixes we need**

   ```bash
   git show upstream/main:path/to/file.ts
   ```

2. **Decide resolution:**
   - **Keep OURS:** Our custom work is primary
   - **Keep THEIRS:** Upstream fix is critical
   - **Merge BOTH:** Combine both changes manually

3. **Resolve:**

   ```bash
   # Keep ours
   git checkout --ours path/to/file.ts
   git add path/to/file.ts

   # Keep theirs
   git checkout --theirs path/to/file.ts
   git add path/to/file.ts

   # Manual merge
   # Edit file, then:
   git add path/to/file.ts
   ```

---

## Implementation Steps

### Phase 1: Fetch and Analyze

```bash
# 1. Add upstream remote (if needed)
git remote add upstream https://github.com/AutoMaker-Org/automaker.git 2>/dev/null || echo "Upstream already added"

# 2. Fetch latest
git fetch upstream --prune --tags

# 2.1 Confirm how far behind we are
git rev-list --count HEAD..upstream/main
git log --oneline HEAD..upstream/main | head -50

# 3. Create backup
BACKUP_BRANCH="backup-before-upstream-sync-$(date +%Y%m%d-%H%M%S)"
git branch $BACKUP_BRANCH
echo "Backup created: $BACKUP_BRANCH"

# 3.1 Record pre-merge SHA for rollback
PRE_MERGE_SHA="$(git rev-parse HEAD)"
echo "Pre-merge SHA: $PRE_MERGE_SHA"

# 4. Analyze what's coming
git log --oneline HEAD..upstream/main | wc -l
git diff --stat HEAD upstream/main | tail -50
```

### Phase 2: Merge

```bash
# Attempt merge (will stop on conflicts)
git merge upstream/main --no-ff --no-commit
```

**Expected:** Conflicts in multiple files

### Phase 3: Resolve Conflicts

**List all conflicted files:**

```bash
git diff --name-only --diff-filter=U
```

**Critical files - KEEP OURS:**

```bash
# BMAD persona service (has 7 agents)
git checkout --ours apps/server/src/services/bmad-persona-service.ts
git add apps/server/src/services/bmad-persona-service.ts

# Auto-mode service (has wizard mode)
git checkout --ours apps/server/src/services/auto-mode-service.ts
git add apps/server/src/services/auto-mode-service.ts

# App store (has executive profiles)
git checkout --ours apps/ui/src/store/app-store.ts
git add apps/ui/src/store/app-store.ts

# Add-feature dialog (has 7 agents + Play icon fix)
git checkout --ours apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx
git add apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx
```

**Package files - MERGE CAREFULLY:**

```bash
# Check both versions
git diff HEAD upstream/main package.json
git diff HEAD upstream/main package-lock.json
git diff HEAD upstream/main pnpm-lock.yaml

# If upstream added new dependencies we need, merge manually
# Otherwise keep ours
git checkout --ours package.json package-lock.json
git add package.json package-lock.json

# Upstream intentionally removed pnpm-lock.yaml (duplicate lockfile)
# If it conflicts, accept upstream deletion:
git rm -f pnpm-lock.yaml
```

**BMAD files - AUTO-ACCEPT (upstream doesn't have):**

```bash
# These won't conflict, but ensure they're staged
git add _bmad/bmm-executive/
git add libs/bmad-bundle/bundle/_bmad/bmm-executive/
git add _bmad/_config/
git add libs/bmad-bundle/bundle/_bmad/_config/
```

### Phase 4: Complete Merge

```bash
# After all conflicts resolved
git status

# Verify no unresolved conflicts
git diff --check
git diff --name-only --diff-filter=U

# Complete the merge
git commit -m "$(cat <<'EOF'
Merge upstream AutoMaker-Org/automaker into fork

Integrated latest official AutoMaker changes while preserving custom work:

Custom Features Preserved:
- BMAD Executive Suite (7 agents: Theo, Sage, Finn, Cerberus, Mary, Walt, Axel)
- Wizard Planning Mode (interactive Q&A workflow)
- npm-security guardrails (dev bypass via AUTOMAKER_DISABLE_NPM_SECURITY=true)
- UI bug fixes (state hydration, Play icon)

Upstream Changes Integrated:
- [List major upstream changes after analyzing]

Conflict Resolution:
- Kept our versions of: auto-mode-service, bmad-persona-service, app-store
- Merged package files
- Preserved all BMAD custom modules

🤖 Generated with Claude Code
Co-Authored-By: Claude Opus 4.5 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Phase 4.1: Push

```bash
git push origin main
```

---

## Phase 5: Post-Merge Verification

### 5.0 Install Dependencies (after lockfile changes)

```bash
npm ci
```

### 5.1 Build Verification

```bash
npm run build:packages
npm run build:server
npm run build
```

**Checklist:**

- [ ] All builds pass
- [ ] No TypeScript errors
- [ ] No missing dependencies

### 5.2 Test Verification

```bash
# Packages + server (non-watch)
npm run test:packages
npm run test:run --workspace=apps/server

# UI E2E (optional but recommended before declaring success)
npm run test
```

**Checklist:**

- [ ] No new test failures
- [ ] Wizard tests pass (`apps/server/tests/unit/services/auto-mode-wizard.test.ts`)

### 5.3 Feature Verification

**Check Executive Suite still works:**

```bash
# Start server
npm run dev:server

# Check personas API
curl -s http://localhost:3008/api/bmad/personas | jq '.personas[].id'
```

**Expected:** 8 personas (7 executive + party-synthesis)

**Checklist:**

- [ ] API returns 8 personas
- [ ] All 7 executive agents present

**Check Wizard Mode still works:**

- [ ] Start UI
- [ ] Create feature with wizard mode
- [ ] Verify wizard selector appears
- [ ] Verify modal can open

---

## Rollback Plan

If merge causes critical issues:

```bash
# If merge is in progress (not committed)
git merge --abort

# If merge was committed, reset to backup (or the recorded pre-merge SHA)
git reset --hard "$BACKUP_BRANCH"
# OR:
git reset --hard "$PRE_MERGE_SHA"

# Push force only if you understand the impact (coordinate with team)
```

---

## Acceptance Criteria

### Integration Success

- [ ] Upstream changes integrated
- [ ] BMAD Executive Suite still functional (7 agents visible)
- [ ] Wizard mode still functional (selector + modal work)
- [ ] npm-security guardrails still functional (dev bypass still available)
- [ ] Bug fixes preserved
- [ ] Build passes
- [ ] No critical test regressions

### Merge Quality

- [ ] All conflicts resolved
- [ ] No broken imports
- [ ] No duplicate code
- [ ] Merge commit created
- [ ] Changes documented in commit message

---

## Estimated Complexity

| Task                    | Complexity | Time           |
| ----------------------- | ---------- | -------------- |
| Fetch and analyze       | Low        | 5-10 min       |
| Merge attempt           | Medium     | 5 min          |
| Conflict resolution     | **High**   | 30-60 min      |
| Post-merge verification | Medium     | 20-30 min      |
| **Total**               |            | **60-105 min** |

---

## EXECUTE NOW

**Claude Dev Team:**

1. Fetch upstream: `https://github.com/AutoMaker-Org/automaker`
2. Create backup branch
3. Attempt merge
4. Resolve conflicts (KEEP OUR CUSTOM WORK)
5. Complete merge
6. Verify build + features work
7. Report back with:
   - Merge status
   - Conflicts encountered
   - Resolution strategy used
   - Verification results

**CRITICAL:** Do NOT lose BMAD Executive Suite or Wizard mode in the merge.

**DO NOT WAIT. BEGIN UPSTREAM SYNC NOW.**

---

_Generated by BMAD Party Mode - Critical Upstream Sync_
