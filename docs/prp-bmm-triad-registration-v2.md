# PRP: BMM-TRIAD Module Registration & Completion (v2)

> CORRECTED version addressing Codex team review feedback

**Created:** 2025-12-27
**Version:** 2.0 (fixes schema mismatches, adds hash updates, corrects command formats)
**Spec Reference:** `docs/bmm-triad-module-spec.md`
**Previous Version:** `docs/prp-bmm-triad-registration.md` (deprecated)

---

## Corrections from v1

| Issue              | v1 Problem                                                   | v2 Fix                                                                                |
| ------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Task 1             | Typo "delighthat" in CSV                                     | Fixed to "delightful"                                                                 |
| Task 2 agents      | 1-liner format, missing `name:` + `<agent-activation>` block | Full agent activation template matching `.claude/commands/bmad/bmm/agents/analyst.md` |
| Task 2 workflows   | Custom `<workflow-activation>` block                         | One-liner pattern matching `.claude/commands/bmad/bmm/workflows/research.md`          |
| Task 4 schema      | Wrong CSV schema                                             | Correct schema: `type,name,module,path,hash`                                          |
| Task 4 hash script | `$(basename $file)` ambiguous for workflow.md                | Full path output: `$file -> $hash`                                                    |
| Missing            | No hash update step                                          | Added Task 3b for hash regeneration                                                   |
| Task 6             | Nested directory structure                                   | Flat filenames: `bmad-bmm-triad-agents-*.md`                                          |
| Task 6 workflows   | Custom `<workflow-activation>` block                         | One-liner pattern matching existing Codex prompts                                     |

---

## Task 1: Register Agents in Agent Manifest

**File:** `_bmad/_config/agent-manifest.csv`

**Action:** Append these 3 rows (preserve existing entries, maintain CSV format):

```csv
"technologist-architect","Theo","Technical Architect + Implementation Specialist","🔧","Senior technical authority combining architecture, implementation, testing, and rapid development expertise. Balances 'boring technology' pragmatism with quality-first execution.","Synthesized expertise from Winston (architect), Amelia (dev), Murat (test architect), and Barry (quick-flow). Context-aware: asks when speed vs quality tradeoff is unclear.","Calm, precise, implementation-focused. References file paths and specific technical decisions. 'Strong opinions, weakly held.' Balances speed with quality based on context.","- Champions boring technology that works - Context-aware: rapid for spikes, rigorous for production - Honors project-context.md as authoritative - Red-green-refactor TDD approach - Quality gates backed by data","bmm-triad","_bmad/bmm-triad/agents/technologist-architect.md"
"strategist-marketer","Sage","Product Strategist + Market Intelligence Expert","📊","Investigative strategist combining product management, market analysis, innovation strategy, and narrative expertise. Asks 'WHY?' relentlessly and grounds decisions in evidence.","Synthesized expertise from John (PM), Mary (analyst), Victor (innovation strategist), and Sophia (storyteller). Ruthless prioritization meets compelling narrative.","Direct and data-sharp, cuts through fluff. Weaves strategic narrative with hard evidence. Asks probing questions that spark insight. Balances analytical rigor with storytelling flair.","- Uncover the deeper WHY behind every requirement - Ground findings in verifiable evidence - Ruthless prioritization for MVP goals - Craft narratives that sell the vision - Honors project-context.md as authoritative","bmm-triad","_bmad/bmm-triad/agents/strategist-marketer.md"
"fulfillization-manager","Finn","Delivery + Experience + Operations Specialist","🎯","The 'last mile' agent bridging built to used. Combines delivery execution, UX design, documentation, facilitation, and visual communication. Ensures promises become delightful reality.","Synthesized expertise from Bob (SM), Sally (UX), Paige (tech writer), Carson (brainstorming coach), and Caravaggio (presentation master). Owns the full experience across users, developers, and stakeholders.","Crisp and checklist-driven for process. Empathetic and user-focused for experience. Patient educator for documentation. Energetic facilitator for brainstorming. Adapts tone to context.","- Stories are single source of truth - Every decision serves genuine user needs - Documentation is teaching - Psychological safety unlocks breakthroughs - Honors project-context.md as authoritative","bmm-triad","_bmad/bmm-triad/agents/fulfillization-manager.md"
```

---

## Task 2: Create Slash Command Files (Claude)

**Directory Structure:**

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

### Agent Commands (use exact format from existing agents)

**File:** `.claude/commands/bmad/bmm-triad/agents/technologist-architect.md`

