# PRP: Claude Dev Team - Sync Fork with Upstream AutoMaker

## Executive Summary

**Mission:** Safely pull the most recent updates from the upstream AutoMaker repository into the forked version while preserving ALL local customizations including BMAD agents, Echon integration, custom modules, Opus profiles, and PRPs.

**Assigned Team:** Claude Dev Team (**20 Opus Subagents**)
**Target Project:** `/home/aip0rt/Desktop/automaker`
**Upstream:** `https://github.com/AutoMaker-Org/automaker`
**Origin (Fork):** `https://github.com/airplne/automaker`

---

## BMAD Executive Team Specifications

> These specifications were determined through BMAD Party Mode consultation with Theo (Technologist-Architect), Axel (Operations Commander), Cerberus (Security Guardian), Apex (Peak Performance Engineer), Sage (Strategist-Marketer), and Echon (Post-Launch Lifecycle Architect).

### Consolidated Decision Matrix

| Question               | Decision                       | Rationale                                                       |
| ---------------------- | ------------------------------ | --------------------------------------------------------------- |
| **Commit Strategy**    | **Commit all changes FIRST**   | Backup branch > stash for 180+ files; permanent and recoverable |
| **Agent Structure**    | **2-Phase with approval gate** | Safety checkpoint between analysis and execution                |
| **Execution Scope**    | **Stop at conflicts**          | Merge is safe with backup; resolution needs human judgment      |
| **Conflict Authority** | **Hybrid**                     | Auto-resolve trivial files; report complex conflicts            |
| **Preview Upstream**   | **Both**                       | Check divergence AND list commits before deciding               |
| **Risk Tolerance**     | **Moderate**                   | Backup exists; use rollback capability if needed                |
| **Success Definition** | **Merge + Echon preserved**    | Core goal: upstream updates + our customizations intact         |
| **Why Sync Now**       | **Routine + Testing**          | Stay current; prove customization resilience                    |

---

## Critical Preservation Requirements

### Non-Negotiable Files (MUST preserve)

| File                                               | Purpose                                    | Priority |
| -------------------------------------------------- | ------------------------------------------ | -------- |
| `_bmad/bmm-executive/agents/echon.md`              | 10th executive agent definition            | CRITICAL |
| `_bmad/_config/agent-manifest.csv`                 | Agent registration including Echon         | CRITICAL |
| `_bmad/_config/files-manifest.csv`                 | File hashes for all agents                 | CRITICAL |
| `apps/ui/src/store/app-store.ts`                   | 14 profiles, 12 Opus models, Echon profile | CRITICAL |
| `apps/server/src/services/bmad-persona-service.ts` | 10-agent registration, Echon entry         | CRITICAL |
| `libs/bmad-bundle/bundle/_bmad/bmm-executive/`     | Echon in bundle                            | CRITICAL |
| `_bmad/bmm-executive/config.yaml`                  | 10-agent party_mode_agents                 | HIGH     |
| All `_bmad/` module files                          | Custom BMAD modules and agents             | HIGH     |

### Acceptable Losses (can recreate)

- PRP documents (`docs/*.md`)
- Backup files (`*.backup-*`)
- Test file modifications (can re-run)

---

## Pre-Flight Safety Check

**BEFORE STARTING PHASE 1**, verify `.mcp.json` doesn't contain secrets:

```bash
# Quick pre-flight check
cat .mcp.json | head -20  # Verify no API keys or secrets
```

If `.mcp.json` contains sensitive data, add to `.gitignore` first:

```bash
echo ".mcp.json" >> .gitignore
```

---

## Current State Analysis

### Git Remotes (Already Configured)

```
origin    https://github.com/airplne/automaker.git
upstream  https://github.com/AutoMaker-Org/automaker.git
```

### Current Branch

`main` (tracking origin/main)

### Local Changes (UNCOMMITTED)

**Critical:** There are ~180+ modified/untracked files including:

| Category           | Files                          | Risk                            |
| ------------------ | ------------------------------ | ------------------------------- |
| BMAD Configuration | ~100+ files in `_bmad/`        | HIGH - Custom agents, workflows |
| Echon Integration  | `echon.md`, manifests, configs | HIGH - New 10th agent           |
| App Store Profiles | `app-store.ts`                 | HIGH - Opus upgrade             |
| Server Changes     | `bmad-persona-service.ts`      | HIGH - Agent registration       |
| Frontend Changes   | Various UI components          | MEDIUM                          |
| Bundle Files       | `libs/bmad-bundle/`            | HIGH - Echon bundle             |
| PRP Documents      | `docs/*.md`                    | LOW - Can recreate              |
| Test Files         | Various `.spec.ts`             | MEDIUM                          |

### Previous Sync Attempts

Backup branches exist:

- `backup-before-upstream-merge-20251228-195800`
- `backup-before-upstream-sync-20251228-230953`

---

## 20-Agent Deployment Structure

### Two-Phase Architecture with Human Approval Gate

```
╔══════════════════════════════════════════════════════════════════╗
║  PHASE 1: SAFETY & ANALYSIS (Agents 1-10)                        ║
║  Duration: 10-15 minutes                                          ║
║  Risk: LOW (no destructive operations)                            ║
╠══════════════════════════════════════════════════════════════════╣
║  Agents 1-3:  Pre-Sync Safety (backup, documentation)            ║
║  Agents 4-6:  Fetch & Divergence Analysis                        ║
║  Agents 7-10: Impact Assessment & Conflict Prediction            ║
╚══════════════════════════════════════════════════════════════════╝
                              │
                              ▼
                 ╔═══════════════════════╗
                 ║   🛑 HUMAN APPROVAL   ║
                 ║   GATE - STOP HERE    ║
                 ║                       ║
                 ║   Review analysis     ║
                 ║   Approve Phase 2     ║
                 ║   or ABORT            ║
                 ╚═══════════════════════╝
                              │
                              ▼
╔══════════════════════════════════════════════════════════════════╗
║  PHASE 2: EXECUTION & VERIFICATION (Agents 11-20)                ║
║  Duration: 15-30 minutes (depends on conflicts)                   ║
║  Risk: MODERATE (has rollback capability)                         ║
╠══════════════════════════════════════════════════════════════════╣
║  Agents 11-13: Merge Execution                                   ║
║  Agents 14-16: Conflict Resolution (if needed, STOP if complex)  ║
║  Agents 17-20: Verification, Testing & Report                    ║
╚══════════════════════════════════════════════════════════════════╝
```

