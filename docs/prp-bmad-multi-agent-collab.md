# PRP: BMAD Multi-Agent Collaboration

## Overview

Transform the BMAD agent selection from single-select to multi-select, enabling true multi-agent collaboration on tasks. When multiple agents are selected, they should work together — not just concatenate system prompts.

## Current State

**Single-select implementation:**

- `personaId?: string` on Feature type
- Single `<Select>` dropdown in UI
- `resolvePersona()` returns one agent's system prompt
- Auto Mode applies single persona prompt

**Relevant files:**

- `libs/types/src/feature.ts:33` — `personaId?: string`
- `libs/types/src/settings.ts:165` — `personaId?: string` in AIProfile
- `apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx:145,511-546`
- `apps/server/src/services/bmad-persona-service.ts:122-182` — `resolvePersona()`
- `apps/server/src/services/auto-mode-service.ts:632-637` — persona resolution

---

## Design Decisions Required

### Decision 1: Collaboration Mode

How should multiple agents collaborate?

**Option A: Sequential Consultation (Recommended)**
Each agent reviews the work, adds their perspective, then passes to next agent. Final output synthesizes all perspectives.

```
User prompt → Agent 1 analysis → Agent 2 review → Agent 3 refinement → Synthesized output
```

**Option B: Parallel Deliberation (Party Mode Style)**
All agents respond simultaneously, then a synthesis step combines their outputs.

```
User prompt → [Agent 1, Agent 2, Agent 3 in parallel] → Synthesis → Output
```

**Option C: Lead + Advisors**
First selected agent leads, others provide advisory input.

```
User prompt → Lead agent (with advisor context) → Output with advisor annotations
```

**Recommendation:** Start with **Option A (Sequential)** for implementation simplicity, with Option B available as "Party Synthesis" (already exists).

### Decision 2: Maximum Agents

How many agents can be selected?

- **Recommended:** Maximum 4 agents
- **Rationale:** More than 4 creates prompt bloat and diminishing returns

### Decision 3: Agent Order

Should users control execution order?

- **Initial:** No — execute in selection order (first clicked = lead)
- **Future:** Add drag-to-reorder capability

---

## Technical Design

### 1. Data Model Changes

#### 1.1 Feature Type

**File:** `libs/types/src/feature.ts`

```typescript
// BEFORE (line 33)
personaId?: string;

// AFTER
/** @deprecated Use agentIds instead */
personaId?: string;
/** Selected BMAD agents for collaboration (max 4) */
agentIds?: string[];
```

#### 1.2 AIProfile Type

**File:** `libs/types/src/settings.ts`

```typescript
// BEFORE (line 165)
personaId?: string;

// AFTER
/** @deprecated Use agentIds instead */
personaId?: string;
/** Selected BMAD agents for this profile */
agentIds?: string[];
```

#### 1.3 ResolvedPersona Type (or rename to ResolvedAgents)

**File:** `libs/types/src/bmad.ts`

```typescript
// Add new type
export interface ResolvedAgentCollab {
  agents: Array<{
    id: string;
    name: string;
    icon: string;
    systemPrompt: string;
  }>;
  combinedSystemPrompt: string;
  collaborationMode: 'sequential' | 'parallel' | 'lead-advisor';
  model?: string;
  thinkingBudget?: number;
}
```

---

### 2. UI Changes

#### 2.1 Multi-Select Agent Component

**File:** `apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx`

Replace single `<Select>` with checkbox-based multi-select (similar to `AncestorContextSection`):

```tsx
// State change
const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());

// Component (lines 511-546 replacement)
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Users className="w-4 h-4 text-muted-foreground" />
      <Label>Add BMAD Agents to Task</Label>
      <span className="text-xs text-muted-foreground">({selectedAgentIds.size}/4 max)</span>
    </div>
    {selectedAgentIds.size > 0 && (
      <Button variant="ghost" size="sm" onClick={() => setSelectedAgentIds(new Set())}>
        Clear All
      </Button>
    )}
  </div>

  <p className="text-xs text-muted-foreground">
    Select multiple agents to collaborate on this task. First selected leads.
  </p>

  <div className="space-y-1 max-h-[200px] overflow-y-auto border rounded-lg p-2 bg-muted/20">
    {/* Group: Strategy & Planning */}
    <div className="text-xs font-medium text-muted-foreground px-2 py-1">Strategy & Planning</div>
    {bmadPersonas
      .filter((p) => ['bmad:pm', 'bmad:analyst', 'bmad:architect'].includes(p.id))
      .map((agent) => (
        <AgentCheckboxItem
          key={agent.id}
          agent={agent}
          isSelected={selectedAgentIds.has(agent.id)}
          isDisabled={!selectedAgentIds.has(agent.id) && selectedAgentIds.size >= 4}
          onToggle={() => toggleAgentSelection(agent.id)}
        />
      ))}

    {/* Group: Implementation */}
    <div className="text-xs font-medium text-muted-foreground px-2 py-1 mt-2">Implementation</div>
    {/* ... similar for dev, sm, tea, quick-flow */}

    {/* Group: Design & Creative */}
    {/* ... ux-designer, storyteller, brainstorming-coach */}
  </div>
</div>;
```

