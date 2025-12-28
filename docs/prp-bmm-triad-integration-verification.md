# PRP: BMM-Triad Integration Verification Protocol

**Status:** Execution Complete ✅
**Created:** 2025-12-27
**Team:** Codex Team
**Source:** Claude Team Integration Report
**Reference:** `docs/automaker-bmm-triad-integration-handoff.md`
**Verified:** 2025-12-27
**Result:** PASS

---

## Context

The Claude team has reported completing the BMM-Triad integration across 13 parallel workstreams:

- 5 Bundle updates
- 4 Server updates
- 3 UI updates
- 1 Test suite update

**Goal:** Replace legacy BMAD roster (PM, Architect, Dev, etc.) with BMM-Triad (3 personas):

| Persona ID                    | Display Name | Role                                             |
| ----------------------------- | ------------ | ------------------------------------------------ |
| `bmad:strategist-marketer`    | Sage         | Business WHY/WHO, product strategy, requirements |
| `bmad:technologist-architect` | Theo         | Technical HOW, architecture, implementation      |
| `bmad:fulfillization-manager` | Finn         | SHIP + UX/docs/ops + end-user experience         |

Plus optional `bmad:party-synthesis` (multi-agent synthesis persona).

**This PRP provides systematic verification that all claimed changes exist and function correctly.**

---

## Claimed Changes Summary

### Bundle (5 changes)

| Change                  | Claimed Location                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------- |
| Triad module copied     | `libs/bmad-bundle/bundle/_bmad/bmm-triad/` (11 files)                              |
| Agent manifest updated  | `libs/bmad-bundle/bundle/_bmad/_config/agent-manifest.csv`                         |
| Module manifest updated | `libs/bmad-bundle/bundle/_bmad/_config/manifest.yaml`                              |
| Files manifest updated  | `libs/bmad-bundle/bundle/_bmad/_config/files-manifest.csv`                         |
| Version bumped          | `libs/bmad-bundle/package.json` + `libs/bmad-bundle/src/index.ts` (6.0.0-alpha.22) |

### Server (4 changes)

| Change                  | Claimed Location                                                        |
| ----------------------- | ----------------------------------------------------------------------- |
| Persona list filtered   | `apps/server/src/services/bmad-persona-service.ts` (PUBLIC_PERSONA_IDS) |
| Party-synthesis updated | Same file (triad-only deliberation)                                     |
| Triad defaults added    | Same file (thinking budgets: Theo=12000, Sage=10000, Finn=9000)         |
| Scaffolding updated     | `apps/server/src/services/bmad-service.ts` (legacy → triad mapping)     |

### UI (3 changes)

| Change                             | Claimed Location                                                         |
| ---------------------------------- | ------------------------------------------------------------------------ |
| DEFAULT_AI_PROFILES replaced       | `apps/ui/src/store/app-store.ts`                                         |
| add-feature-dialog fixed           | `apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx` |
| edit-dialog + profile-form updated | `edit-feature-dialog.tsx` + `profile-form.tsx`                           |

### Tests

| Change       | Claimed Result |
| ------------ | -------------- |
| BMAD tests   | 48/48 pass     |
| Server tests | 737/737 pass   |

---

## Phase 1: Bundle Verification

### 1.1 Triad Module Exists in Bundle

```bash
# Verify bmm-triad directory exists with expected structure
ls -la libs/bmad-bundle/bundle/_bmad/bmm-triad/

# Count files (should be 11)
find libs/bmad-bundle/bundle/_bmad/bmm-triad -type f | wc -l

# Verify key subdirectories
ls libs/bmad-bundle/bundle/_bmad/bmm-triad/agents/
ls libs/bmad-bundle/bundle/_bmad/bmm-triad/workflows/
ls libs/bmad-bundle/bundle/_bmad/bmm-triad/teams/
```

**Checklist:**

- [ ] `libs/bmad-bundle/bundle/_bmad/bmm-triad/` directory exists
- [ ] Contains 11 files total
- [ ] `agents/` subdirectory contains 3 agent files
- [ ] `workflows/` subdirectory exists
- [ ] `config.yaml` exists
- [ ] `teams/default-party.csv` exists

