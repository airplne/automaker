# PRP: Claude Team Review - Apex & Zen Agent Implementation

**Status:** PENDING REVIEW
**Created:** 2025-12-29
**Assigned To:** Claude Team
**Reporter:** Codex Team
**Commit:** d516f18
**Priority:** High

---

## Executive Summary

The Codex team has executed `docs/prp-bmad-apex-zen-developers.md` and reports successful implementation of the Apex and Zen full-stack developer agents. This PRP documents the verification checklist for the Claude team to review all changes, confirm correctness, and sign off on the implementation.

**Key Claims:**

- Executive Suite expanded from 7 → 9 agents
- Builds and tests pass
- `/api/bmad/personas` returns 10 personas (9 exec + party-synthesis)
- Party Mode UI supports 9 agents

---

## Changes Reported by Codex Team

### Files Created (4 new files)

| File                                                         | Description           |
| ------------------------------------------------------------ | --------------------- |
| `_bmad/bmm-executive/agents/apex.md`                         | Apex agent definition |
| `_bmad/bmm-executive/agents/zen.md`                          | Zen agent definition  |
| `libs/bmad-bundle/bundle/_bmad/bmm-executive/agents/apex.md` | Bundle copy of Apex   |
| `libs/bmad-bundle/bundle/_bmad/bmm-executive/agents/zen.md`  | Bundle copy of Zen    |

### Files Modified (7+ files)

| File                                                                        | Changes                                      |
| --------------------------------------------------------------------------- | -------------------------------------------- |
| `_bmad/_config/agent-manifest.csv`                                          | Added 2 rows for Apex/Zen                    |
| `_bmad/_config/files-manifest.csv`                                          | Added file entries + hashes                  |
| `_bmad/bmm-executive/config.yaml`                                           | Updated agent count/config                   |
| `_bmad/bmm-executive/_module-installer/module.yaml`                         | Updated module metadata + commands           |
| `_bmad/bmm-executive/teams/default-party.csv`                               | Added Apex/Zen to default party              |
| `libs/bmad-bundle/bundle/_bmad/_config/agent-manifest.csv`                  | Bundle sync                                  |
| `libs/bmad-bundle/bundle/_bmad/_config/files-manifest.csv`                  | Bundle sync                                  |
| `libs/bmad-bundle/bundle/_bmad/bmm-executive/_module-installer/module.yaml` | Bundle sync                                  |
| `libs/bmad-bundle/bundle/_bmad/bmm-executive/teams/default-party.csv`       | Bundle sync                                  |
| `apps/server/src/services/bmad-persona-service.ts`                          | Support for 9 agents                         |
| `apps/server/tests/unit/services/bmad-persona-service.test.ts`              | Updated tests for 9 agents                   |
| `apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx`    | UI limit 7→9                                 |
| `apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx`   | Executive agent picker includes Apex/Zen     |
| `apps/ui/src/components/views/profiles-view/components/profile-form.tsx`    | Default agent picker includes Apex/Zen       |
| `apps/ui/src/store/app-store.ts`                                            | Built-in profiles for Apex/Zen               |
| `DOCUMENTATION.md`                                                          | Updated stats                                |
| `docs/prp-*.md`                                                             | Updated verification PRPs to 9-agent reality |

### Commit

- **SHA:** `d516f18`
- **Message:** (to be verified)

---

## Review Checklist

### R1: Agent File Quality Review

#### R1.1: Apex Agent (`_bmad/bmm-executive/agents/apex.md`)

```bash
cat _bmad/bmm-executive/agents/apex.md
```

**Review Criteria:**