### Agent Assignment Table

| Phase       | Agents | Focus Area                                         | Duration | Can Parallelize  |
| ----------- | ------ | -------------------------------------------------- | -------- | ---------------- |
| **PHASE 1** |        |                                                    |          |                  |
| 1.1         | 1-2    | Create backup branch + WIP commit                  | 3-5 min  | Yes              |
| 1.2         | 3      | Document pre-sync state                            | 2-3 min  | Yes (with 1-2)   |
| 1.3         | 4-5    | Fetch upstream + analyze divergence                | 3-5 min  | Yes              |
| 1.4         | 6-7    | List upstream commits + file changes               | 2-3 min  | Yes (with 4-5)   |
| 1.5         | 8-9    | Predict conflicts in critical files                | 3-5 min  | After 4-5        |
| 1.6         | 10     | Generate Phase 1 Report + Recommendations          | 2-3 min  | After 8-9        |
| **🛑 STOP** |        | **Human reviews Phase 1 report, approves Phase 2** | -        | -                |
| **PHASE 2** |        |                                                    |          |                  |
| 2.1         | 11-12  | Execute merge (3-way merge)                        | 3-5 min  | Yes              |
| 2.2         | 13     | Fast-forward check + merge verification            | 2-3 min  | After 11-12      |
| 2.3         | 14-15  | Auto-resolve trivial conflicts                     | 3-5 min  | Conditional      |
| 2.4         | 16     | Report complex conflicts (STOP if any)             | 2-3 min  | After 14-15      |
| 2.5         | 17-18  | Verify critical customizations preserved           | 5-7 min  | After merge      |
| 2.6         | 19     | Run TypeScript compilation + npm checks            | 5-7 min  | Yes (with 17-18) |
| 2.7         | 20     | Generate final sync report                         | 3-5 min  | After all        |

**Total Estimated Time:** 25-45 minutes (depends on conflicts)

---

## PHASE 1: SAFETY & ANALYSIS (Agents 1-10)

### Task 1.1: Create Comprehensive Backup

**Agents:** 1-2 (parallel)

**CRITICAL:** Before ANY git operations, create safety net.

**Agent 1: Create WIP Commit**

```bash
#!/bin/bash
echo "=== Agent 1: Create WIP Backup Commit ==="
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

cd /home/aip0rt/Desktop/automaker

# Record pre-commit state
PRE_COMMIT=$(git rev-parse HEAD)
echo "Pre-backup commit: $PRE_COMMIT"

# Stage ALL current changes (this preserves everything)
echo ""
echo "Staging all current changes (~180+ files)..."
git add -A

# Count what's staged
STAGED=$(git diff --cached --name-only | wc -l)
echo "Staged files: $STAGED"

# Create WIP commit to preserve current state
echo ""
echo "Creating WIP commit..."
git commit -m "WIP: Pre-upstream-sync state - ALL CUSTOMIZATIONS

This commit preserves all local changes before syncing with upstream.

CRITICAL CUSTOMIZATIONS INCLUDED:
- Echon agent integration (10th executive agent)
- _bmad/bmm-executive/agents/echon.md
- Agent manifest updates (agent-manifest.csv, files-manifest.csv)
- App store profiles (14 profiles, 12 Opus models)
- BMAD persona service (10-agent registration)
- Bundle updates (libs/bmad-bundle/)
- BMAD configuration updates across all modules
- Opus profile upgrades
- Various PRPs and documentation

IMPORTANT: DO NOT PUSH this commit to origin.
This is a safety checkpoint for upstream sync.

Created: $(date)
Pre-sync commit: $PRE_COMMIT
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ WIP commit created successfully"
    git log --oneline -1
else
    echo "⚠️ No changes to commit (or already committed)"
fi
```

**Agent 2: Create Backup Branch**

```bash
#!/bin/bash
echo "=== Agent 2: Create Backup Branch ==="

cd /home/aip0rt/Desktop/automaker

# Create timestamped backup branch from current state
BACKUP_BRANCH="backup-before-upstream-sync-$(date +%Y%m%d-%H%M%S)"
echo "Creating backup branch: $BACKUP_BRANCH"

# Create backup branch pointing to current HEAD (includes WIP commit)
git branch "$BACKUP_BRANCH" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Backup branch created: $BACKUP_BRANCH"
else
    echo "⚠️ Branch may already exist, checking..."
fi

# Verify backup
echo ""
echo "Verification:"
echo "Current HEAD: $(git rev-parse --short HEAD)"
echo "Backup branch points to: $(git rev-parse --short $BACKUP_BRANCH 2>/dev/null || echo 'N/A')"
echo ""
echo "All backup branches:"
git branch | grep backup | tail -5

# Verify critical files exist in backup
echo ""
echo "Critical files in backup state:"
echo -n "  echon.md: "
[ -f "_bmad/bmm-executive/agents/echon.md" ] && echo "✅" || echo "❌"
echo -n "  agent-manifest.csv: "
[ -f "_bmad/_config/agent-manifest.csv" ] && echo "✅" || echo "❌"
echo -n "  app-store.ts: "
[ -f "apps/ui/src/store/app-store.ts" ] && echo "✅" || echo "❌"
```

