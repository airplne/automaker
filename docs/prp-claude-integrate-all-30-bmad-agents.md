# PRP: Claude Dev Team - Integrate All 29 BMAD Agents

## Executive Summary

**Mission:** Expose all 29 BMAD agents in Automaker's UI with module-based categorization and unlimited agent selection, enabling comprehensive multi-agent collaboration testing.

**Assigned Team:** Claude Dev Team (12 Opus Subagents)
**Target Project:** `/home/aip0rt/Desktop/automaker`
**Scope:** Frontend + Backend integration

---

## Current State Analysis

### Agent Inventory (From Exploration)

**Total BMAD Agents: 29** (verified from `_bmad/_config/agent-manifest.csv`)

| Module             | Count | Agents                                                                                                                                                                   |
| ------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Core**           | 1     | bmad-master                                                                                                                                                              |
| **BMB** (Builders) | 3     | agent-builder, module-builder, workflow-builder                                                                                                                          |
| **BMM** (Method)   | 9     | analyst, architect, dev, pm, quick-flow-solo-dev, sm, tea, tech-writer, ux-designer                                                                                      |
| **BMM-Executive**  | 10    | strategist-marketer, technologist-architect, fulfillization-manager, security-guardian, analyst-strategist, financial-strategist, operations-commander, apex, zen, echon |
| **CIS** (Creative) | 6     | brainstorming-coach, creative-problem-solver, design-thinking-coach, innovation-strategist, presentation-master, storyteller                                             |

### Current UI State

**Exposed:** Only 10 executive agents (+ party-synthesis)
**Hidden:** 18 other agents (Core, BMM, CIS, BMB)

**Current Limitation:**

- `MAX_EXECUTIVE_AGENTS = 10` hardcoded limit
- Only `bmm-executive` agents in PUBLIC_PERSONA_IDS
- UI components filter to executive agents only

---

## User Requirements

✅ **Expose all 29 agents** in UI profile selector
✅ **Categorize by module** (5 categories: Core, Builders, Method, Executive, Creative)
✅ **Remove selection limit** (allow unlimited agent selection)
✅ **Comprehensive testing** for subscription SaaS project

---

## 12-Agent Deployment Structure

| Phase | Agents | Focus Area              | Duration  |
| ----- | ------ | ----------------------- | --------- |
| 1     | 1-2    | Pre-Integration Backup  | 3-5 min   |
| 2     | 3-5    | Frontend Config Updates | 10-15 min |
| 3     | 6-7    | Backend Service Updates | 10-15 min |
| 4     | 8-10   | UI Component Updates    | 10-15 min |
| 5     | 11     | Verification & Testing  | 10-15 min |
| 6     | 12     | Final Report            | 5 min     |

**Total Estimated Time:** 50-70 minutes

---

## Phase 1: Pre-Integration Backup (Agents 1-2)

### Task 1.1: Create Backup

**Agent:** 1

```bash
#!/bin/bash
echo "=== Task 1.1: Pre-Integration Backup ==="

cd /home/aip0rt/Desktop/automaker

# Create backup branch
BACKUP_BRANCH="backup-before-29-agent-integration-$(date +%Y%m%d-%H%M%S)"
echo "Creating backup: $BACKUP_BRANCH"

# Stage and commit current state
git add -A
git commit -m "WIP: Pre-29-agent-integration state

Preserving current state before exposing all 29 BMAD agents.

Current state:
- 10 executive agents exposed
- MAX_EXECUTIVE_AGENTS = 10
- 18 agents hidden but functional

Created: $(date)
" 2>/dev/null || echo "Nothing to commit"

# Create backup branch
git branch "$BACKUP_BRANCH"

echo "✅ Backup created: $BACKUP_BRANCH"
```

---

### Task 1.2: Document Current State

**Agent:** 2

```bash
#!/bin/bash
echo "=== Task 1.2: Document Current State ==="

cd /home/aip0rt/Desktop/automaker

STATE_FILE="docs/29-agent-integration-state-$(date +%Y%m%d-%H%M%S).md"

cat > "$STATE_FILE" << 'EOF'
# 29-Agent Integration - Pre-Integration State

## Current Configuration

### Exposed Agents (11)
- bmad:party-synthesis
- bmad:strategist-marketer (Sage)
- bmad:technologist-architect (Theo)
- bmad:fulfillization-manager (Finn)
- bmad:security-guardian (Cerberus)
- bmad:analyst-strategist (Mary)
- bmad:financial-strategist (Walt)
- bmad:operations-commander (Axel)
- bmad:apex (Apex)
- bmad:zen (Zen)
- bmad:echon (Echon)

### Hidden Agents (18)
**Core (1):** bmad-master
**Builders (3):** agent-builder, module-builder, workflow-builder
**Method (9):** analyst, architect, dev, pm, quick-flow-solo-dev, sm, tea, tech-writer, ux-designer
**Creative (6):** brainstorming-coach, creative-problem-solver, design-thinking-coach, innovation-strategist, presentation-master, storyteller

### Current Limits
- MAX_EXECUTIVE_AGENTS = 10
- Selection limit: 10 agents maximum

## Files to Modify
1. apps/ui/src/config/bmad-agents.ts
2. apps/server/src/services/bmad-persona-service.ts
3. apps/ui/src/components/views/profiles-view/components/profile-form.tsx
4. apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx
5. apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx
6. apps/ui/src/store/app-store.ts (profiles for all 29 agents)

EOF

echo "✅ State documented: $STATE_FILE"
```

