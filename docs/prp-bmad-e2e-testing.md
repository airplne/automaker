# PRP: BMAD Integration End-to-End Testing

## Overview

Comprehensive testing of all BMAD features implemented in this sprint. This PRP covers unit tests, API endpoint tests, integration validation, and manual UI verification.

---

## Features to Test

| Feature                   | Description                                                             |
| ------------------------- | ----------------------------------------------------------------------- |
| Multi-Agent Collaboration | Select 1-3 Triad agents (Sage/Theo/Finn), sequential collaboration mode |
| Agent Collab UI           | Prompt tab: "Add Triad Agents to Task" multi-select (max 3)             |
| BMM Triad Profiles        | Sage, Theo, Finn profiles work correctly                                |
| Party Synthesis           | One-shot triad deliberation via `bmad:party-synthesis`                  |
| BMAD Initialize           | Install BMAD bundle into project                                        |
| BMAD Status               | Check if project has BMAD installed                                     |
| BMAD Upgrade              | Upgrade BMAD with backup                                                |
| Backward Compatibility    | Old `personaId` features still work                                     |
| Profile Defaults          | Default agents on AI profiles                                           |

---

## Test Execution Plan

### Phase 1: Unit Tests (Agents 1-3)

#### Agent 1: BMAD Persona Service Tests

```bash
npm run test:run --workspace=apps/server -- tests/unit/services/bmad-persona-service.test.ts --reporter=verbose
```

**Expected:** All tests pass (current file is ~48 tests; do not hardcode if it changes)

**Verify these test suites exist and pass:**

- `getBundleVersion`
- `getBundleDir`
- `listPersonas`
- `resolvePersona`
- `loadManifestRows error handling`
- `getAgentDefaults`
- `resolveAgentCollab`

---

#### Agent 2: Full Server Test Suite

```bash
npm run test:run --workspace=apps/server 2>&1 | tail -20
```

**Expected:** 737/737 tests pass

If any fail, capture:

```bash
npm run test:run --workspace=apps/server 2>&1 | rg -n "FAIL|Error|✗" | head -50
```

---

#### Agent 3: Test Coverage Check

```bash
npm run test:cov --workspace=apps/server -- tests/unit/services/bmad-persona-service.test.ts 2>&1 | tee /tmp/bmad-coverage.txt
rg -n "bmad-persona-service\\.ts" /tmp/bmad-coverage.txt | head -20
```

**Document coverage for:**

- `bmad-persona-service.ts`
- Any other BMAD-related files

---

### Phase 2: Build & Compile (Agents 4-5)

#### Agent 4: Full Build Verification

```bash
npm run build:packages && npm run build --workspace=apps/server && npm run build --workspace=apps/ui
```

**Expected:** All builds complete with exit code 0

Capture any warnings:

```bash
npm run build:packages 2>&1 | rg -ni "warning|error" | head -20
```

---

#### Agent 5: TypeScript Verification

```bash
npx tsc --noEmit -p apps/ui/tsconfig.json 2>&1
npx tsc --noEmit -p apps/server/tsconfig.json 2>&1
npx tsc --noEmit -p libs/types/tsconfig.json 2>&1
```

**Expected:** No errors (empty output or only warnings)

---

### Phase 3: API Endpoint Testing (Agents 6-9)

Start the server first (if not running). Default API port is `3008`.

```bash
npm run dev:server &
sleep 5
```

Set a base URL (override if you changed `PORT`):

```bash
export AUTOMAKER_BASE_URL="${AUTOMAKER_BASE_URL:-http://localhost:3008}"
```

#### Agent 6: List Personas Endpoint

```bash
curl -sS "$AUTOMAKER_BASE_URL/api/bmad/personas" | jq '.personas[0:5]'
```

**Expected Response:**

- Returns `{ success, bundleVersion, personas }`
- `personas` contains only: `bmad:party-synthesis`, `bmad:strategist-marketer`, `bmad:technologist-architect`, `bmad:fulfillization-manager`
- Each persona has: `id`, `label`, `icon`, `description`

**Verify BMM Triad personas:**

```bash
curl -sS "$AUTOMAKER_BASE_URL/api/bmad/personas" | jq -r '.personas[].id' | sort
```

---

#### Agent 7: BMAD Status Endpoint (Non-BMAD Project)