---

### Task 1.2: Document Pre-Sync State

**Agent:** 3

````bash
#!/bin/bash
echo "=== Agent 3: Document Pre-Sync State ==="

cd /home/aip0rt/Desktop/automaker

# Create state documentation
STATE_FILE="/home/aip0rt/Desktop/automaker/docs/upstream-sync-state-$(date +%Y%m%d-%H%M%S).md"

cat > "$STATE_FILE" << 'HEADER'
# Upstream Sync State Documentation

## Executive Summary
This document captures the pre-sync state for rollback reference.

## Pre-Sync Commit Information
HEADER

echo "- **Commit Hash:** $(git rev-parse HEAD)" >> "$STATE_FILE"
echo "- **Short Hash:** $(git rev-parse --short HEAD)" >> "$STATE_FILE"
echo "- **Branch:** $(git branch --show-current)" >> "$STATE_FILE"
echo "- **Date:** $(date)" >> "$STATE_FILE"
echo "" >> "$STATE_FILE"

echo "## Backup Branch" >> "$STATE_FILE"
BACKUP=$(git branch | grep backup | tail -1 | tr -d ' ')
echo "- **Backup:** $BACKUP" >> "$STATE_FILE"
echo "" >> "$STATE_FILE"

echo "## Critical Custom Files Status" >> "$STATE_FILE"
echo "" >> "$STATE_FILE"
echo "| File | Status | Size |" >> "$STATE_FILE"
echo "|------|--------|------|" >> "$STATE_FILE"

CRITICAL_FILES=(
    "_bmad/bmm-executive/agents/echon.md"
    "_bmad/_config/agent-manifest.csv"
    "_bmad/_config/files-manifest.csv"
    "apps/ui/src/store/app-store.ts"
    "apps/server/src/services/bmad-persona-service.ts"
    "libs/bmad-bundle/bundle/_bmad/bmm-executive/agents/echon.md"
    "_bmad/bmm-executive/config.yaml"
)

for FILE in "${CRITICAL_FILES[@]}"; do
    if [ -f "$FILE" ]; then
        SIZE=$(wc -c < "$FILE")
        echo "| $FILE | ✅ Present | ${SIZE}B |" >> "$STATE_FILE"
    else
        echo "| $FILE | ❌ Missing | - |" >> "$STATE_FILE"
    fi
done

echo "" >> "$STATE_FILE"
echo "## Local Modifications Summary (last commit)" >> "$STATE_FILE"
echo "" >> "$STATE_FILE"
echo '```' >> "$STATE_FILE"
git diff --stat HEAD~1 2>/dev/null | tail -30 >> "$STATE_FILE"
echo '```' >> "$STATE_FILE"

echo ""
echo "✅ State documentation created: $STATE_FILE"
````

---

### Task 1.3: Fetch Upstream Changes

**Agents:** 4-5 (parallel)

**Agent 4: Fetch Upstream**

```bash
#!/bin/bash
echo "=== Agent 4: Fetch Upstream ==="

cd /home/aip0rt/Desktop/automaker

# Verify upstream remote exists
echo "Verifying upstream remote..."
if ! git remote -v | grep -q upstream; then
    echo "Adding upstream remote..."
    git remote add upstream https://github.com/AutoMaker-Org/automaker.git
fi

git remote -v | grep upstream

# Fetch all upstream changes
echo ""
echo "Fetching from upstream (with tags)..."
git fetch upstream --tags --prune

if [ $? -eq 0 ]; then
    echo "✅ Fetch successful"
else
    echo "❌ Fetch FAILED - check network/permissions"
    exit 1
fi

# Show upstream main latest commits
echo ""
echo "=== UPSTREAM main - Latest 15 commits ==="
git log upstream/main --oneline -15
```

**Agent 5: Analyze Divergence**

```bash
#!/bin/bash
echo "=== Agent 5: Analyze Divergence ==="

cd /home/aip0rt/Desktop/automaker

# Calculate divergence
AHEAD=$(git rev-list --count upstream/main..HEAD 2>/dev/null || echo "0")
BEHIND=$(git rev-list --count HEAD..upstream/main 2>/dev/null || echo "0")

echo "╔════════════════════════════════════════╗"
echo "║       DIVERGENCE ANALYSIS              ║"
echo "╠════════════════════════════════════════╣"
echo "║  Local is $AHEAD commits AHEAD of upstream"
echo "║  Local is $BEHIND commits BEHIND upstream"
echo "╚════════════════════════════════════════╝"
echo ""

if [ "$BEHIND" -eq 0 ]; then
    echo "✅ Already up to date with upstream!"
    echo "No merge needed."
    exit 0
fi

echo "=== NEW COMMITS FROM UPSTREAM ==="
git log HEAD..upstream/main --oneline --no-merges
echo ""

echo "=== UPSTREAM COMMIT AUTHORS ==="
git log HEAD..upstream/main --format="%an" | sort | uniq -c | sort -rn
```

---

### Task 1.4: List Upstream Changes

**Agents:** 6-7 (parallel)

**Agent 6: File Change Summary**

```bash
#!/bin/bash
echo "=== Agent 6: Upstream File Changes ==="

cd /home/aip0rt/Desktop/automaker

echo "=== FILES CHANGED IN UPSTREAM ==="
echo ""
git diff --stat HEAD...upstream/main | tail -50
echo ""

echo "=== CHANGE SUMMARY BY DIRECTORY ==="
git diff --stat HEAD...upstream/main --dirstat=files
```

**Agent 7: Identify Modified Areas**

