# PRP: Install BMM-Executive Module in codex-subagents

## Executive Summary

**Goal:** Install the `bmm-executive` BMAD module in the codex-subagents project to enable the full 9-agent Executive Suite (Sage, Theo, Finn, Cerberus, Mary, Walt, Axel, Apex, Zen).

**Target Project:** `/home/aip0rt/Desktop/codex-subagents`
**Source Project:** `/home/aip0rt/Desktop/automaker`

**Current State:**

- automaker: Has `bmm-executive` module installed (manifest includes it)
- codex-subagents: Missing `bmm-executive` module entirely

---

## Pre-Execution Verification

Before starting, verify the following conditions:

```bash
# Verify source module exists
ls -la /home/aip0rt/Desktop/automaker/_bmad/bmm-executive/

# Verify target is missing the module
ls -la /home/aip0rt/Desktop/codex-subagents/_bmad/bmm-executive/ 2>&1 | grep -q "No such file" && echo "PASS: Module missing as expected" || echo "FAIL: Module already exists"

# Verify manifest difference
grep "bmm-executive" /home/aip0rt/Desktop/codex-subagents/_bmad/_config/manifest.yaml && echo "FAIL: Already in manifest" || echo "PASS: Not in manifest"
```

---

## Task Breakdown

### Task 1: Copy BMM-Executive Module Directory

**Priority:** Critical
**Parallelizable:** No (must complete before Tasks 2-5)

Copy the entire `bmm-executive` module directory from automaker to codex-subagents.

```bash
cp -r /home/aip0rt/Desktop/automaker/_bmad/bmm-executive /home/aip0rt/Desktop/codex-subagents/_bmad/
```

**Expected Contents:**

```
bmm-executive/
├── config.yaml              # Module configuration
├── agents/
│   ├── analyst-strategist.md    # Mary (Chief Analyst)
│   ├── apex.md                  # Apex (Peak Performance Engineer)
│   ├── financial-strategist.md  # Walt (Financial Strategist)
│   ├── fulfillization-manager.md # Finn (Delivery + Experience)
│   ├── operations-commander.md  # Axel (Operations Commander)
│   ├── security-guardian.md     # Cerberus (Security Architect)
│   ├── strategist-marketer.md   # Sage (Product Strategist)
│   ├── technologist-architect.md # Theo (Technical Architect)
│   └── zen.md                   # Zen (Clean Architecture Engineer)
├── data/
│   └── migration-guide.md
├── teams/
│   └── default-party.csv
└── workflows/
    ├── triad-build/workflow.md
    ├── triad-discovery/workflow.md
    ├── triad-full-cycle/workflow.md
    └── triad-ship/workflow.md
```

**Verification:**

```bash
# Count files (should be 16)
find /home/aip0rt/Desktop/codex-subagents/_bmad/bmm-executive -type f | wc -l
```

---

### Task 2: Update manifest.yaml

**Priority:** Critical
**Parallelizable:** Yes (with Tasks 3-5, after Task 1)

**File:** `/home/aip0rt/Desktop/codex-subagents/_bmad/_config/manifest.yaml`

**Current Content:**

```yaml
installation:
  version: 6.0.0-alpha.21
  installDate: 2025-12-29T17:40:10.599Z
  lastUpdated: 2025-12-29T17:40:10.599Z
modules:
  - core
  - bmb
  - bmm
  - cis
ides:
  - claude-code
  - codex
```

**Required Change:**
Add `bmm-executive` to the modules list:

```yaml
modules:
  - core
  - bmb
  - bmm
  - cis
  - bmm-executive
```

**Also update `lastUpdated` timestamp to current time.**

---

### Task 3: Update agent-manifest.csv

**Priority:** Critical
**Parallelizable:** Yes (with Tasks 2, 4-5, after Task 1)

**File:** `/home/aip0rt/Desktop/codex-subagents/_bmad/_config/agent-manifest.csv`

**Action:** Append the following 9 agent entries at the end of the CSV file.

**Entries to Add (from automaker agent-manifest.csv lines 21-29):**

| name                   | displayName | module        | path                                                  |
| ---------------------- | ----------- | ------------- | ----------------------------------------------------- |
| analyst-strategist     | Mary        | bmm-executive | \_bmad/bmm-executive/agents/analyst-strategist.md     |
| apex                   | Apex        | bmm-executive | \_bmad/bmm-executive/agents/apex.md                   |
| financial-strategist   | Walt        | bmm-executive | \_bmad/bmm-executive/agents/financial-strategist.md   |
| fulfillization-manager | Finn        | bmm-executive | \_bmad/bmm-executive/agents/fulfillization-manager.md |
| operations-commander   | Axel        | bmm-executive | \_bmad/bmm-executive/agents/operations-commander.md   |
| security-guardian      | Cerberus    | bmm-executive | \_bmad/bmm-executive/agents/security-guardian.md      |
| strategist-marketer    | Sage        | bmm-executive | \_bmad/bmm-executive/agents/strategist-marketer.md    |
| technologist-architect | Theo        | bmm-executive | \_bmad/bmm-executive/agents/technologist-architect.md |
| zen                    | Zen         | bmm-executive | \_bmad/bmm-executive/agents/zen.md                    |

