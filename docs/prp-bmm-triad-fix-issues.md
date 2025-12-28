# PRP: BMM-Triad Integration Fixes

**Status:** Execution Complete ✅
**Created:** 2025-12-27
**Executed:** 2025-12-27
**Verified:** 2025-12-27
**Team:** Claude Team
**Source:** Codex Team Verification Report
**Parent PRP:** `docs/prp-bmm-triad-integration-verification.md`

---

## Context

Codex team executed the BMM-Triad integration verification PRP and found **2 issues** that need fixing. Core integration works correctly, but these gaps must be resolved before the integration is complete.

---

## Execution Summary (Result: PASS)

### Issue 1: Bundle Config Hash Mismatch — Fixed

Updated `libs/bmad-bundle/bundle/_bmad/_config/files-manifest.csv` hashes:

| File                         | SHA-256                                                            |
| ---------------------------- | ------------------------------------------------------------------ |
| `_config/agent-manifest.csv` | `4c9bfc64dd462081333ea87bc11977a80975faff36513f3d70dd5f4a39a9d266` |
| `_config/manifest.yaml`      | `20bc0c8cd25a876c94f64326dbe6cfbeca5bb420af66d93d2ad9a631aa9d4ab4` |

### Issue 2: Non-Triad Profiles Removed — Fixed

Removed **11** legacy BMAD built-in profiles from `DEFAULT_AI_PROFILES`:

- `bmad:bmad-master`
- `bmad:quick-flow-solo-dev`
- `bmad:agent-builder`
- `bmad:module-builder`
- `bmad:workflow-builder`
- `bmad:brainstorming-coach`
- `bmad:creative-problem-solver`
- `bmad:design-thinking-coach`
- `bmad:innovation-strategist`
- `bmad:presentation-master`
- `bmad:storyteller`

Remaining built-in profiles are now **7 total**:

- Core: Heavy Task, Balanced, Quick Edit
- BMAD: Party Synthesis, Sage, Theo, Finn

### Tests

- `npm run test:run --workspace=apps/server` → **34/34 files**, **737/737 tests** passing

---

## Issue Summary

| #   | Issue                                                         | Severity | Location                                                              |
| --- | ------------------------------------------------------------- | -------- | --------------------------------------------------------------------- |
| 1   | Bundle files-manifest.csv has stale hashes for \_config files | Medium   | `libs/bmad-bundle/bundle/_bmad/_config/files-manifest.csv:2` and `:5` |
| 2   | DEFAULT_AI_PROFILES includes non-triad BMAD personas          | High     | `apps/ui/src/store/app-store.ts:850`                                  |

---

## Issue 1: Bundle Config Hash Mismatch

### Problem

The bundled `files-manifest.csv` has incorrect SHA-256 hashes for the config files that were modified during triad integration:

- **Line 2:** Hash for `_config/agent-manifest.csv` does not match actual file
- **Line 5:** Hash for `_config/manifest.yaml` does not match actual file

The triad file hashes (lines 462-472) are correct. Only the \_config file hashes are stale.

### Root Cause

When triad rows were added to `agent-manifest.csv` and `manifest.yaml`, the corresponding hash entries in `files-manifest.csv` were not updated.

### Fix Steps

**Step 1:** Generate correct hashes

```bash
cd libs/bmad-bundle/bundle/_bmad

# Get current (correct) hash for agent-manifest.csv
sha256sum _config/agent-manifest.csv

# Get current (correct) hash for manifest.yaml
sha256sum _config/manifest.yaml
```

**Step 2:** Update `files-manifest.csv` with correct hashes

Edit `libs/bmad-bundle/bundle/_bmad/_config/files-manifest.csv`:

- Line 2: Replace hash for `_config/agent-manifest.csv` with output from Step 1
- Line 5: Replace hash for `_config/manifest.yaml` with output from Step 1

**Step 3:** Verify fix

```bash
cd libs/bmad-bundle/bundle/_bmad

# Verify agent-manifest.csv hash matches
EXPECTED=$(rg -n -F "\"_config/agent-manifest.csv\"" _config/files-manifest.csv | head -1 | cut -d',' -f5 | tr -d '"')
ACTUAL=$(sha256sum _config/agent-manifest.csv | cut -d' ' -f1)
[ "$EXPECTED" = "$ACTUAL" ] && echo "✅ agent-manifest.csv hash correct" || echo "❌ MISMATCH"

# Verify manifest.yaml hash matches
EXPECTED=$(rg -n -F "\"_config/manifest.yaml\"" _config/files-manifest.csv | head -1 | cut -d',' -f5 | tr -d '"')
ACTUAL=$(sha256sum _config/manifest.yaml | cut -d' ' -f1)
[ "$EXPECTED" = "$ACTUAL" ] && echo "✅ manifest.yaml hash correct" || echo "❌ MISMATCH"
```

### Acceptance Criteria

- [x] `files-manifest.csv` line 2 hash matches `sha256sum _config/agent-manifest.csv`
- [x] `files-manifest.csv` line 5 hash matches `sha256sum _config/manifest.yaml`
- [x] Verification commands both output ✅

---

## Issue 2: DEFAULT_AI_PROFILES Contains Non-Triad BMAD Personas

