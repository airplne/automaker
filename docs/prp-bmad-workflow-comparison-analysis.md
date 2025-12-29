# PRP: BMAD Workflow vs Original AutoMaker Workflow - Comparative Analysis

**Status:** Completed (Executed)
**Created:** 2025-12-28
**Executed:** 2025-12-28
**Team:** Codex Team (investigation and analysis)
**Priority:** P1 - Strategic

---

## Context

A task was just completed using BMAD agent "Finn" (bmad:fulfillization-manager):

- **Task:** "Create GitHub pull request template"
- **Agent:** Finn (🎯 Fulfillization Manager)
- **Model:** `opus`
- **Duration:** ~1.8 minutes
- **Result:** Created comprehensive PR template with 10+ sections

**Question:** How does BMAD agent execution differ from AutoMaker's original (non-BMAD) workflow? What value does the persona actually add?

---

## Investigation Objectives

1. **Identify behavioral differences** between BMAD-driven vs vanilla AutoMaker execution
2. **Quantify the impact** of persona injection on agent behavior
3. **Determine if BMAD adds value** or just overhead
4. **Analyze tool usage patterns** with vs without persona context
5. **Assess quality differences** in output

---

## Test Case: GitHub PR Template Creation

### Test Setup

**Same Task, Two Approaches:**

| Approach                | Configuration                                      |
| ----------------------- | -------------------------------------------------- |
| **A: BMAD (Completed)** | Agent: Finn, Model: `opus`, Persona context loaded |
| **B: Vanilla (Test)**   | No agent, Model: `opus`, No persona context        |

### Baseline Data from Completed BMAD Run

**Feature:** `feature-1766963944563-3qfg8wi4r`
**Agent Output:** `/home/aip0rt/.config/Automaker/.automaker/features/feature-1766963944563-3qfg8wi4r/agent-output.md`

**Metrics Captured:**

- Tool calls: 13 total (Bash 7, Glob 3, Read 2, Write 1)
- Discovery actions: 8 (pwd, ls, glob patterns, read bmad context, git log, check `.github`)
- Execution actions: 2 (`mkdir`, `Write`)
- Verification actions: 3 (`ls` verify, `Read` verify, `git status`)
- Context loaded (tool): `bmad.md`
- Output size: 2,170 bytes
- Template headings: 13 (incl. subheadings)

**Important caveat:** This baseline run wrote the template to `/home/aip0rt/.config/Automaker/.github/pull_request_template.md` (not a project repo path), so a controlled same-repo run was executed below.

### Controlled Runs (Same `projectPath`)

**Project:** `/home/aip0rt/Desktop/CatalogBridge/cb-mono/Test`

| Run         | Feature ID                        | Agent Output                                                                                                          | Output Template                                  | Notes                                           |
| ----------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------- |
| Vanilla     | `feature-1766965508225-4v08l9o45` | `/home/aip0rt/Desktop/CatalogBridge/cb-mono/Test/.automaker/features/feature-1766965508225-4v08l9o45/agent-output.md` | `.github/PULL_REQUEST_TEMPLATE.md` (1,468 bytes) | Reads `.automaker/app_spec.txt`                 |
| BMAD (Finn) | `feature-1766965751479-g3kb36whx` | `/home/aip0rt/Desktop/CatalogBridge/cb-mono/Test/.automaker/features/feature-1766965751479-g3kb36whx/agent-output.md` | `.github/PULL_REQUEST_TEMPLATE.md` (1,941 bytes) | Adds `git log` + post-write `Read` verification |

---

## Phase 1: Extract BMAD Run Characteristics

### 1.1 Analyze Agent Output

**File:** `/home/aip0rt/.config/Automaker/.automaker/features/feature-1766963944563-3qfg8wi4r/agent-output.md`

**Extract:**

```bash
# Count tool calls
rg "🔧 Tool:" /home/aip0rt/.config/Automaker/.automaker/features/feature-1766963944563-3qfg8wi4r/agent-output.md | wc -l

# List tool types and sequence
rg "🔧 Tool: (Bash|Read|Write|Glob|Edit)" /home/aip0rt/.config/Automaker/.automaker/features/feature-1766963944563-3qfg8wi4r/agent-output.md -o | cat -n

# Extract reasoning/planning text
cat /home/aip0rt/.config/Automaker/.automaker/features/feature-1766963944563-3qfg8wi4r/agent-output.md
```