**Method:** Copy lines 21-29 from automaker's agent-manifest.csv and append to codex-subagents' file:

```bash
# Extract bmm-executive agent entries from automaker
grep "bmm-executive" /home/aip0rt/Desktop/automaker/_bmad/_config/agent-manifest.csv >> /home/aip0rt/Desktop/codex-subagents/_bmad/_config/agent-manifest.csv
```

**Verification:**

```bash
grep -c "bmm-executive" /home/aip0rt/Desktop/codex-subagents/_bmad/_config/agent-manifest.csv
# Expected: 9
```

---

### Task 4: Update workflow-manifest.csv

**Priority:** Critical
**Parallelizable:** Yes (with Tasks 2-3, 5, after Task 1)

**File:** `/home/aip0rt/Desktop/codex-subagents/_bmad/_config/workflow-manifest.csv`

**Action:** Append the following 4 workflow entries at the end of the CSV file.

**Entries to Add:**

| name             | description                                                   | module        | path                                                        |
| ---------------- | ------------------------------------------------------------- | ------------- | ----------------------------------------------------------- |
| triad-build      | Architecture → Implementation: Lead by Technologist Architect | bmm-executive | \_bmad/bmm-executive/workflows/triad-build/workflow.md      |
| triad-discovery  | Strategy → Requirements: Lead by Strategist Marketer          | bmm-executive | \_bmad/bmm-executive/workflows/triad-discovery/workflow.md  |
| triad-full-cycle | End-to-end orchestration: Discovery → Build → Ship            | bmm-executive | \_bmad/bmm-executive/workflows/triad-full-cycle/workflow.md |
| triad-ship       | Testing → Delivery → Docs: Lead by Fulfillization Manager     | bmm-executive | \_bmad/bmm-executive/workflows/triad-ship/workflow.md       |

**Method:**

```bash
grep "bmm-executive" /home/aip0rt/Desktop/automaker/_bmad/_config/workflow-manifest.csv >> /home/aip0rt/Desktop/codex-subagents/_bmad/_config/workflow-manifest.csv
```

**Verification:**

```bash
grep -c "bmm-executive" /home/aip0rt/Desktop/codex-subagents/_bmad/_config/workflow-manifest.csv
# Expected: 4
```

---

### Task 5: Update files-manifest.csv

**Priority:** Critical
**Parallelizable:** Yes (with Tasks 2-4, after Task 1)

**File:** `/home/aip0rt/Desktop/codex-subagents/_bmad/_config/files-manifest.csv`

**Action:** Append the following 16 file entries at the end of the CSV file.

**Entries to Add (with SHA-256 hashes for integrity):**

```csv
"csv","default-party","bmm-executive","bmm-executive/teams/default-party.csv","8555daa5cf98eff9c5ce9e3bb286e0e0cce446625320634f2ed491081dab2e22"
"md","analyst-strategist","bmm-executive","bmm-executive/agents/analyst-strategist.md","c45f75518991e8abef002b4a471a424143d7f7d3183b4b10297f2a9f542d6ac6"
"md","apex","bmm-executive","bmm-executive/agents/apex.md","79489c679e7821f8be8e12342abeee4f6e4aaded5e8a336c296e8ca6fdc7ddbd"
"md","financial-strategist","bmm-executive","bmm-executive/agents/financial-strategist.md","90448ea4bb2ee458293c6bf9088b72e7924440ebdf6c9bff9cb949c0a57b4664"
"md","fulfillization-manager","bmm-executive","bmm-executive/agents/fulfillization-manager.md","3866d9e266d346905cdbb5f525580c31fd629a6c6229ceb4333efaa9b5835d3f"
"md","migration-guide","bmm-executive","bmm-executive/data/migration-guide.md","2f64e7e8737facbbca6ad2de59fa8cd4deddf6827bd653869d8dbcd684435191"
"md","operations-commander","bmm-executive","bmm-executive/agents/operations-commander.md","c3af6954f9d3c1546574183149ac4ef40208a778a9ec5f1fa4b4baf7d19b5fe0"
"md","security-guardian","bmm-executive","bmm-executive/agents/security-guardian.md","d592686c6e668b6c7ceb6ad64d9ce9b0cf93a888ac7f4d3f009a79e9d191a72c"
"md","strategist-marketer","bmm-executive","bmm-executive/agents/strategist-marketer.md","1a4f0a104437751cf4c84518648d86cd9b9b65e56f82420399e036fe7f17b124"
"md","technologist-architect","bmm-executive","bmm-executive/agents/technologist-architect.md","86d40696fb993278505fef7e52fb7ab5318c00afb3efa8c0576af8afc6b3cc96"
"md","workflow","bmm-executive","bmm-executive/workflows/triad-build/workflow.md","95e174e8ea86e2656b6bf3603376a73b56df4e3ae27f98a34168013a0976f41e"
"md","workflow","bmm-executive","bmm-executive/workflows/triad-discovery/workflow.md","f949fbdd855fed828a1ea037c03d62fc38c9b89861d1cdb61790f9d6136d17b8"
"md","workflow","bmm-executive","bmm-executive/workflows/triad-full-cycle/workflow.md","4c5258e013256139b43febb96ae7fa79ebe17ee4296a9a7a721a679ae1790983"
"md","workflow","bmm-executive","bmm-executive/workflows/triad-ship/workflow.md","9312c33f3d9d4a9f3d2cc987ab4a2e63cf9cca8afb83c6d1e7f1366f44e7f4b0"
"md","zen","bmm-executive","bmm-executive/agents/zen.md","09c8e45ec8a3e526a316633654ec12c63da9a8f538c1723ab02052dbd4c993a6"
"yaml","config","bmm-executive","bmm-executive/config.yaml","d8b6357c8db08601626b8b4f3d205f53dca53bcb110f9a9639edbde8f2aa3c22"
```