Create a temp project under the repo (avoids `ALLOWED_ROOT_DIRECTORY` issues if set):

```bash
export BMAD_E2E_TMP_DIR="${BMAD_E2E_TMP_DIR:-"$(pwd)/.tmp/bmad-e2e"}"
export BMAD_E2E_PROJECT_DIR="${BMAD_E2E_PROJECT_DIR:-"$BMAD_E2E_TMP_DIR/project"}"
rm -rf "$BMAD_E2E_PROJECT_DIR"
mkdir -p "$BMAD_E2E_PROJECT_DIR"
```

```bash
curl -sS -X POST "$AUTOMAKER_BASE_URL/api/bmad/status" \
  -H "Content-Type: application/json" \
  -d "{\"projectPath\": \"$BMAD_E2E_PROJECT_DIR\"}" | jq
```

**Expected Response:**

```json
{
  "success": true,
  "status": {
    "enabled": false,
    "artifactsDir": ".automaker/bmad-output",
    "installed": false,
    "installedVersion": null,
    "bundleVersion": "<BMAD_BUNDLE_VERSION>",
    "needsUpgrade": false
  }
}
```

---

#### Agent 8: Initialize Endpoint

Test initialization on a temp project:

```bash
curl -sS -X POST "$AUTOMAKER_BASE_URL/api/bmad/initialize" \
  -H "Content-Type: application/json" \
  -d "{\"projectPath\": \"$BMAD_E2E_PROJECT_DIR\"}" | jq

# Verify files were created
ls -la "$BMAD_E2E_PROJECT_DIR/_bmad/" 2>/dev/null || echo "BMAD dir not created"
ls -la "$BMAD_E2E_PROJECT_DIR/.automaker/" 2>/dev/null || echo ".automaker dir not created"

# Verify status now shows installed + enabled
curl -sS -X POST "$AUTOMAKER_BASE_URL/api/bmad/status" \
  -H "Content-Type: application/json" \
  -d "{\"projectPath\": \"$BMAD_E2E_PROJECT_DIR\"}" | jq
```

**Expected:**

- Response indicates success
- `_bmad/` directory created with config files
- Status shows `enabled: true`, `installed: true`, and `installedVersion === bundleVersion`

---

#### Agent 9: Upgrade Endpoint

```bash
curl -sS -X POST "$AUTOMAKER_BASE_URL/api/bmad/upgrade" \
  -H "Content-Type: application/json" \
  -d "{\"projectPath\": \"$BMAD_E2E_PROJECT_DIR\"}" | jq

# Verify a backup was created
ls -la "$BMAD_E2E_PROJECT_DIR/.automaker/bmad-backups" 2>/dev/null || echo "No backups directory created"
find "$BMAD_E2E_PROJECT_DIR/.automaker/bmad-backups" -maxdepth 2 -type d -print | head -20
```

**Expected:**

- Response indicates success
- `.automaker/bmad-backups/<timestamp>/_bmad` exists

Optional cleanup:

```bash
rm -rf "$BMAD_E2E_TMP_DIR"
```

### Phase 4: Data Model Verification (Agents 10-11)

#### Agent 10: Feature Type Verification

```bash
rg -n "agentIds|personaId" libs/types/src/feature.ts
```

**Expected:**

- Line ~33: `personaId?: string;` with `@deprecated` comment
- Line ~34 (or nearby): `agentIds?: string[];`

Verify deprecation comment:

```bash
rg -n "personaId" libs/types/src/feature.ts | head -5
```

---

#### Agent 11: AIProfile Type Verification

```bash
rg -n "agentIds|personaId" libs/types/src/settings.ts
```

**Expected:**

- Both fields exist in AIProfile interface
- `personaId` deprecated, `agentIds` is new

---

### Phase 5: UI Component Verification (Agents 12-14)

#### Agent 12: Add Feature Dialog — Multi-Select

```bash
rg -n "selectedAgentIds|agentIds|Add Triad Agents|Triad Agents" apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx | head -40
```

**Expected:**

- `selectedAgentIds` state exists
- "Add Triad Agents to Task" label
- Single agent group: "Triad Agents"

Verify max 3 enforcement:

```bash
rg -n "next\\.size < 3|selectedAgentIds\\.size >= 3|/3 selected" apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx
```