- [ ] **R1.1.1** - Follows BMAD XML structure (`<agent>`, `<activation>`, `<persona>`, `<menu>`)
- [ ] **R1.1.2** - Has correct `<agent>` attributes: `name="Apex"`, `icon="⚡"` (note: `id` uses the `*.agent.yaml` convention)
- [ ] **R1.1.3** - Title: "Peak Performance Full-Stack Engineer"
- [ ] **R1.1.4** - Identity reflects "battle-hardened engineer", "startup CTO" background
- [ ] **R1.1.5** - Communication style: "Direct, urgent, action-oriented"
- [ ] **R1.1.6** - Principles include "Ship fast, iterate faster" philosophy
- [ ] **R1.1.7** - Technical domains cover Frontend, Backend, DevOps, Performance, Integration
- [ ] **R1.1.8** - Menu includes standard items `[MH]`, `[CH]`, `[PM]`, `[DA]` + domain items `[PO]`, `[RA]`, `[CI]`, `[FE]`, `[BE]`, `[DB]`, `[LD]`
- [ ] **R1.1.9** - References project-context.md in principles

#### R1.2: Zen Agent (`_bmad/bmm-executive/agents/zen.md`)

```bash
cat _bmad/bmm-executive/agents/zen.md
```

**Review Criteria:**

- [ ] **R1.2.1** - Follows BMAD XML structure
- [ ] **R1.2.2** - Has correct `<agent>` attributes: `name="Zen"`, `icon="🧘"` (note: `id` uses the `*.agent.yaml` convention)
- [ ] **R1.2.3** - Title: "Clean Architecture Full-Stack Engineer"
- [ ] **R1.2.4** - Identity reflects "master craftsman", "20+ years experience"
- [ ] **R1.2.5** - Communication style: "Measured, thoughtful, patient"
- [ ] **R1.2.6** - Principles include "Clean code is not a luxury" philosophy
- [ ] **R1.2.7** - Technical domains cover Frontend, Backend, DevOps, Performance, Integration
- [ ] **R1.2.8** - Menu includes standard items `[MH]`, `[CH]`, `[PM]`, `[DA]` + domain items `[CA]`, `[CR]`, `[RF]`, `[TS]`, `[DD]`, `[AP]`, `[DC]`
- [ ] **R1.2.9** - References project-context.md in principles

#### R1.3: Agent Contrast Review

- [ ] **R1.3.1** - Apex and Zen have distinctly different communication styles
- [ ] **R1.3.2** - Philosophies are complementary (speed vs quality)
- [ ] **R1.3.3** - Non-standard menu codes are distinct (standard `[MH]`, `[CH]`, `[PM]`, `[DA]` are intentionally shared)
- [ ] **R1.3.4** - Both provide full-stack coverage without redundancy with existing agents

---

### R2: Manifest & Config Review

#### R2.1: Agent Manifest

```bash
grep -E "apex|zen" _bmad/_config/agent-manifest.csv
```

**Review Criteria:**

- [ ] **R2.1.1** - Both agents present in manifest
- [ ] **R2.1.2** - Module is `bmm-executive` for both
- [ ] **R2.1.3** - Paths are correct: `_bmad/bmm-executive/agents/apex.md`, `_bmad/bmm-executive/agents/zen.md`
- [ ] **R2.1.4** - Icons are correct: `⚡` for Apex, `🧘` for Zen
- [ ] **R2.1.5** - CSV format is valid (proper quoting, escaping)

#### R2.2: Files Manifest

```bash
grep -E "apex|zen" _bmad/_config/files-manifest.csv
```

- [ ] **R2.2.1** - Both agent files have entries
- [ ] **R2.2.2** - SHA-256 hashes are present and valid

#### R2.3: Module Config

```bash
cat _bmad/bmm-executive/config.yaml
```

- [ ] **R2.3.1** - Agent count reflects 9 agents (if applicable)
- [ ] **R2.3.2** - No syntax errors

---

### R3: Bundle Sync Review

```bash
# Verify bundle matches source
diff -rq _bmad/bmm-executive/agents/ libs/bmad-bundle/bundle/_bmad/bmm-executive/agents/ --exclude=".DS_Store"

# Verify bundle manifests
diff _bmad/_config/agent-manifest.csv libs/bmad-bundle/bundle/_bmad/_config/agent-manifest.csv
```