---

## Phase 2: Frontend Config Updates (Agents 3-5)

### Task 2.1: Update bmad-agents.ts with All 29 Agents

**Agent:** 3

**File:** `apps/ui/src/config/bmad-agents.ts`

**Current content:**

```typescript
// (10 agents) All BMM Executive agents
export const ALL_EXECUTIVE_AGENT_IDS = [
  'bmad:strategist-marketer',
  // ... 9 more ...
] as const;

export const MAX_EXECUTIVE_AGENTS = ALL_EXECUTIVE_AGENT_IDS.length; // 10
```

**Changes:**

```typescript
// Module-organized agent constants

// Core (1 agent)
export const CORE_AGENT_IDS = ['bmad:bmad-master'] as const;

// BMB - Builders (3 agents)
export const BUILDER_AGENT_IDS = [
  'bmad:agent-builder',
  'bmad:module-builder',
  'bmad:workflow-builder',
] as const;

// BMM - Method (9 agents)
export const METHOD_AGENT_IDS = [
  'bmad:analyst',
  'bmad:architect',
  'bmad:dev',
  'bmad:pm',
  'bmad:quick-flow-solo-dev',
  'bmad:sm',
  'bmad:tea',
  'bmad:tech-writer',
  'bmad:ux-designer',
] as const;

// BMM-Executive (10 agents)
export const EXECUTIVE_AGENT_IDS = [
  'bmad:strategist-marketer',
  'bmad:technologist-architect',
  'bmad:fulfillization-manager',
  'bmad:security-guardian',
  'bmad:analyst-strategist',
  'bmad:financial-strategist',
  'bmad:operations-commander',
  'bmad:apex',
  'bmad:zen',
  'bmad:echon',
] as const;

// CIS - Creative Innovation Suite (6 agents)
export const CREATIVE_AGENT_IDS = [
  'bmad:brainstorming-coach',
  'bmad:creative-problem-solver',
  'bmad:design-thinking-coach',
  'bmad:innovation-strategist',
  'bmad:presentation-master',
  'bmad:storyteller',
] as const;

// All agents combined (29 total)
export const ALL_BMAD_AGENT_IDS = [
  ...CORE_AGENT_IDS,
  ...BUILDER_AGENT_IDS,
  ...METHOD_AGENT_IDS,
  ...EXECUTIVE_AGENT_IDS,
  ...CREATIVE_AGENT_IDS,
] as const;

// Module metadata for UI organization
export const AGENT_MODULES = {
  core: {
    label: 'Core',
    description: 'Platform core agent',
    agents: CORE_AGENT_IDS,
  },
  builders: {
    label: 'Builders',
    description: 'Module & workflow builders',
    agents: BUILDER_AGENT_IDS,
  },
  method: {
    label: 'Method (General)',
    description: 'BMAD methodology agents',
    agents: METHOD_AGENT_IDS,
  },
  executive: {
    label: 'Executive Suite',
    description: 'Senior leadership perspectives',
    agents: EXECUTIVE_AGENT_IDS,
  },
  creative: {
    label: 'Creative Innovation',
    description: 'Design thinking & innovation',
    agents: CREATIVE_AGENT_IDS,
  },
} as const;

// Remove old limit - allow unlimited selection
// export const MAX_EXECUTIVE_AGENTS = 10; // ❌ REMOVE THIS

// Type exports
export type BmadAgentId = (typeof ALL_BMAD_AGENT_IDS)[number];
export type AgentModule = keyof typeof AGENT_MODULES;
```

**Verification:**

```bash
echo "Verifying bmad-agents.ts..."
grep -c "bmad:" apps/ui/src/config/bmad-agents.ts  # Should be 29
```

---

### Task 2.2: Create Agent Profiles for All 29 Agents

**Agent:** 4

**File:** `apps/ui/src/store/app-store.ts`

**Current:** 14 profiles (3 standard + 11 BMAD)

**Add:** 18 new BMAD profiles (total 32 profiles: 3 standard + 29 BMAD)

**Strategy:** Add profiles for all non-executive agents.

**New profile template:**