```markdown
---
name: 'technologist-architect'
description: 'technologist-architect agent'
---

You must fully embody this agent's persona and follow all activation instructions exactly as specified. NEVER break character until given an exit command.

<agent-activation CRITICAL="TRUE">
1. LOAD the FULL agent file from @_bmad/bmm-triad/agents/technologist-architect.md
2. READ its entire contents - this contains the complete agent persona, menu, and instructions
3. Execute ALL activation steps exactly as written in the agent file
4. Follow the agent's persona and menu system precisely
5. Stay in character throughout the session
</agent-activation>
```

**File:** `.claude/commands/bmad/bmm-triad/agents/strategist-marketer.md`

```markdown
---
name: 'strategist-marketer'
description: 'strategist-marketer agent'
---

You must fully embody this agent's persona and follow all activation instructions exactly as specified. NEVER break character until given an exit command.

<agent-activation CRITICAL="TRUE">
1. LOAD the FULL agent file from @_bmad/bmm-triad/agents/strategist-marketer.md
2. READ its entire contents - this contains the complete agent persona, menu, and instructions
3. Execute ALL activation steps exactly as written in the agent file
4. Follow the agent's persona and menu system precisely
5. Stay in character throughout the session
</agent-activation>
```

**File:** `.claude/commands/bmad/bmm-triad/agents/fulfillization-manager.md`

```markdown
---
name: 'fulfillization-manager'
description: 'fulfillization-manager agent'
---

You must fully embody this agent's persona and follow all activation instructions exactly as specified. NEVER break character until given an exit command.

<agent-activation CRITICAL="TRUE">
1. LOAD the FULL agent file from @_bmad/bmm-triad/agents/fulfillization-manager.md
2. READ its entire contents - this contains the complete agent persona, menu, and instructions
3. Execute ALL activation steps exactly as written in the agent file
4. Follow the agent's persona and menu system precisely
5. Stay in character throughout the session
</agent-activation>
```

### Workflow Commands (matches existing pattern from `.claude/commands/bmad/bmm/workflows/`)

**File:** `.claude/commands/bmad/bmm-triad/workflows/triad-discovery.md`

```markdown
---
description: 'Run the Triad Discovery workflow - Strategy to Requirements'
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @\_bmad/bmm-triad/workflows/triad-discovery/workflow.md, READ its entire contents and follow its directions exactly!
```

**File:** `.claude/commands/bmad/bmm-triad/workflows/triad-build.md`

```markdown
---
description: 'Run the Triad Build workflow - Architecture to Implementation'
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @\_bmad/bmm-triad/workflows/triad-build/workflow.md, READ its entire contents and follow its directions exactly!
```

**File:** `.claude/commands/bmad/bmm-triad/workflows/triad-ship.md`

```markdown
---
description: 'Run the Triad Ship workflow - Testing to Delivery to Docs'
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @\_bmad/bmm-triad/workflows/triad-ship/workflow.md, READ its entire contents and follow its directions exactly!
```

**File:** `.claude/commands/bmad/bmm-triad/workflows/triad-full-cycle.md`

```markdown
---
description: 'Run the Triad Full Cycle workflow - End-to-end orchestration'
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @\_bmad/bmm-triad/workflows/triad-full-cycle/workflow.md, READ its entire contents and follow its directions exactly!
```

---

## Task 3: Update Module Manifest

**File:** `_bmad/_config/manifest.yaml`

**Action:** Add `bmm-triad` to the `modules` list.

**Example after edit:**

```yaml
modules:
  - core
  - bmb
  - bmm
  - cis
  - bmm-triad
```

---

## Task 3b: Update Hashes in Files Manifest (CRITICAL)

**File:** `_bmad/_config/files-manifest.csv`

**Why:** The files-manifest tracks SHA-256 hashes for config files. After modifying `agent-manifest.csv` (Task 1) and `manifest.yaml` (Task 3), their hashes become stale.

**Action:** Regenerate hashes and update these specific rows:

### Row to update (agent-manifest.csv):

```csv
"csv","agent-manifest","_config","_config/agent-manifest.csv","<NEW_HASH>"
```

### Row to update (manifest.yaml):

```csv
"yaml","manifest","_config","_config/manifest.yaml","<NEW_HASH>"
```

### Hash Generation Command:

```bash
# Generate new hash for agent-manifest.csv
sha256sum _bmad/_config/agent-manifest.csv | awk '{print $1}'

# Generate new hash for manifest.yaml
sha256sum _bmad/_config/manifest.yaml | awk '{print $1}'
```