**Method:**

```bash
grep "bmm-executive" /home/aip0rt/Desktop/automaker/_bmad/_config/files-manifest.csv >> /home/aip0rt/Desktop/codex-subagents/_bmad/_config/files-manifest.csv
```

**Verification:**

```bash
grep -c "bmm-executive" /home/aip0rt/Desktop/codex-subagents/_bmad/_config/files-manifest.csv
# Expected: 16
```

---

### Task 6: Update config.yaml User Settings

**Priority:** Medium
**Parallelizable:** Yes (after Task 1)

**File:** `/home/aip0rt/Desktop/codex-subagents/_bmad/bmm-executive/config.yaml`

The copied config.yaml contains automaker-specific settings. Update to match codex-subagents context if needed:

```yaml
# BMM-EXECUTIVE Module Configuration
# Version: 6.0.0-alpha.21

user_name: Aip0rt
communication_language: English
document_output_language: English
output_folder: '{project-root}/_bmad-output'
```

**Note:** These settings should be correct as-is since they use `{project-root}` placeholder.

---

## Post-Execution Verification

### Verification Script

Run this comprehensive verification after all tasks complete:

```bash
#!/bin/bash
set -e

TARGET="/home/aip0rt/Desktop/codex-subagents"
echo "=== BMM-Executive Module Installation Verification ==="

# 1. Check module directory exists
echo -n "1. Module directory exists: "
if [ -d "$TARGET/_bmad/bmm-executive" ]; then
    echo "PASS"
else
    echo "FAIL"
    exit 1
fi

# 2. Count agent files (should be 9)
echo -n "2. Agent files (expected 9): "
AGENT_COUNT=$(find "$TARGET/_bmad/bmm-executive/agents" -name "*.md" | wc -l)
if [ "$AGENT_COUNT" -eq 9 ]; then
    echo "PASS ($AGENT_COUNT)"
else
    echo "FAIL ($AGENT_COUNT)"
    exit 1
fi

# 3. Count workflow files (should be 4)
echo -n "3. Workflow files (expected 4): "
WORKFLOW_COUNT=$(find "$TARGET/_bmad/bmm-executive/workflows" -name "workflow.md" | wc -l)
if [ "$WORKFLOW_COUNT" -eq 4 ]; then
    echo "PASS ($WORKFLOW_COUNT)"
else
    echo "FAIL ($WORKFLOW_COUNT)"
    exit 1
fi

# 4. Check manifest.yaml includes module
echo -n "4. manifest.yaml includes bmm-executive: "
if grep -q "bmm-executive" "$TARGET/_bmad/_config/manifest.yaml"; then
    echo "PASS"
else
    echo "FAIL"
    exit 1
fi

# 5. Check agent-manifest.csv entries
echo -n "5. agent-manifest.csv entries (expected 9): "
AGENT_MANIFEST_COUNT=$(grep -c "bmm-executive" "$TARGET/_bmad/_config/agent-manifest.csv")
if [ "$AGENT_MANIFEST_COUNT" -eq 9 ]; then
    echo "PASS ($AGENT_MANIFEST_COUNT)"
else
    echo "FAIL ($AGENT_MANIFEST_COUNT)"
    exit 1
fi

# 6. Check workflow-manifest.csv entries
echo -n "6. workflow-manifest.csv entries (expected 4): "
WORKFLOW_MANIFEST_COUNT=$(grep -c "bmm-executive" "$TARGET/_bmad/_config/workflow-manifest.csv")
if [ "$WORKFLOW_MANIFEST_COUNT" -eq 4 ]; then
    echo "PASS ($WORKFLOW_MANIFEST_COUNT)"
else
    echo "FAIL ($WORKFLOW_MANIFEST_COUNT)"
    exit 1
fi

# 7. Check files-manifest.csv entries
echo -n "7. files-manifest.csv entries (expected 16): "
FILES_MANIFEST_COUNT=$(grep -c "bmm-executive" "$TARGET/_bmad/_config/files-manifest.csv")
if [ "$FILES_MANIFEST_COUNT" -eq 16 ]; then
    echo "PASS ($FILES_MANIFEST_COUNT)"
else
    echo "FAIL ($FILES_MANIFEST_COUNT)"
    exit 1
fi

# 8. Verify all 9 agents by name
echo "8. Verifying individual agents:"
AGENTS=("analyst-strategist" "apex" "financial-strategist" "fulfillization-manager"
        "operations-commander" "security-guardian" "strategist-marketer"
        "technologist-architect" "zen")
for agent in "${AGENTS[@]}"; do
    echo -n "   - $agent: "
    if [ -f "$TARGET/_bmad/bmm-executive/agents/$agent.md" ]; then
        echo "PASS"
    else
        echo "FAIL"
        exit 1
    fi
done

echo ""
echo "=== ALL VERIFICATIONS PASSED ==="
echo "BMM-Executive module successfully installed in codex-subagents"
```