```bash
#!/bin/bash
echo "=== Agent 7: Modified Areas Analysis ==="

cd /home/aip0rt/Desktop/automaker

echo "=== FILES ADDED BY UPSTREAM ==="
git diff --name-status HEAD...upstream/main | grep "^A" | head -20
echo ""

echo "=== FILES DELETED BY UPSTREAM ==="
git diff --name-status HEAD...upstream/main | grep "^D" | head -20
echo ""

echo "=== FILES MODIFIED BY UPSTREAM ==="
git diff --name-status HEAD...upstream/main | grep "^M" | wc -l
echo "files modified"
```

---

### Task 1.5: Predict Conflicts in Critical Files

**Agents:** 8-9 (sequential after 4-5)

**Agent 8: Critical File Conflict Check**

```bash
#!/bin/bash
echo "=== Agent 8: Critical File Conflict Prediction ==="

cd /home/aip0rt/Desktop/automaker

# Our critical files that MUST be preserved
CRITICAL_FILES=(
    "apps/ui/src/store/app-store.ts"
    "apps/server/src/services/bmad-persona-service.ts"
    "apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx"
    "_bmad/_config/agent-manifest.csv"
    "_bmad/_config/files-manifest.csv"
    "_bmad/bmm-executive/config.yaml"
    "libs/bmad-bundle/bundle/_bmad/bmm-executive/config.yaml"
)

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           CRITICAL FILE CONFLICT PREDICTION                    ║"
echo "╠════════════════════════════════════════════════════════════════╣"

CONFLICT_LIKELY=0
SAFE=0

for FILE in "${CRITICAL_FILES[@]}"; do
    printf "║ %-55s" "$FILE"
    if git diff HEAD...upstream/main --name-only | grep -q "$FILE"; then
        echo "⚠️ CONFLICT LIKELY ║"
        ((CONFLICT_LIKELY++))
    else
        echo "✅ SAFE           ║"
        ((SAFE++))
    fi
done

echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  SUMMARY: $SAFE safe, $CONFLICT_LIKELY potential conflicts                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"

if [ $CONFLICT_LIKELY -gt 0 ]; then
    echo ""
    echo "⚠️ WARNING: Conflicts expected in $CONFLICT_LIKELY critical files"
    echo "Phase 2 will require careful conflict resolution"
fi
```

**Agent 9: Detailed Conflict Preview**

```bash
#!/bin/bash
echo "=== Agent 9: Detailed Conflict Preview ==="

cd /home/aip0rt/Desktop/automaker

# Check app-store.ts specifically (most likely conflict)
FILE="apps/ui/src/store/app-store.ts"
if git diff HEAD...upstream/main --name-only | grep -q "$FILE"; then
    echo "=== CONFLICT PREVIEW: app-store.ts ==="
    echo ""
    echo "Our changes (what we need to preserve):"
    echo "  - 14 built-in profiles (including Echon)"
    echo "  - 12 Opus model settings"
    echo "  - profile-bmad-echon entry"
    echo ""
    echo "Upstream changes:"
    git diff HEAD...upstream/main -- "$FILE" | head -100
fi

# Check bmad-persona-service.ts
FILE="apps/server/src/services/bmad-persona-service.ts"
if git diff HEAD...upstream/main --name-only | grep -q "$FILE"; then
    echo ""
    echo "=== CONFLICT PREVIEW: bmad-persona-service.ts ==="
    echo ""
    echo "Our changes (what we need to preserve):"
    echo "  - PUBLIC_PERSONA_IDS with 10 agents including echon"
    echo "  - getAgentDefaults with echon entry"
    echo "  - 10-agent party synthesis prompt"
    echo ""
    echo "Upstream changes:"
    git diff HEAD...upstream/main -- "$FILE" | head -100
fi
```

---

### Task 1.6: Generate Phase 1 Report

**Agent:** 10

```bash
#!/bin/bash
echo "═══════════════════════════════════════════════════════════════════"
echo "               PHASE 1 ANALYSIS REPORT"
echo "               Upstream Sync Readiness Assessment"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Generated: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

cd /home/aip0rt/Desktop/automaker

# Divergence Summary
AHEAD=$(git rev-list --count upstream/main..HEAD 2>/dev/null || echo "0")
BEHIND=$(git rev-list --count HEAD..upstream/main 2>/dev/null || echo "0")

echo "┌─────────────────────────────────────────┐"
echo "│  DIVERGENCE STATUS                      │"
echo "├─────────────────────────────────────────┤"
echo "│  Local commits ahead:  $AHEAD"
echo "│  Upstream commits behind: $BEHIND"
echo "└─────────────────────────────────────────┘"
echo ""

# Backup Status
echo "┌─────────────────────────────────────────┐"
echo "│  BACKUP STATUS                          │"
echo "├─────────────────────────────────────────┤"
BACKUP=$(git branch | grep backup | tail -1 | tr -d ' ')
echo "│  Latest backup: $BACKUP"
echo "│  Backup commit: $(git rev-parse --short $BACKUP 2>/dev/null || echo 'N/A')"
echo "└─────────────────────────────────────────┘"
echo ""

# Conflict Prediction
echo "┌─────────────────────────────────────────┐"
echo "│  CONFLICT PREDICTION                    │"
echo "├─────────────────────────────────────────┤"

CRITICAL_FILES=(
    "apps/ui/src/store/app-store.ts"
    "apps/server/src/services/bmad-persona-service.ts"
)

CONFLICT_COUNT=0
for FILE in "${CRITICAL_FILES[@]}"; do
    if git diff HEAD...upstream/main --name-only | grep -q "$FILE"; then
        echo "│  ⚠️ $FILE"
        ((CONFLICT_COUNT++))
    fi
done

if [ $CONFLICT_COUNT -eq 0 ]; then
    echo "│  ✅ No conflicts expected in critical files"
fi
echo "└─────────────────────────────────────────┘"
echo ""

# Recommendation
echo "┌─────────────────────────────────────────┐"
echo "│  RECOMMENDATION                         │"
echo "├─────────────────────────────────────────┤"

if [ "$BEHIND" -eq 0 ]; then
    echo "│  ✅ SYNC NOT NEEDED - Already up to date"
    echo "│  Action: None required"
elif [ $CONFLICT_COUNT -eq 0 ]; then
    echo "│  ✅ PROCEED WITH PHASE 2"
    echo "│  Risk Level: LOW"
    echo "│  Conflicts: None expected"
else
    echo "│  ⚠️ PROCEED WITH CAUTION"
    echo "│  Risk Level: MODERATE"
    echo "│  Conflicts: $CONFLICT_COUNT files may conflict"
    echo "│  Strategy: Hybrid resolution (auto + manual)"
fi
echo "└─────────────────────────────────────────┘"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  🛑 PHASE 1 COMPLETE - AWAITING HUMAN APPROVAL FOR PHASE 2"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "To proceed with Phase 2 (merge execution), user must explicitly approve."
echo "To abort, user can rollback to backup branch: $BACKUP"
echo ""
```