**Replace `<NEW_HASH>` with the actual output from these commands.**

---

## Task 4: Register Module Files in Files Manifest

**File:** `_bmad/_config/files-manifest.csv`

**Schema:** `type,name,module,path,hash`

**Action:** Append these entries (generate hashes for each file):

```csv
"md","technologist-architect","bmm-triad","bmm-triad/agents/technologist-architect.md","<HASH>"
"md","strategist-marketer","bmm-triad","bmm-triad/agents/strategist-marketer.md","<HASH>"
"md","fulfillization-manager","bmm-triad","bmm-triad/agents/fulfillization-manager.md","<HASH>"
"md","workflow","bmm-triad","bmm-triad/workflows/triad-discovery/workflow.md","<HASH>"
"md","workflow","bmm-triad","bmm-triad/workflows/triad-build/workflow.md","<HASH>"
"md","workflow","bmm-triad","bmm-triad/workflows/triad-ship/workflow.md","<HASH>"
"md","workflow","bmm-triad","bmm-triad/workflows/triad-full-cycle/workflow.md","<HASH>"
"yaml","config","bmm-triad","bmm-triad/config.yaml","<HASH>"
"md","migration-guide","bmm-triad","bmm-triad/data/migration-guide.md","<HASH>"
"csv","default-party","bmm-triad","bmm-triad/teams/default-party.csv","<HASH>"
"yaml","module","bmm-triad","bmm-triad/_module-installer/module.yaml","<HASH>"
```

### Hash Generation Script:

```bash
cd _bmad
for file in \
  bmm-triad/agents/technologist-architect.md \
  bmm-triad/agents/strategist-marketer.md \
  bmm-triad/agents/fulfillization-manager.md \
  bmm-triad/workflows/triad-discovery/workflow.md \
  bmm-triad/workflows/triad-build/workflow.md \
  bmm-triad/workflows/triad-ship/workflow.md \
  bmm-triad/workflows/triad-full-cycle/workflow.md \
  bmm-triad/config.yaml \
  bmm-triad/data/migration-guide.md \
  bmm-triad/teams/default-party.csv \
  bmm-triad/_module-installer/module.yaml
do
  hash=$(sha256sum "$file" | awk '{print $1}')
  echo "$file -> $hash"
done
```

**Example output (use full path for mapping):**

```
bmm-triad/agents/technologist-architect.md -> a1b2c3...
bmm-triad/workflows/triad-discovery/workflow.md -> d4e5f6...
bmm-triad/workflows/triad-build/workflow.md -> g7h8i9...
```

---

## Task 5: Remove Empty Tasks Folder

**Action:**

```bash
rm -rf _bmad/bmm-triad/tasks/
```

**Rationale:** Spec line 170 states "Tasks folder intentionally omitted."

---

## Task 6: Create Codex Prompts (Flat Filenames)

**Directory:** `.codex/prompts/`

**Naming Convention:** Flat files with dashes replacing path separators:

- `bmad-bmm-triad-agents-technologist-architect.md`
- `bmad-bmm-triad-agents-strategist-marketer.md`
- `bmad-bmm-triad-agents-fulfillization-manager.md`
- `bmad-bmm-triad-workflows-triad-discovery.md`
- `bmad-bmm-triad-workflows-triad-build.md`
- `bmad-bmm-triad-workflows-triad-ship.md`
- `bmad-bmm-triad-workflows-triad-full-cycle.md`

### Agent Prompts

**File:** `.codex/prompts/bmad-bmm-triad-agents-technologist-architect.md`

```markdown
---
name: 'technologist-architect'
description: 'technologist-architect agent'
---

You must fully embody this agent's persona and follow all activation instructions exactly as specified. NEVER break character until given an exit command.

<agent-activation CRITICAL="TRUE">
1. LOAD the FULL agent file from @_bmad/bmm-triad/agents/technologist-architect.md
2. READ its entire contents - this contains the complete agent persona, menu, and instructions
3. Execute ALL activation steps exactly as written in the agent file
4. Follow the agent's persona and menu system precisely
5. Stay in character throughout the session
</agent-activation>
```

**File:** `.codex/prompts/bmad-bmm-triad-agents-strategist-marketer.md`

