# PRP: BMM-TRIAD Module Registration & Completion

> Execute this PRP to bring bmm-triad from "implemented" to "complete" status

**Created:** 2025-12-27
**Priority:** HIGH
**Spec Reference:** `docs/bmm-triad-module-spec.md`
**Audit Source:** Codex Team ULTRATHINK Analysis

---

## Executive Summary

The bmm-triad module has been implemented on disk with correct agent content, workflows, and structure. However, it is NOT "complete" per spec because **registration and invokability requirements are missing**.

This PRP provides exact instructions to complete the registration.

---

## Current State (Codex Audit Results)

### PASSING

- [x] Module directory exists: `_bmad/bmm-triad/`
- [x] All 3 agent files exist with correct personas (Theo, Sage, Finn)
- [x] All 4 workflow files exist with correct structure
- [x] Agent icons match spec (🔧, 📊, 🎯)
- [x] Menu items match spec tables
- [x] project-context.md handling implemented
- [x] Handoff checklists exist in workflows
- [x] Orchestrator pattern implemented in triad-full-cycle
- [x] Party mode roster exists (`teams/default-party.csv`)
- [x] Migration guide exists with required sections

### FAILING (Action Required)

- [ ] Agents NOT in `_bmad/_config/agent-manifest.csv`
- [ ] Slash commands NOT registered (no `.claude/commands/bmad/bmm-triad/`)
- [ ] No entries in `_bmad/_config/files-manifest.csv`
- [ ] Module NOT in `_bmad/_config/manifest.yaml` modules list
- [ ] Tasks folder ambiguity (exists but empty)

---

## Task 1: Register Agents in Agent Manifest

**File:** `_bmad/_config/agent-manifest.csv`

**Action:** Append these 3 rows to the CSV (preserve existing entries):

```csv
"technologist-architect","Theo","Technical Architect + Implementation Specialist","🔧","Senior technical authority combining architecture, implementation, testing, and rapid development expertise. Balances 'boring technology' pragmatism with quality-first execution.","Synthesized expertise from Winston (architect), Amelia (dev), Murat (test architect), and Barry (quick-flow). Context-aware: asks when speed vs quality tradeoff is unclear.","Calm, precise, implementation-focused. References file paths and specific technical decisions. 'Strong opinions, weakly held.' Balances speed with quality based on context.","- Champions boring technology that works - Context-aware: rapid for spikes, rigorous for production - Honors project-context.md as authoritative - Red-green-refactor TDD approach - Quality gates backed by data","bmm-triad","_bmad/bmm-triad/agents/technologist-architect.md"
"strategist-marketer","Sage","Product Strategist + Market Intelligence Expert","📊","Investigative strategist combining product management, market analysis, innovation strategy, and narrative expertise. Asks 'WHY?' relentlessly and grounds decisions in evidence.","Synthesized expertise from John (PM), Mary (analyst), Victor (innovation strategist), and Sophia (storyteller). Ruthless prioritization meets compelling narrative.","Direct and data-sharp, cuts through fluff. Weaves strategic narrative with hard evidence. Asks probing questions that spark insight. Balances analytical rigor with storytelling flair.","- Uncover the deeper WHY behind every requirement - Ground findings in verifiable evidence - Ruthless prioritization for MVP goals - Craft narratives that sell the vision - Honors project-context.md as authoritative","bmm-triad","_bmad/bmm-triad/agents/strategist-marketer.md"
"fulfillization-manager","Finn","Delivery + Experience + Operations Specialist","🎯","The 'last mile' agent bridging built to used. Combines delivery execution, UX design, documentation, facilitation, and visual communication. Ensures promises become delightful reality.","Synthesized expertise from Bob (SM), Sally (UX), Paige (tech writer), Carson (brainstorming coach), and Caravaggio (presentation master). Owns the full experience across users, developers, and stakeholders.","Crisp and checklist-driven for process. Empathetic and user-focused for experience. Patient educator for documentation. Energetic facilitator for brainstorming. Adapts tone to context.","- Stories are single source of truth - Every decision serves genuine user needs - Documentation is teaching - Psychological safety unlocks breakthroughs - Honors project-context.md as authoritative","bmm-triad","_bmad/bmm-triad/agents/fulfillization-manager.md"
```