---

## 🛑 HUMAN APPROVAL GATE

**STOP HERE AFTER PHASE 1 COMPLETES**

The Claude team must:

1. Present Phase 1 Report to user
2. Wait for explicit approval to proceed
3. DO NOT start Phase 2 without user saying "proceed" or "approved"

**User Options:**

- **"Proceed"** / **"Approved"** → Start Phase 2
- **"Abort"** → Reset to backup branch, end sync
- **"Wait"** → Pause for user to review files manually

---

## PHASE 2: EXECUTION & VERIFICATION (Agents 11-20)

> **Only execute after user approval from Phase 1**

### Task 2.1: Execute Merge

**Agents:** 11-12 (parallel)

**Agent 11: Prepare Merge**

```bash
#!/bin/bash
echo "=== Agent 11: Prepare Merge ==="

cd /home/aip0rt/Desktop/automaker

# Ensure we're on main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "Switching to main branch..."
    git checkout main
fi

echo "Current branch: $(git branch --show-current)"
echo "Current commit: $(git rev-parse --short HEAD)"
echo ""
echo "Ready to merge upstream/main"
```

**Agent 12: Execute 3-Way Merge**

```bash
#!/bin/bash
echo "=== Agent 12: Execute 3-Way Merge ==="

cd /home/aip0rt/Desktop/automaker

# Ensure we're on main
git checkout main

# Attempt merge with descriptive message
echo "Executing merge with upstream/main..."
echo ""

git merge upstream/main -m "Merge upstream/main: Sync with AutoMaker-Org

Syncing fork with latest upstream changes while preserving:
- Echon agent (10th executive agent)
- All BMAD module customizations
- 14 built-in profiles (including Echon)
- 12 Opus model configurations
- Agent manifest and files manifest
- Bundle configurations

🔄 Upstream sync $(date +%Y-%m-%d)

Co-authored-by: BMAD Executive Team <bmad@automaker.dev>
"

MERGE_RESULT=$?

echo ""
if [ $MERGE_RESULT -eq 0 ]; then
    echo "╔════════════════════════════════════════╗"
    echo "║  ✅ MERGE COMPLETED SUCCESSFULLY       ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    echo "Post-merge commits:"
    git log --oneline -5
else
    echo "╔════════════════════════════════════════╗"
    echo "║  ⚠️ MERGE HAS CONFLICTS                ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    echo "Conflicted files:"
    git diff --name-only --diff-filter=U
    echo ""
    echo "NEXT: Conflict resolution (Agents 14-16)"
fi

exit $MERGE_RESULT
```

---

### Task 2.2: Merge Verification

**Agent:** 13

```bash
#!/bin/bash
echo "=== Agent 13: Merge Verification ==="

cd /home/aip0rt/Desktop/automaker

# Check merge state
echo "Checking merge state..."
echo ""

# Check for conflicts
CONFLICTS=$(git diff --name-only --diff-filter=U 2>/dev/null | wc -l)

if [ "$CONFLICTS" -gt 0 ]; then
    echo "⚠️ Merge incomplete - $CONFLICTS conflicted files"
    echo ""
    echo "Conflicted files:"
    git diff --name-only --diff-filter=U
    echo ""
    echo "Proceeding to conflict resolution (Agents 14-16)"
    exit 1
else
    echo "✅ Merge completed without conflicts"
    echo ""
    echo "Verifying merge commit..."
    git log --oneline -3
fi
```

---

### Task 2.3: Auto-Resolve Trivial Conflicts

**Agents:** 14-15 (conditional - only if conflicts exist)

**Agent 14: Identify Trivial vs Complex Conflicts**