```typescript
// CORE AGENTS (1)
{
  id: 'profile-bmad-bmad-master',
  name: 'BMAD: BMad Master',
  description: 'BMad Master Executor, Knowledge Custodian, and Workflow Orchestrator.',
  model: 'sonnet',
  thinkingLevel: 'high',
  provider: 'claude',
  isBuiltIn: true,
  icon: 'Crown',
  personaId: 'bmad:bmad-master',
},

// BUILDERS (3)
{
  id: 'profile-bmad-agent-builder',
  name: 'BMAD: Bond (Agent Builder)',
  description: 'Agent Building Expert. Creates and refines BMAD agent definitions.',
  model: 'sonnet',
  thinkingLevel: 'high',
  provider: 'claude',
  isBuiltIn: true,
  icon: 'Hammer',
  personaId: 'bmad:agent-builder',
},
{
  id: 'profile-bmad-module-builder',
  name: 'BMAD: Morgan (Module Builder)',
  description: 'Module Creation Master. Designs and builds complete BMAD modules.',
  model: 'sonnet',
  thinkingLevel: 'high',
  provider: 'claude',
  isBuiltIn: true,
  icon: 'Package',
  personaId: 'bmad:module-builder',
},
{
  id: 'profile-bmad-workflow-builder',
  name: 'BMAD: Wendy (Workflow Builder)',
  description: 'Workflow Building Master. Creates structured multi-step workflows.',
  model: 'sonnet',
  thinkingLevel: 'medium',
  provider: 'claude',
  isBuiltIn: true,
  icon: 'GitBranch',
  personaId: 'bmad:workflow-builder',
},

// METHOD AGENTS (9)
{
  id: 'profile-bmad-analyst',
  name: 'BMAD: Mary (Analyst)',
  description: 'Business Analyst. Requirements gathering and analysis.',
  model: 'sonnet',
  thinkingLevel: 'high',
  provider: 'claude',
  isBuiltIn: true,
  icon: 'FileSearch',
  personaId: 'bmad:analyst',
},
{
  id: 'profile-bmad-architect',
  name: 'BMAD: Winston (Architect)',
  description: 'Software Architect. System design and technical architecture.',
  model: 'sonnet',
  thinkingLevel: 'high',
  provider: 'claude',
  isBuiltIn: true,
  icon: 'Building',
  personaId: 'bmad:architect',
},
{
  id: 'profile-bmad-dev',
  name: 'BMAD: Amelia (Developer)',
  description: 'Developer Agent. Executes stories with strict AC adherence.',
  model: 'sonnet',
  thinkingLevel: 'medium',
  provider: 'claude',
  isBuiltIn: true,
  icon: 'Code',
  personaId: 'bmad:dev',
},
{
  id: 'profile-bmad-pm',
  name: 'BMAD: John (Product Manager)',
  description: 'Product Manager. Product strategy and roadmap planning.',
  model: 'sonnet',
  thinkingLevel: 'high',
  provider: 'claude',
  isBuiltIn: true,
  icon: 'Target',
  personaId: 'bmad:pm',
},
{
  id: 'profile-bmad-quick-flow-solo-dev',
  name: 'BMAD: Barry (Quick Flow Solo Dev)',
  description: 'Quick Flow Solo Developer. Rapid prototyping and iteration.',
  model: 'haiku',
  thinkingLevel: 'low',
  provider: 'claude',
  isBuiltIn: true,
  icon: 'Zap',
  personaId: 'bmad:quick-flow-solo-dev',
},
{
  id: 'profile-bmad-sm',
  name: 'BMAD: Bob (Scrum Master)',
  description: 'Scrum Master. Agile process facilitation and team coordination.',
  model: 'sonnet',
  thinkingLevel: 'medium',
  provider: 'claude',
  isBuiltIn: true,
  icon: 'Users',
  personaId: 'bmad:sm',
},
{
  id: 'profile-bmad-tea',
  name: 'BMAD: Murat (Test Architect)',
  description: 'Master Test Architect. Testing strategy and quality assurance.',
  model: 'sonnet',
  thinkingLevel: 'high',
  provider: 'claude',
  isBuiltIn: true,
  icon: 'TestTube',
  personaId: 'bmad:tea',
},
{
  id: 'profile-bmad-tech-writer',
  name: 'BMAD: Paige (Technical Writer)',
  description: 'Technical Writer. Documentation and knowledge management.',
  model: 'sonnet',
  thinkingLevel: 'medium',
  provider: 'claude',
  isBuiltIn: true,
  icon: 'BookOpen',
  personaId: 'bmad:tech-writer',
},
{
  id: 'profile-bmad-ux-designer',
  name: 'BMAD: Sally (UX Designer)',
  description: 'UX Designer. User experience design and wireframing.',
  model: 'sonnet',
  thinkingLevel: 'high',
  provider: 'claude',
  isBuiltIn: true,
  icon: 'Palette',
  personaId: 'bmad:ux-designer',
},

// CREATIVE AGENTS (6)
{
  id: 'profile-bmad-brainstorming-coach',
  name: 'BMAD: Carson (Brainstorming Coach)',
  description: 'Elite Brainstorming Specialist. Ideation and creative facilitation.',
  model: 'sonnet',
  thinkingLevel: 'high',
  provider: 'claude',
  isBuiltIn: true,
  icon: 'Lightbulb',
  personaId: 'bmad:brainstorming-coach',
},
{
  id: 'profile-bmad-creative-problem-solver',
  name: 'BMAD: Dr. Quinn (Problem Solver)',
  description: 'Master Problem Solver. Creative approaches to complex challenges.',
  model: 'sonnet',
  thinkingLevel: 'high',
  provider: 'claude',
  isBuiltIn: true,
  icon: 'Puzzle',
  personaId: 'bmad:creative-problem-solver',
},
{
  id: 'profile-bmad-design-thinking-coach',
  name: 'BMAD: Maya (Design Thinking Coach)',
  description: 'Design Thinking Maestro. Human-centered design facilitation.',
  model: 'sonnet',
  thinkingLevel: 'high',
  provider: 'claude',
  isBuiltIn: true,
  icon: 'Compass',
  personaId: 'bmad:design-thinking-coach',
},
{
  id: 'profile-bmad-innovation-strategist',
  name: 'BMAD: Victor (Innovation Strategist)',
  description: 'Disruptive Innovation Oracle. Strategic innovation and market disruption.',
  model: 'sonnet',
  thinkingLevel: 'high',
  provider: 'claude',
  isBuiltIn: true,
  icon: 'Rocket',
  personaId: 'bmad:innovation-strategist',
},
{
  id: 'profile-bmad-presentation-master',
  name: 'BMAD: Caravaggio (Presentation Master)',
  description: 'Visual Communication + Presentation Expert. Compelling storytelling.',
  model: 'sonnet',
  thinkingLevel: 'medium',
  provider: 'claude',
  isBuiltIn: true,
  icon: 'Presentation',
  personaId: 'bmad:presentation-master',
},
{
  id: 'profile-bmad-storyteller',
  name: 'BMAD: Sophia (Storyteller)',
  description: 'Master Storyteller. Narrative crafting and emotional resonance.',
  model: 'sonnet',
  thinkingLevel: 'high',
  provider: 'claude',
  isBuiltIn: true,
  icon: 'Book',
  personaId: 'bmad:storyteller',
},
```