---

## Execution Order Summary

```
┌─────────────────────────────────────────────────────────────────┐
│ Phase 1: Copy Module (Sequential - Must Complete First)        │
├─────────────────────────────────────────────────────────────────┤
│ Task 1: Copy bmm-executive directory                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Phase 2: Update Manifests (Parallelizable)                      │
├─────────────────────────────────────────────────────────────────┤
│ Task 2: Update manifest.yaml         ─┬─ Run in parallel       │
│ Task 3: Update agent-manifest.csv     │                        │
│ Task 4: Update workflow-manifest.csv  │                        │
│ Task 5: Update files-manifest.csv     │                        │
│ Task 6: Verify config.yaml           ─┘                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Phase 3: Verification (Sequential)                              │
├─────────────────────────────────────────────────────────────────┤
│ Run verification script                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Rollback Plan

If installation fails, execute:

```bash
# Remove the module directory
rm -rf /home/aip0rt/Desktop/codex-subagents/_bmad/bmm-executive

# Restore manifest files from git (if tracked)
cd /home/aip0rt/Desktop/codex-subagents
git checkout -- _bmad/_config/manifest.yaml
git checkout -- _bmad/_config/agent-manifest.csv
git checkout -- _bmad/_config/workflow-manifest.csv
git checkout -- _bmad/_config/files-manifest.csv

# Or manually remove appended lines if not tracked
```

---

## Success Criteria

| Criterion               | Expected Value                           |
| ----------------------- | ---------------------------------------- |
| Module directory exists | `_bmad/bmm-executive/` present           |
| Agent count             | 9 markdown files in `agents/`            |
| Workflow count          | 4 workflow.md files                      |
| manifest.yaml           | Contains `bmm-executive` in modules list |
| agent-manifest.csv      | 9 bmm-executive entries                  |
| workflow-manifest.csv   | 4 bmm-executive entries                  |
| files-manifest.csv      | 16 bmm-executive entries                 |

---

## Agent Reference

| Agent ID               | Display Name | Icon | Role                                      |
| ---------------------- | ------------ | ---- | ----------------------------------------- |
| analyst-strategist     | Mary         | 📊   | Chief Analyst + Strategic Intelligence    |
| apex                   | Apex         | ⚡   | Peak Performance Full-Stack Engineer      |
| financial-strategist   | Walt         | 💰   | Financial Strategist + Resource Allocator |
| fulfillization-manager | Finn         | 🎯   | Delivery + Experience + Operations        |
| operations-commander   | Axel         | ⚙️   | Operations Commander + Process Optimizer  |
| security-guardian      | Cerberus     | 🛡️   | Security Architect + Risk Guardian        |
| strategist-marketer    | Sage         | 📊   | Product Strategist + Market Intelligence  |
| technologist-architect | Theo         | 🔧   | Technical Architect + Implementation      |
| zen                    | Zen          | 🧘   | Clean Architecture Full-Stack Engineer    |

---

## Notes

1. **No code changes required** - This is purely a file copy and manifest update operation
2. **No build step** - BMAD modules are runtime-loaded markdown files
3. **Backward compatible** - Adding a module doesn't affect existing functionality
4. **IDE config unchanged** - The `claude-code.yaml` and `codex.yaml` IDE configs don't need module-specific updates