**Checklist:**

- [x] Total tool call count
- [x] Tool call sequence documented
- [x] Discovery vs execution ratio calculated
- [x] Context files loaded identified
- [x] Planning/reasoning text extracted

**Results (Baseline BMAD Run):**

- Tool calls: 13 total
- Tool call sequence: `Bash → Bash → Glob → Read → Glob → Bash → Glob → Bash → Bash → Write → Bash → Read → Bash`
- Discovery / execution / verification: `8 / 2 / 3` (discovery-to-execution ratio: `4:1`)
- Context loaded (tool): `/home/aip0rt/.config/Automaker/.automaker/context/bmad.md`
- Output created: `/home/aip0rt/.config/Automaker/.github/pull_request_template.md` (2,170 bytes)

### 1.2 Analyze BMAD Persona Prompt

**Extract what context Finn received:**

```bash
# Find Finn's persona definition
cat _bmad/bmm-executive/agents/fulfillization-manager.md | head -150

# Check what's in the bundled version
cat libs/bmad-bundle/bundle/_bmad/bmm-executive/agents/fulfillization-manager.md | head -150
```

**Checklist:**

- [x] Finn's identity/principles documented
- [x] Communication style noted
- [x] Menu items/capabilities listed
- [x] Estimated persona prompt size

**Results (Finn Persona Prompt):**

- Source: `_bmad/bmm-executive/agents/fulfillization-manager.md` (bundled copy identical)
- Size: 10,725 bytes, 1,256 words (~1.6k–2.0k tokens rough estimate)
- Persona highlights: checklist-driven delivery focus, UX sensitivity, and “verify the work” bias (reads back outputs, encourages QA)
- Menu: includes workflows + `[PM] Start Party Mode`, but AutoMaker “auto-mode” runs did not display the menu (persona acts as injected guidance, not an interactive menu loop)

---

## Phase 2: Execute Vanilla (Non-BMAD) Test Run

### 2.1 Create Identical Task Without BMAD

**Setup:**

```bash
# Via AutoMaker API
curl -X POST http://localhost:3008/api/features/create \
  -H "Content-Type: application/json" \
  -d '{
    "projectPath": "/home/aip0rt/Desktop/CatalogBridge/cb-mono/Test",
    "feature": {
      "title": "Create GitHub PR template (Vanilla Test)",
      "description": "make github pr template",
      "category": "Test",
      "model": "opus",
      "thinkingLevel": "medium",
      "agentIds": [],
      "personaId": null,
      "skipTests": true,
      "planningMode": "skip",
      "requirePlanApproval": false
    }
  }'

# Note the feature ID, then run it
curl -X POST http://localhost:3008/api/auto-mode/run-feature \
  -H "Content-Type: application/json" \
  -d '{
    "projectPath": "/home/aip0rt/Desktop/CatalogBridge/cb-mono/Test",
    "featureId": "<FEATURE_ID>",
    "useWorktrees": false
  }'
```

### 2.2 Wait for Completion and Collect Data

**Monitor:**

```bash
# Check status
curl -s -X POST http://localhost:3008/api/auto-mode/status \
  -H "Content-Type: application/json" \
  -d '{"projectPath": "/home/aip0rt/Desktop/CatalogBridge/cb-mono/Test"}' | jq .
```

**Extract when complete:**

```bash
# Read agent output
cat /home/aip0rt/Desktop/CatalogBridge/cb-mono/Test/.automaker/features/<VANILLA_FEATURE_ID>/agent-output.md
```

**Checklist:**

- [x] Vanilla run completed successfully
- [x] Agent output captured
- [x] Tool calls counted
- [x] Output file created

**Results (Controlled Vanilla Run):**

- Feature: `feature-1766965508225-4v08l9o45`
- Tool calls: 9 total (Bash 4, Glob 3, Read 1, Write 1)
- Tool call sequence: `Glob → Glob → Bash → Glob → Bash → Read → Bash → Write → Bash`
- Context loaded (tool): `/home/aip0rt/Desktop/CatalogBridge/cb-mono/Test/.automaker/app_spec.txt`
- Output created: `/home/aip0rt/Desktop/CatalogBridge/cb-mono/Test/.github/PULL_REQUEST_TEMPLATE.md` (1,468 bytes)