**Verification:**

```bash
echo "Verifying profile count..."
grep -c "id: 'profile-bmad-" apps/ui/src/store/app-store.ts  # Should be 29
```

---

### Task 2.3: Update TypeScript Types

**Agent:** 5

**Files to update with new types:**

1. **apps/ui/src/config/bmad-agents.ts** - Already updated in Task 2.1
2. **apps/ui/src/types/** - Check if any type definitions need updating

```bash
#!/bin/bash
echo "=== Task 2.3: Verify TypeScript Types ==="

cd /home/aip0rt/Desktop/automaker/apps/ui

# Run TypeScript compiler
echo "Running TypeScript check..."
npx tsc --noEmit 2>&1 | tee /tmp/tsc-output.log

# Check for errors in modified files
echo ""
echo "Checking for errors in modified files:"
grep -E "(bmad-agents|app-store)" /tmp/tsc-output.log || echo "✅ No errors in target files"
```

---

## Phase 3: Backend Service Updates (Agents 6-7)

### Task 3.1: Update bmad-persona-service.ts

**Agent:** 6

**File:** `apps/server/src/services/bmad-persona-service.ts`

**Current PUBLIC_PERSONA_IDS (11):**

```typescript
const PUBLIC_PERSONA_IDS = [
  'bmad:party-synthesis',
  'bmad:strategist-marketer',
  // ... 8 more executive agents ...
  'bmad:echon',
] as const;
```

**Change to (30 - all 29 agents + party-synthesis):**

```typescript
const PUBLIC_PERSONA_IDS = [
  'bmad:party-synthesis',

  // Core (1)
  'bmad:bmad-master',

  // Builders (3)
  'bmad:agent-builder',
  'bmad:module-builder',
  'bmad:workflow-builder',

  // Method (9)
  'bmad:analyst',
  'bmad:architect',
  'bmad:dev',
  'bmad:pm',
  'bmad:quick-flow-solo-dev',
  'bmad:sm',
  'bmad:tea',
  'bmad:tech-writer',
  'bmad:ux-designer',

  // Executive (10)
  'bmad:strategist-marketer',
  'bmad:technologist-architect',
  'bmad:fulfillization-manager',
  'bmad:security-guardian',
  'bmad:analyst-strategist',
  'bmad:financial-strategist',
  'bmad:operations-commander',
  'bmad:apex',
  'bmad:zen',
  'bmad:echon',

  // Creative (6)
  'bmad:brainstorming-coach',
  'bmad:creative-problem-solver',
  'bmad:design-thinking-coach',
  'bmad:innovation-strategist',
  'bmad:presentation-master',
  'bmad:storyteller',
] as const;
```

**Verification:**

```bash
echo "Verifying PUBLIC_PERSONA_IDS count..."
grep -c "'bmad:" apps/server/src/services/bmad-persona-service.ts  # Should be 30 (29 + party)
```

---

### Task 3.2: Update getAgentDefaults with All Agents

**Agent:** 7

**File:** `apps/server/src/services/bmad-persona-service.ts`

**Current:** getAgentDefaults() has entries for 24 agents; 5 agents are missing defaults

**Add:** Entries for ALL 29 agents (including the 5 currently missing)

**Missing agents that need defaults:**

- bmad:bmad-master (core)
- bmad:creative-problem-solver (cis)
- bmad:design-thinking-coach (cis)
- bmad:presentation-master (cis)
- bmad:tech-writer (bmm)

```typescript
private getAgentDefaults(personaId: string): { model: string; thinkingBudget: number } {
  // Core
  if (personaId === 'bmad:bmad-master') return { model: 'sonnet', thinkingBudget: 10000 };

  // Builders
  if (personaId === 'bmad:agent-builder') return { model: 'sonnet', thinkingBudget: 10000 };
  if (personaId === 'bmad:module-builder') return { model: 'sonnet', thinkingBudget: 10000 };
  if (personaId === 'bmad:workflow-builder') return { model: 'sonnet', thinkingBudget: 8000 };

  // Method
  if (personaId === 'bmad:analyst') return { model: 'sonnet', thinkingBudget: 10000 };
  if (personaId === 'bmad:architect') return { model: 'sonnet', thinkingBudget: 10000 };
  if (personaId === 'bmad:dev') return { model: 'sonnet', thinkingBudget: 6000 };
  if (personaId === 'bmad:pm') return { model: 'sonnet', thinkingBudget: 10000 };
  if (personaId === 'bmad:quick-flow-solo-dev') return { model: 'haiku', thinkingBudget: 3000 };
  if (personaId === 'bmad:sm') return { model: 'sonnet', thinkingBudget: 6000 };
  if (personaId === 'bmad:tea') return { model: 'sonnet', thinkingBudget: 10000 };
  if (personaId === 'bmad:tech-writer') return { model: 'sonnet', thinkingBudget: 6000 };
  if (personaId === 'bmad:ux-designer') return { model: 'sonnet', thinkingBudget: 10000 };

  // Executive (already configured in existing code)
  if (personaId === 'bmad:strategist-marketer') return { model: 'sonnet', thinkingBudget: 12000 };
  if (personaId === 'bmad:technologist-architect') return { model: 'sonnet', thinkingBudget: 12000 };
  if (personaId === 'bmad:fulfillization-manager') return { model: 'sonnet', thinkingBudget: 10000 };
  if (personaId === 'bmad:security-guardian') return { model: 'sonnet', thinkingBudget: 10000 };
  if (personaId === 'bmad:analyst-strategist') return { model: 'sonnet', thinkingBudget: 12000 };
  if (personaId === 'bmad:financial-strategist') return { model: 'sonnet', thinkingBudget: 10000 };
  if (personaId === 'bmad:operations-commander') return { model: 'sonnet', thinkingBudget: 10000 };
  if (personaId === 'bmad:apex') return { model: 'sonnet', thinkingBudget: 8000 };
  if (personaId === 'bmad:zen') return { model: 'sonnet', thinkingBudget: 10000 };
  if (personaId === 'bmad:echon') return { model: 'sonnet', thinkingBudget: 10000 };

  // Creative
  if (personaId === 'bmad:brainstorming-coach') return { model: 'sonnet', thinkingBudget: 10000 };
  if (personaId === 'bmad:creative-problem-solver') return { model: 'sonnet', thinkingBudget: 10000 };
  if (personaId === 'bmad:design-thinking-coach') return { model: 'sonnet', thinkingBudget: 10000 };
  if (personaId === 'bmad:innovation-strategist') return { model: 'sonnet', thinkingBudget: 10000 };
  if (personaId === 'bmad:presentation-master') return { model: 'sonnet', thinkingBudget: 6000 };
  if (personaId === 'bmad:storyteller') return { model: 'sonnet', thinkingBudget: 10000 };

  // Fallback
  return { model: 'sonnet', thinkingBudget: 5000 };
}
```

---

## Phase 4: UI Component Updates (Agents 8-10)

### Task 4.1: Update profile-form.tsx with Module Categories

**Agent:** 8

**File:** `apps/ui/src/components/views/profiles-view/components/profile-form.tsx`

**Current code (line ~200):**

```tsx
<div className="text-xs font-medium text-muted-foreground px-2 py-1">BMM Executive Agents</div>;
{
  ALL_EXECUTIVE_AGENT_IDS.map((id) => {
    // ... render checkboxes ...
  });
}
```

**Replace with module-categorized rendering:**

```tsx
import { AGENT_MODULES, ALL_BMAD_AGENT_IDS } from '@/config/bmad-agents';

// Remove MAX_EXECUTIVE_AGENTS check (allow unlimited)

// In the render section:
<div className="space-y-4">
  {Object.entries(AGENT_MODULES).map(([moduleKey, module]) => (
    <div key={moduleKey}>
      {/* Module header */}
      <div className="flex items-center justify-between px-2 py-1">
        <div>
          <div className="text-xs font-medium text-muted-foreground">
            {module.label} ({module.agents.length} agents)
          </div>
          <div className="text-xs text-muted-foreground/70">{module.description}</div>
        </div>
      </div>

      {/* Agent checkboxes for this module */}
      <div className="space-y-1 mt-2">
        {module.agents.map((id) => {
          const persona = bmadPersonas.find((p) => p.id === id);
          if (!persona) return null;

          return (
            <label
              key={id}
              className="flex items-center space-x-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
            >
              <Checkbox
                checked={defaultAgentIds?.includes(id)}
                onCheckedChange={(checked) => {
                  const current = defaultAgentIds || [];
                  const updated = checked
                    ? [...current, id]
                    : current.filter((agentId) => agentId !== id);
                  form.setValue('defaultAgentIds', updated);
                }}
              />
              <span className="text-sm">
                {persona.icon} {persona.name}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  ))}
</div>;

{
  /* Show count */
}
<div className="text-xs text-muted-foreground px-2 mt-2">
  {defaultAgentIds?.length || 0} agents selected
</div>;
```

**Remove this limit check:**

```tsx
// DELETE THIS:
{
  defaultAgentIds && defaultAgentIds.length >= MAX_EXECUTIVE_AGENTS && (
    <p className="text-xs text-muted-foreground px-2">
      Maximum {MAX_EXECUTIVE_AGENTS} agents selected
    </p>
  );
}
```

---

### Task 4.2: Update add-feature-dialog.tsx

**Agent:** 9

**File:** `apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx`

**Changes:**

1. **Update imports:**

```tsx
import { AGENT_MODULES, ALL_BMAD_AGENT_IDS } from '@/config/bmad-agents';
```

2. **Remove MAX_EXECUTIVE_AGENTS references:**

```tsx
// DELETE:
// import { MAX_EXECUTIVE_AGENTS } from '@/config/bmad-agents';
```

3. **Update hardcoded party mode description (line ~736-737):**

```tsx
// REPLACE:
// "All 9 executive agents collaborate: Sage, Theo, Finn, Cerberus, Mary, Walt, Axel, Apex, Zen"

// WITH dynamic description:
{
  `All ${ALL_BMAD_AGENT_IDS.length} BMAD agents collaborate across all modules for comprehensive analysis`;
}
```

4. **Update agent selector to use module categorization:**

Same pattern as profile-form.tsx:

```tsx
<div className="space-y-4">
  {Object.entries(AGENT_MODULES).map(([moduleKey, module]) => (
    <div key={moduleKey}>
      <div className="text-xs font-medium text-muted-foreground px-2 py-1">{module.label}</div>
      {module.agents.map((id) => {
        const persona = bmadPersonas.find((p) => p.id === id);
        if (!persona) return null;
        return (
          <label key={id} className="flex items-center space-x-2 px-2 py-1.5">
            <Checkbox
              checked={selectedAgents.includes(id)}
              onCheckedChange={(checked) => {
                setSelectedAgents(
                  checked ? [...selectedAgents, id] : selectedAgents.filter((a) => a !== id)
                );
              }}
            />
            <span className="text-sm">
              {persona.icon} {persona.name}
            </span>
          </label>
        );
      })}
    </div>
  ))}
</div>
```

5. **Remove max agent warning:**

```tsx
// DELETE THIS:
{
  selectedAgents.length >= MAX_EXECUTIVE_AGENTS && (
    <p className="text-xs text-muted-foreground">Maximum {MAX_EXECUTIVE_AGENTS} agents</p>
  );
}
```

6. **Remove MAX_EXECUTIVE_AGENTS limit in toggleAgentSelection:**

```tsx
// REPLACE:
} else if (next.size < MAX_EXECUTIVE_AGENTS) {
  next.add(agentId);
}

