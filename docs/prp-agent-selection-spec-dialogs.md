# PRP: Add Agent Selection to Spec Generation Dialogs

**Status**: READY FOR EXECUTION
**Created**: 2025-12-29
**Author**: Claude Sonnet 4.5 (12 Opus Investigation Agents)
**Target**: Claude Dev Team
**Estimated Effort**: 1-2 days (8-16 hours)

---

## Executive Summary

Add BMAD agent selection UI to the spec generation/regeneration dialogs, matching the existing pattern from the "Add Feature" dialog. This allows users to select which of the 9 BMAD Executive agents (Sage, Theo, Finn, Cerberus, Mary, Walt, Axel, Apex, Zen) analyze their project spec.

**Key Approach**: Reuse existing `BmadPersonaService.resolveAgentCollab()` method (no new orchestration service needed) and extend current spec dialog UI with agent selection component.

**User Flow**:

1. User clicks "Generate Spec" or "Regenerate Spec"
2. Dialog shows new "Agent Collaboration" section (similar to Add Feature dialog)
3. User selects "Party Mode" (all 9 agents) or individual agents
4. Optional: Display cost estimate before generation
5. Spec generation runs with enhanced multi-agent analysis

---

## Table of Contents

1. [Current State](#1-current-state)
2. [Proposed Changes](#2-proposed-changes)
3. [Implementation Plan](#3-implementation-plan)
4. [UI/UX Design](#4-uiux-design)
5. [API Changes](#5-api-changes)
6. [Backend Implementation](#6-backend-implementation)
7. [Testing Strategy](#7-testing-strategy)
8. [File Change Summary](#8-file-change-summary)

---

## 1. Current State

### Existing Implementations

**Add Feature Dialog** (`add-feature-dialog.tsx`):

- ✅ Has agent selection UI with Party Mode toggle
- ✅ Supports up to 9 executive agents
- ✅ Uses checkboxes for individual selection
- ✅ Loads personas via `useBmadPersonas()` hook
- ✅ Passes `agentIds` to backend via feature.json

**Spec Generation Dialogs** (`create-spec-dialog.tsx`, `regenerate-spec-dialog.tsx`):

- ❌ No agent selection (currently single-agent only)
- ✅ Has `projectOverview` textarea
- ✅ Has `analyzeProject` checkbox
- ✅ Has `generateFeatures` checkbox + feature count selector
- ✅ Calls `api.specRegeneration.create()` or `.generate()`

### Gap Analysis

The spec dialogs need the same agent selection functionality as Add Feature dialog, but:

1. **Simpler UI** - Spec dialogs are already content-heavy
2. **Different defaults** - Default to Party Mode (all 9) for comprehensive spec analysis
3. **Cost awareness** - Show estimated cost before expensive multi-agent run

---

## 2. Proposed Changes

### User-Facing Changes

1. Both spec dialogs get an "Agent Collaboration" section between "Analyze project" and "Generate features"
2. Three modes available:
   - **Party Mode** (default, recommended) - All 9 executive agents
   - **Individual Selection** - Choose specific agents (up to 9)
   - **Skip** - Fast single-agent generation (existing behavior)
3. Optional cost estimate display when agents selected

### Technical Changes

**Frontend**:

- Add agent selection component to both spec dialogs
- Extend `use-spec-generation` hook to track selected agents
- Handle new `agentIds` parameter in API calls

**Backend**:

- Modify `generate-spec.ts` to accept `agentIds` parameter
- Use existing `BmadPersonaService.resolveAgentCollab()` for multi-agent prompts
- Add cost estimation endpoint (optional)

---

## 3. Implementation Plan

### Phase 1: Backend API Extension (4 hours)

#### 1.1 Extend Route Handlers

**File**: `apps/server/src/routes/app-spec/routes/generate.ts`

**Changes**:

```typescript
// Add to request body destructuring
const {
  projectPath,
  projectDefinition,
  generateFeatures,
  analyzeProject,
  maxFeatures,
  agentIds, // NEW: Array of agent IDs
} = req.body;

// Instantiate BmadPersonaService
import { BmadPersonaService } from '../../../services/bmad-persona-service.js';
const bmadPersonaService = new BmadPersonaService();

// Validate agentIds (keeps API strict + matches tests)
const allowedAgentIds = new Set([
  'bmad:strategist-marketer',
  'bmad:technologist-architect',
  'bmad:fulfillization-manager',
  'bmad:security-guardian',
  'bmad:analyst-strategist',
  'bmad:financial-strategist',
  'bmad:operations-commander',
  'bmad:apex',
  'bmad:zen',
]);
const invalidAgentIds = (agentIds ?? []).filter((id: string) => !allowedAgentIds.has(id));
if (invalidAgentIds.length > 0) {
  res.status(400).json({
    success: false,
    error: `Invalid agentIds: ${invalidAgentIds.join(', ')}`,
  });
  return;
}

// Pass to generateSpec
await generateSpec(
  projectPath,
  projectDefinition,
  events,
  abortController,
  generateFeatures,
  analyzeProject,
  maxFeatures,
  settingsService,
  agentIds, // NEW
  bmadPersonaService // NEW
);
```

#### 1.2 Modify Core Spec Generation

**File**: `apps/server/src/routes/app-spec/generate-spec.ts`

**Changes**:

```typescript
// Add parameters to function signature
export async function generateSpec(
  projectPath: string,
  projectOverview: string,
  events: EventEmitter,
  abortController: AbortController,
  generateFeatures?: boolean,
  analyzeProject?: boolean,
  maxFeatures?: number,
  settingsService?: SettingsService,
  agentIds?: string[], // NEW
  bmadPersonaService?: BmadPersonaService // NEW
): Promise<void> {
  // ... existing code ...

  // NEW: Resolve agent collaboration if agentIds provided
  let resolvedCollab: ResolvedAgentCollab | null = null;
  if (agentIds && agentIds.length > 0 && bmadPersonaService) {
    resolvedCollab = await bmadPersonaService.resolveAgentCollab({
      agentIds,
      projectPath,
    });

    // Emit agent selection event for UI
    events.emit('spec-regeneration:event', {
      type: 'spec_agent_selection',
      agentIds,
      agentNames: resolvedCollab.agents.map((a) => a.name),
      projectPath,
    });
  }

  // Modify SDK options to use resolved collab
  const options = createSpecGenerationOptions({
    cwd: projectPath,
    abortController,
    autoLoadClaudeMd,
    outputFormat: { type: 'json_schema', schema: specOutputSchema },
    // NEW: Use resolved settings when available (falls back to spec defaults when undefined)
    model: resolvedCollab?.model,
    maxThinkingTokens: resolvedCollab?.thinkingBudget,
    systemPrompt: resolvedCollab?.combinedSystemPrompt, // Multi-agent prompt
  });

  // ... rest of existing code ...
}
```

#### 1.3 Add Cost Estimation Endpoint (Optional)

**File**: `apps/server/src/routes/app-spec/routes/estimate.ts` (NEW)

```typescript
import type { Request, Response } from 'express';

export function createEstimateHandler() {
  return async (req: Request, res: Response) => {
    const { projectOverviewLength, agentIds } = req.body;

    // Simple estimation based on agent count
    const agentCount = agentIds?.length || 0;
    const baseTokens = 5000;
    const agentOverhead = agentCount * 1500;
    const totalInputTokens = baseTokens + agentOverhead + projectOverviewLength / 4;

    // Rough cost estimates (USD per 1M tokens)
    const sonnetInputCost = 3.0 / 1_000_000;
    const sonnetOutputCost = 15.0 / 1_000_000;

    const estimatedCost = totalInputTokens * sonnetInputCost + 3000 * sonnetOutputCost;

    res.json({
      success: true,
      estimate: {
        costUsd: Math.round(estimatedCost * 100) / 100,
        durationSeconds: { min: agentCount * 30, max: agentCount * 60 },
        agentCount,
      },
    });
  };
}
```

**Register route** in `apps/server/src/routes/app-spec/index.ts`:

```typescript
router.post('/estimate', createEstimateHandler());
```

### Phase 2: Frontend Component (6 hours)

#### 2.1 Create Shared Agent Selection Component

**Files**:

- `apps/ui/src/components/views/spec-view/shared/agent-selection.tsx` (NEW)
- `apps/ui/src/components/views/spec-view/shared/use-agent-selection.ts` (NEW)

This extracts the agent selection UI pattern from `add-feature-dialog.tsx` into a reusable component.

**Key exports**:

```typescript
// agent-selection.tsx
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

// use-agent-selection.ts
export function useAgentSelection(options?: {
  initialMode?: 'party' | 'individual' | 'skip';
  maxAgents?: number;
}) {
  // State management hook for agent selection
  // Returns: { mode, setMode, selectedAgentIds, toggleAgent, getAgentIds, ... }
}

// agent-selection.tsx
export function AgentSelection(props: {
  mode: 'party' | 'individual' | 'skip';
  onModeChange: (mode) => void;
  selectedAgentIds: Set<string>;
  onAgentSelectionChange: (ids: Set<string>) => void;
  agents: Array<{ id; label; icon }>;
  isLoading?: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  // Renders the UI for agent selection
}
```

**Full implementation**: See Appendix A for complete component code.

#### 2.2 Integrate into Create Spec Dialog

**File**: `apps/ui/src/components/views/spec-view/dialogs/create-spec-dialog.tsx`

**Changes**:

```tsx
import { AgentSelection, useAgentSelection, ALL_EXECUTIVE_AGENT_IDS } from '../shared/agent-selection';
import { useBmadPersonas } from '@/hooks/use-bmad-personas';

export function CreateSpecDialog({ ... }: CreateSpecDialogProps) {
  // Load BMAD personas
  const { personas, isLoading: isLoadingPersonas } = useBmadPersonas({ enabled: open });

  // Agent selection state
  const agentSelection = useAgentSelection({
    initialMode: 'party',  // Default to Party Mode
  });

  // Build agent options from personas
  const agentOptions = useMemo(() => {
    return ALL_EXECUTIVE_AGENT_IDS
      .map(id => personas.find(p => p.id === id))
      .filter((p): p is PersonaDescriptor => p !== undefined)
      .map(persona => ({
        id: persona.id,
        label: persona.label,
        icon: persona.icon ?? '🤖',
      }));
  }, [personas]);

  // Modified create handler
  const handleCreate = () => {
    onCreateSpec({
      projectOverview,
      generateFeatures,
      analyzeProject,
      featureCount,
      agentIds: agentSelection.getAgentIds(),  // NEW: Pass agent IDs
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate App Specification</DialogTitle>
        </DialogHeader>

        {/* Existing project overview textarea */}
        <div className="space-y-4">
          <Label>Project Overview</Label>
          <Textarea
            value={projectOverview}
            onChange={(e) => onProjectOverviewChange(e.target.value)}
            rows={6}
            placeholder="Describe your project..."
          />
        </div>

        {/* Existing analyze project checkbox */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="analyze-project"
            checked={analyzeProject}
            onCheckedChange={onAnalyzeProjectChange}
          />
          <Label htmlFor="analyze-project">
            Analyze current project for additional context
          </Label>
        </div>

        {/* === NEW: Agent Selection === */}
        <AgentSelection
          mode={agentSelection.mode}
          onModeChange={agentSelection.setMode}
          selectedAgentIds={agentSelection.selectedAgentIds}
          onAgentSelectionChange={(ids) => {
            // Sync set to internal state
            agentSelection.selectedAgentIds.forEach(id => {
              if (!ids.has(id)) agentSelection.toggleAgent(id);
            });
            ids.forEach(id => {
              if (!agentSelection.selectedAgentIds.has(id)) agentSelection.toggleAgent(id);
            });
          }}
          agents={agentOptions}
          isLoading={isLoadingPersonas}
          disabled={isCreatingSpec}
          compact={true}
        />

        {/* Existing generate features checkbox */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="generate-features"
            checked={generateFeatures}
            onCheckedChange={onGenerateFeaturesChange}
          />
          <Label htmlFor="generate-features">
            Generate feature list from spec
          </Label>
        </div>

        <DialogFooter>
          <Button onClick={onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleCreate}
            disabled={!projectOverview.trim() || isCreatingSpec}
          >
            {isCreatingSpec ? 'Generating...' : 'Generate Spec'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### 2.3 Update Spec Generation Hook

**File**: `apps/ui/src/components/views/spec-view/hooks/use-spec-generation.ts`

**Changes**:

```typescript
// Add agent tracking state
// NOTE: Keep IDs (for API) separate from display names (for UI/progress).
const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(ALL_EXECUTIVE_AGENT_IDS);
const [activeAgentNames, setActiveAgentNames] = useState<string[]>([]);

// Modify handleCreateSpec to pass agentIds
const handleCreateSpec = useCallback(async () => {
  setIsCreating(true);
  setErrorMessage(null);

  try {
    await api.specRegeneration.create(
      currentProject.path,
      projectOverview.trim(),
      generateFeatures,
      analyzeProjectOnCreate,
      generateFeatures ? featureCountOnCreate : undefined,
      // NEW: Pass agent IDs as 6th parameter (requires API extension)
      selectedAgentIds.length > 0 ? selectedAgentIds : undefined
    );
  } catch (error) {
    setErrorMessage(error.message);
  }
}, [, /* deps */ selectedAgentIds]); // Add to deps

// Handle new event type
useEffect(() => {
  const unsubscribe = api.specRegeneration.onEvent((event) => {
    if (event.type === 'spec_agent_selection') {
      setActiveAgentNames(event.agentNames);
      // Optionally show toast
      toast.success(`Using ${event.agentNames.join(', ')} for analysis`);
    }
    // ... existing event handlers ...
  });
  return unsubscribe;
}, []);

// Export selection + display state for UI use
return {
  // ... existing exports ...
  selectedAgentIds,
  setSelectedAgentIds,
  activeAgentNames,
};
```

#### 2.4 Extend Electron API Types

**File**: `apps/ui/src/types/electron.d.ts`

**Changes**:

```typescript
export interface SpecRegenerationAPI {
  // Extend existing create signature
  create: (
    projectPath: string,
    projectOverview: string,
    generateFeatures?: boolean,
    analyzeProject?: boolean,
    maxFeatures?: number,
    agentIds?: string[] // NEW: Optional agent IDs
  ) => Promise<{ success: boolean; error?: string }>;

  // Extend existing generate signature
  generate: (
    projectPath: string,
    projectDefinition: string,
    generateFeatures?: boolean,
    analyzeProject?: boolean,
    maxFeatures?: number,
    agentIds?: string[] // NEW: Optional agent IDs
  ) => Promise<{ success: boolean; error?: string }>;

  // ... rest unchanged ...
}

export type SpecRegenerationEvent =
  // ... existing events ...
  {
    type: 'spec_agent_selection';
    agentIds: string[];
    agentNames: string[];
    projectPath: string;
  };
```

**Also update**: `apps/ui/src/lib/http-api-client.ts` to accept the new optional `agentIds` argument and include it in the POST bodies for:

- `/api/spec-regeneration/create`
- `/api/spec-regeneration/generate`

### Phase 3: Apply to Regenerate Dialog (2 hours)

Repeat Phase 2.2 changes for `regenerate-spec-dialog.tsx` (near-identical implementation).

### Phase 4: Testing (2-4 hours)

See [Testing Strategy](#7-testing-strategy) below.

---

## 4. UI/UX Design

### Layout in Spec Dialog

```
┌────────────────────────────────────────────────┐
│ Generate App Specification                     │
├────────────────────────────────────────────────┤
│                                                │
│ Project Overview                               │
│ ┌────────────────────────────────────────────┐ │
│ │ Describe your project...                   │ │
│ │                                            │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ [✓] Analyze current project for context       │
│                                                │
│ Agent Collaboration                            │
│ ┌────────────────────────────────────────────┐ │
│ │ [●] Party Mode          [Recommended]      │ │
│ │     All 9 executive agents deliberate      │ │
│ │     Sage, Theo, Finn, Cerberus, Mary...    │ │
│ │                                            │ │
│ │ [ ] Select Individual Agents               │ │
│ │     Choose specific agents (up to 9)       │ │
│ │                                            │ │
│ │ [ ] Skip                                   │ │
│ │     Fast single-agent generation           │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ [✓] Generate feature list from spec           │
│     ● 20  ● 50  ● 100 features                 │
│                                                │
│ ┌────────────────────────────────────────────┐ │
│ │ Estimated cost: ~$2.50 (sonnet)            │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│              [Cancel]  [Generate Spec]         │
└────────────────────────────────────────────────┘
```

### Compact Mode (when expanded in Individual mode)

```
┌────────────────────────────────────────────────┐
│ Selected Agents: 3/9              [Clear All]  │
├────────────────────────────────────────────────┤
│ [✓] 🎯 Sage       Strategist/Marketer         │
│ [✓] 🏗️  Theo       Architect                   │
│ [ ] 🚀 Finn       Delivery Manager            │
│ [✓] 🛡️  Cerberus   Security Guardian           │
│ [ ] 📊 Mary       Analyst                     │
│ [ ] 💰 Walt       Financial                   │
│ [ ] ⚙️  Axel       Operations                  │
│ [ ] ⚡ Apex       Performance                 │
│ [ ] 🧘 Zen        Clean Code                  │
└────────────────────────────────────────────────┘
```

### Progress Tracking (during generation)

When agents are selected, show which agents are active:

```
┌────────────────────────────────────────────────┐
│ Generating Specification...                   │
├────────────────────────────────────────────────┤
│ Agents: Sage, Theo, Finn, Cerberus, Mary,     │
│         Walt, Axel, Apex, Zen                  │
│                                                │
│ [=========>                ] 45%               │
│ Analyzing project structure...                 │
└────────────────────────────────────────────────┘
```

---

## 5. API Changes

**Note**: Server code lives in `apps/server/src/routes/app-spec/*`, but it is mounted at `/api/spec-regeneration` in `apps/server/src/index.ts`.

### Request Body Extensions

**POST** `/api/spec-regeneration/create`
**POST** `/api/spec-regeneration/generate`

**New optional fields**:

```typescript
// /api/spec-regeneration/create
{
  projectPath: string;
  projectOverview: string;
  generateFeatures?: boolean;
  analyzeProject?: boolean;
  maxFeatures?: number;
  // NEW: Optional agent selection
  agentIds?: string[];  // e.g., ['bmad:strategist-marketer', 'bmad:technologist-architect']
}

// /api/spec-regeneration/generate
{
  projectPath: string;
  projectDefinition: string;
  generateFeatures?: boolean;
  analyzeProject?: boolean;
  maxFeatures?: number;
  // NEW: Optional agent selection
  agentIds?: string[];  // e.g., ['bmad:strategist-marketer', 'bmad:technologist-architect']
}
```

### Event Extensions

**New event type** via `spec-regeneration:event`:

```typescript
{
  type: 'spec_agent_selection';
  agentIds: string[];
  agentNames: string[];  // Human-readable names
  projectPath: string;
}
```

### New Endpoint (Optional)

**POST** `/api/spec-regeneration/estimate`

**Request**:

```json
{
  "projectOverviewLength": 500,
  "agentIds": ["bmad:strategist-marketer", "bmad:technologist-architect"]
}
```

**Response**:

```json
{
  "success": true,
  "estimate": {
    "costUsd": 2.5,
    "durationSeconds": { "min": 60, "max": 120 },
    "agentCount": 2
  }
}
```

---

## 6. Backend Implementation

### Key Integration Point: BmadPersonaService

**Use existing method** (no new code needed):

```typescript
// apps/server/src/services/bmad-persona-service.ts

async resolveAgentCollab(params: {
  agentIds: string[];
  artifactsDir?: string;
  projectPath?: string;
}): Promise<ResolvedAgentCollab | null>
```

**Returns**:

```typescript
{
  agents: Array<{ id; name; icon; systemPrompt }>;
  combinedSystemPrompt: string; // Multi-agent collaboration prompt
  collaborationMode: 'sequential';
  model: string; // Lead agent's model
  thinkingBudget: number; // Lead agent's thinking budget
}
```

**How it works**:

1. Resolves each agent ID to its persona config
2. Builds a combined system prompt that instructs the model to:
   - Consider the task from each agent's perspective
   - Lead with first agent's analysis
   - Incorporate insights from other agents
   - Note disagreements or trade-offs
3. Returns a single prompt for ONE SDK call (not 9 separate calls)

### Implementation Notes

- **No new service needed** - Reuse `BmadPersonaService.resolveAgentCollab()`
- **Single SDK call** - Not 9 separate agent calls (much simpler than full PRP)
- **Sequential collaboration** - Model considers each agent's perspective within one call
- **Backwards compatible** - When `agentIds` is omitted, spec generation works as before

---

## 7. Testing Strategy

### Unit Tests

**New file**: `apps/server/tests/unit/routes/app-spec/generate-spec-with-agents.test.ts`

```typescript
describe('generateSpec with agent selection', () => {
  it('should accept agentIds parameter', async () => {
    const agentIds = ['bmad:strategist-marketer', 'bmad:technologist-architect'];
    await generateSpec(
      projectPath,
      overview,
      events,
      abortController,
      false,
      true,
      50,
      settingsService,
      agentIds,
      bmadPersonaService
    );

    expect(bmadPersonaService.resolveAgentCollab).toHaveBeenCalledWith({
      agentIds,
      projectPath,
    });
  });

  it('should work without agentIds (backwards compatible)', async () => {
    await generateSpec(
      projectPath,
      overview,
      events,
      abortController
    );

    // Should not call resolveAgentCollab
    expect(bmadPersonaService.resolveAgentCollab).not.toHaveBeenCalled();
  });

  it('should emit spec_agent_selection event', async () => {
    const agentIds = ['bmad:strategist-marketer'];
    let emittedEvent;
    events.on('spec-regeneration:event', (event) => {
      if (event.type === 'spec_agent_selection') {
        emittedEvent = event;
      }
    });

    await generateSpec(/* ... */, agentIds, bmadPersonaService);

    expect(emittedEvent).toMatchObject({
      type: 'spec_agent_selection',
      agentIds,
    });
  });
});
```

### Integration Tests

**New file**: `apps/server/tests/integration/app-spec-agent-selection.test.ts`

```typescript
describe('POST /api/spec-regeneration/generate with agents', () => {
  it('should generate spec with selected agents', async () => {
    const response = await fetch('http://localhost:3008/api/spec-regeneration/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectPath: testProjectPath,
        projectDefinition: 'Test project',
        agentIds: ['bmad:strategist-marketer', 'bmad:technologist-architect'],
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('should reject invalid agent IDs', async () => {
    const response = await fetch('http://localhost:3008/api/spec-regeneration/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectPath: testProjectPath,
        projectDefinition: 'Test project',
        agentIds: ['invalid-agent-id'],
      }),
    });

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Invalid agent');
  });
});
```

### E2E Tests

**New file**: `apps/ui/tests/spec/spec-agent-selection.spec.ts`

**Note**: The selectors below assume you add stable `data-testid` attributes to the spec view + dialogs (e.g. `create-spec-button`, `project-overview`, `generate-spec-button`, and the new agent selection controls). If you skip adding these attributes, update the selectors to match the existing UI.

```typescript
test('should show agent selection in create spec dialog', async ({ page }) => {
  await page.goto('/spec');
  await page.click('[data-testid="create-spec-button"]');

  // Verify agent selection UI is visible
  await expect(page.locator('text=Agent Collaboration')).toBeVisible();
  await expect(page.locator('text=Party Mode')).toBeVisible();

  // Select Party Mode
  await page.click('[data-testid="agent-mode-party"]');

  // Verify all 9 agents are selected
  const agentCheckboxes = page.locator('[data-testid^="agent-checkbox-"]');
  expect(await agentCheckboxes.count()).toBe(9);

  // Fill in project overview and submit
  await page.fill('[data-testid="project-overview"]', 'Test project');
  await page.click('[data-testid="generate-spec-button"]');

  // Verify generation starts
  await expect(page.locator('text=Generating Specification')).toBeVisible();
});

test('should allow individual agent selection', async ({ page }) => {
  await page.goto('/spec');
  await page.click('[data-testid="create-spec-button"]');

  // Switch to individual mode
  await page.click('[data-testid="agent-mode-individual"]');

  // Select specific agents
  await page.click('[data-testid="agent-checkbox-bmad:strategist-marketer"]');
  await page.click('[data-testid="agent-checkbox-bmad:technologist-architect"]');

  // Verify selection count
  await expect(page.locator('text=Selected: 2/9')).toBeVisible();
});
```

---

## 8. File Change Summary

### New Files (5)

| File                                                                       | Lines | Purpose                               |
| -------------------------------------------------------------------------- | ----- | ------------------------------------- |
| `apps/ui/src/components/views/spec-view/shared/agent-selection.tsx`        | ~400  | Reusable agent selection component    |
| `apps/ui/src/components/views/spec-view/shared/use-agent-selection.ts`     | ~150  | Agent selection state management hook |
| `apps/server/src/routes/app-spec/routes/estimate.ts`                       | ~50   | Cost estimation endpoint (optional)   |
| `apps/server/tests/unit/routes/app-spec/generate-spec-with-agents.test.ts` | ~100  | Unit tests                            |
| `apps/ui/tests/spec/spec-agent-selection.spec.ts`                          | ~80   | E2E tests                             |

### Modified Files (10)

| File                                                                        | Change Description                                              | Lines Changed |
| --------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------- |
| `apps/server/src/routes/app-spec/routes/generate.ts`                        | Add agentIds parsing, inject BmadPersonaService                 | ~15           |
| `apps/server/src/routes/app-spec/routes/create.ts`                          | Add agentIds parsing, inject BmadPersonaService                 | ~15           |
| `apps/server/src/routes/app-spec/generate-spec.ts`                          | Add agentIds parameter, integrate resolveAgentCollab()          | ~30           |
| `apps/server/src/routes/app-spec/index.ts`                                  | Register estimate route                                         | ~3            |
| `apps/ui/src/lib/http-api-client.ts`                                        | Include `agentIds` in `/api/spec-regeneration/*` request bodies | ~10           |
| `apps/ui/src/components/views/spec-view/types.ts`                           | Add agent selection props/types for spec dialogs                | ~15           |
| `apps/ui/src/components/views/spec-view/dialogs/create-spec-dialog.tsx`     | Add AgentSelection component                                    | ~40           |
| `apps/ui/src/components/views/spec-view/dialogs/regenerate-spec-dialog.tsx` | Add AgentSelection component                                    | ~40           |
| `apps/ui/src/components/views/spec-view/hooks/use-spec-generation.ts`       | Add agent state, handle events                                  | ~20           |
| `apps/ui/src/types/electron.d.ts`                                           | Extend API signatures and events                                | ~15           |

**Total**: ~5 new files, ~10 modified files, ~980 total lines of code (including tests)

---

## Appendix A: Agent Selection Component Code

**File**: `apps/ui/src/components/views/spec-view/shared/agent-selection.tsx`

```typescript
import { useState, useCallback, useMemo } from 'react';
import { Users, UserCog, Zap } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { PersonaDescriptor } from '@automaker/types';

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

export type AgentMode = 'party' | 'individual' | 'skip';

export interface AgentOption {
  id: string;
  label: string;
  icon: string;
}

export interface AgentSelectionProps {
  mode: AgentMode;
  onModeChange: (mode: AgentMode) => void;
  selectedAgentIds: Set<string>;
  onAgentSelectionChange: (ids: Set<string>) => void;
  agents: AgentOption[];
  isLoading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  testIdPrefix?: string;
}

export function AgentSelection({
  mode,
  onModeChange,
  selectedAgentIds,
  onAgentSelectionChange,
  agents,
  isLoading = false,
  disabled = false,
  compact = false,
  testIdPrefix = 'spec',
}: AgentSelectionProps) {
  const handleModeChange = (newMode: AgentMode) => {
    onModeChange(newMode);

    if (newMode === 'party') {
      onAgentSelectionChange(new Set(ALL_EXECUTIVE_AGENT_IDS));
    } else if (newMode === 'skip') {
      onAgentSelectionChange(new Set());
    }
  };

  const toggleAgent = (agentId: string) => {
    const next = new Set(selectedAgentIds);
    if (next.has(agentId)) {
      next.delete(agentId);
    } else if (next.size < 9) {
      next.add(agentId);
    }
    onAgentSelectionChange(next);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Agent Collaboration</label>

      {/* Party Mode Option */}
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
          mode === 'party'
            ? 'bg-primary/10 border-primary'
            : 'hover:bg-muted/50 border-border'
        )}
        onClick={() => !disabled && handleModeChange('party')}
        data-testid={`${testIdPrefix}-agent-mode-party`}
      >
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          mode === 'party' ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}>
          <Users className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">Party Mode</span>
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              Recommended
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            All 9 executive agents deliberate: Sage, Theo, Finn, Cerberus, Mary, Walt, Axel, Apex, Zen
          </p>
        </div>
        <Checkbox
          checked={mode === 'party'}
          onCheckedChange={() => handleModeChange('party')}
          disabled={disabled}
        />
      </div>

      {/* Individual Selection Option */}
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
          mode === 'individual'
            ? 'bg-primary/10 border-primary'
            : 'hover:bg-muted/50 border-border'
        )}
        onClick={() => !disabled && handleModeChange('individual')}
        data-testid={`${testIdPrefix}-agent-mode-individual`}
      >
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          mode === 'individual' ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}>
          <UserCog className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <span className="font-medium">Select Individual Agents</span>
          <p className="text-xs text-muted-foreground">
            Choose specific agents for focused analysis (up to 9)
          </p>
        </div>
        <Checkbox
          checked={mode === 'individual'}
          onCheckedChange={() => handleModeChange('individual')}
          disabled={disabled}
        />
      </div>

      {/* Individual agent list (when in individual mode) */}
      {mode === 'individual' && (
        <div className="ml-4 space-y-2 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Selected: {selectedAgentIds.size}/9</span>
            <button
              onClick={() => onAgentSelectionChange(new Set())}
              className="text-primary hover:underline"
              disabled={disabled}
            >
              Clear All
            </button>
          </div>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading agents...</div>
          ) : (
            agents.map((agent) => {
              const isSelected = selectedAgentIds.has(agent.id);
              return (
                <div
                  key={agent.id}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-md transition-colors cursor-pointer',
                    isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                  )}
                  onClick={() => !disabled && toggleAgent(agent.id)}
                  data-testid={`${testIdPrefix}-agent-checkbox-${agent.id}`}
                >
                  <Checkbox
                    checked={isSelected}
                    disabled={disabled}
                    onCheckedChange={() => toggleAgent(agent.id)}
                  />
                  <span className="text-base">{agent.icon}</span>
                  <span className="text-sm flex-1">{agent.label}</span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Skip Option */}
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
          mode === 'skip'
            ? 'bg-primary/10 border-primary'
            : 'hover:bg-muted/50 border-border'
        )}
        onClick={() => !disabled && handleModeChange('skip')}
        data-testid={`${testIdPrefix}-agent-mode-skip`}
      >
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          mode === 'skip' ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}>
          <Zap className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <span className="font-medium">Skip</span>
          <p className="text-xs text-muted-foreground">
            Fast single-agent generation without multi-agent collaboration
          </p>
        </div>
        <Checkbox
          checked={mode === 'skip'}
          onCheckedChange={() => handleModeChange('skip')}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