#### 2.2 AgentCheckboxItem Sub-Component

Create or inline:

```tsx
function AgentCheckboxItem({ agent, isSelected, isDisabled, onToggle }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-md transition-colors',
        isSelected ? 'bg-primary/10' : 'hover:bg-muted/50',
        isDisabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <Checkbox
        id={`agent-${agent.id}`}
        checked={isSelected}
        disabled={isDisabled}
        onCheckedChange={onToggle}
      />
      <span className="text-base">{agent.icon}</span>
      <label htmlFor={`agent-${agent.id}`} className="text-sm cursor-pointer flex-1">
        {agent.label}
      </label>
      {isSelected && selectedAgentIds.size > 1 && (
        <span className="text-xs text-muted-foreground">
          #{Array.from(selectedAgentIds).indexOf(agent.id) + 1}
        </span>
      )}
    </div>
  );
}
```

#### 2.3 Feature Submission

Update `handleAdd()` to pass array:

```typescript
onAdd({
  // ...existing fields
  // personaId: selectedPersonaId,  // REMOVE
  agentIds: selectedAgentIds.size > 0 ? Array.from(selectedAgentIds) : undefined,
});
```

---

### 3. Server-Side Changes

#### 3.1 BmadPersonaService — New Method

**File:** `apps/server/src/services/bmad-persona-service.ts`

```typescript
async resolveAgentCollab(params: {
  agentIds?: string[];
  artifactsDir?: string;
  projectPath?: string;
}): Promise<ResolvedAgentCollab | null> {
  const agentIds = params.agentIds?.filter(Boolean);
  if (!agentIds || agentIds.length === 0) return null;

  // Resolve each agent
  const agents = await Promise.all(
    agentIds.map(async (id) => {
      const resolved = await this.resolvePersona({
        personaId: id,
        artifactsDir: params.artifactsDir,
        projectPath: params.projectPath,
      });
      const manifest = await this.getAgentManifestRow(id);
      return {
        id,
        name: manifest?.displayName || id,
        icon: manifest?.icon || '',
        systemPrompt: resolved?.systemPrompt || '',
      };
    })
  );

  // Build combined prompt for sequential collaboration
  const combinedSystemPrompt = this.buildCollaborativePrompt(agents);

  // Use lead agent's defaults
  const leadDefaults = this.getAgentDefaults(agentIds[0]);

  return {
    agents,
    combinedSystemPrompt,
    collaborationMode: 'sequential',
    model: leadDefaults.model,
    thinkingBudget: leadDefaults.thinkingBudget,
  };
}

private buildCollaborativePrompt(agents: Array<{id: string; name: string; icon: string; systemPrompt: string}>): string {
  if (agents.length === 1) {
    return agents[0].systemPrompt;
  }

  const agentRoster = agents
    .map((a, i) => `${i + 1}. ${a.icon} **${a.name}**`)
    .join('\n');

  const agentContexts = agents
    .map((a, i) => `### Agent ${i + 1}: ${a.name}\n${a.systemPrompt}`)
    .join('\n\n');

  return `# Multi-Agent Collaboration Mode

You are operating in **collaborative mode** with ${agents.length} BMAD agents working together.

## Agent Team
${agentRoster}

## Collaboration Protocol
1. Consider the task from each agent's perspective sequentially
2. ${agents[0].name} leads the analysis
3. Each subsequent agent reviews and adds their expertise
4. Synthesize perspectives into a cohesive response
5. Note any disagreements or trade-offs between agent viewpoints

## Agent Contexts
${agentContexts}

## Output Format
When responding:
- Lead with ${agents[0].name}'s primary analysis
- Incorporate insights from other agents naturally
- If agents would disagree, present the trade-offs
- End with a synthesized recommendation

---`;
}
```

#### 3.2 Auto Mode Service Updates

**File:** `apps/server/src/services/auto-mode-service.ts`

```typescript
// Around line 632, update persona resolution:

// BEFORE
const effectivePersonaId = feature.personaId || selectedProfile?.personaId;
const resolvedPersona = await this.bmadPersonaService.resolvePersona({
  personaId: effectivePersonaId,
  artifactsDir: `${bmadArtifactsDir} (relative to project root)`,
  projectPath,
});

// AFTER
const effectiveAgentIds = feature.agentIds?.length
  ? feature.agentIds
  : feature.personaId // Backward compat
    ? [feature.personaId]
    : selectedProfile?.agentIds?.length
      ? selectedProfile.agentIds
      : selectedProfile?.personaId
        ? [selectedProfile.personaId]
        : undefined;

let resolvedPersona: ResolvedPersona | null = null;
let resolvedCollab: ResolvedAgentCollab | null = null;