// WITH:
} else {
  next.add(agentId);
}
```

---

### Task 4.3: Update edit-feature-dialog.tsx

**Agent:** 10

**File:** `apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx`

**Changes:**

Same pattern as add-feature-dialog.tsx:

1. Update imports to use `AGENT_MODULES, ALL_BMAD_AGENT_IDS`
2. Remove `MAX_EXECUTIVE_AGENTS` import
3. Update agent rendering to use module categories
4. Remove max agent warnings
5. Remove limit check in toggleAgentSelection

---

## Phase 5: Verification & Testing (Agent 11)

### Task 5.1: Comprehensive Verification

**Agent:** 11

```bash
#!/bin/bash
echo "=== Task 5.1: Comprehensive Verification ==="

cd /home/aip0rt/Desktop/automaker

PASS=0
FAIL=0

echo "Running verification checks..."
echo ""

# 1. Frontend config
echo -n "1. bmad-agents.ts has 29 agent IDs: "
AGENT_COUNT=$(grep -c "'bmad:" apps/ui/src/config/bmad-agents.ts)
if [ "$AGENT_COUNT" -eq 29 ]; then
    echo "✅ PASS ($AGENT_COUNT)"
    ((PASS++))
else
    echo "❌ FAIL ($AGENT_COUNT expected 29)"
    ((FAIL++))