```bash
#!/bin/bash
echo "=== Agent 14: Conflict Classification ==="

cd /home/aip0rt/Desktop/automaker

# Get conflicted files
CONFLICTS=$(git diff --name-only --diff-filter=U 2>/dev/null)

if [ -z "$CONFLICTS" ]; then
    echo "✅ No conflicts to resolve"
    exit 0
fi

echo "Classifying conflicts..."
echo ""

TRIVIAL=()
COMPLEX=()

for FILE in $CONFLICTS; do
    # Count conflict markers
    MARKERS=$(grep -c "^<<<<<<< " "$FILE" 2>/dev/null || echo "0")

    # Complex files (require human review)
    if [[ "$FILE" == *"app-store.ts"* ]] || \
       [[ "$FILE" == *"bmad-persona-service.ts"* ]] || \
       [[ "$FILE" == *"agent-manifest.csv"* ]]; then
        COMPLEX+=("$FILE")
        echo "⚠️ COMPLEX: $FILE ($MARKERS conflicts)"
    elif [ "$MARKERS" -le 2 ]; then
        TRIVIAL+=("$FILE")
        echo "✅ TRIVIAL: $FILE ($MARKERS conflicts)"
    else
        COMPLEX+=("$FILE")
        echo "⚠️ COMPLEX: $FILE ($MARKERS conflicts)"
    fi
done

echo ""
echo "Summary:"
echo "  Trivial (auto-resolvable): ${#TRIVIAL[@]}"
echo "  Complex (needs review): ${#COMPLEX[@]}"

# Export for Agent 15
echo "${TRIVIAL[@]}" > /tmp/trivial_conflicts.txt
echo "${COMPLEX[@]}" > /tmp/complex_conflicts.txt
```

**Agent 15: Auto-Resolve Trivial Conflicts**

```bash
#!/bin/bash
echo "=== Agent 15: Auto-Resolve Trivial Conflicts ==="

cd /home/aip0rt/Desktop/automaker

# Read trivial conflicts from Agent 14
TRIVIAL=$(cat /tmp/trivial_conflicts.txt 2>/dev/null)

if [ -z "$TRIVIAL" ]; then
    echo "No trivial conflicts to auto-resolve"
    exit 0
fi

echo "Auto-resolving trivial conflicts..."
echo "(Strategy: Accept OURS for files not in upstream critical path)"
echo ""

for FILE in $TRIVIAL; do
    echo "Resolving: $FILE"

    # For trivial conflicts, keep our version (we have Echon, Opus, etc.)
    git checkout --ours "$FILE" 2>/dev/null
    git add "$FILE"

    if [ $? -eq 0 ]; then
        echo "  ✅ Resolved (kept ours)"
    else
        echo "  ⚠️ Could not auto-resolve"
    fi
done

echo ""
echo "Trivial conflicts resolved"
```

---

### Task 2.4: Report Complex Conflicts

**Agent:** 16

```bash
#!/bin/bash
echo "═══════════════════════════════════════════════════════════════════"
echo "                  COMPLEX CONFLICT REPORT"
echo "═══════════════════════════════════════════════════════════════════"

cd /home/aip0rt/Desktop/automaker

# Check remaining conflicts
REMAINING=$(git diff --name-only --diff-filter=U 2>/dev/null)

if [ -z "$REMAINING" ]; then
    echo "✅ All conflicts resolved - proceeding to verification"
    exit 0
fi

echo ""
echo "⚠️ COMPLEX CONFLICTS REQUIRE MANUAL RESOLUTION"
echo ""
echo "Files with unresolved conflicts:"
echo ""

for FILE in $REMAINING; do
    echo "┌─────────────────────────────────────────────────────────────────┐"
    echo "│ FILE: $FILE"
    echo "├─────────────────────────────────────────────────────────────────┤"

    # Show conflict sections
    MARKERS=$(grep -c "^<<<<<<< " "$FILE" 2>/dev/null || echo "0")
    echo "│ Conflict sections: $MARKERS"
    echo "│"
    echo "│ Preview:"
    grep -B2 -A10 "^<<<<<<< " "$FILE" 2>/dev/null | head -30 | sed 's/^/│ /'
    echo "└─────────────────────────────────────────────────────────────────┘"
    echo ""
done

echo "═══════════════════════════════════════════════════════════════════"
echo "  🛑 MANUAL INTERVENTION REQUIRED"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "RESOLUTION PROTOCOL:"
echo ""
echo "For app-store.ts:"
echo "  1. KEEP all our BMAD profiles (including Echon)"
echo "  2. KEEP all model: 'opus' entries (12 total)"
echo "  3. TAKE any NEW profiles from upstream"
echo ""
echo "For bmad-persona-service.ts:"
echo "  1. KEEP 'bmad:echon' in PUBLIC_PERSONA_IDS"
echo "  2. KEEP echon in getAgentDefaults"
echo "  3. KEEP 10-agent party synthesis prompt"
echo "  4. TAKE any new service features from upstream"
echo ""
echo "Commands:"
echo "  git diff --name-only --diff-filter=U  # List conflicts"
echo "  code <filename>                        # Open in editor"
echo "  git add <filename>                     # Mark resolved"
echo "  git commit                             # Complete merge"
echo ""

# Exit with error to stop Phase 2 progress
exit 1
```

---

### Task 2.5: Verify Critical Customizations

**Agents:** 17-18 (after merge complete)

**Agent 17: Verify Echon Integration**