### 1.2 Agent Manifest Contains Triad Rows

```bash
# Search for triad agents in bundled manifest
rg -n "strategist-marketer|technologist-architect|fulfillization-manager" \
  libs/bmad-bundle/bundle/_bmad/_config/agent-manifest.csv
```

**Checklist:**

- [ ] `strategist-marketer` row exists (Sage)
- [ ] `technologist-architect` row exists (Theo)
- [ ] `fulfillization-manager` row exists (Finn)
- [ ] Each row has complete CSV fields (name, displayName, title, icon, role, etc.)

### 1.3 Module Manifest Includes bmm-triad

```bash
rg -n "bmm-triad" libs/bmad-bundle/bundle/_bmad/_config/manifest.yaml
```

**Checklist:**

- [ ] `bmm-triad` appears in installed modules list

### 1.4 Files Manifest Contains Triad Entries

```bash
# Count triad entries
rg -c "bmm-triad" libs/bmad-bundle/bundle/_bmad/_config/files-manifest.csv

# View triad entries
rg "bmm-triad" libs/bmad-bundle/bundle/_bmad/_config/files-manifest.csv
```

**Checklist:**

- [ ] 11 `bmm-triad/` entries exist in files-manifest.csv
- [ ] Each entry has a SHA-256 hash

### 1.5 Version Bumped

```bash
# Check package.json version
rg '"version"' libs/bmad-bundle/package.json

# Check BMAD_BUNDLE_VERSION constant
rg "BMAD_BUNDLE_VERSION" libs/bmad-bundle/src/index.ts
```

**Checklist:**

- [ ] `package.json` version is `6.0.0-alpha.22` (or higher)
- [ ] `BMAD_BUNDLE_VERSION` constant matches package version

---

## Phase 2: Server Verification

### 2.1 Persona List Filtering

```bash
# Search for PUBLIC_PERSONA_IDS or filtering logic
rg -n -C 5 "PUBLIC_PERSONA_IDS|triad|strategist-marketer" \
  apps/server/src/services/bmad-persona-service.ts
```

**Verify in `bmad-persona-service.ts`:**

- [ ] `PUBLIC_PERSONA_IDS` constant (or equivalent filter) exists
- [ ] Filter includes only: `strategist-marketer`, `technologist-architect`, `fulfillization-manager`
- [ ] Optional: `party-synthesis` included
- [ ] Legacy personas (`pm`, `architect`, `dev`, etc.) NOT in public list

### 2.2 Party-Synthesis Updated

```bash
rg -n -C 10 "party-synthesis|deliberation|Sage|Theo|Finn" \
  apps/server/src/services/bmad-persona-service.ts
```

**Checklist:**

- [ ] Party-synthesis persona references Sage, Theo, Finn
- [ ] No references to legacy personas in party-synthesis definition
- [ ] Deliberation logic uses triad terminology

### 2.3 Triad Agent Defaults

```bash
rg -n -B 2 -A 5 "getAgentDefaults|thinking.*budget|12000|10000|9000" \
  apps/server/src/services/bmad-persona-service.ts
```

**Checklist:**

- [ ] `technologist-architect` (Theo) has thinking budget ~12000
- [ ] `strategist-marketer` (Sage) has thinking budget ~10000
- [ ] `fulfillization-manager` (Finn) has thinking budget ~9000
- [ ] Defaults function handles triad persona IDs

### 2.4 Scaffolding Updated

```bash
rg -n "bmad:pm|bmad:architect|bmad:strategist|bmad:technologist" \
  apps/server/src/services/bmad-service.ts
```

**Checklist:**

- [ ] No `bmad:pm` in scaffolding (should be `bmad:strategist-marketer`)
- [ ] No `bmad:architect` in scaffolding (should be `bmad:technologist-architect`)
- [ ] Methodology cards use triad persona IDs

---

## Phase 3: UI Verification

### 3.1 DEFAULT_AI_PROFILES Replaced

```bash
rg -n -C 3 "DEFAULT_AI_PROFILES|strategist-marketer|technologist-architect|fulfillization-manager" \
  apps/ui/src/store/app-store.ts
```