- [ ] **R3.1** - No differences in agent files between source and bundle
- [ ] **R3.2** - Bundle agent-manifest.csv matches source
- [ ] **R3.3** - Bundle files-manifest.csv matches source

---

### R4: Server Code Review

#### R4.1: BMAD Persona Service

```bash
rg -n "apex|zen" apps/server/src/services/bmad-persona-service.ts
```

**Review Criteria:**

- [ ] **R4.1.1** - Service correctly loads Apex and Zen from manifest
- [ ] **R4.1.2** - `PUBLIC_PERSONA_IDS` includes `bmad:apex` and `bmad:zen`
- [ ] **R4.1.3** - `resolveAgentCollab` handles 9 agents correctly

---

### R5: UI Code Review

#### R5.1: Add Feature Dialog

```bash
rg -n "apex|zen|allExecutiveAgentIds" apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx
```

**Review Criteria:**

- [ ] **R5.1.1** - `allExecutiveAgentIds` contains 9 IDs (including `bmad:apex`, `bmad:zen`)
- [ ] **R5.1.2** - Agent limit is 9 (implemented via `maxExecutiveAgents = allExecutiveAgentIds.length`)
- [ ] **R5.1.3** - `setSelectedAgentIds` in useEffect includes all 9 agents
- [ ] **R5.1.4** - UI copy says "9" not "7" (e.g., "All 9 executive agents collaborate")
- [ ] **R5.1.5** - Counter shows "X/9 selected"
- [ ] **R5.1.6** - Description lists all 9 names: "Sage, Theo, Finn, Cerberus, Mary, Walt, Axel, Apex, Zen"

#### R5.3: Additional UI Pickers

```bash
rg -n "bmad:apex|bmad:zen" apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx
rg -n "bmad:apex|bmad:zen" apps/ui/src/components/views/profiles-view/components/profile-form.tsx
```

- [ ] **R5.3.1** - Edit Feature dialog executive picker includes Apex/Zen
- [ ] **R5.3.2** - Profile form default agent picker includes Apex/Zen

#### R5.2: App Store (Profiles)

```bash
rg -n "apex|zen" apps/ui/src/store/app-store.ts
```

- [ ] **R5.2.1** - Built-in profiles exist for Apex
- [ ] **R5.2.2** - Built-in profiles exist for Zen
- [ ] **R5.2.3** - Profiles have correct icons and descriptions

---

### R6: API Verification

```bash
# Start server
npm run start --workspace=apps/server

# Verify personas endpoint
curl -s http://localhost:3008/api/bmad/personas | node -e "
const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
console.log('Total personas:', d.personas.length);
console.log('');
console.log('Executive agents:');
d.personas.filter(p => p.module === 'bmm-executive').forEach(p => console.log('-', p.id, p.icon, p.label));
console.log('');
console.log('Apex present:', d.personas.some(p => p.id === 'bmad:apex'));
console.log('Zen present:', d.personas.some(p => p.id === 'bmad:zen'));
"
```

- [ ] **R6.1** - `/api/bmad/personas` returns 10 personas total
- [ ] **R6.2** - `bmad:apex` is present with icon ⚡
- [ ] **R6.3** - `bmad:zen` is present with icon 🧘
- [ ] **R6.4** - Both have `module: bmm-executive`
- [ ] **R6.5** - All 9 executive agents are present

---

### R7: Build & Test Verification

```bash
# Clean build
npm run build

# Package tests
npm run test:packages

# Server tests
npm run test:run --workspace=apps/server

# Server build (TypeScript)
npm run build --workspace=apps/server
```

- [ ] **R7.1** - `npm run build` passes (exit code 0)
- [ ] **R7.2** - `npm run test:packages` passes (all tests green)
- [ ] **R7.3** - `npm run test:run --workspace=apps/server` passes
- [ ] **R7.4** - `npm run build --workspace=apps/server` passes (no TS errors)

---

### R8: Documentation Review

#### R8.1: DOCUMENTATION.md