if (effectiveAgentIds && effectiveAgentIds.length > 1) {
  resolvedCollab = await this.bmadPersonaService.resolveAgentCollab({
    agentIds: effectiveAgentIds,
    artifactsDir: `${bmadArtifactsDir} (relative to project root)`,
    projectPath,
  });
} else if (effectiveAgentIds && effectiveAgentIds.length === 1) {
  resolvedPersona = await this.bmadPersonaService.resolvePersona({
    personaId: effectiveAgentIds[0],
    artifactsDir: `${bmadArtifactsDir} (relative to project root)`,
    projectPath,
  });
}

const agentSystemPrompt = resolvedCollab?.combinedSystemPrompt || resolvedPersona?.systemPrompt;
```

---

### 4. Migration & Backward Compatibility

#### 4.1 Data Migration

Features with `personaId` should continue working:

```typescript
// In auto-mode-service.ts, already handled above with backward compat logic
const effectiveAgentIds = feature.agentIds?.length
  ? feature.agentIds
  : feature.personaId
    ? [feature.personaId]  // Backward compat: convert single to array
    : ...
```

#### 4.2 UI Migration

The `selectedPersonaId` state becomes `selectedAgentIds: Set<string>`:

```typescript
// When loading existing feature with personaId (edit dialog)
useEffect(() => {
  if (feature?.personaId && !feature?.agentIds?.length) {
    setSelectedAgentIds(new Set([feature.personaId]));
  } else if (feature?.agentIds?.length) {
    setSelectedAgentIds(new Set(feature.agentIds));
  }
}, [feature]);
```

---

## Implementation Phases

### Phase 1: Research (This PRP)

1. **Verify assumptions** — Read all files listed, confirm current implementation
2. **Identify all `personaId` usages** — Map every file that needs changes
3. **Validate UI pattern** — Confirm `AncestorContextSection` pattern works for this use case
4. **Report findings** — List any unexpected complexities

### Phase 2: Data Model

1. Add `agentIds?: string[]` to Feature type
2. Add `agentIds?: string[]` to AIProfile type
3. Add `ResolvedAgentCollab` type
4. Keep `personaId` as deprecated for backward compat

### Phase 3: Server-Side

1. Add `resolveAgentCollab()` to `BmadPersonaService`
2. Add `buildCollaborativePrompt()` private method
3. Update `AutoModeService` to use new method
4. Add backward compat logic for `personaId`

### Phase 4: UI

1. Update state from `selectedPersonaId` to `selectedAgentIds: Set<string>`
2. Replace `<Select>` with checkbox-based multi-select
3. Add agent grouping by category
4. Add max 4 limit with visual feedback
5. Update `handleAdd()` to pass `agentIds` array
6. Update `edit-feature-dialog.tsx` similarly

### Phase 5: Testing

1. Unit tests for `resolveAgentCollab()`
2. Unit tests for backward compat
3. Manual test: create feature with 1, 2, 3, 4 agents
4. Manual test: edit existing feature with old `personaId`
5. Verify collaboration prompt is coherent

---

## Files to Modify

| File                                               | Changes                                          |
| -------------------------------------------------- | ------------------------------------------------ |
| `libs/types/src/feature.ts`                        | Add `agentIds?: string[]`, deprecate `personaId` |
| `libs/types/src/settings.ts`                       | Add `agentIds?: string[]` to AIProfile           |
| `libs/types/src/bmad.ts`                           | Add `ResolvedAgentCollab` interface              |
| `apps/server/src/services/bmad-persona-service.ts` | Add `resolveAgentCollab()`                       |
| `apps/server/src/services/auto-mode-service.ts`    | Update persona resolution (~line 632)            |
| `apps/ui/src/.../add-feature-dialog.tsx`           | Multi-select UI                                  |
| `apps/ui/src/.../edit-feature-dialog.tsx`          | Multi-select UI                                  |
| `apps/ui/src/.../use-board-actions.ts`             | Update submission handling                       |

---

## Acceptance Criteria

- [ ] Can select 1-4 BMAD agents in Add Feature dialog
- [ ] Agents grouped by category (Strategy, Implementation, Creative)
- [ ] Visual indication of selection order (lead agent highlighted)
- [ ] Max 4 agents enforced with disabled checkboxes
- [ ] Clear All button works
- [ ] Existing features with `personaId` continue working
- [ ] Multi-agent prompt includes collaboration instructions
- [ ] Each agent's context included in system prompt
- [ ] Edit Feature dialog supports multi-select
- [ ] Build/TypeScript/Lint all pass

---

## Report Format

After research phase, report:

```
BMAD Multi-Agent Collaboration - Research Report

Files Analyzed:
- [file]: [findings]

personaId Usages Found:
1. [file:line] — [usage context]
2. ...

Unexpected Complexities:
- [issue 1]
- [issue 2]

UI Pattern Validation:
- AncestorContextSection pattern: [suitable/needs modification]

Recommendations:
- [any changes to proposed design]

Ready for Implementation: [YES/NO]
```