```bash
#!/bin/bash
echo "=== Agent 17: Verify Echon Integration ==="

cd /home/aip0rt/Desktop/automaker

PASS=0
FAIL=0

echo "Verifying Echon integration post-merge..."
echo ""

# 1. Echon agent file
echo -n "1. Echon agent file (_bmad/bmm-executive/agents/echon.md): "
if [ -f "_bmad/bmm-executive/agents/echon.md" ]; then
    echo "✅ PASS"
    ((PASS++))
else
    echo "❌ FAIL - CRITICAL"
    ((FAIL++))
fi

# 2. Echon in agent manifest
echo -n "2. Echon in agent-manifest.csv: "
if grep -q "echon" "_bmad/_config/agent-manifest.csv"; then
    echo "✅ PASS"
    ((PASS++))
else
    echo "❌ FAIL"
    ((FAIL++))
fi

# 3. Echon profile in app-store
echo -n "3. Echon profile in app-store.ts: "
if grep -q "profile-bmad-echon" "apps/ui/src/store/app-store.ts"; then
    echo "✅ PASS"
    ((PASS++))
else
    echo "❌ FAIL - CRITICAL"
    ((FAIL++))
fi

# 4. Echon in persona service
echo -n "4. Echon in bmad-persona-service.ts: "
if grep -q "'bmad:echon'" "apps/server/src/services/bmad-persona-service.ts"; then
    echo "✅ PASS"
    ((PASS++))
else
    echo "❌ FAIL - CRITICAL"
    ((FAIL++))
fi

# 5. Echon in bundle
echo -n "5. Echon in bundle: "
if [ -f "libs/bmad-bundle/bundle/_bmad/bmm-executive/agents/echon.md" ]; then
    echo "✅ PASS"
    ((PASS++))
else
    echo "❌ FAIL"
    ((FAIL++))
fi

# 6. 10 agents in party mode
echo -n "6. 10 agents in party_mode_agents: "
AGENT_COUNT=$(grep -A20 "party_mode_agents:" "_bmad/bmm-executive/config.yaml" | grep "^ *-" | wc -l)
if [ "$AGENT_COUNT" -ge 10 ]; then
    echo "✅ PASS ($AGENT_COUNT agents)"
    ((PASS++))
else
    echo "⚠️ WARN ($AGENT_COUNT agents, expected 10)"
fi

echo ""
echo "Echon Integration: $PASS passed, $FAIL failed"

if [ $FAIL -gt 0 ]; then
    echo ""
    echo "⚠️ ECHON INTEGRATION COMPROMISED - RESTORE FROM BACKUP"
    exit 1
fi
```

**Agent 18: Verify Opus Profiles**

```bash
#!/bin/bash
echo "=== Agent 18: Verify Opus Profiles ==="

cd /home/aip0rt/Desktop/automaker

PASS=0
FAIL=0

echo "Verifying Opus profile configuration..."
echo ""

# 1. Total profile count
echo -n "1. Total built-in profiles (expected 14): "
PROFILE_COUNT=$(grep -c "id: 'profile-" "apps/ui/src/store/app-store.ts")
if [ "$PROFILE_COUNT" -eq 14 ]; then
    echo "✅ PASS ($PROFILE_COUNT)"
    ((PASS++))
else
    echo "❌ FAIL ($PROFILE_COUNT found)"
    ((FAIL++))
fi

# 2. Opus model count
echo -n "2. Opus model assignments (expected 12): "
OPUS_COUNT=$(grep -c "model: 'opus'" "apps/ui/src/store/app-store.ts")
if [ "$OPUS_COUNT" -ge 12 ]; then
    echo "✅ PASS ($OPUS_COUNT)"
    ((PASS++))
else
    echo "⚠️ WARN ($OPUS_COUNT found, expected 12)"
fi

# 3. Executive agent profiles
echo "3. Executive agent profiles:"
EXEC_AGENTS=(
    "analyst-strategist"
    "apex"
    "financial-strategist"
    "fulfillization-manager"
    "operations-commander"
    "security-guardian"
    "strategist-marketer"
    "technologist-architect"
    "zen"
    "echon"
)

for AGENT in "${EXEC_AGENTS[@]}"; do
    echo -n "   - $AGENT: "
    if grep -q "profile-bmad-$AGENT" "apps/ui/src/store/app-store.ts"; then
        echo "✅"
        ((PASS++))
    else
        echo "❌ MISSING"
        ((FAIL++))
    fi
done

echo ""
echo "Opus Profiles: $PASS passed, $FAIL failed"

if [ $FAIL -gt 0 ]; then
    echo ""
    echo "⚠️ OPUS PROFILES COMPROMISED - CHECK RESTORATION"
fi
```

---

### Task 2.6: Technical Verification

**Agent:** 19

```bash
#!/bin/bash
echo "=== Agent 19: Technical Verification ==="

cd /home/aip0rt/Desktop/automaker

echo "Running technical checks..."
echo ""

# 1. Git state clean
echo -n "1. Git state (no unresolved conflicts): "
if git diff --name-only --diff-filter=U | grep -q .; then
    echo "❌ FAIL - Unresolved conflicts remain"
    git diff --name-only --diff-filter=U
else
    echo "✅ PASS"
fi

# 2. Package.json valid
echo -n "2. package.json valid: "
if node -e "require('./package.json')" 2>/dev/null; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

# 3. TypeScript compilation
echo -n "3. TypeScript compilation: "
cd apps/ui
TSC_OUTPUT=$(npx tsc --noEmit 2>&1)
TSC_ERRORS=$(echo "$TSC_OUTPUT" | grep -c "error TS" || echo "0")
cd ../..

if [ "$TSC_ERRORS" -eq 0 ]; then
    echo "✅ PASS (no errors)"
elif [ "$TSC_ERRORS" -lt 5 ]; then
    echo "⚠️ WARN ($TSC_ERRORS errors - may be pre-existing)"
else
    echo "❌ FAIL ($TSC_ERRORS errors)"
fi

# 4. npm install
echo -n "4. Dependencies (npm install): "
npm install --silent 2>&1
if [ $? -eq 0 ]; then
    echo "✅ PASS"
else
    echo "⚠️ Check npm output"
fi

# 5. Agent service count
echo -n "5. Persona service agent count: "
AGENT_COUNT=$(grep -c "'bmad:" "apps/server/src/services/bmad-persona-service.ts")
if [ "$AGENT_COUNT" -ge 10 ]; then
    echo "✅ PASS ($AGENT_COUNT agents)"
else
    echo "❌ FAIL ($AGENT_COUNT agents)"
fi

echo ""
echo "Technical verification complete"
```

---

### Task 2.7: Generate Final Sync Report

**Agent:** 20