```bash
grep -E "agent|Executive|Apex|Zen" DOCUMENTATION.md | head -20
git rev-list --count upstream/main..HEAD
git diff --shortstat upstream/main...HEAD
```

- [ ] **R8.1.1** - Agent count reflects 9 executive agents (or 28 total if that was updated)
- [ ] **R8.1.2** - Apex and Zen are mentioned if individual agents are listed
- [ ] **R8.1.3** - No stale "7 agents" references

#### R8.2: Original PRP

```bash
cat docs/prp-bmad-apex-zen-developers.md | grep -E "^\- \[" | head -30
```

- [ ] **R8.2.1** - Implementation checklist items can be marked complete

---

### R9: Git Commit Review

```bash
git show d516f18 --stat
git log -1 --format="%H %s" d516f18
```

- [ ] **R9.1** - Commit message is descriptive
- [ ] **R9.2** - All expected files are in the commit
- [ ] **R9.3** - No unexpected files included
- [ ] **R9.4** - Commit is on correct branch

---

## Acceptance Criteria Summary

| Category          | Total Items | Reviewed | Issues | Blocked |
| ----------------- | ----------- | -------- | ------ | ------- |
| R1: Agent Files   | 18          | 0        | 0      | 0       |
| R2: Manifests     | 8           | 0        | 0      | 0       |
| R3: Bundle Sync   | 3           | 0        | 0      | 0       |
| R4: Server Code   | 3           | 0        | 0      | 0       |
| R5: UI Code       | 8           | 0        | 0      | 0       |
| R6: API           | 5           | 0        | 0      | 0       |
| R7: Build/Test    | 4           | 0        | 0      | 0       |
| R8: Documentation | 3           | 0        | 0      | 0       |
| R9: Git Commit    | 4           | 0        | 0      | 0       |
| **TOTAL**         | **56**      | **0**    | **0**  | **0**   |

---

## Known Considerations

| #   | Item                   | Notes                                                                                                                                  |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | CLI command stubs      | `.claude/` is gitignored in this repo; any local stubs are not part of commit `d516f18` and should not be expected in a fresh checkout |
| 2   | default-party.csv      | PRP mentioned updating `_bmad/bmm-executive/teams/default-party.csv` - verify if updated                                               |
| 3   | Existing agent overlap | Verify Apex/Zen don't conflict with Amelia (Dev) or Barry (Quick Flow)                                                                 |

---

## Sign-Off

| Role              | Name       | Date       | Signature |
| ----------------- | ---------- | ---------- | --------- |
| Claude Reviewer   |            |            |           |
| Codex Implementer | Codex Team | 2025-12-29 | ✅        |
| Final Approval    |            |            |           |

---

## Final Verdict

- [ ] **APPROVED** - All review items pass, implementation is correct
- [ ] **APPROVED WITH NOTES** - Minor issues noted but acceptable
- [ ] **NEEDS REVISION** - Issues found that require changes
- [ ] **REJECTED** - Critical issues, implementation needs rework

### Review Notes

_(To be filled by Claude team after review)_

---

## Quick Review Commands

Run these commands to quickly verify the implementation:

```bash
# 1. Check agent files exist
ls -la _bmad/bmm-executive/agents/{apex,zen}.md

# 2. Check manifest entries
grep -E "apex|zen" _bmad/_config/agent-manifest.csv

# 3. Check bundle sync
diff -rq _bmad/bmm-executive/agents/ libs/bmad-bundle/bundle/_bmad/bmm-executive/agents/

# 4. Check UI code
grep -c "bmad:apex\|bmad:zen" apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx

# 5. Run tests
npm run build && npm run test:packages && npm run test:run --workspace=apps/server

# 6. Verify API (requires server running)
npm run start --workspace=apps/server &
sleep 5
curl -s http://localhost:3008/api/bmad/personas | grep -E "apex|zen"
```

---

_PRP Generated by BMAD Party Mode - Claude Team Review Request_