// Hook for managing agent selection state
export function useAgentSelection(options: {
  initialMode?: AgentMode;
  maxAgents?: number;
} = {}) {
  const { initialMode = 'party', maxAgents = 9 } = options;

  const [mode, setMode] = useState<AgentMode>(initialMode);
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(
    () => new Set(initialMode === 'party' ? ALL_EXECUTIVE_AGENT_IDS : [])
  );

  const toggleAgent = useCallback((agentId: string) => {
    setSelectedAgentIds((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else if (next.size < maxAgents) {
        next.add(agentId);
      }
      return next;
    });
  }, [maxAgents]);

  const getAgentIds = useCallback((): string[] | undefined => {
    if (mode === 'skip') return undefined;
    return selectedAgentIds.size > 0 ? Array.from(selectedAgentIds) : undefined;
  }, [mode, selectedAgentIds]);

  return {
    mode,
    setMode,
    selectedAgentIds,
    setSelectedAgentIds,
    toggleAgent,
    getAgentIds,
  };
}
```

---

## Success Criteria

- [ ] Agent selection UI appears in both Create and Regenerate spec dialogs
- [ ] Party Mode (all 9 agents) works and is the default
- [ ] Individual agent selection works (up to 9 agents)
- [ ] Skip mode works (single-agent, existing behavior)
- [ ] `useBmadPersonas()` hook loads 9 executive agents correctly
- [ ] `agentIds` parameter passes through API correctly
- [ ] `BmadPersonaService.resolveAgentCollab()` is called with selected agents
- [ ] Spec generation uses combined multi-agent prompt
- [ ] Backwards compatibility: Existing spec generation without agents still works
- [ ] All tests pass (unit, integration, E2E)

---

## Sign-Off

**Prepared By**: Claude Sonnet 4.5 + 12 Opus Investigation Agents
**Review Required**: Yes - Claude Dev Team
**Execution Ready**: Yes - All technical details specified
**Estimated Timeline**: 1-2 days (8-16 hours)

---

**Next Steps**:

1. Claude team reviews PRP
2. Approve or request changes
3. Execute implementation in phases
4. Test thoroughly (unit, integration, E2E)
5. Deploy and gather user feedback

**Key Advantage**: This is a much simpler implementation than the full multi-agent orchestration PRP, reusing existing `resolveAgentCollab()` method instead of building new services. It provides 80% of the value with 20% of the complexity.