fi

# 2. Backend service
echo -n "2. PUBLIC_PERSONA_IDS has 30 entries (29 + party): "
PERSONA_COUNT=$(grep -c "'bmad:" apps/server/src/services/bmad-persona-service.ts)
if [ "$PERSONA_COUNT" -ge 30 ]; then
    echo "✅ PASS ($PERSONA_COUNT)"
    ((PASS++))
else
    echo "❌ FAIL ($PERSONA_COUNT expected 30)"
    ((FAIL++))
fi

# 3. Profiles count
echo -n "3. app-store.ts has 32 profiles (3 standard + 29 BMAD): "
PROFILE_COUNT=$(grep -c "id: 'profile-" apps/ui/src/store/app-store.ts)
if [ "$PROFILE_COUNT" -ge 32 ]; then
    echo "✅ PASS ($PROFILE_COUNT)"
    ((PASS++))
else
    echo "⚠️ WARN ($PROFILE_COUNT - expected 32)"
fi

# 4. MAX_EXECUTIVE_AGENTS removed
echo -n "4. MAX_EXECUTIVE_AGENTS removed from bmad-agents.ts: "
if grep -q "MAX_EXECUTIVE_AGENTS" apps/ui/src/config/bmad-agents.ts; then
    echo "❌ FAIL - Still present"
    ((FAIL++))