---

#### Agent 13: Edit Feature Dialog — Backward Compat

```bash
grep -n "personaId\|agentIds\|selectedAgentIds" apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx | head -15
```

**Expected:**

- Handles both `personaId` (legacy) and `agentIds` (new)
- Sets `selectedAgentIds` from either source
- Only exposes the Triad IDs (no legacy personas in UI)

---

#### Agent 14: Profile Form — Default Agents

```bash
rg -n "Default BMAD Agents|BMM Triad Agents|agentIds|selectedAgentIds" apps/ui/src/components/views/profiles-view/components/profile-form.tsx | head -40
```

**Expected:**

- Agent selection UI in profile form
- Can set default agents for profiles
- Only exposes the Triad IDs (no legacy personas in UI)

---

### Phase 6: Server-Side Logic Verification (Agents 15-17)

#### Agent 15: resolveAgentCollab Method

```bash
grep -n "async resolveAgentCollab" apps/server/src/services/bmad-persona-service.ts
grep -n "buildCollaborativePrompt" apps/server/src/services/bmad-persona-service.ts
```

**Expected:**

- `resolveAgentCollab()` method exists
- `buildCollaborativePrompt()` private method exists

Verify collaboration prompt structure:

```bash
grep -A 30 "buildCollaborativePrompt" apps/server/src/services/bmad-persona-service.ts | head -40
```

**Expected content in prompt:**

- "Multi-Agent Collaboration Mode"
- "Agent Team"
- "Collaboration Protocol"
- "Agent Contexts"

---

#### Agent 16: Auto Mode Service — Backward Compat

```bash
grep -n "effectiveAgentIds\|agentIds\|personaId" apps/server/src/services/auto-mode-service.ts | head -20
```

**Expected:**

- `effectiveAgentIds` variable with backward compat logic
- Converts `personaId` to `[personaId]` array when needed
- Calls `resolveAgentCollab()` for multiple agents

---

#### Agent 17: BMM Triad Profile Defaults

```bash
grep -n "technologist-architect\|strategist-marketer\|fulfillization-manager" apps/server/src/services/bmad-persona-service.ts
```

**Expected:**

- Triad personas have specific defaults in `getAgentDefaults()`
- Appropriate thinking budgets (9000-12000 range)

---

### Phase 7: Lint Verification (Agent 18)

#### Agent 18: Full Lint Check

```bash
npm run lint --workspace=apps/ui 2>&1 | tail -20
npm run lint --workspace=apps/server 2>&1 | tail -20
```

**Expected:** 0 errors (warnings acceptable)

Check for BMAD-specific issues:

```bash
npm run lint --workspace=apps/ui 2>&1 | rg -ni "bmad|persona|agent" | head -10
```

---

### Phase 8: Manual UI Test Checklist (Agent 19-20)

These are manual verification steps to be documented.

#### Agent 19: Document Manual Test Cases

Create a checklist file with these test scenarios:

**Test Case 1: Create Feature with Single Agent**

1. Open Add Feature dialog
2. Go to Prompt tab
3. In "Add Triad Agents to Task" section, select one agent (e.g., Sage)
4. Verify agent shows checkmark and "#1" indicator
5. Create feature
6. Verify feature card shows agent indicator

**Test Case 2: Create Feature with Multiple Agents**