---

## Phase 3: Comparative Analysis

### 3.1 Tool Usage Comparison

_Controlled same-repo comparison: `feature-1766965751479-g3kb36whx` (BMAD) vs `feature-1766965508225-4v08l9o45` (Vanilla)._

| Metric                       | BMAD (Finn) | Vanilla                   | Delta   |
| ---------------------------- | ----------- | ------------------------- | ------- |
| Total tool calls             | 11          | 9                         | +2      |
| Bash calls                   | 5           | 4                         | +1      |
| Read calls                   | 1           | 1                         | 0       |
| Write calls                  | 1           | 1                         | 0       |
| Glob calls                   | 4           | 3                         | +1      |
| Context files loaded (tool)  | (none)      | `.automaker/app_spec.txt` | -1 file |
| Discovery-to-execution ratio | 3.5:1       | 3:1                       | +0.5    |

### 3.2 Output Quality Comparison

**Template Sections:**

| Section               | BMAD (Finn)    | Vanilla          | Notes                                           |
| --------------------- | -------------- | ---------------- | ----------------------------------------------- |
| Summary / Description | ✅ “Summary”   | ✅ “Description” | Different naming                                |
| Type of Change        | ✅ (8 options) | ✅ (7 options)   | BMAD adds config/infrastructure + “Other”       |
| Related Issues        | ✅             | ✅               | Both present                                    |
| Changes Made          | ✅             | ✅               | Both present                                    |
| Motivation / Context  | ✅             | ❌               | BMAD adds                                       |
| Testing               | ✅             | ✅               | Vanilla includes “Test Instructions” subheading |
| Screenshots           | ✅             | ✅               | Both present                                    |
| Checklist             | ✅ (8 items)   | ✅ (6 items)     | BMAD more QA items                              |
| Deployment Notes      | ✅             | ❌               | BMAD adds                                       |
| **Total headings**    | 11             | 9                | +2 headings                                     |
| **File size**         | 1,941 bytes    | 1,468 bytes      | +473 bytes                                      |

### 3.3 Behavioral Differences

**Check for:**

```bash
# Did vanilla run explore the codebase first?
rg "git log|git status|ls -la" <vanilla-agent-output.md>

# Did vanilla run load project context?
rg "bmad.md|context|project-context" <vanilla-agent-output.md>

# Did vanilla run verify its work?
rg "verify|check|confirm" <vanilla-agent-output.md>
```

**Document:**

- [x] Exploration behavior differences
- [x] Context-loading differences
- [x] Verification/QA differences
- [x] Reasoning/planning differences

**Observed Differences (Controlled):**

- Exploration: BMAD checks `git log` and probes for `package.json`; Vanilla probes `.automaker/` and reads `app_spec.txt`.
- Verification: BMAD reads the created template back (`Read`) after writing; Vanilla only `ls` verifies directory contents.
- Output structure: BMAD adds “Motivation and Context” + “Deployment Notes”; Vanilla adds “Test Instructions” but is otherwise slimmer.

### 3.4 Prompt Analysis

**Compare system prompts sent to the model:**

**BMAD Run:**