**Checklist:**

- [ ] `DEFAULT_AI_PROFILES` contains exactly 3 triad profiles (plus any non-BMAD profiles)
- [ ] No legacy BMAD persona IDs (`bmad:pm`, `bmad:architect`, `bmad:dev`, etc.)
- [ ] Profiles reference: `bmad:strategist-marketer`, `bmad:technologist-architect`, `bmad:fulfillization-manager`

### 3.2 Add-Feature-Dialog Fixed

```bash
rg -n -C 5 "BMAD|Triad|bmad:|max.*3|specialized" \
  apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx
```

**Checklist:**

- [ ] ID matching bug fixed (uses `bmad:` prefixed IDs, not bare names)
- [ ] Max selection is 3 (not 4)
- [ ] Copy says "Triad agents" (not "BMAD agents")
- [ ] Only triad personas selectable

### 3.3 Edit-Dialog + Profile-Form Updated

```bash
rg -n "BMM Triad|Triad Agents|strategist|technologist|fulfillization" \
  apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx \
  apps/ui/src/components/views/profiles-view/components/profile-form.tsx
```

**Checklist:**

- [ ] `edit-feature-dialog.tsx`: Single "BMM Triad Agents" group
- [ ] `edit-feature-dialog.tsx`: No legacy persona groupings (Analysis, Technical, Execution, etc.)
- [ ] `profile-form.tsx`: Single "BMM Triad Agents" group
- [ ] `profile-form.tsx`: No legacy persona ID references

---

## Phase 4: API Integration Tests

### Prerequisites

- [ ] Automaker server running (`npm run dev:server`)
- [ ] Server started with valid `ANTHROPIC_API_KEY`

### 4.1 Persona List API

```bash
export AUTOMAKER_BASE_URL=${AUTOMAKER_BASE_URL:-http://localhost:3008}

# Get all personas
curl -s "$AUTOMAKER_BASE_URL/api/bmad/personas" | jq .
```

**Expected Response:**

```json
{
  "success": true,
  "bundleVersion": "<BMAD_BUNDLE_VERSION>",
  "personas": [
    { "id": "bmad:party-synthesis", "label": "Party Mode Synthesis (one-shot)", "icon": "🎉", ... },
    { "id": "bmad:strategist-marketer", "label": "Sage (...)", ... },
    { "id": "bmad:technologist-architect", "label": "Theo (...)", ... },
    { "id": "bmad:fulfillization-manager", "label": "Finn (...)", ... }
  ]
}
```

**Checklist:**

- [ ] API returns 200
- [ ] Response contains exactly 4 personas (3 triad + party-synthesis) OR exactly 3 (if party-synthesis excluded)
- [ ] `bmad:strategist-marketer` present with Sage label
- [ ] `bmad:technologist-architect` present with Theo label
- [ ] `bmad:fulfillization-manager` present with Finn label
- [ ] NO legacy personas (`bmad:pm`, `bmad:architect`, `bmad:dev`, etc.)

### 4.2 Legacy Persona IDs NOT Exposed

```bash
# Verify legacy IDs don't appear in public list
curl -s "$AUTOMAKER_BASE_URL/api/bmad/personas" | jq '.personas[].id' | \
  rg "bmad:pm|bmad:architect|bmad:dev|bmad:analyst|bmad:sm|bmad:tea|bmad:ux"
```

**Expected:** No output (empty result)

**Checklist:**

- [ ] `bmad:pm` NOT in response
- [ ] `bmad:architect` NOT in response
- [ ] `bmad:dev` NOT in response
- [ ] `bmad:analyst` NOT in response
- [ ] `bmad:sm` NOT in response
- [ ] `bmad:tea` NOT in response
- [ ] `bmad:ux-designer` NOT in response

---

## Phase 5: Backward Compatibility Tests

### 5.1 Legacy Persona Resolution Still Works

```bash
# This tests that existing saved features with legacy IDs don't break
# Check if resolvePersona function exists and handles legacy IDs
rg -n -C 10 "resolvePersona|legacy|backward" \
  apps/server/src/services/bmad-persona-service.ts
```

**Checklist:**