**Verification:** After adding, the manifest should have 3 new entries with `module` = `bmm-triad`.

---

## Task 2: Create Slash Command Files

**Directory Structure to Create:**

```
.claude/commands/bmad/bmm-triad/
├── agents/
│   ├── technologist-architect.md
│   ├── strategist-marketer.md
│   └── fulfillization-manager.md
└── workflows/
    ├── triad-discovery.md
    ├── triad-build.md
    ├── triad-ship.md
    └── triad-full-cycle.md
```

### Agent Slash Commands

**File:** `.claude/commands/bmad/bmm-triad/agents/technologist-architect.md`

```markdown
---
description: technologist-architect agent (project)
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @\_bmad/bmm-triad/agents/technologist-architect.md, READ its entire contents and follow its directions exactly!
```

**File:** `.claude/commands/bmad/bmm-triad/agents/strategist-marketer.md`

```markdown
---
description: strategist-marketer agent (project)
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @\_bmad/bmm-triad/agents/strategist-marketer.md, READ its entire contents and follow its directions exactly!
```

**File:** `.claude/commands/bmad/bmm-triad/agents/fulfillization-manager.md`

```markdown
---
description: fulfillization-manager agent (project)
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @\_bmad/bmm-triad/agents/fulfillization-manager.md, READ its entire contents and follow its directions exactly!
```

### Workflow Slash Commands

**File:** `.claude/commands/bmad/bmm-triad/workflows/triad-discovery.md`

```markdown
---
description: Run the Triad Discovery workflow - Strategy to Requirements (project)
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @\_bmad/bmm-triad/workflows/triad-discovery/workflow.md, READ its entire contents and follow its directions exactly!
```

**File:** `.claude/commands/bmad/bmm-triad/workflows/triad-build.md`

```markdown
---
description: Run the Triad Build workflow - Architecture to Implementation (project)
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @\_bmad/bmm-triad/workflows/triad-build/workflow.md, READ its entire contents and follow its directions exactly!
```

**File:** `.claude/commands/bmad/bmm-triad/workflows/triad-ship.md`

```markdown
---
description: Run the Triad Ship workflow - Testing to Delivery to Docs (project)
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @\_bmad/bmm-triad/workflows/triad-ship/workflow.md, READ its entire contents and follow its directions exactly!
```

**File:** `.claude/commands/bmad/bmm-triad/workflows/triad-full-cycle.md`

```markdown
---
description: Run the Triad Full Cycle workflow - End-to-end orchestration (project)
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @\_bmad/bmm-triad/workflows/triad-full-cycle/workflow.md, READ its entire contents and follow its directions exactly!
```

---

## Task 3: Update Module Manifest

**File:** `_bmad/_config/manifest.yaml`

**Action:** Add `bmm-triad` to the `modules` list.

**Before (example):**

```yaml
modules:
  - core
  - bmb
  - bmm
  - cis
```

**After:**

```yaml
modules:
  - core
  - bmb
  - bmm
  - cis
  - bmm-triad
```

---

## Task 4: Register in Files Manifest

**File:** `_bmad/_config/files-manifest.csv`

**Action:** If this file exists and tracks module files, add entries for bmm-triad module files.

**Entries to Add (if applicable):**