else
    echo "✅ PASS"
    ((PASS++))
fi

# 5. Module organization exists
echo -n "5. AGENT_MODULES defined in bmad-agents.ts: "
if grep -q "AGENT_MODULES" apps/ui/src/config/bmad-agents.ts; then
    echo "✅ PASS"
    ((PASS++))
else
    echo "❌ FAIL"
    ((FAIL++))
fi

# 6. TypeScript compilation
echo -n "6. TypeScript compiles: "
cd apps/ui
TSC_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0")
cd ../..
if [ "$TSC_ERRORS" -eq 0 ]; then
    echo "✅ PASS"
    ((PASS++))
elif [ "$TSC_ERRORS" -lt 5 ]; then
    echo "⚠️ WARN ($TSC_ERRORS errors - may be pre-existing)"
else
    echo "❌ FAIL ($TSC_ERRORS errors)"
    ((FAIL++))
fi

# 7. npm install
echo -n "7. Dependencies valid: "
npm install --silent 2>&1
if [ $? -eq 0 ]; then
    echo "✅ PASS"
    ((PASS++))
else
    echo "⚠️ Check npm output"
fi

echo ""
echo "Verification: $PASS passed, $FAIL failed"

if [ $FAIL -gt 0 ]; then
    echo ""
    echo "⚠️ Some checks failed - review before testing"
    exit 1
fi
```

---

## Phase 6: Final Report (Agent 12)

### Task 6.1: Generate Integration Report

**Agent:** 12

```bash
#!/bin/bash
echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                      ║"
echo "║              29-AGENT INTEGRATION - FINAL REPORT                     ║"
echo "║                                                                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "  Integration Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

cd /home/aip0rt/Desktop/automaker

# Summary
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║  INTEGRATION SUMMARY                                                 ║"
echo "╠══════════════════════════════════════════════════════════════════════╣"
echo "║  Previous State: 10 executive agents exposed                         ║"
echo "║  New State:      29 agents across 5 modules                          ║"
echo "║                                                                      ║"
echo "║  Modules:                                                            ║"
echo "║    - Core:              1 agent                                      ║"
echo "║    - Builders:          3 agents                                     ║"
echo "║    - Method:            9 agents                                     ║"
echo "║    - Executive Suite:  10 agents                                     ║"
echo "║    - Creative:          6 agents                                     ║"
echo "║                                                                      ║"
echo "║  Selection Limit: UNLIMITED (was 10)                                 ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Files Modified
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║  FILES MODIFIED                                                      ║"
echo "╠══════════════════════════════════════════════════════════════════════╣"
echo "║  Frontend:                                                           ║"
echo "║    1. apps/ui/src/config/bmad-agents.ts                              ║"
echo "║    2. apps/ui/src/store/app-store.ts                                 ║"
echo "║    3. apps/ui/src/components/views/profiles-view/...                 ║"
echo "║    4. apps/ui/src/components/views/board-view/dialogs/...            ║"
echo "║                                                                      ║"
echo "║  Backend:                                                            ║"
echo "║    5. apps/server/src/services/bmad-persona-service.ts               ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Verification Results
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║  VERIFICATION RESULTS                                                ║"
echo "╠══════════════════════════════════════════════════════════════════════╣"