1. Open Add Feature dialog
2. Select 3 agents: Sage, Theo, Finn
3. Verify order indicators (#1, #2, #3)
4. Verify UI shows `3/3 selected`
5. Click "Clear All" — verify all cleared
6. Re-select and create feature

**Test Case 3: Edit Existing Feature**

1. Create feature with 2 agents
2. Open edit dialog
   - Go to Model tab
3. Verify agents are pre-selected
4. Add a third agent
5. Save and verify changes persisted

**Test Case 4: Party Synthesis Profile**

1. Create a feature with **no** selected Triad agents (leave selection empty)
2. In Settings → Profiles, set the default AI profile to "BMAD: Party Synthesis" (or edit the feature and select the Party Synthesis profile)
3. Verify the feature JSON has `personaId: "bmad:party-synthesis"` (or the selected profile applies it)
4. (Optional) Run in Auto Mode and verify one-shot synthesis behavior

**Test Case 5: Profile Default Agents**

1. Go to Settings → Profiles
2. Edit or create a profile
   - Leave Persona as "Default" (no `personaId`) so it remains selectable in Add Feature → Model tab
3. Set default agents (2-3 agents)
4. Create new feature using that profile
5. Verify feature runs with the profile’s default agents when feature has no explicit agents selected

**Test Case 6: Backward Compatibility**

1. Find existing feature with old `personaId` (if any)
2. Open edit dialog
3. Verify persona converted to agent selection
4. Save without changes
5. Verify still works

---

#### Agent 20: Start Dev Server and Document URL

```bash
echo "=== BMAD Testing URLs ==="
echo ""
echo "Dev Server: npm run dev (choose web or electron)"
echo "API Base: http://localhost:3008/api"
echo ""
echo "Key Endpoints:"
echo "  GET  /api/bmad/personas - List all BMAD personas"
echo "  POST /api/bmad/status   - Check BMAD installation status"
echo "  POST /api/bmad/initialize - Install BMAD into project"
echo "  POST /api/bmad/upgrade  - Upgrade BMAD with backup"
echo ""
echo "UI Test Locations:"
echo "  Add Feature: Click '+' on board → Prompt tab → 'Add Triad Agents to Task'"
echo "  Edit Feature: Click feature card → Edit → Model tab"
echo "  Profiles: Settings → Profiles → Create/Edit"
echo "  BMAD Settings: Settings → BMAD tab"
```

---

## Report Format

```
BMAD E2E Testing Report

=== UNIT TESTS ===
bmad-persona-service.test.ts: [X/Y pass]
Full server suite: [737/737 or actual]
Coverage: [X%]

=== BUILD ===
packages: [PASS/FAIL]
server: [PASS/FAIL]
ui: [PASS/FAIL]
TypeScript: [0 errors / X errors]

=== API ENDPOINTS ===
GET /personas: [PASS/FAIL] - [X personas returned; expect 4]
POST /status (fresh project): [PASS/FAIL] - installed=false
POST /initialize: [PASS/FAIL] - installed=true, enabled=true
POST /upgrade: [PASS/FAIL] - backup created

=== DATA MODEL ===
Feature.agentIds: [FOUND/NOT FOUND]
Feature.personaId deprecated: [YES/NO]
AIProfile.agentIds: [FOUND/NOT FOUND]
ResolvedAgentCollab: [FOUND/NOT FOUND]

=== UI COMPONENTS ===
Add Feature Dialog:
  - Multi-select: [YES/NO]
  - Triad-only group: [YES/NO]
  - Max 3 limit: [YES/NO]
  - Order indicators: [YES/NO]

Edit Feature Dialog:
  - Backward compat: [YES/NO]

Profile Form:
  - Agent selection: [YES/NO]

=== SERVER LOGIC ===
resolveAgentCollab(): [FOUND/WORKING]
buildCollaborativePrompt(): [FOUND/WORKING]
Backward compat: [VERIFIED]
Triad defaults: [VERIFIED]

=== LINT ===
Errors: [0]
Warnings: [X]

=== OVERALL ===
Status: [READY FOR PR / ISSUES FOUND]

Issues Found:
1. [issue description]
2. [issue description]

Manual Testing Required:
- [ ] Test Case 1: Single agent feature
- [ ] Test Case 2: Multiple agents (max 3)
- [ ] Test Case 3: Edit existing feature
- [ ] Test Case 4: Party Synthesis
- [ ] Test Case 5: Profile default agents
- [ ] Test Case 6: Backward compatibility
```

---

## Success Criteria

- [ ] All 737+ unit tests pass
- [ ] All BMAD-specific tests pass (bmad-persona-service suite)
- [ ] Build completes without errors
- [ ] TypeScript compiles without errors
- [ ] Lint has 0 errors
- [ ] All 4+ API endpoints respond correctly (`/personas`, `/status`, `/initialize`, `/upgrade`)
- [ ] Data model changes verified
- [ ] UI components have required functionality
- [ ] Server-side logic verified
- [ ] Manual test cases documented

---

## Notes

- If server isn't running, start with `npm run dev:server`
- API tests assume server on port 3008 (default), or set `AUTOMAKER_BASE_URL`
- For manual UI testing, run `npm run dev` and choose web or electron
- Cleanup temp directories after testing