```csv
"bmm-triad","agent","_bmad/bmm-triad/agents/technologist-architect.md","Theo - Technical Architect"
"bmm-triad","agent","_bmad/bmm-triad/agents/strategist-marketer.md","Sage - Product Strategist"
"bmm-triad","agent","_bmad/bmm-triad/agents/fulfillization-manager.md","Finn - Delivery Specialist"
"bmm-triad","workflow","_bmad/bmm-triad/workflows/triad-discovery/workflow.md","Discovery workflow"
"bmm-triad","workflow","_bmad/bmm-triad/workflows/triad-build/workflow.md","Build workflow"
"bmm-triad","workflow","_bmad/bmm-triad/workflows/triad-ship/workflow.md","Ship workflow"
"bmm-triad","workflow","_bmad/bmm-triad/workflows/triad-full-cycle/workflow.md","Full cycle orchestrator"
"bmm-triad","config","_bmad/bmm-triad/config.yaml","Module configuration"
"bmm-triad","data","_bmad/bmm-triad/data/migration-guide.md","Migration guide"
"bmm-triad","team","_bmad/bmm-triad/teams/default-party.csv","Party mode roster"
```

**Note:** Check existing files-manifest.csv format and match it. If file doesn't exist or isn't used, skip this task.

---

## Task 5: Resolve Tasks Folder Ambiguity

**Issue:** Spec says tasks folder is intentionally omitted (spec line 170), but also mentions cherry-picking tasks (spec line 332). Current state: `_bmad/bmm-triad/tasks/` exists but is empty.

**Resolution:** Delete the empty tasks folder to match spec intent.

**Action:**

```bash
rm -rf _bmad/bmm-triad/tasks/
```

**Rationale:** The spec explicitly states "Tasks folder intentionally omitted. Triad agents invoke BMM workflows directly where needed, keeping the module minimal." The empty folder contradicts this.

---

## Task 6: Create Codex Prompts (If Applicable)

**Check:** Does `.codex/prompts/` exist for other modules?

If yes, create corresponding entries for bmm-triad:

**Directory:** `.codex/prompts/bmad/bmm-triad/`

Mirror the structure created in Task 2 for `.claude/commands/` but adapted for Codex format.

If `.codex/prompts/` doesn't exist or isn't used, skip this task.

---

## Verification Checklist

After executing all tasks, verify:

### Registration Verification

- [ ] `_bmad/_config/agent-manifest.csv` contains 3 bmm-triad entries
- [ ] `_bmad/_config/manifest.yaml` includes `bmm-triad` in modules list
- [ ] `.claude/commands/bmad/bmm-triad/` directory exists with 7 files

### Invokability Verification

- [ ] `/bmad:bmm-triad:agents:technologist-architect` is recognized as valid command
- [ ] `/bmad:bmm-triad:agents:strategist-marketer` is recognized as valid command
- [ ] `/bmad:bmm-triad:agents:fulfillization-manager` is recognized as valid command
- [ ] `/bmad:bmm-triad:workflows:triad-discovery` is recognized as valid command
- [ ] `/bmad:bmm-triad:workflows:triad-build` is recognized as valid command
- [ ] `/bmad:bmm-triad:workflows:triad-ship` is recognized as valid command
- [ ] `/bmad:bmm-triad:workflows:triad-full-cycle` is recognized as valid command

### Cleanup Verification

- [ ] `_bmad/bmm-triad/tasks/` directory does NOT exist (removed)

### Functional Test

- [ ] Invoke one agent (e.g., `/bmad:bmm-triad:agents:strategist-marketer`) and verify it loads correctly
- [ ] Verify agent displays correct persona name (Sage) and menu

---

## Execution Order

1. **Task 1** - Register agents in agent-manifest.csv
2. **Task 2** - Create slash command files (all 7 files)
3. **Task 3** - Update manifest.yaml modules list
4. **Task 4** - Register in files-manifest.csv (if applicable)
5. **Task 5** - Remove empty tasks folder
6. **Task 6** - Create Codex prompts (if applicable)
7. **Verification** - Run all verification checks

---

## Success Criteria

When complete, the bmm-triad module will be:

- **Registered** in all required manifests
- **Invokable** via slash commands
- **Consistent** with spec (no empty tasks folder)
- **Functional** when tested

This brings the module from "implemented" to "complete" status per `docs/bmm-triad-module-spec.md`.