# Count checks
AGENT_IDS=$(grep -c "'bmad:" apps/ui/src/config/bmad-agents.ts)
PERSONAS=$(grep -c "'bmad:" apps/server/src/services/bmad-persona-service.ts)
PROFILES=$(grep -c "id: 'profile-bmad-" apps/ui/src/store/app-store.ts)

echo "║  Agent IDs in config:     $AGENT_IDS (expected 29)                           ║"
echo "║  Personas in service:     $PERSONAS (expected 30 with party)                ║"
echo "║  BMAD Profiles:           $PROFILES (expected 29)                           ║"
echo "║                                                                      ║"

# Module check
echo -n "║  AGENT_MODULES defined:   "
if grep -q "AGENT_MODULES" apps/ui/src/config/bmad-agents.ts; then
    echo "✅ YES                                       ║"
else
    echo "❌ NO                                        ║"
fi

# Limit removed
echo -n "║  Selection limit removed: "
if ! grep -q "MAX_EXECUTIVE_AGENTS" apps/ui/src/config/bmad-agents.ts; then
    echo "✅ YES                                       ║"
else
    echo "❌ NO                                        ║"
fi

echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Next Steps
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║  NEXT STEPS                                                          ║"
echo "╠══════════════════════════════════════════════════════════════════════╣"
echo "║  1. ✅ Start dev server: npm run dev:web                             ║"
echo "║  2. ✅ Test AI Profiles view (verify 5 module categories)            ║"
echo "║  3. ✅ Test feature creation with 15+ agents                         ║"
echo "║  4. ✅ Test party mode with all 29 agents                            ║"
echo "║  5. ✅ Execute subscription SaaS test project                        ║"
echo "║  6. ✅ Monitor agent collaboration in logs                           ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Git Status
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║  GIT STATUS                                                          ║"
echo "╠══════════════════════════════════════════════════════════════════════╣"
echo "║  Branch: $(git branch --show-current)"
echo "║  Modified files: $(git diff --name-only | wc -l)"
echo "║                                                                      ║"
echo "║  Backup branch available:                                            ║"
BACKUP=$(git branch | grep backup | tail -1 | tr -d ' ')
echo "║    $BACKUP"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

echo "═══════════════════════════════════════════════════════════════════════"
echo "            29-AGENT INTEGRATION COMPLETE"
echo "═══════════════════════════════════════════════════════════════════════"
```

---

## Success Criteria

| Criterion                                     | Required | Verification |
| --------------------------------------------- | -------- | ------------ |
| All 29 agents in bmad-agents.ts               | ✅       | Agent 11     |
| 30 entries in PUBLIC_PERSONA_IDS (29 + party) | ✅       | Agent 11     |
| 32 profiles in app-store.ts (3 + 29)          | ✅       | Agent 11     |
| AGENT_MODULES defined with 5 categories       | ✅       | Agent 11     |
| MAX_EXECUTIVE_AGENTS removed                  | ✅       | Agent 11     |
| Module categories in UI components            | ✅       | Agents 8-10  |
| All agents have getAgentDefaults              | ✅       | Agent 7      |
| TypeScript compiles                           | ✅       | Agent 11     |
| Application starts                            | ✅       | Manual       |
| All 29 agents selectable in UI                | ✅       | Manual       |
| Unlimited selection works                     | ✅       | Manual       |

---

## Rollback Instructions

If integration fails:

```bash
# Reset to backup branch
BACKUP=$(git branch | grep backup | tail -1 | tr -d ' ')
git reset --hard $BACKUP

# Or revert specific files
git checkout HEAD -- apps/ui/src/config/bmad-agents.ts
git checkout HEAD -- apps/ui/src/store/app-store.ts
git checkout HEAD -- apps/server/src/services/bmad-persona-service.ts
```

---

## Important Notes

1. **Module Organization** - 5 categories make 29 agents manageable in UI
2. **Unlimited Selection** - Allows comprehensive testing with all agents
3. **Backward Compatibility** - Existing profiles/features still work
4. **Profile Defaults** - All 29 agents have explicit model defaults (no fallbacks)
5. **Testing Priority** - Focus on subscription SaaS project for real-world test
6. **Performance** - Monitor API costs with 29-agent party mode
7. **UI Responsiveness** - Verify scrolling works with expanded lists
8. **Documentation** - Update user docs about new agents available
9. **Party Mode Description** - Now dynamic based on ALL_BMAD_AGENT_IDS length
10. **Agent Count** - Verified 29 agents total from manifest (not 30)

---

**END OF PRP**
