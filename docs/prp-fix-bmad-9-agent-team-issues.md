# PRP: Fix BMAD 9-Agent Executive Suite Issues

**Status**: READY FOR EXECUTION
**Created**: 2025-12-29
**Author**: Claude Sonnet 4.5 (36 Opus Investigation Agents)
**Target**: Claude Dev Team
**Priority**: P0 - Critical Fixes Required
**Estimated Effort**: 2-3 hours (critical fixes only) or 8-10 hours (with tiered installation)

---

## Executive Summary

Fix critical issues preventing full use of the BMAD 9-Agent Executive Suite. The validation report identified **3 critical issues** that must be resolved:

1. **UI Agent Limit Bug** - 2 files still enforce 4-agent limit instead of 9
2. **UI Text Clarity** - "Initialize BMAD" doesn't clearly convey what's being installed
3. **Missing Executive Suite** - codex-subagents project missing bmm-executive module

Plus **1 optional enhancement**:

- **Tiered Installation** - Install Executive Suite by default, full BMM on request

**Impact**: Without these fixes, users cannot select all 9 executive agents and may be confused about what BMAD installs.

---

## Table of Contents

1. [Validation Findings](#1-validation-findings)
2. [Critical Fix #1: UI Agent Limits](#2-critical-fix-1-ui-agent-limits)
3. [Critical Fix #2: UI Text Improvements](#3-critical-fix-2-ui-text-improvements)
4. [Critical Fix #3: Ensure Executive Suite Installed](#4-critical-fix-3-ensure-executive-suite-installed)
5. [Optional Enhancement: Tiered Installation](#5-optional-enhancement-tiered-installation)
6. [Testing Strategy](#6-testing-strategy)
7. [Implementation Timeline](#7-implementation-timeline)
8. [File Change Summary](#8-file-change-summary)

---

## 1. Validation Findings

### Validation Report Summary

**Validation Method**: 36 Opus agents (24 investigation + 12 monitoring)
**Validation Report**: `/home/aip0rt/Desktop/automaker/docs/validation-report-bmad-9-agent-team.md`

### ✅ What's Working Correctly

1. **Automaker BMAD Bundle**: Complete with all 9 executive agents verified
2. **PUBLIC_PERSONA_IDS**: Correctly lists all 9 + party-synthesis (10 total)
3. **Party Mode**: Properly configured with all 9 agents
4. **API Endpoint**: /api/bmad/personas returns all agents correctly
5. **Test Coverage**: Excellent - all 9 agents thoroughly tested
6. **Collaboration Prompts**: buildCollaborativePrompt() design is sound
7. **Agent Distinctiveness**: 8.4/10 - unique personas, complementary pairs
8. **add-feature-dialog.tsx**: Reference implementation using dynamic limit (correct)

### ❌ Critical Issues Found

1. **UI Agent Limit Bug** (2 files):
   - `profile-form.tsx` enforces max 4 agents (should be 9)
   - `edit-feature-dialog.tsx` enforces max 4 agents (should be 9)

2. **UI Text Unclear** (30+ occurrences):
   - "Initialize BMAD" is too generic
   - Doesn't convey it's installing the 9-agent team

3. **Missing Executive Suite** (version mismatch):
   - codex-subagents has BMAD 6.0.0-alpha.21
   - bmm-executive was added in alpha.22
   - Current bundle is alpha.23

### The 9-Agent Executive Suite

| #   | Agent ID                      | Name     | Icon | Role                   |
| --- | ----------------------------- | -------- | ---- | ---------------------- |
| 1   | `bmad:strategist-marketer`    | Sage     | 🎯   | Product Strategy       |
| 2   | `bmad:technologist-architect` | Theo     | 🏗️   | Technical Architecture |
| 3   | `bmad:fulfillization-manager` | Finn     | 🚀   | Delivery + UX          |
| 4   | `bmad:security-guardian`      | Cerberus | 🛡️   | Security + Risk        |
| 5   | `bmad:analyst-strategist`     | Mary     | 📊   | Research + Analysis    |
| 6   | `bmad:financial-strategist`   | Walt     | 💰   | Financial Planning     |
| 7   | `bmad:operations-commander`   | Axel     | ⚙️   | Operations             |
| 8   | `bmad:apex`                   | Apex     | ⚡   | Peak Performance       |
| 9   | `bmad:zen`                    | Zen      | 🧘   | Clean Architecture     |

---

## 2. Critical Fix #1: UI Agent Limits (4 → 9)

### Problem

Two files enforce a 4-agent maximum, but the Executive Suite has 9 agents. Users cannot select all agents!

### Affected Files

**File 1**: `apps/ui/src/components/views/profiles-view/components/profile-form.tsx`

- Line 68: `next.size < 4` (should be 9)
- Line 176: `({selectedAgentIds.size}/4 max)` (should be /9)
- Line 217: `selectedAgentIds.size >= 4` (should be >= 9)

**File 2**: `apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx`

- Line 214: `next.size < 4` (should be 9)
- Line 544: `({selectedAgentIds.size}/4 max)` (should be /9)
- Line 588: `selectedAgentIds.size >= 4` (should be >= 9)

### Solution: Extract Shared Constant (Recommended)

#### Step 1: Create Shared Constants File

**New File**: `apps/ui/src/config/bmad-agents.ts`

```typescript
/**
 * All executive agent IDs for the BMAD Executive Suite (9 agents)
 * Single source of truth for agent limits across the application
 */
export const ALL_EXECUTIVE_AGENT_IDS = [
  'bmad:strategist-marketer',
  'bmad:technologist-architect',
  'bmad:fulfillization-manager',
  'bmad:security-guardian',
  'bmad:analyst-strategist',
  'bmad:financial-strategist',
  'bmad:operations-commander',
  'bmad:apex',
  'bmad:zen',
] as const;

/**
 * Maximum number of executive agents that can be selected
 * Derived from array length to prevent hardcoding errors
 */
export const MAX_EXECUTIVE_AGENTS = ALL_EXECUTIVE_AGENT_IDS.length; // 9

export type ExecutiveAgentId = (typeof ALL_EXECUTIVE_AGENT_IDS)[number];
```

#### Step 2: Update profile-form.tsx

**File**: `apps/ui/src/components/views/profiles-view/components/profile-form.tsx`

**Import** (add after line 22):

```typescript
import { MAX_EXECUTIVE_AGENTS, ALL_EXECUTIVE_AGENT_IDS } from '@/config/bmad-agents';
```

**Changes**:

```typescript
// Line 68: BEFORE
} else if (next.size < 4) {

// Line 68: AFTER
} else if (next.size < MAX_EXECUTIVE_AGENTS) {

// Line 176: BEFORE
<span className="text-xs text-muted-foreground">({selectedAgentIds.size}/4 max)</span>

// Line 176: AFTER
<span className="text-xs text-muted-foreground">({selectedAgentIds.size}/{MAX_EXECUTIVE_AGENTS} max)</span>

// Line 217: BEFORE
const isDisabled = !isSelected && selectedAgentIds.size >= 4;

// Line 217: AFTER
const isDisabled = !isSelected && selectedAgentIds.size >= MAX_EXECUTIVE_AGENTS;
```

**Recommended (keeps one source of truth)**: Replace the hardcoded executive agent ID list with `ALL_EXECUTIVE_AGENT_IDS`:

```typescript
// BEFORE
[
  'bmad:strategist-marketer',
  'bmad:technologist-architect',
  'bmad:fulfillization-manager',
  'bmad:security-guardian',
  'bmad:analyst-strategist',
  'bmad:financial-strategist',
  'bmad:operations-commander',
  'bmad:apex',
  'bmad:zen',
].map((id) => bmadPersonas.find((persona) => persona.id === id));

// AFTER
ALL_EXECUTIVE_AGENT_IDS.map((id) => bmadPersonas.find((persona) => persona.id === id));
```

#### Step 3: Update edit-feature-dialog.tsx

**File**: `apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx`

**Import** (add after line 59):

```typescript
import { MAX_EXECUTIVE_AGENTS, ALL_EXECUTIVE_AGENT_IDS } from '@/config/bmad-agents';
```

**Changes**:

```typescript
// Line 214: BEFORE
} else if (next.size < 4) {

// Line 214: AFTER
} else if (next.size < MAX_EXECUTIVE_AGENTS) {

// Line 544: BEFORE
({selectedAgentIds.size}/4 max)

// Line 544: AFTER
({selectedAgentIds.size}/{MAX_EXECUTIVE_AGENTS} max)

// Line 588: BEFORE
const isDisabled = !isSelected && selectedAgentIds.size >= 4;

// Line 588: AFTER
const isDisabled = !isSelected && selectedAgentIds.size >= MAX_EXECUTIVE_AGENTS;
```

**Recommended (keeps one source of truth)**: Replace the hardcoded executive agent ID list with `ALL_EXECUTIVE_AGENT_IDS` (same pattern as above).

#### Step 4: Refactor add-feature-dialog.tsx (For Consistency)

**File**: `apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx`

**Import** (add after line 68):

```typescript
import { MAX_EXECUTIVE_AGENTS, ALL_EXECUTIVE_AGENT_IDS } from '@/config/bmad-agents';
```

**Delete** lines 427-439 (local constant):

```typescript
// REMOVE THIS:
const allExecutiveAgentIds = [
  'bmad:strategist-marketer',
  'bmad:technologist-architect',
  'bmad:fulfillization-manager',
  'bmad:security-guardian',
  'bmad:analyst-strategist',
  'bmad:financial-strategist',
  'bmad:operations-commander',
  'bmad:apex',
  'bmad:zen',
];

const maxExecutiveAgents = allExecutiveAgentIds.length;
```

**Replace** with:

```typescript
// Use shared constants
const allExecutiveAgentIds = ALL_EXECUTIVE_AGENT_IDS;
const maxExecutiveAgents = MAX_EXECUTIVE_AGENTS;
```

### Estimated Effort

| Task                                                    | Time        |
| ------------------------------------------------------- | ----------- |
| Create shared constants file                            | 5 min       |
| Update profile-form.tsx (limit + use shared IDs)        | 7 min       |
| Update edit-feature-dialog.tsx (limit + use shared IDs) | 7 min       |
| Refactor add-feature-dialog.tsx (optional)              | 5 min       |
| **Total (P0 only)**                                     | **~19 min** |
| **Total (with optional refactor)**                      | **~24 min** |

---

## 3. Critical Fix #2: UI Text Improvements

### Problem

User-facing copy is inconsistent and underspecified:

- Primary UI actions say **"Initialize BMAD"**
- The Settings page already describes the action as an **install** ("Install BMAD workflows to `_bmad/` …")
- Nothing explicitly tells the user that the install includes the **9-agent Executive Suite** (Sage → Zen)

**Recommended Change (UI copy only)**:

- Button/menu label: `"Initialize BMAD"` → `"Install BMAD"` (short + accurate)
- Supporting copy: explicitly mention **"includes the 9-agent Executive Suite"**
- Toast/error copy: `"initialized"`/`"initialization failed"` → `"installed"`/`"install failed"`

**Rationale**:

- "Install" more accurately describes copying BMAD resources into `_bmad/`
- The “Executive Suite” callout removes ambiguity without changing any API surface
- Keeps terminology consistent across Settings + Board UI

### Occurrences to Update (UI + a few comments)

| File                      | Occurrences | Lines                        |
| ------------------------- | ----------- | ---------------------------- |
| `bmad-section.tsx`        | 6           | 74, 79, 82, 145, 184, 187    |
| `board-header.tsx`        | 5           | 54, 62, 64, 67, 162          |
| `use-project-creation.ts` | 6           | 71, 78, 192, 199, 282, 289   |
| `welcome-view.tsx`        | 6           | 300, 307, 412, 419, 523, 530 |
| `http-api-client.ts`      | 1           | 760                          |

### Detailed Changes

#### File 1: bmad-section.tsx

**Location**: `apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx`

```typescript
// Line 74: BEFORE
toast.success('BMAD initialized', {

// Line 74: AFTER
toast.success('BMAD installed', {

// Line 79: BEFORE
toast.error('Failed to initialize BMAD', {

// Line 79: AFTER
toast.error('Failed to install BMAD', {

// Line 82: BEFORE
toast.error('Failed to initialize BMAD', {

// Line 82: AFTER
toast.error('Failed to install BMAD', {

// Line 145: BEFORE (section description)
Install BMAD workflows to _bmad/ and configure git-friendly artifacts.

// Line 145: AFTER
Install BMAD to _bmad/ (includes the 9-agent Executive Suite) and configure git-friendly artifacts.

// Line 187: BEFORE (button text)
Initialize BMAD

// Line 187: AFTER
Install BMAD
```

#### File 2: board-header.tsx

**Location**: `apps/ui/src/components/views/board-view/board-header.tsx`

```typescript
// Line 54: Function name (optional to change)
const handleInitializeBmad = async () => {
// Could rename to handleInstallBmad (not critical)

// Line 62: BEFORE
toast.success('BMAD initialized');

// Line 62: AFTER
toast.success('BMAD installed');

// Line 64, 67: BEFORE
toast.error('Failed to initialize BMAD', ...);

// Line 64, 67: AFTER
toast.error('Failed to install BMAD', ...);

// Line 162: BEFORE
Initialize BMAD

// Line 162: AFTER
Install BMAD
```

#### File 3: use-project-creation.ts

**Location**: `apps/ui/src/components/layout/sidebar/hooks/use-project-creation.ts`

```typescript
// Lines 71, 192, 282: BEFORE (comments)
// Initialize BMAD (optional)

// AFTER
// Install BMAD (optional)

// Lines 78, 199, 289: BEFORE
toast.error('BMAD initialization failed', ...);

// AFTER
toast.error('BMAD install failed', ...);
```

#### File 4: welcome-view.tsx

**Location**: `apps/ui/src/components/views/welcome-view.tsx`

```typescript
// Lines 300, 412, 523: BEFORE (comments)
// Initialize BMAD (optional)

// AFTER
// Install BMAD (optional)

// Lines 307, 419, 530: BEFORE
toast.error('BMAD initialization failed', ...);

// AFTER
toast.error('BMAD install failed', ...);
```

#### File 5: http-api-client.ts (Optional - API Endpoint Reference)

**Location**: `apps/ui/src/lib/http-api-client.ts`

```typescript
// Line 760: BEFORE (API endpoint path - DO NOT CHANGE)
this.post('/api/bmad/initialize', {

// AFTER (Keep the endpoint path, update comment only)
// Install BMAD agents to project
this.post('/api/bmad/initialize', {
```

**Note**: The API endpoint path `/api/bmad/initialize` should NOT change to avoid breaking compatibility. Only update comments/documentation.

### Test IDs (Keep Unchanged)

These test IDs should **NOT** be changed to maintain E2E test compatibility:

- `bmad-initialize-button` (bmad-section.tsx line 184)
- `bmad-initialize-quick` (board-header.tsx line 160)

E2E tests may reference these IDs, so changing them would break tests.

### Important: Do Not Rename the API Endpoint

The endpoint is intentionally named `/api/bmad/initialize` today and should remain unchanged for backward compatibility.
Only update UI labels / toasts / comments.

### Estimated Effort

| Task                                       | Time       |
| ------------------------------------------ | ---------- |
| Update bmad-section.tsx (6 changes)        | 8 min      |
| Update board-header.tsx (5 changes)        | 7 min      |
| Update use-project-creation.ts (6 changes) | 7 min      |
| Update welcome-view.tsx (6 changes)        | 7 min      |
| Update http-api-client.ts (1 comment)      | 1 min      |
| Visual verification                        | 5 min      |
| **Total**                                  | **35 min** |

---

## 4. Critical Fix #3: Ensure Executive Suite Installed

### Problem

The codex-subagents project has BMAD **without** the Executive Suite:

- Installed version: `6.0.0-alpha.21` (before bmm-executive existed)
- bmm-executive was added in: `6.0.0-alpha.22`
- Current bundle version: `6.0.0-alpha.23`

**Impact**: In codex-subagents, Party Mode and the 9-agent Executive Suite are unavailable until BMAD is upgraded.

**Scope note**: This is primarily an **operational remediation** for the separate `codex-subagents` project on disk. It is not strictly an Automaker repo code defect, because Automaker already exposes an Upgrade action when the installed version differs from the bundled version.

### Solution Options

#### Option A: Manual Upgrade (Fastest - 5 minutes)

**Steps**:

1. Open codex-subagents in Automaker UI
2. Navigate to Settings > BMAD
3. Click "Upgrade" button
4. Verify bmm-executive directory appears in \_bmad/

**Validation**:

```bash
ls -la /home/aip0rt/Desktop/codex-subagents/_bmad/bmm-executive/agents/
# Should list 9 .md files
```

#### Option B: Programmatic Fix (For All Projects)

Add upgrade detection and automatic prompt when bmm-executive is missing:

**File**: `apps/server/src/services/bmad-service.ts`

```typescript
async getStatus(projectPath: string): Promise<BmadStatus> {
  // ... existing code ...

  // NEW: Check if bmm-executive is missing
  const bmadDir = path.join(projectPath, '_bmad');
  const hasExecutive = await exists(path.join(bmadDir, 'bmm-executive'));

  return {
    // ... existing fields ...
    needsUpgrade: installed && (!hasExecutive || (installedVersion && installedVersion !== bundleVersion)),
    missingExecutiveSuite: installed && !hasExecutive,
  };
}
```

**Also update types** (required if you use these fields in UI):

- `apps/ui/src/lib/electron.ts` → extend `export interface BmadStatus` with `missingExecutiveSuite?: boolean`
- `apps/server/src/services/bmad-service.ts` → extend the local `type BmadStatus` with `missingExecutiveSuite?: boolean`

**File**: `apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx`

Add warning when `status?.missingExecutiveSuite`:

```tsx
{
  status?.missingExecutiveSuite && (
    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-amber-600">Executive Suite Missing</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your BMAD installation is missing the 9-agent Executive Suite. Click "Upgrade" to add
            Sage, Theo, Finn, Cerberus, Mary, Walt, Axel, Apex, and Zen.
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Recommended Approach

**For codex-subagents**: Use Option A (manual upgrade) as a one-time remediation
**Optional (future-proofing)**: Implement Option B (detection + warning) if you want a clearer, more specific UI signal than “needs upgrade”

### Estimated Effort

| Task                              | Time      |
| --------------------------------- | --------- |
| **Option A (Manual)**             | **5 min** |
| Option B (Programmatic detection) | 45 min    |
| Option B (UI warning component)   | 30 min    |

---

## 5. Optional Enhancement: Tiered Installation

### Problem

Current BMAD installation is **all-or-nothing** (5.5MB):

- Installs ALL modules: core + bmm + bmm-executive + cis + bmb + \_memory
- Most users only need Executive Suite (9 agents)
- Full BMM adds 3.3MB of unused workflows

### Proposed Tiers

| Tier               | Modules                   | Size   | Agents                     | Use Case          |
| ------------------ | ------------------------- | ------ | -------------------------- | ----------------- |
| **Lite** (default) | core + bmm-executive      | ~700KB | 9 executive                | Most users        |
| **Standard**       | Lite + cis + bmb          | ~2.5MB | 9 + 6 creative + 3 builder | Power users       |
| **Full**           | Standard + bmm + \_memory | ~5.5MB | All 28 agents              | Enterprise/legacy |

### Benefits

- 60% disk space savings for default installs
- Clearer user choice
- Faster initialization
- Executive Suite becomes the obvious default

### Implementation

#### 1. Define Tier Configuration

**New File**: `libs/bmad-bundle/src/tier-config.ts`

```typescript
export type BmadInstallTier = 'lite' | 'standard' | 'full';

export const BMAD_TIER_MODULES: Record<BmadInstallTier, string[]> = {
  lite: ['_config', 'core', 'bmm-executive'],
  standard: ['_config', 'core', 'bmm-executive', 'cis', 'bmb'],
  full: ['_config', 'core', 'bmm-executive', 'cis', 'bmb', 'bmm', '_memory'],
};

export function getModulesForTier(tier: BmadInstallTier): string[] {
  return BMAD_TIER_MODULES[tier];
}
```

#### 2. Modify Installation Service

**File**: `apps/server/src/services/bmad-service.ts`

**Update interface** (add to options):

```typescript
async initializeProjectBmad(
  projectPath: string,
  options?: {
    artifactsDir?: string;
    scaffoldMethodology?: boolean;
    installTier?: BmadInstallTier;  // NEW
  }
): Promise<BmadStatus & { createdFeatures?: Feature[] }>
```

**Modify installation logic** (around line 184):

```typescript
const tier = options?.installTier ?? 'lite';
const modulesToInstall = getModulesForTier(tier);

// Instead of copying entire bundle directory:
// await copyDirFromBundleToProject(bundleDir, path.join(projectPath, '_bmad'));

// Copy selective modules:
const destDir = path.join(projectPath, '_bmad');
await secureFs.mkdir(destDir, { recursive: true });

for (const moduleName of modulesToInstall) {
  const srcModule = path.join(bundleDir, moduleName);
  const destModule = path.join(destDir, moduleName);

  if (await exists(srcModule)) {
    await copyDirFromBundleToProject(srcModule, destModule);
  }
}
```

**Save tier in settings**:

```typescript
await this.settingsService.updateProjectSettings(projectPath, {
  bmad: {
    enabled: true,
    artifactsDir,
    installedVersion: BMAD_BUNDLE_VERSION,
    installTier: tier,
    installedModules: modulesToInstall,
  },
});
```

#### 3. Add UI Tier Selector

**File**: `apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx`

**Add state** (around line 50):

```typescript
const [installTier, setInstallTier] = useState<'lite' | 'standard' | 'full'>('lite');
```

**Add UI component** (before Initialize button, around line 170):

```tsx
<div className="space-y-3">
  <Label className="text-foreground font-medium">Installation Tier</Label>
  <Select value={installTier} onValueChange={(v) => setInstallTier(v as any)}>
    <SelectTrigger className="w-full">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="lite">
        <div className="flex flex-col">
          <span className="font-medium">Lite (~700KB)</span>
          <span className="text-xs text-muted-foreground">
            Executive Suite only - 9 agents (Sage, Theo, Finn...)
          </span>
        </div>
      </SelectItem>
      <SelectItem value="standard">
        <div className="flex flex-col">
          <span className="font-medium">Standard (~2.5MB)</span>
          <span className="text-xs text-muted-foreground">Lite + Creative + Builder modules</span>
        </div>
      </SelectItem>
      <SelectItem value="full">
        <div className="flex flex-col">
          <span className="font-medium">Full (~5.5MB)</span>
          <span className="text-xs text-muted-foreground">All modules including legacy BMM</span>
        </div>
      </SelectItem>
    </SelectContent>
  </Select>
  <p className="text-xs text-muted-foreground">
    Lite tier recommended for most users. Full tier for enterprise or legacy compatibility.
  </p>
</div>
```

**Update handleInitialize** (around line 69):

```typescript
const result = await api.bmad?.initialize(projectPath, {
  artifactsDir,
  scaffoldMethodology,
  installTier, // NEW
});
```

#### 4. Extend Type Definitions

**File**: `libs/types/src/settings.ts`

```typescript
bmad?: {
  enabled?: boolean;
  installedVersion?: string;
  artifactsDir?: string;
  installTier?: 'lite' | 'standard' | 'full';  // NEW
  installedModules?: string[];  // NEW
};
```

#### 5. Update API Route

**File**: `apps/server/src/routes/bmad/routes/initialize.ts`

```typescript
const { projectPath, artifactsDir, scaffoldMethodology, installTier } = req.body as {
  projectPath?: string;
  artifactsDir?: string;
  scaffoldMethodology?: boolean;
  installTier?: 'lite' | 'standard' | 'full'; // NEW
};

const result = await bmadService.initializeProjectBmad(projectPath, {
  artifactsDir,
  scaffoldMethodology: Boolean(scaffoldMethodology),
  installTier: installTier ?? 'lite', // NEW
});
```

#### 6. Update API Client

**File**: `apps/ui/src/lib/http-api-client.ts`

```typescript
initialize: (
  projectPath: string,
  options?: {
    artifactsDir?: string;
    scaffoldMethodology?: boolean;
    installTier?: 'lite' | 'standard' | 'full';  // NEW
  }
) =>
  this.post('/api/bmad/initialize', {
    projectPath,
    artifactsDir: options?.artifactsDir,
    scaffoldMethodology: options?.scaffoldMethodology,
    installTier: options?.installTier,  // NEW
	  }),
```

#### 7. Update UI API Types

The UI’s `ElectronAPI` types mirror the HTTP client surface. Update the `initialize()` options type to include `installTier` so TypeScript stays consistent.

**File**: `apps/ui/src/lib/electron.ts`

```typescript
initialize: (
  projectPath: string,
  options?: {
    artifactsDir?: string;
    scaffoldMethodology?: boolean;
    installTier?: 'lite' | 'standard' | 'full'; // NEW
  }
) =>
  Promise<{
    success: boolean;
    status?: BmadStatus;
    createdFeatures?: Feature[];
    error?: string;
  }>;
```

### Estimated Effort

| Task                                      | Time         |
| ----------------------------------------- | ------------ |
| Create tier-config.ts                     | 30 min       |
| Modify bmad-service.ts installation logic | 1.5 hr       |
| Add tier selector UI                      | 45 min       |
| Update type definitions                   | 15 min       |
| Update API route and client               | 30 min       |
| Update UI API types (electron.ts)         | 5 min        |
| Testing tiered installation               | 1 hr         |
| **Total**                                 | **4.5-5 hr** |

**Recommendation**: Defer to separate PR - this is an enhancement, not a critical fix.

---

## 6. Testing Strategy

### What to Run (Actual Repo Commands)

This repo’s UI test runner is **Playwright** (not Vitest). Use:

```bash
# From repo root
npm run build:packages
npm run build --workspace=apps/ui
npm run test --workspace=apps/ui

# Optional (server unit tests)
npm run test --workspace=apps/server
```

Playwright starts both the backend and frontend dev servers automatically via `apps/ui/playwright.config.ts`.

### Integration Tests (Server)

**File**: `apps/server/tests/unit/services/bmad-persona-service.test.ts`

**Verify existing tests still pass** (no changes needed):

- Line 588-624: "should support all 9 executive personas in agent collaboration"
- All tests should continue passing after limit changes

### E2E Tests (Recommended Additions)

**Important selector note**: The BMAD agent checkboxes in the UI do **not** currently have `data-testid` attributes. For E2E, select them by their `id`:

- Profile form: `id="agent-bmad:..."` (e.g. `agent-bmad:apex`)
- Edit feature dialog: `id="edit-agent-bmad:..."` (e.g. `edit-agent-bmad:apex`)

#### E2E: Profile form allows selecting >4 agents

**Preferred**: Extend the existing profiles E2E test: `apps/ui/tests/profiles/profiles-crud.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import {
  setupMockProjectWithProfiles,
  waitForNetworkIdle,
  navigateToProfiles,
  clickNewProfileButton,
} from '../utils';

test.describe('Profile Agent Selection', () => {
  test('should allow selecting 5 agents (limit is 9)', async ({ page }) => {
    await setupMockProjectWithProfiles(page, { customProfilesCount: 0 });
    await page.goto('/');
    await waitForNetworkIdle(page);
    await navigateToProfiles(page);
    await clickNewProfileButton(page);

    const dialog = page.locator('[data-testid="add-profile-dialog"]');
    await expect(dialog).toBeVisible();

    // Select 5 distinct executive agents
    await dialog.locator('[id="agent-bmad:strategist-marketer"]').click();
    await dialog.locator('[id="agent-bmad:technologist-architect"]').click();
    await dialog.locator('[id="agent-bmad:fulfillization-manager"]').click();
    await dialog.locator('[id="agent-bmad:security-guardian"]').click();
    await dialog.locator('[id="agent-bmad:analyst-strategist"]').click();

    await expect(dialog.locator('text=/\\(5\\/9 max\\)/')).toBeVisible();
  });
});
```

#### E2E: Edit feature dialog allows selecting >4 agents

**Extend**: `apps/ui/tests/features/edit-feature.spec.ts` to:

- Open the edit feature dialog
- Click the Model tab (`data-testid="edit-tab-model"`)
- Select 5 agent checkboxes by id (`edit-agent-bmad:...`)
- Assert the counter shows `(5/9 max)`

```typescript
import { test, expect } from '@playwright/test';
import { clickElement } from '../utils';

// Pseudocode outline (see existing edit-feature.spec.ts for full project setup)
// await clickElement(page, 'edit-tab-model');
// const dialog = page.locator('[data-testid="edit-feature-dialog"]');
// await dialog.locator('[id="edit-agent-bmad:strategist-marketer"]').click();
// ... click 4 more ...
// await expect(dialog.locator('text=/\\(5\\/9 max\\)/')).toBeVisible();
```

### Manual Testing Checklist

After implementation, manually verify:

- [ ] Profile form shows "X/9 max"
- [ ] Can select all 9 agents in profile form
- [ ] Edit feature dialog shows "X/9 max"
- [ ] Can select all 9 agents in edit feature dialog
- [ ] Add feature dialog still works (already correct)
- [ ] BMAD section shows "Install BMAD" button text
- [ ] Board header dropdown shows "Install BMAD"
- [ ] Toast messages show "BMAD installed" or "Failed to install BMAD"
- [ ] Upgrading codex-subagents adds bmm-executive directory

### Estimated Effort

| Task                            | Time       |
| ------------------------------- | ---------- |
| Add/extend Playwright E2E tests | 30-45 min  |
| Run UI test suite (Playwright)  | 10-20 min  |
| Manual testing checklist        | 20 min     |
| **Total**                       | **75 min** |

---

## 7. Implementation Timeline

### Phase 1: Critical Fixes (Required - 2-3 hours)

**Day 1, Morning (1 hour)**:

1. Create shared constants file (5 min)
2. Fix UI agent limits in 2 files (+ optional add-feature refactor) (15-20 min)
3. Update UI text in 5 files (35 min)
4. Manual upgrade codex-subagents (Option A) (5 min)
5. Manual verification (5 min)

**Day 1, Afternoon (1-2 hours)**: 6. Extend Playwright E2E coverage (30-45 min) 7. Run UI test suite (Playwright) (10-20 min) 8. Manual testing (20 min) 9. Update documentation (20 min) 10. Code review and polish (30 min)

**Deliverable**: UI agent limits fixed, UI text improved, all tests passing

### Phase 2: Tiered Installation (Optional - 6-8 hours)

**Can be deferred to separate PR/sprint**

**Day 2 or Later (6-8 hours)**:

1. Design and create tier-config.ts (1 hr)
2. Modify bmad-service.ts for selective copying (2 hr)
3. Create tier selector UI (1 hr)
4. Update API route/client + UI API types (45 min)
5. Testing and validation (1.5 hr)
6. Documentation (1 hr)

**Deliverable**: Users can choose Lite/Standard/Full installation tiers

### Critical Path

```
Create Constants (5min)
        ↓
  ┌─────────────┬─────────────┐
  │             │             │
Fix Limits    Fix Text    Manual Fix
(15min)       (35min)     codex-subagents
  │             │         (5min)
  └──────┬──────┘             │
         │                    │
    Build & Verify       Verify Upgrade
      (5min)              (5min)
         │                    │
         └──────┬─────────────┘
                │
           Create Tests
            (30-45min)
                │
           Run Tests
            (10-20min)
                │
         Manual Testing
            (20min)
                │
              Docs
            (20min)
                │
         Code Review
            (30min)
```

**Critical Path Duration**: ~2.5 hours

---

## 8. File Change Summary

### Phase 1 (Required)

#### New Files (1)

| File                                | Lines | Priority | Purpose                                                      |
| ----------------------------------- | ----- | -------- | ------------------------------------------------------------ |
| `apps/ui/src/config/bmad-agents.ts` | ~20   | P0       | Shared constants for executive agent IDs + derived max limit |

#### Modified Files (P0 - agent limit bug)

| File                                                                      | Changes                            | Lines Affected         | Priority |
| ------------------------------------------------------------------------- | ---------------------------------- | ---------------------- | -------- |
| `apps/ui/src/components/views/profiles-view/components/profile-form.tsx`  | Replace 4→MAX + use shared ID list | 68, 176, 217, 202-213  | P0       |
| `apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx` | Replace 4→MAX + use shared ID list | 214, 544, 588, 573-583 | P0       |

#### Modified Files (P1 - optional consistency refactor)

| File                                                                     | Changes                                                         | Priority |
| ------------------------------------------------------------------------ | --------------------------------------------------------------- | -------- |
| `apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx` | Refactor to use shared constants (dialog already correct today) | P1       |

#### Modified Files (P1 - E2E coverage, recommended)

| File                                           | Changes                                        | Priority |
| ---------------------------------------------- | ---------------------------------------------- | -------- |
| `apps/ui/tests/profiles/profiles-crud.spec.ts` | Add E2E assertion for selecting >4 BMAD agents | P1       |
| `apps/ui/tests/features/edit-feature.spec.ts`  | Add E2E assertion for selecting >4 BMAD agents | P1       |

#### Modified Files (UI text improvements)

| File                                                                  | Changes                                                   | Occurrences | Priority |
| --------------------------------------------------------------------- | --------------------------------------------------------- | ----------- | -------- |
| `apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx`    | Replace "Initialize/initialized" with "Install/installed" | 6           | P1       |
| `apps/ui/src/components/views/board-view/board-header.tsx`            | Replace "Initialize/initialized" with "Install/installed" | 4           | P1       |
| `apps/ui/src/components/layout/sidebar/hooks/use-project-creation.ts` | Replace "initialization" with "installation"              | 6           | P2       |
| `apps/ui/src/components/views/welcome-view.tsx`                       | Replace "initialization" with "installation"              | 6           | P2       |
| `apps/ui/src/lib/http-api-client.ts`                                  | Update comment only                                       | 1           | P3       |

### Phase 2 (Optional - separate PR): Tiered Installation

#### New Files (1)

| File                                  | Lines | Priority | Purpose                      |
| ------------------------------------- | ----- | -------- | ---------------------------- |
| `libs/bmad-bundle/src/tier-config.ts` | ~40   | P2       | Define tier → module mapping |

#### Modified Files (unique)

| File                                                               | Changes                                                  | Priority |
| ------------------------------------------------------------------ | -------------------------------------------------------- | -------- |
| `libs/types/src/settings.ts`                                       | Add installTier and installedModules fields              | P2       |
| `apps/server/src/services/bmad-service.ts`                         | Selective module copying                                 | P2       |
| `apps/server/src/routes/bmad/routes/initialize.ts`                 | Accept installTier parameter                             | P2       |
| `libs/bmad-bundle/src/index.ts`                                    | Export tier utilities                                    | P2       |
| `apps/ui/src/lib/electron.ts`                                      | Update BmadAPI.initialize() options type                 | P2       |
| `apps/ui/src/lib/http-api-client.ts`                               | Add installTier to API call (already touched in Phase 1) | P2       |
| `apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx` | Add tier selector UI (already touched in Phase 1)        | P2       |

#### Totals (unique files)

| Scope                 | New Files | Modified Files | Total |
| --------------------- | --------- | -------------- | ----- |
| Phase 1 (P0 only)     | 1         | 2              | 3     |
| Phase 1 (recommended) | 1         | 9-10           | 10-11 |
| Phase 1 + Phase 2     | 2         | 14-15          | 16-17 |

---

## Appendix A: Quick Reference

### Before/After Comparison

**Agent Limit**:

- Before: `next.size < 4`
- After: `next.size < MAX_EXECUTIVE_AGENTS`

**UI Display**:

- Before: `({selectedAgentIds.size}/4 max)`
- After: `({selectedAgentIds.size}/{MAX_EXECUTIVE_AGENTS} max)`

**Button Text**:

- Before: `Initialize BMAD`
- After: `Install BMAD`

**Toast Success**:

- Before: `'BMAD initialized'`
- After: `'BMAD installed'`

**Toast Error**:

- Before: `'Failed to initialize BMAD'`
- After: `'Failed to install BMAD'`

---

## Sign-Off

**Prepared By**: Claude Sonnet 4.5 + 36 Opus Investigation Agents (24 validation + 12 fix analysis)
**Review Required**: Yes - Claude Dev Team
**Execution Ready**: Yes - All technical details specified
**Estimated Timeline**:

- **Critical fixes**: 2-3 hours
- **Full implementation**: 8-10 hours (if including tiered installation)

**Recommendation**: Execute critical fixes first (Phase 1), defer tiered installation to Phase 2.

---

## Next Steps

1. **Review this PRP**
2. **Execute Phase 1** (critical fixes, 2-3 hours)
3. **Validate all tests pass**
4. **Manually test in UI**
5. **Decide on Phase 2** (tiered installation, optional)
6. **Ship it!** ✅