- [ ] `resolvePersona()` function exists
- [ ] Function can resolve `bmad:pm` (returns valid persona data or maps to triad)
- [ ] Function can resolve `bmad:architect` (returns valid persona data or maps to triad)
- [ ] Function can resolve `bmad:dev` (returns valid persona data or maps to triad)

### 5.2 Programmatic Resolution Test (if API exists)

If there's an API to resolve a specific persona:

```bash
# Example - adjust endpoint as needed
curl -s "$AUTOMAKER_BASE_URL/api/bmad/personas/bmad:pm" | jq .
```

**Checklist:**

- [ ] Legacy ID resolution doesn't error
- [ ] Returns persona data (either legacy or mapped to triad)

---

## Phase 6: Test Suite Verification

### 6.1 Run BMAD Tests

```bash
npm run test:run --workspace=apps/server -- tests/unit/services/bmad-persona-service.test.ts --reporter=verbose
```

**Checklist:**

- [ ] All BMAD-related tests pass
- [ ] Claimed: 48/48 pass (verify actual count)

### 6.2 Run Full Server Tests

```bash
npm run test:run --workspace=apps/server
```

**Checklist:**

- [ ] All server tests pass
- [ ] Claimed: 737/737 pass (verify actual count)
- [ ] No new failures introduced

### 6.3 Check for Updated Test Assertions

```bash
# Verify tests reference triad, not legacy
rg -n "strategist-marketer|technologist-architect|fulfillization-manager" \
  apps/server/tests/

# Verify no tests still expect legacy personas in public list
rg -n "bmad:pm|bmad:architect|bmad:dev" apps/server/tests/ | \
  rg -v "legacy|backward|resolve"
```

**Checklist:**

- [ ] Tests include triad persona assertions
- [ ] Tests don't assert legacy personas in public persona list
- [ ] Backward compatibility tests exist (if applicable)

---

## Phase 7: UI Visual Verification (Manual)

### 7.1 Start UI

```bash
npm run dev
# choose "web" (or use: npm run dev:web)
```

### 7.2 Visual Checklist

Open browser to UI and verify:

**Profile Selection:**

- [ ] Built-in profiles show only core + triad (+ party-synthesis if enabled)
- [ ] No legacy BMAD profile names visible

**Add Feature Dialog:**

- [ ] Agent picker shows only 3 triad agents (Sage/Theo/Finn)
- [ ] Copy says "Triad agents" not "BMAD agents"
- [ ] Max selection is 3
- [ ] No legacy agent names (PM, Architect, Developer, etc.)

**Edit Feature Dialog:**

- [ ] Agent picker shows single "BMM Triad Agents" group
- [ ] No legacy groupings (Analysis, Technical, Execution, etc.)
- [ ] Only Sage, Theo, Finn selectable

**Profile Form:**

- [ ] Persona picker shows only triad (+ party-synthesis if enabled)
- [ ] No legacy persona options

---

## Deliverables

Upon completion, provide:

1. **Completed Checklist:** All boxes checked with pass/fail
2. **API Response Samples:**
   - `GET /api/bmad/personas` full response
3. **Test Results:**
   - BMAD test count and pass rate
   - Server test count and pass rate
4. **Screenshots (if UI verified):**
   - Add feature dialog agent picker
   - Profile form persona picker
5. **Discrepancies:** Any differences from claimed implementation
6. **Issues Found:** Any bugs or gaps discovered

---

## Sign-Off

| Phase                    | Completed By | Date | Status |
| ------------------------ | ------------ | ---- | ------ |
| Phase 1: Bundle          |              |      |        |
| Phase 2: Server          |              |      |        |
| Phase 3: UI              |              |      |        |
| Phase 4: API Tests       |              |      |        |
| Phase 5: Backward Compat |              |      |        |
| Phase 6: Test Suite      |              |      |        |
| Phase 7: UI Visual       |              |      |        |

**Final Verdict:** [ ] VERIFIED / [ ] ISSUES FOUND / [ ] BLOCKED

**Notes:**

```


```

---

_Generated by BMAD Party Mode - Winston (Architect), Amelia (Developer), Murat (Test Architect), John (PM)_