```bash
#!/bin/bash
echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                      ║"
echo "║                    UPSTREAM SYNC - FINAL REPORT                      ║"
echo "║                                                                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "  Sync Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "  Target: AutoMaker-Org/automaker → airplne/automaker"
echo ""

cd /home/aip0rt/Desktop/automaker

# Overall Status
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║  SYNC STATUS                                                         ║"
echo "╠══════════════════════════════════════════════════════════════════════╣"

if git diff --name-only --diff-filter=U | grep -q .; then
    echo "║  Status: ⚠️ CONFLICTS NEED RESOLUTION                              ║"
    echo "║                                                                      ║"
    echo "║  Conflicted files:                                                   ║"
    git diff --name-only --diff-filter=U | sed 's/^/║    - /'
else
    echo "║  Status: ✅ SYNC COMPLETE                                           ║"
fi
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Git Info
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║  GIT STATUS                                                          ║"
echo "╠══════════════════════════════════════════════════════════════════════╣"
echo "║  Branch: $(git branch --show-current)"
echo "║  Commit: $(git rev-parse --short HEAD)"
echo "║                                                                      ║"
echo "║  Recent commits:                                                     ║"
git log --oneline -5 | sed 's/^/║    /'
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Customization Status
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║  CUSTOMIZATION PRESERVATION                                          ║"
echo "╠══════════════════════════════════════════════════════════════════════╣"
echo "║                                                                      ║"
echo -n "║  Echon agent file:        "
[ -f "_bmad/bmm-executive/agents/echon.md" ] && echo "✅ PRESERVED                       ║" || echo "❌ MISSING                         ║"

echo -n "║  Agent manifest entry:    "
grep -q "echon" "_bmad/_config/agent-manifest.csv" && echo "✅ PRESERVED                       ║" || echo "❌ MISSING                         ║"

PROFILE_COUNT=$(grep -c "id: 'profile-" "apps/ui/src/store/app-store.ts")
echo "║  Built-in profiles:       $PROFILE_COUNT (expected 14)                          ║"

OPUS_COUNT=$(grep -c "model: 'opus'" "apps/ui/src/store/app-store.ts")
echo "║  Opus model configs:      $OPUS_COUNT (expected 12)                          ║"

echo "║                                                                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Next Steps
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║  NEXT STEPS                                                          ║"
echo "╠══════════════════════════════════════════════════════════════════════╣"

if git diff --name-only --diff-filter=U | grep -q .; then
    echo "║  1. ❌ Resolve conflicts in listed files                            ║"
    echo "║  2. git add <resolved-files>                                        ║"
    echo "║  3. git commit                                                      ║"
    echo "║  4. Re-run verification                                             ║"
else
    echo "║  1. ✅ Test application: npm run dev:web                            ║"
    echo "║  2. ✅ Verify Echon appears in profiles dropdown                    ║"
    echo "║  3. ✅ Run automated tests: npm run test                            ║"
    echo "║  4. ✅ Push to origin: git push origin main                         ║"
fi
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Rollback Info
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║  ROLLBACK (if needed)                                                ║"
echo "╠══════════════════════════════════════════════════════════════════════╣"
echo "║  Command: git reset --hard <backup-branch>                           ║"
echo "║                                                                      ║"
echo "║  Available backups:                                                  ║"
git branch | grep backup | tail -3 | sed 's/^/║    /'
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "                    END OF UPSTREAM SYNC REPORT"
echo "═══════════════════════════════════════════════════════════════════════"
```

---

## Rollback Instructions

### If Sync Fails or Breaks Something

```bash
# Find backup branch
git branch | grep backup

# Reset to backup (DESTRUCTIVE - loses merge)
git reset --hard backup-before-upstream-sync-YYYYMMDD-HHMMSS

# Or soft reset to review changes
git reset --soft backup-before-upstream-sync-YYYYMMDD-HHMMSS
```

### If Need to Start Over

```bash
# Abort current merge if in progress
git merge --abort

# Reset to before sync attempt
git reset --hard HEAD~1  # Only if committed the merge

# Fetch fresh
git fetch upstream
```

---

## Success Criteria

| Criterion                                    | Required | Verification |
| -------------------------------------------- | -------- | ------------ |
| Merge completes without unresolved conflicts | ✅       | Agent 13     |
| Echon agent file preserved                   | ✅       | Agent 17     |
| Echon in agent-manifest.csv                  | ✅       | Agent 17     |
| Echon profile in app-store.ts                | ✅       | Agent 17     |
| Echon in bmad-persona-service.ts             | ✅       | Agent 17     |
| 14 profiles in app-store.ts                  | ✅       | Agent 18     |
| 12 Opus profiles                             | ✅       | Agent 18     |
| 10 executive agents registered               | ✅       | Agent 19     |
| TypeScript compiles                          | ✅       | Agent 19     |
| npm install succeeds                         | ✅       | Agent 19     |
| Application starts                           | ✅       | Manual       |

---

## Important Notes

1. **BACKUP FIRST** - Never skip Phase 1
2. **HUMAN APPROVAL GATE** - Phase 2 requires explicit user approval
3. **LOCAL CHANGES** - ~180+ uncommitted files preserved in WIP backup commit
4. **CONFLICTS LIKELY** - If upstream modified app-store.ts or services, expect conflicts
5. **PRESERVE ECHON** - The 10th agent integration is CRITICAL
6. **PRESERVE OPUS** - The model upgrades are CRITICAL
7. **PRESERVE ALL BMAD** - All custom modules and agents must remain intact
8. **TEST AFTER** - Always verify the app works after sync
9. **HYBRID RESOLUTION** - Auto-resolve trivial, report complex conflicts
10. **STOP AT COMPLEX** - If complex conflicts detected, pause for human review

---

**END OF PRP**