- Agent persona (Finn's identity, principles, communication style)
- Project context (bmad.md if loaded)
- Menu/capabilities context
- Estimated total context size: ?

**Vanilla Run:**

- AutoMaker base system prompt
- No persona context
- Standard tool descriptions
- Estimated total context size: ?

**Checklist:**

- [x] Calculate token difference in system prompts
- [x] Identify what context BMAD adds
- [x] Determine if context influenced behavior

**Prompt Delta (Approximate):**

- BMAD adds Finn persona text (10,725 bytes / 1,256 words ≈ ~1.6k–2.0k tokens rough estimate), plus any BMAD runtime framing.
- Vanilla adds no persona, but in this run it loaded project-specific context via `.automaker/app_spec.txt` (575 bytes / 64 words).
- Behavioral correlation: persona-aligned behaviors show up as extra QA/verification and “deployment + motivation” sections; vanilla leans toward “read app spec, then write a minimal template”.

---

## Phase 4: Value Assessment

### 4.1 Quantitative Metrics

| Metric                        | BMAD                             | Vanilla        | Winner  |
| ----------------------------- | -------------------------------- | -------------- | ------- |
| Time to completion (observed) | ~2.2 min                         | ~1.3 min       | Vanilla |
| Tool calls                    | 11                               | 9              | Vanilla |
| Discovery steps               | 7                                | 6              | Vanilla |
| Verification steps            | 2                                | 1              | BMAD    |
| Output completeness           | More sections + deployment notes | Fewer sections | BMAD    |
| File size                     | 1,941 bytes                      | 1,468 bytes    | BMAD    |

### 4.2 Qualitative Assessment

**Evaluate:**

- [x] Template comprehensiveness (BMAD vs Vanilla)
- [x] Code quality and structure
- [x] Adherence to best practices
- [x] Thoughtfulness of approach
- [x] Would a developer prefer BMAD or Vanilla output?

**Assessment (This Task):**

- BMAD output is generally more “production checklist” oriented (deployment notes, motivation/context) and includes an explicit read-back verification step.
- Vanilla output is reasonable but slimmer; it loads project context (`app_spec.txt`) before writing.
- Preference depends on team norms: if you want more “operational rigor” by default, BMAD wins; if you want speed + minimal template, Vanilla wins.

### 4.3 Cost-Benefit Analysis

**Calculate:**

```
BMAD Overhead Cost:
- Extra prompt tokens for persona: ~1.6k–2.0k tokens (rough estimate)
- Extra tool calls (controlled run): +2 calls (11 vs 9) ≈ +22%
- Extra wall time (observed): +55s (133s vs 78s) ≈ +71%

BMAD Value Delivered:
- Better output quality: Yes (more sections; more QA checkboxes)
- More thorough exploration: Slightly (git conventions vs app spec trade)
- Better verification: Yes (reads output back)
- Worth the overhead: For production-facing tasks, likely yes; for trivial tasks, maybe no
```

---

## Phase 5: Workflow Pattern Analysis

### 5.1 Decision Points

**Identify where BMAD persona influenced decisions:**

**Examples to look for:**

- Did Finn check git history to match commit style? (Vanilla might skip)
- Did Finn read project context? (Vanilla might not)
- Did Finn verify the template after creation? (Vanilla might skip QA)
- Did Finn structure the template based on "Delivery + Experience" principles?

### 5.2 Emergent Behaviors

**Document unexpected behaviors:**

- [x] Did BMAD agent do anything surprising/good that vanilla wouldn't?
- [x] Did BMAD agent waste time on unnecessary exploration?
- [x] Did BMAD agent's "personality" show through in the output?
- [x] Did BMAD agent follow its stated principles?

**Notes:**

- Good: BMAD’s read-after-write verification step is a reliable “quality floor”.
- Waste: BMAD’s `Glob "*"` + `Glob "*.md"` + `Glob "package.json"` is mildly redundant for this task.
- Personality: Shows up primarily in “comprehensive template” framing and operational sections, not in overt tone.
- Principle mismatch: Finn persona file has an interactive menu loop, but auto-mode bypasses that; this is expected given non-interactive execution mode.

---

## Phase 6: Strategic Implications

### 6.1 BMAD Value Hypothesis Testing

**Hypotheses to validate:**

| Hypothesis                   | Evidence For                                                 | Evidence Against                                                              | Verdict           |
| ---------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- | ----------------- |
| BMAD improves output quality | More sections, larger template, more QA checkboxes           | Not strictly a superset (e.g., no “Test Instructions” heading in BMAD output) | Likely Yes        |
| BMAD increases thoroughness  | Extra tool calls; includes `git log`; reads output back      | Vanilla reads `app_spec.txt` (project context), which BMAD skipped            | Slight Yes        |
| BMAD provides consistency    | Persona provides stable “QA + delivery” bias                 | Needs more runs across projects                                               | Inconclusive      |
| BMAD is worth the overhead   | Better quality floor via verification + operational sections | +22% tool calls; +71% wall time (observed)                                    | Context-dependent |

### 6.2 Recommendations

Based on findings, recommend:

**Recommendation (Current Evidence): “Keep + optimize”**

- Keep BMAD personas as an opt-in (or per-category default) where output quality and verification matter more than speed.
- Optimize persona prompts for efficiency (shorten activation boilerplate for auto-mode; keep principles and QA heuristics).
- Standardize “project context” loading in both modes (e.g., `.automaker/app_spec.txt` or `project-context.md`) so BMAD does not skip project-specific clues.

**Next Measurement to Increase Confidence:**

- Repeat the same A/B run across 3–5 different task categories (code change, test fix, config change, refactor, doc update) and compare variance.

---

## Deliverables

Upon completion, provide:

1. **Side-by-side comparison table** (BMAD vs Vanilla) ✅
2. **Tool usage analysis** ✅
3. **Output quality assessment** ✅
4. **Cost-benefit calculation** ✅
5. **Behavioral differences** ✅
6. **Strategic recommendation** ✅
7. **Sample outputs** ✅ (see Appendix)

---

## Appendix: Sample Outputs (Controlled Runs)

### Vanilla Output (`feature-1766965508225-4v08l9o45`)

```md
## Description

<!-- Provide a brief description of the changes in this PR -->

## Type of Change

<!-- Mark the relevant option with an "x" -->

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test update

## Related Issues

<!-- Link any related issues here using "Fixes #123" or "Closes #123" -->

## Changes Made

<!-- List the specific changes made in this PR -->

-

## Testing

<!-- Describe how you tested these changes -->

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

### Test Instructions

<!-- Provide steps to test the changes -->

1.

## Checklist

<!-- Ensure all items are checked before requesting review -->

- [ ] My code follows the project's coding conventions
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)

<!-- Add screenshots to help explain your changes -->

## Additional Notes

<!-- Any additional information reviewers should know -->
```

### BMAD (Finn) Output (`feature-1766965751479-g3kb36whx`)

```md
# Pull Request

## Summary

<!-- Provide a clear and concise description of what this PR does -->

## Type of Change

<!-- Mark the relevant option(s) with an 'x' -->

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Configuration/infrastructure change
- [ ] Other (please describe):

## Changes Made

<!-- List the key changes introduced in this PR -->

-
-
-

## Motivation and Context

<!-- Why is this change required? What problem does it solve? -->

## Testing Done

<!-- Describe the tests you ran to verify your changes -->

- [ ] Manual testing completed
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All existing tests pass

**Test Details:**

<!-- Describe what you tested and how -->

## Screenshots/Recordings

<!-- If applicable, add screenshots or recordings to help explain your changes -->

## Checklist

<!-- Mark items with an 'x' when completed -->

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings or errors
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Related Issues

<!-- Link to related issues, user stories, or tickets -->

Closes #
Related to #

## Additional Notes

<!-- Any additional information that reviewers should know -->

## Deployment Notes

<!-- Special instructions for deploying this change, if any -->
```

---

## Success Criteria

**Investigation is complete when we can answer:**

✅ Does BMAD agent execution behave measurably different from vanilla?
✅ If yes, what specific behaviors changed?
✅ Is the difference worth the added complexity?
✅ Should we continue investing in BMAD agent development?

---

## Timeline Estimate

| Phase     | Scope                        | Est. Time        |
| --------- | ---------------------------- | ---------------- |
| Phase 1   | Extract BMAD characteristics | 15 min           |
| Phase 2   | Execute vanilla test run     | 5 min            |
| Phase 3   | Comparative analysis         | 30 min           |
| Phase 4   | Value assessment             | 20 min           |
| Phase 5   | Pattern analysis             | 20 min           |
| Phase 6   | Strategic recommendations    | 15 min           |
| **Total** |                              | **~1.5-2 hours** |

---

## Notes

**This PRP addresses the fundamental question:** "Will we be using this method a year from now?"

The comparative analysis will provide hard data on whether BMAD personas actually improve AI agent behavior, or if they're just elaborate prompt engineering theater.

---

_Generated by BMAD Party Mode - Winston (Architect), John (PM), Theo (Technologist), Murat (TEA), Sage (Strategist)_