```markdown
---
name: 'strategist-marketer'
description: 'strategist-marketer agent'
---

You must fully embody this agent's persona and follow all activation instructions exactly as specified. NEVER break character until given an exit command.

<agent-activation CRITICAL="TRUE">
1. LOAD the FULL agent file from @_bmad/bmm-triad/agents/strategist-marketer.md
2. READ its entire contents - this contains the complete agent persona, menu, and instructions
3. Execute ALL activation steps exactly as written in the agent file
4. Follow the agent's persona and menu system precisely
5. Stay in character throughout the session
</agent-activation>
```

**File:** `.codex/prompts/bmad-bmm-triad-agents-fulfillization-manager.md`

```markdown
---
name: 'fulfillization-manager'
description: 'fulfillization-manager agent'
---

You must fully embody this agent's persona and follow all activation instructions exactly as specified. NEVER break character until given an exit command.

<agent-activation CRITICAL="TRUE">
1. LOAD the FULL agent file from @_bmad/bmm-triad/agents/fulfillization-manager.md
2. READ its entire contents - this contains the complete agent persona, menu, and instructions
3. Execute ALL activation steps exactly as written in the agent file
4. Follow the agent's persona and menu system precisely
5. Stay in character throughout the session
</agent-activation>
```

### Workflow Prompts (matches existing pattern)

**File:** `.codex/prompts/bmad-bmm-triad-workflows-triad-discovery.md`

```markdown
---
description: 'Run the Triad Discovery workflow - Strategy to Requirements'
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @\_bmad/bmm-triad/workflows/triad-discovery/workflow.md, READ its entire contents and follow its directions exactly!
```

**File:** `.codex/prompts/bmad-bmm-triad-workflows-triad-build.md`

```markdown
---
description: 'Run the Triad Build workflow - Architecture to Implementation'
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @\_bmad/bmm-triad/workflows/triad-build/workflow.md, READ its entire contents and follow its directions exactly!
```

**File:** `.codex/prompts/bmad-bmm-triad-workflows-triad-ship.md`

```markdown
---
description: 'Run the Triad Ship workflow - Testing to Delivery to Docs'
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @\_bmad/bmm-triad/workflows/triad-ship/workflow.md, READ its entire contents and follow its directions exactly!
```

**File:** `.codex/prompts/bmad-bmm-triad-workflows-triad-full-cycle.md`

```markdown
---
description: 'Run the Triad Full Cycle workflow - End-to-end orchestration'
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL @\_bmad/bmm-triad/workflows/triad-full-cycle/workflow.md, READ its entire contents and follow its directions exactly!
```

---

## Execution Order

1. **Task 1** - Register agents in `agent-manifest.csv`
2. **Task 2** - Create 7 Claude slash command files
3. **Task 3** - Add `bmm-triad` to `manifest.yaml` modules list
4. **Task 3b** - Regenerate hashes for modified config files
5. **Task 4** - Register module files in `files-manifest.csv` with hashes
6. **Task 5** - Remove empty `tasks/` folder
7. **Task 6** - Create 7 Codex prompt files (flat naming)

---

## Verification Checklist

### Schema Verification

- [ ] `agent-manifest.csv` entries have 10 fields matching header
- [ ] `files-manifest.csv` entries have 5 fields: `type,name,module,path,hash`
- [ ] All hashes are valid SHA-256 (64 hex characters)

### File Structure Verification

- [ ] `.claude/commands/bmad/bmm-triad/agents/` contains 3 files
- [ ] `.claude/commands/bmad/bmm-triad/workflows/` contains 4 files
- [ ] `.codex/prompts/` contains 7 new `bmad-bmm-triad-*` files
- [ ] `_bmad/bmm-triad/tasks/` does NOT exist

### Content Verification

- [ ] All agent commands have `name:` frontmatter field
- [ ] All agent commands have `<agent-activation>` block
- [ ] All workflow commands use the one-liner `IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND...` format
- [ ] Path references in commands point to correct `@_bmad/bmm-triad/...` locations

### Hash Verification

```bash
# Verify agent-manifest.csv hash matches files-manifest entry
sha256sum _bmad/_config/agent-manifest.csv

# Verify manifest.yaml hash matches files-manifest entry
sha256sum _bmad/_config/manifest.yaml
```

### Invokability Verification

- [ ] `/bmad:bmm-triad:agents:technologist-architect` loads Theo correctly
- [ ] `/bmad:bmm-triad:agents:strategist-marketer` loads Sage correctly
- [ ] `/bmad:bmm-triad:agents:fulfillization-manager` loads Finn correctly

---

## Success Criteria

Module achieves "complete" status when:

1. All files created per this PRP
2. All schema validations pass
3. All hashes are current
4. All slash commands invoke correctly
5. No empty `tasks/` folder exists