### Problem

The PRP required `DEFAULT_AI_PROFILES` to contain "exactly 3 triad profiles (plus any non-BMAD profiles)". However, the current implementation at `apps/ui/src/store/app-store.ts:891-1045` includes:

- `bmad:bmad-master`
- `bmad:quick-flow-solo-dev`
- Multiple builder personas (`bmad:agent-builder`, `bmad:module-builder`, `bmad:workflow-builder`)
- CIS personas (`bmad:brainstorming-coach`, `bmad:innovation-strategist`, etc.)

These are legacy BMAD personas that should not be exposed in the triad-only UI.

### Decision

**Option A** was confirmed and executed: remove ALL non-triad BMAD profiles from `DEFAULT_AI_PROFILES`, keeping only:

- 3 core (non-persona) profiles
- `bmad:party-synthesis`
- 3 triad personas (Sage/Theo/Finn)

### Fix Steps (Assuming Option A)

**Step 1:** Identify profiles to remove

```bash
# Find all BMAD persona references in DEFAULT_AI_PROFILES
rg -n "bmad:" apps/ui/src/store/app-store.ts | head -50
```

**Step 2:** Edit `apps/ui/src/store/app-store.ts`

In the `DEFAULT_AI_PROFILES` constant (around line 849 onwards):

1. **KEEP** profiles that use ONLY these personas:
   - `bmad:strategist-marketer` (Sage)
   - `bmad:technologist-architect` (Theo)
   - `bmad:fulfillization-manager` (Finn)
   - `bmad:party-synthesis` (optional)

2. **REMOVE** profiles that use ANY of these legacy personas:
   - `bmad:bmad-master`
   - `bmad:quick-flow-solo-dev`
   - `bmad:pm`
   - `bmad:architect`
   - `bmad:dev`
   - `bmad:analyst`
   - `bmad:sm`
   - `bmad:tea`
   - `bmad:ux-designer`
   - `bmad:tech-writer`
   - `bmad:agent-builder`
   - `bmad:module-builder`
   - `bmad:workflow-builder`
   - `bmad:brainstorming-coach`
   - `bmad:creative-problem-solver`
   - `bmad:design-thinking-coach`
   - `bmad:innovation-strategist`
   - `bmad:presentation-master`
   - `bmad:storyteller`

3. **KEEP** any profiles that use NO BMAD personas (pure Claude/GPT profiles)

**Step 3:** Verify fix

```bash
# Count BMAD persona references in DEFAULT_AI_PROFILES region
# Should only find: strategist-marketer, technologist-architect, fulfillization-manager, party-synthesis
rg "bmad:" apps/ui/src/store/app-store.ts | rg -v "strategist-marketer|technologist-architect|fulfillization-manager|party-synthesis"
```

**Expected:** No output (all non-triad BMAD references removed)

**Step 4:** Run UI and verify visually

```bash
npm run dev
# choose "web" (or use: npm run dev:web)
```

- Open browser
- Check built-in profile list
- Confirm only triad-based profiles visible

### Acceptance Criteria

- [x] `DEFAULT_AI_PROFILES` contains only profiles using triad personas (+ party-synthesis)
- [x] No legacy BMAD persona IDs remain in `DEFAULT_AI_PROFILES`
- [x] UI profile picker shows only triad-based profiles (+ party-synthesis)
- [x] Verification grep returns empty (no non-triad BMAD references)

---

## Post-Fix Verification

After both fixes are applied, run the full verification:

### Re-run PRP Phases

```bash
# Phase 1.4 - Files manifest hashes
cd libs/bmad-bundle/bundle/_bmad
for f in _config/agent-manifest.csv _config/manifest.yaml; do
  EXPECTED=$(rg -n -F "\"${f}\"" _config/files-manifest.csv | head -1 | cut -d',' -f5 | tr -d '"')
  ACTUAL=$(sha256sum "$f" | cut -d' ' -f1)
  [ "$EXPECTED" = "$ACTUAL" ] && echo "✅ $f" || echo "❌ $f MISMATCH"
done

# Phase 3.1 - DEFAULT_AI_PROFILES
rg "bmad:" apps/ui/src/store/app-store.ts | \
  rg -v "strategist-marketer|technologist-architect|fulfillization-manager|party-synthesis" && \
  echo "❌ Non-triad BMAD personas found" || echo "✅ Only triad personas in profiles"

# Phase 6 - Tests still pass
npm run test:run --workspace=apps/server
```

### Final Checklist

- [x] Issue 1 fixed: Config hashes match
- [x] Issue 2 fixed: Only triad profiles in DEFAULT_AI_PROFILES
- [x] All 737 server tests still pass
- [x] UI builds and runs without errors

---

## Sign-Off

| Issue                       | Fixed By    | Date       | Verified |
| --------------------------- | ----------- | ---------- | -------- |
| Issue 1: Hash mismatch      | Claude Team | 2025-12-27 | ✅       |
| Issue 2: Non-triad profiles | Claude Team | 2025-12-27 | ✅       |

**Final Status:** ✅ ALL FIXED

**Notes:**
N/A

---

_Generated by BMAD Party Mode_
