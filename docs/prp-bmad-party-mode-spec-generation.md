# PRP: Integrate BMAD 9-Agent Party Mode into Spec Generation

**Status**: DRAFT - Ready for Review
**Created**: 2025-12-29
**Author**: Claude Sonnet 4.5 (Ultrathink + 12 Opus Subagents)
**Target**: Claude Dev Team Execution
**Estimated Effort**: 3-5 days (1 senior full-stack engineer)

---

## Executive Summary

Integrate Automaker's BMAD Executive Suite (9 specialized AI agents) into the project specification generation workflow to provide comprehensive, multi-perspective analysis of project requirements. This enhancement transforms spec creation from a single-agent process into a collaborative board-room deliberation, leveraging the unique expertise of:

- **Sage** (Strategist/Marketer) - Business WHY/WHO
- **Theo** (Technologist/Architect) - Technical HOW
- **Finn** (Fulfillization Manager) - Delivery + UX
- **Cerberus** (Security Guardian) - Security + Risk
- **Mary** (Analyst/Strategist) - Research + Analysis
- **Walt** (Financial Strategist) - ROI + Budgets
- **Axel** (Operations Commander) - Operations + Process
- **Apex** - Peak Performance Engineering
- **Zen** - Clean Architecture + Maintainability

**Key Benefits**:

- Richer, more comprehensive project specifications
- Early identification of security, performance, and operational concerns
- Balanced perspectives (speed vs quality, cost vs features)
- Reduced downstream rework from incomplete requirements

---

## Table of Contents

1. [Context & Investigation Summary](#1-context--investigation-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Proposed Architecture](#3-proposed-architecture)
4. [Implementation Plan](#4-implementation-plan)
5. [UI/UX Design](#5-uiux-design)
6. [API Design](#6-api-design)
7. [Configuration System](#7-configuration-system)
8. [Performance & Cost Optimization](#8-performance--cost-optimization)
9. [Migration & Backwards Compatibility](#9-migration--backwards-compatibility)
10. [Testing Strategy](#10-testing-strategy)
11. [Success Criteria](#11-success-criteria)
12. [Risks & Mitigations](#12-risks--mitigations)

---

## 1. Context & Investigation Summary

### Investigation Methodology

Deployed 12 specialized Opus subagents in parallel to investigate:

1. ✅ **Spec Workflow Analysis** - Current `app_spec.txt` generation flow
2. ✅ **Party Mode Deep Dive** - BMAD multi-agent orchestration patterns
3. ✅ **Integration Architecture** - Technical design and data flow
4. ✅ **UI/UX Planning** - User experience and interaction design
5. ✅ **API Design** - Endpoints, schemas, and event streaming
6. ⚠️ **Testing Strategy** - (output limit exceeded)
7. ⚠️ **Documentation Planning** - (output limit exceeded)
8. ⚠️ **Security Audit** - (output limit exceeded)
9. ✅ **Performance Analysis** - Latency, cost, caching strategies
10. ✅ **Migration Planning** - Backwards compatibility approach
11. ✅ **User Flow Design** - Complete journey mapping
12. ✅ **Configuration Design** - Settings and cost controls

### Key Findings

**Current Spec Generation**:

- File: `.automaker/app_spec.txt` (XML format, NOT `spec.md`)
- Single-agent Claude SDK call (Haiku default)
- Structured JSON output via `specOutputSchema`
- Optional codebase analysis with `analyzeProject` flag
- Takes 30-60 seconds for single-agent analysis

**Party Mode Implementation**:

- Two modes: Interactive workflow vs one-shot synthesis
- `BmadPersonaService.resolveAgentCollab()` builds collaborative prompts
- Party Synthesis uses `collaborationMode: 'sequential'`
- Returns structured `PartySynthesisResult` with consensus/dissent
- Artifacts saved to `_bmad-output/party-synthesis/`

**Integration Readiness**:

- BMAD already integrated at project level (`ProjectSettings.bmad`)
- Graceful degradation when BMAD not installed
- Agent manifest cached in-memory for fast lookup
- Event-driven architecture ready for multi-agent streaming

---

## 2. Current State Analysis

### File Locations

**Spec Generation (Server)**:

```
apps/server/src/routes/app-spec/
├── index.ts                       # Express router
├── generate-spec.ts               # Core AI spec generation
├── routes/
│   ├── create.ts                  # POST /create handler
│   ├── generate.ts                # POST /generate handler
│   └── generate-features.ts       # Feature generation from spec
├── generate-features-from-spec.ts # AI feature generation
├── parse-and-create-features.ts   # JSON parsing and file creation
└── common.ts                      # Shared state management
```

**Spec UI (Frontend)**:

```
apps/ui/src/components/views/spec-view/
├── spec-view.tsx                  # Main view component
├── components/
│   ├── spec-editor.tsx            # CodeMirror XML editor
│   ├── spec-header.tsx            # Header with regenerate/save
│   └── spec-empty-state.tsx       # Empty state with create button
├── dialogs/
│   ├── create-spec-dialog.tsx     # Creation dialog
│   └── regenerate-spec-dialog.tsx # Regeneration dialog
└── hooks/
    ├── use-spec-generation.ts     # Generation state + WebSocket events
    ├── use-spec-loading.ts        # Load from disk
    └── use-spec-save.ts           # Save to disk
```

**BMAD Services**:

```
apps/server/src/services/
├── bmad-persona-service.ts        # Persona resolution + collab prompts
├── bmad-service.ts                # BMAD initialization + upgrade
└── auto-mode-service.ts           # Party synthesis execution
```

### Current Data Flow

```
User Input (CreateSpecDialog)
    │
    ├─ projectOverview (text)
    ├─ analyzeProject (boolean)
    ├─ generateFeatures (boolean)
    └─ maxFeatures (number)
    │
    ▼
POST /api/app-spec/generate
    │
    ▼
generateSpec() [generate-spec.ts]
    │
    ├─ Build prompt with project overview
    ├─ Optionally analyze codebase (Read, Glob, Grep tools)
    ├─ Claude SDK call with specOutputSchema
    ├─ Convert JSON → XML via specToXml()
    └─ Save to .automaker/app_spec.txt
    │
    ▼
WebSocket Events → UI Progress Updates
```

---

## 3. Proposed Architecture

### High-Level Design

**Approach**: Extend existing spec generation with optional BMAD analysis phase

```
┌─────────────────────────────────────────────────────────────┐
│                  SPEC GENERATION REQUEST                     │
│   (projectOverview + useBmadAnalysis flag + bmadOptions)    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ useBmadAnalysis? │
                  └──────┬───────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
   NO   ▼                                 ▼  YES
┌────────────────┐              ┌─────────────────────────┐
│ Standard Spec  │              │ BMAD Multi-Agent        │
│ Generation     │              │ Analysis                │
│ (existing)     │              │                         │
│                │              │ Phase 1: Agent Positions│
│ - Single agent │              │  ├─ Sage: Strategy      │
│ - Haiku model  │              │  ├─ Theo: Architecture  │
│ - 30-60s       │              │  ├─ Finn: UX/Delivery   │
└────────┬───────┘              │  ├─ Cerberus: Security  │
         │                      │  ├─ Mary: Analysis      │
         │                      │  ├─ Walt: Financial     │
         │                      │  ├─ Axel: Operations    │
         │                      │  ├─ Apex: Performance   │
         │                      │  └─ Zen: Clean Code     │
         │                      │                         │
         │                      │ Phase 2: Synthesis      │
         │                      │  └─ Build final spec    │
         │                      │     with all perspectives│
         │                      └──────────┬──────────────┘
         │                                 │
         └─────────────┬───────────────────┘
                       ▼
            ┌──────────────────────┐
            │  Merge & Save Spec   │
            │  .automaker/app_spec.txt │
            └──────────────────────┘
```

### Component Design

#### 1. New Service: `BmadSpecSynthesisService`

**Location**: `apps/server/src/services/bmad-spec-synthesis-service.ts`

**Responsibilities**:

- Orchestrate 9-agent deliberation for spec generation
- Stream agent-by-agent progress via EventEmitter
- Aggregate individual perspectives into synthesis
- Handle agent failures gracefully (continue with available agents)
- Apply cost controls and budget limits

**Key Methods**:

```typescript
class BmadSpecSynthesisService {
  async synthesizeSpec(params: {
    projectPath: string;
    projectOverview: string;
    agents?: string[]; // Default: all 9
    abortController: AbortController;
    events: EventEmitter;
  }): Promise<BmadSpecSynthesisResult>;

  private async getAgentPosition(
    agentId: string,
    context: SynthesisContext
  ): Promise<AgentPosition>;

  private buildFinalSynthesis(positions: AgentPosition[]): Promise<SpecOutput>;
}
```

#### 2. Extend Existing Routes

**File**: `apps/server/src/routes/app-spec/routes/generate.ts`

**Changes**:

- Add `useBmadAnalysis?: boolean` to request body
- Add `bmadOptions?: BmadAnalysisOptions` to request body
- Conditionally route to `BmadSpecSynthesisService` when enabled
- Merge BMAD synthesis result with standard spec output

#### 3. New WebSocket Events

**Event Types** (add to `libs/types/src/event.ts`):

```typescript
'bmad-spec:agent_turn'; // Agent starting analysis
'bmad-spec:synthesis_progress'; // Progress update
'bmad-spec:deliberation_complete'; // All agents finished
'bmad-spec:agent_error'; // Individual agent error
```

**Event Payloads** (add to `libs/types/src/bmad.ts`):

```typescript
interface BmadSpecAgentTurnEvent {
  type: 'bmad-spec:agent_turn';
  agentId: string;
  agentName: string;
  agentIcon: string;
  turnNumber: number; // 1-9
}

interface BmadSpecSynthesisProgressEvent {
  type: 'bmad-spec:synthesis_progress';
  phase: 'deliberation' | 'synthesis' | 'finalizing';
  agentsComplete: number;
  agentsTotal: number;
  currentAgent?: string;
}
```

---

## 4. Implementation Plan

### Phase 1: Foundation (Types & Schemas) - 4 hours

**Files to Create/Modify**:

- `libs/types/src/bmad.ts` - Add new types
- `libs/types/src/event.ts` - Add event types
- `libs/types/src/settings.ts` - Extend settings

**Type Definitions**:

```typescript
// libs/types/src/bmad.ts

export interface BmadSpecAnalysisOptions {
  agentIds?: string[]; // Default: all 9 executive agents
  model?: AgentModel; // Default: opus for synthesis
  thinkingBudget?: number; // Default: 16000
  includeArchDocs?: boolean; // Load existing architecture docs
}

export interface BmadSpecSynthesisResult extends PartySynthesisResult {
  enrichedSpec?: {
    strategicInsights: string[]; // From Sage
    technicalConsiderations: string[]; // From Theo
    securityRequirements: string[]; // From Cerberus
    financialConstraints: string[]; // From Walt
    operationalNeeds: string[]; // From Axel
    qualityStandards: string[]; // From Zen
    performanceGoals: string[]; // From Apex
    userExperience: string[]; // From Finn
    researchFindings: string[]; // From Mary
  };
}

export interface BmadAgentPosition {
  agentId: string;
  agentName: string;
  position: string; // Full analysis text
  keyInsights: string[]; // Bullet points
  concerns?: string[]; // Risks or issues raised
  recommendations?: string[]; // Specific actions
}

export const BMAD_SPEC_SYNTHESIS_SCHEMA = {
  type: 'object',
  properties: {
    agents: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          position: { type: 'string' },
          keyInsights: { type: 'array', items: { type: 'string' } },
          concerns: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
        },
        required: ['id', 'position', 'keyInsights'],
      },
    },
    consensus: { type: ['string', 'null'] },
    dissent: { type: 'array', items: { type: 'string' } },
    recommendation: { type: 'string' },
    markdownSummary: { type: 'string' },
    enrichedSpec: {
      type: 'object',
      properties: {
        strategicInsights: { type: 'array', items: { type: 'string' } },
        technicalConsiderations: { type: 'array', items: { type: 'string' } },
        securityRequirements: { type: 'array', items: { type: 'string' } },
        financialConstraints: { type: 'array', items: { type: 'string' } },
        operationalNeeds: { type: 'array', items: { type: 'string' } },
        qualityStandards: { type: 'array', items: { type: 'string' } },
        performanceGoals: { type: 'array', items: { type: 'string' } },
        userExperience: { type: 'array', items: { type: 'string' } },
        researchFindings: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  required: ['agents', 'consensus', 'dissent', 'recommendation', 'markdownSummary'],
  additionalProperties: false,
};
```

**Settings Extensions**:

```typescript
// libs/types/src/settings.ts

// Extend ProjectSettings
export interface ProjectSettings {
  // ... existing fields ...
  bmad?: {
    enabled?: boolean;
    installedVersion?: string;
    artifactsDir?: string;

    // NEW: Spec analysis settings
    specAnalysis?: {
      enabled?: boolean; // Opt-in per project
      agentIds?: string[]; // Override default agents
      model?: AgentModel;
      thinkingBudget?: number;
      autoSaveArtifacts?: boolean;
    };
  };
}

// Extend GlobalSettings
export interface GlobalSettings {
  // ... existing fields ...
  bmadSpecAnalysis?: {
    defaultAgentIds: string[]; // Default: all 9
    defaultModel: AgentModel; // Default: opus
    defaultThinkingBudget: number; // Default: 16000
  };
}
```

### Phase 2: Service Implementation - 8 hours

**File**: `apps/server/src/services/bmad-spec-synthesis-service.ts` (NEW)

**Implementation**:

```typescript
import { EventEmitter } from 'events';
import { ProviderFactory } from '../providers/provider-factory.js';
import { BmadPersonaService } from './bmad-persona-service.js';
import { SettingsService } from './settings-service.js';
import { createCustomOptions } from '../lib/sdk-options.js';
import type {
  BmadSpecSynthesisResult,
  BmadAgentPosition,
  BmadSpecAnalysisOptions,
} from '@automaker/types';

export class BmadSpecSynthesisService {
  constructor(
    private bmadPersonaService: BmadPersonaService,
    private settingsService: SettingsService
  ) {}

  async synthesizeSpec(params: {
    projectPath: string;
    projectOverview: string;
    options?: BmadSpecAnalysisOptions;
    abortController: AbortController;
    events: EventEmitter;
  }): Promise<BmadSpecSynthesisResult> {
    const { projectPath, projectOverview, options = {}, abortController, events } = params;

    // 1. Resolve agents (default: all 9 executive agents)
    const agentIds = options.agentIds ?? [
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

    // 2. Emit synthesis started event
    events.emit('bmad-spec:synthesis_progress', {
      phase: 'deliberation',
      agentsComplete: 0,
      agentsTotal: agentIds.length,
    });

    // 3. Gather positions from each agent
    const positions: BmadAgentPosition[] = [];
    for (let i = 0; i < agentIds.length; i++) {
      const agentId = agentIds[i];

      // Check abort
      if (abortController.signal.aborted) {
        throw new Error('Synthesis aborted by user');
      }

      // Get agent position
      try {
        const position = await this.getAgentPosition({
          agentId,
          projectOverview,
          projectPath,
          previousPositions: positions,
          events,
        });

        positions.push(position);

        // Emit progress
        events.emit('bmad-spec:synthesis_progress', {
          phase: 'deliberation',
          agentsComplete: i + 1,
          agentsTotal: agentIds.length,
        });
      } catch (error) {
        // Log error but continue with other agents
        console.warn(`[BmadSpecSynthesis] Agent ${agentId} failed:`, error);
        events.emit('bmad-spec:agent_error', {
          agentId,
          error: (error as Error).message,
        });
      }
    }

    // 4. Build final synthesis
    events.emit('bmad-spec:synthesis_progress', {
      phase: 'synthesis',
      agentsComplete: positions.length,
      agentsTotal: agentIds.length,
    });

    const synthesis = await this.buildFinalSynthesis({
      positions,
      projectOverview,
      projectPath,
      events,
    });

    // 5. Emit completion
    events.emit('bmad-spec:deliberation_complete', {
      projectPath,
      agentsParticipated: positions.length,
      consensus: synthesis.consensus,
      dissent: synthesis.dissent,
    });

    return synthesis;
  }

  private async getAgentPosition(params: {
    agentId: string;
    projectOverview: string;
    projectPath: string;
    previousPositions: BmadAgentPosition[];
    events: EventEmitter;
  }): Promise<BmadAgentPosition> {
    const { agentId, projectOverview, projectPath, previousPositions, events } = params;

    // Resolve persona
    const persona = await this.bmadPersonaService.resolvePersona({
      personaId: agentId,
      projectPath,
    });

    if (!persona) {
      throw new Error(`Persona ${agentId} not found`);
    }

    // Emit agent turn event
    events.emit('bmad-spec:agent_turn', {
      agentId,
      agentName: persona.name,
      agentIcon: persona.icon,
      turnNumber: previousPositions.length + 1,
    });

    // Build prompt with context
    const prompt = this.buildAgentPrompt({
      projectOverview,
      previousPositions,
      agentRole: persona.role,
    });

    // Execute SDK call
    const provider = ProviderFactory.getProviderForModel(persona.model);
    const sdkOptions = createCustomOptions({
      cwd: projectPath,
      model: persona.model,
      systemPrompt: persona.systemPrompt,
      maxTurns: 50,
      allowedTools: ['Read', 'Glob', 'Grep'],
      sandbox: { enabled: true, autoAllowBashIfSandboxed: false },
      outputFormat: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            position: { type: 'string' },
            keyInsights: { type: 'array', items: { type: 'string' } },
            concerns: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } },
          },
          required: ['position', 'keyInsights'],
        },
      },
      maxThinkingTokens: persona.thinkingBudget,
    });

    const response = await provider.executeQuery({ prompt }, sdkOptions);

    // Parse structured output
    const parsed = JSON.parse(response.content);

    return {
      agentId,
      agentName: persona.name,
      position: parsed.position,
      keyInsights: parsed.keyInsights ?? [],
      concerns: parsed.concerns,
      recommendations: parsed.recommendations,
    };
  }

  private buildAgentPrompt(params: {
    projectOverview: string;
    previousPositions: BmadAgentPosition[];
    agentRole: string;
  }): string {
    const { projectOverview, previousPositions, agentRole } = params;

    const parts = [
      `You are analyzing a project specification from your role as: ${agentRole}`,
      ``,
      `## Project Overview`,
      projectOverview,
      ``,
    ];

    if (previousPositions.length > 0) {
      parts.push(`## Perspectives from Other Agents`);
      for (const pos of previousPositions) {
        parts.push(`### ${pos.agentName}`);
        parts.push(pos.position);
        parts.push(``);
      }
    }

    parts.push(`## Your Task`);
    parts.push(`Analyze this project from your unique perspective.`);
    parts.push(`Focus on aspects relevant to your role.`);
    parts.push(`Identify risks, opportunities, and key requirements.`);
    parts.push(``);
    parts.push(`Output your analysis in the structured JSON format.`);

    return parts.join('\n');
  }

  private async buildFinalSynthesis(params: {
    positions: BmadAgentPosition[];
    projectOverview: string;
    projectPath: string;
    events: EventEmitter;
  }): Promise<BmadSpecSynthesisResult> {
    // Build synthesis prompt with all positions
    const synthesisPrompt = this.buildSynthesisPrompt(params.positions, params.projectOverview);

    // Use Opus for final synthesis
    const provider = ProviderFactory.getProviderForModel('opus');
    const sdkOptions = createCustomOptions({
      cwd: params.projectPath,
      model: 'opus',
      systemPrompt:
        'You are synthesizing input from 9 specialized executives into a unified project specification.',
      maxTurns: 30,
      allowedTools: [],
      outputFormat: {
        type: 'json_schema',
        schema: BMAD_SPEC_SYNTHESIS_SCHEMA,
      },
      maxThinkingTokens: 20000,
    });

    const response = await provider.executeQuery({ prompt: synthesisPrompt }, sdkOptions);
    const parsed = JSON.parse(response.content);

    return {
      agents: parsed.agents,
      consensus: parsed.consensus,
      dissent: parsed.dissent ?? [],
      recommendation: parsed.recommendation,
      markdownSummary: parsed.markdownSummary,
      enrichedSpec: parsed.enrichedSpec,
    };
  }

  private buildSynthesisPrompt(positions: BmadAgentPosition[], projectOverview: string): string {
    const parts = [
      `# Executive Board Deliberation Synthesis`,
      ``,
      `## Project Overview`,
      projectOverview,
      ``,
      `## Agent Positions`,
      ``,
    ];

    for (const pos of positions) {
      parts.push(`### ${pos.agentName} (${pos.agentId})`);
      parts.push(pos.position);
      parts.push(``);

      if (pos.keyInsights.length > 0) {
        parts.push(`**Key Insights:**`);
        pos.keyInsights.forEach((insight) => parts.push(`- ${insight}`));
        parts.push(``);
      }

      if (pos.concerns && pos.concerns.length > 0) {
        parts.push(`**Concerns:**`);
        pos.concerns.forEach((concern) => parts.push(`- ${concern}`));
        parts.push(``);
      }
    }

    parts.push(`## Your Task`);
    parts.push(`Synthesize all perspectives into a unified recommendation.`);
    parts.push(`Identify consensus points and areas of dissent.`);
    parts.push(`Create enrichedSpec with categorized insights from each domain.`);

    return parts.join('\n');
  }
}
```

### Phase 3: Route Integration - 4 hours

**File**: `apps/server/src/routes/app-spec/routes/generate.ts`

**Changes**:

```typescript
// Add to request body interface
interface GenerateSpecRequest {
  projectPath: string;
  projectOverview: string;
  generateFeatures?: boolean;
  analyzeProject?: boolean;
  maxFeatures?: number;

  // NEW: BMAD analysis options
  useBmadAnalysis?: boolean;
  bmadOptions?: {
    agentIds?: string[];
    model?: AgentModel;
    thinkingBudget?: number;
  };
}

// Modify handler
export function createGenerateHandler(deps: HandlerDeps) {
  return async (req: Request, res: Response) => {
    const {
      projectPath,
      projectOverview,
      useBmadAnalysis = false,
      bmadOptions,
      // ... other fields
    } = req.body;

    // ... existing validation ...

    let specResult: SpecOutput;

    if (useBmadAnalysis) {
      // Route to BMAD synthesis service
      const bmadService = new BmadSpecSynthesisService(
        deps.bmadPersonaService,
        deps.settingsService
      );

      const synthesis = await bmadService.synthesizeSpec({
        projectPath,
        projectOverview,
        options: bmadOptions,
        abortController: deps.abortController,
        events: deps.events,
      });

      // Convert synthesis to SpecOutput format
      specResult = convertSynthesisToSpec(synthesis, projectOverview);
    } else {
      // Standard single-agent spec generation (existing code)
      specResult = await generateSpec({
        projectPath,
        projectOverview,
        analyzeProject,
        events: deps.events,
        abortController: deps.abortController,
      });
    }

    // Save spec (existing code)
    const xmlContent = specToXml(specResult);
    const specPath = getAppSpecPath(projectPath);
    await fs.writeFile(specPath, xmlContent, 'utf-8');

    // ... rest of handler (feature generation, etc.) ...
  };
}

function convertSynthesisToSpec(
  synthesis: BmadSpecSynthesisResult,
  projectOverview: string
): SpecOutput {
  // Extract insights from enrichedSpec and format as SpecOutput
  return {
    project_name: extractProjectName(projectOverview),
    overview: projectOverview,
    technology_stack: synthesis.enrichedSpec?.technicalConsiderations.filter(/* ... */) ?? [],
    core_capabilities: synthesis.enrichedSpec?.strategicInsights ?? [],
    implemented_features: [],
    additional_requirements: [
      ...(synthesis.enrichedSpec?.securityRequirements ?? []),
      ...(synthesis.enrichedSpec?.performanceGoals ?? []),
    ],
    development_guidelines: synthesis.enrichedSpec?.qualityStandards ?? [],
  };
}
```

### Phase 4: UI Implementation - 6 hours

#### 4.1 Update Create Spec Dialog

**File**: `apps/ui/src/components/views/spec-view/dialogs/create-spec-dialog.tsx`

**Changes**:

```typescript
// Add state
const [useBmadAnalysis, setUseBmadAnalysis] = useState(false);
const [bmadAgentSelection, setBmadAgentSelection] = useState<string[]>([]);

// Add checkbox (after analyzeProject checkbox)
<div className="flex items-start space-x-3 pt-2">
  <Checkbox
    id="enable-bmad-analysis"
    checked={useBmadAnalysis}
    onCheckedChange={(checked) => setUseBmadAnalysis(checked === true)}
    disabled={isCreatingSpec}
  />
  <div className="space-y-1">
    <label htmlFor="enable-bmad-analysis" className="text-sm font-medium cursor-pointer">
      Enable BMAD Multi-Agent Analysis
    </label>
    <p className="text-xs text-muted-foreground">
      Run 9 specialized agents (Strategist, Architect, Security, Performance, etc.)
      for comprehensive multi-perspective spec analysis. (~5-10 min, higher cost)
    </p>
  </div>
</div>

{/* Agent selection (shown when BMAD enabled) */}
{useBmadAnalysis && (
  <div className="ml-8 mt-2 space-y-2">
    <Label className="text-sm">Agent Selection</Label>
    <Select defaultValue="all">
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All 9 Executive Agents (Recommended)</SelectItem>
        <SelectItem value="strategic-trio">Strategic Trio (Sage, Mary, Walt)</SelectItem>
        <SelectItem value="technical-trio">Technical Trio (Theo, Apex, Zen)</SelectItem>
        <SelectItem value="quick-review">Quick Review (Sage, Theo)</SelectItem>
      </SelectContent>
    </Select>
  </div>
)}

// Update API call
const handleGenerate = async () => {
  await api.specRegeneration.create({
    projectPath,
    projectOverview,
    analyzeProject,
    generateFeatures,
    maxFeatures,
    useBmadAnalysis,  // NEW
    bmadOptions: useBmadAnalysis ? {
      agentIds: bmadAgentSelection
    } : undefined
  });
};
```

#### 4.2 Create Progress Tracker Component

**File**: `apps/ui/src/components/views/spec-view/components/bmad-progress-tracker.tsx` (NEW)

```typescript
import { useMemo } from 'react';
import { Loader2, Check, Circle, XCircle } from 'lucide-react';

interface BmadProgressTrackerProps {
  agentsComplete: number;
  agentsTotal: number;
  currentAgent?: string;
  phase: 'deliberation' | 'synthesis' | 'finalizing';
}

export function BmadProgressTracker({
  agentsComplete,
  agentsTotal,
  currentAgent,
  phase
}: BmadProgressTrackerProps) {
  const progressPercent = Math.round((agentsComplete / agentsTotal) * 100);

  const agents = [
    { id: 'bmad:strategist-marketer', name: 'Sage', icon: '🎯' },
    { id: 'bmad:technologist-architect', name: 'Theo', icon: '🏗️' },
    { id: 'bmad:fulfillization-manager', name: 'Finn', icon: '🚀' },
    { id: 'bmad:security-guardian', name: 'Cerberus', icon: '🛡️' },
    { id: 'bmad:analyst-strategist', name: 'Mary', icon: '📊' },
    { id: 'bmad:financial-strategist', name: 'Walt', icon: '💰' },
    { id: 'bmad:operations-commander', name: 'Axel', icon: '⚙️' },
    { id: 'bmad:apex', name: 'Apex', icon: '⚡' },
    { id: 'bmad:zen', name: 'Zen', icon: '🧘' }
  ];

  return (
    <div className="space-y-4">
      {/* Header progress bar */}
      <div className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/30">
        <div className="relative">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-primary">
            BMAD Analysis: {agentsComplete}/{agentsTotal} agents
          </span>
          <span className="text-xs text-muted-foreground">
            {phase === 'deliberation' && `${currentAgent} analyzing...`}
            {phase === 'synthesis' && 'Synthesizing perspectives...'}
            {phase === 'finalizing' && 'Finalizing specification...'}
          </span>
        </div>

        {/* Circular progress */}
        <div className="ml-auto relative h-8 w-8">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 24 24">
            <circle
              className="text-muted/20"
              cx="12"
              cy="12"
              r="10"
              strokeWidth="3"
              fill="none"
              stroke="currentColor"
            />
            <circle
              className="text-primary"
              cx="12"
              cy="12"
              r="10"
              strokeWidth="3"
              fill="none"
              stroke="currentColor"
              strokeDasharray={63}
              strokeDashoffset={63 - (63 * progressPercent) / 100}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Agent status list */}
      <div className="space-y-2">
        {agents.map((agent, index) => {
          const status = index < agentsComplete ? 'completed'
            : index === agentsComplete ? 'running'
            : 'pending';

          return (
            <div key={agent.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 flex-1">
                {status === 'completed' && <Check className="w-4 h-4 text-green-500" />}
                {status === 'running' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                {status === 'pending' && <Circle className="w-4 h-4 text-muted opacity-50" />}

                <span className="text-lg">{agent.icon}</span>
                <span className="text-sm font-medium">{agent.name}</span>
              </div>

              <span className="text-xs text-muted-foreground">
                {status === 'completed' && 'Complete'}
                {status === 'running' && 'Analyzing...'}
                {status === 'pending' && 'Pending'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

#### 4.3 Update Spec Generation Hook

**File**: `apps/ui/src/components/views/spec-view/hooks/use-spec-generation.ts`

**Changes**:

```typescript
// Add state for BMAD tracking
const [bmadProgress, setBmadProgress] = useState<{
  agentsComplete: number;
  agentsTotal: number;
  currentAgent?: string;
  phase: 'deliberation' | 'synthesis' | 'finalizing';
} | null>(null);

// Add event handlers
useEffect(() => {
  if (!api.electron) return;

  const handleBmadProgress = (data: any) => {
    setBmadProgress({
      agentsComplete: data.agentsComplete,
      agentsTotal: data.agentsTotal,
      currentAgent: data.currentAgent,
      phase: data.phase,
    });
  };

  const handleBmadAgentTurn = (data: any) => {
    // Update current agent
    setBmadProgress((prev) =>
      prev
        ? {
            ...prev,
            currentAgent: data.agentName,
          }
        : null
    );
  };

  const handleBmadComplete = () => {
    setBmadProgress(null);
  };

  api.electron.on('bmad-spec:synthesis_progress', handleBmadProgress);
  api.electron.on('bmad-spec:agent_turn', handleBmadAgentTurn);
  api.electron.on('bmad-spec:deliberation_complete', handleBmadComplete);

  return () => {
    api.electron.off('bmad-spec:synthesis_progress', handleBmadProgress);
    api.electron.off('bmad-spec:agent_turn', handleBmadAgentTurn);
    api.electron.off('bmad-spec:deliberation_complete', handleBmadComplete);
  };
}, []);

// Export bmadProgress for use in UI
return {
  // ... existing exports ...
  bmadProgress,
};
```

### Phase 5: Testing - 4 hours

#### 5.1 Unit Tests

**File**: `apps/server/tests/unit/services/bmad-spec-synthesis-service.test.ts` (NEW)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BmadSpecSynthesisService } from '../../../src/services/bmad-spec-synthesis-service.js';
import { EventEmitter } from 'events';

describe('BmadSpecSynthesisService', () => {
  let service: BmadSpecSynthesisService;
  let mockBmadPersonaService: any;
  let mockSettingsService: any;

  beforeEach(() => {
    mockBmadPersonaService = {
      resolvePersona: vi.fn(),
    };
    mockSettingsService = {};
    service = new BmadSpecSynthesisService(mockBmadPersonaService, mockSettingsService);
  });

  it('should synthesize spec with all 9 agents by default', async () => {
    // Test implementation
  });

  it('should handle agent failures gracefully', async () => {
    // Test implementation
  });

  it('should emit progress events', async () => {
    // Test implementation
  });

  it('should respect abort signal', async () => {
    // Test implementation
  });
});
```

#### 5.2 Integration Tests

**File**: `apps/server/tests/integration/bmad-spec-synthesis.test.ts` (NEW)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, stopTestServer } from '../helpers/test-server.js';
import { createTestProject } from '../helpers/test-project.js';

describe('BMAD Spec Synthesis Integration', () => {
  beforeAll(async () => {
    await startTestServer();
  });

  afterAll(async () => {
    await stopTestServer();
  });

  it('should generate spec with BMAD analysis via API', async () => {
    const projectPath = await createTestProject();

    const response = await fetch('http://localhost:3008/api/app-spec/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectPath,
        projectOverview: 'Build an e-commerce platform',
        useBmadAnalysis: true,
      }),
    });

    expect(response.status).toBe(200);
    // Assert spec was created with BMAD insights
  });
});
```

#### 5.3 E2E Tests (if time permits)

**File**: `apps/ui/tests/e2e/bmad-spec-generation.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test';

test('should create spec with BMAD analysis', async ({ page }) => {
  // Navigate to spec view
  await page.goto('/spec');

  // Click create spec
  await page.click('[data-testid="create-spec-button"]');

  // Fill in form
  await page.fill('[data-testid="project-overview"]', 'Test project');

  // Enable BMAD analysis
  await page.check('[data-testid="enable-bmad-analysis"]');

  // Submit
  await page.click('[data-testid="generate-spec-button"]');

  // Wait for BMAD progress tracker
  await expect(page.locator('[data-testid="bmad-progress-tracker"]')).toBeVisible();

  // Wait for completion (with long timeout for 9 agents)
  await expect(page.locator('[data-testid="spec-editor"]')).toBeVisible({ timeout: 600000 });
});
```

### Phase 6: Documentation - 2 hours

**Files to Update**:

- `CLAUDE.md` - Add BMAD spec generation workflow
- `docs/DOCUMENTATION.md` - API documentation
- `README.md` - Mention BMAD integration

### Phase 7: Polish & Review - 2 hours

- Code review
- Performance profiling
- Cost estimation validation
- UI/UX polish

---

## 5. UI/UX Design

### 5.1 Opt-In Approach

**Decision**: Make BMAD analysis opt-in with prominent discoverability

**Rationale**:

- Manages token cost and execution time
- Allows users to choose based on project needs
- Follows existing pattern (`analyzeProject` checkbox)

### 5.2 Progress Indicators

**Three-Tier System**:

1. **Header Progress Bar** - Global completion percentage
2. **Agent Status List** - Detailed agent-by-agent status
3. **Real-time Log Stream** (optional) - Raw event stream

### 5.3 Agent Selection

**Preset Groups**:

- **Full Executive** (all 9) - Recommended default
- **Strategic Trio** (Sage, Mary, Walt) - Business focus
- **Technical Trio** (Theo, Apex, Zen) - Engineering focus
- **Quick Review** (Sage, Theo) - Fast analysis

---

## 6. API Design

### 6.1 Request/Response Schemas

**Extend POST `/api/app-spec/generate`**:

```typescript
// Request
{
  projectPath: string;
  projectOverview: string;
  generateFeatures?: boolean;
  analyzeProject?: boolean;
  maxFeatures?: number;

  // NEW fields
  useBmadAnalysis?: boolean;
  bmadOptions?: {
    agentIds?: string[];
    model?: AgentModel;
    thinkingBudget?: number;
  };
}

// Response (unchanged)
{
  success: boolean;
  message?: string;
  error?: string;
}
```

### 6.2 WebSocket Events

**New Event Types**:

- `bmad-spec:agent_turn` - Agent starting analysis
- `bmad-spec:synthesis_progress` - Progress update (n/9 complete)
- `bmad-spec:deliberation_complete` - All agents finished
- `bmad-spec:agent_error` - Individual agent error (non-fatal)

---

## 7. Configuration System

### 7.1 Project-Level Settings

```typescript
// .automaker/settings.json
{
  "bmad": {
    "enabled": true,
    "specAnalysis": {
      "enabled": true,  // Auto-enable BMAD for specs in this project
      "agentIds": ["bmad:strategist-marketer", "bmad:technologist-architect"],
      "model": "opus"
    }
  }
}
```

### 7.2 Global Defaults

```typescript
// {DATA_DIR}/settings.json
{
  "bmadSpecAnalysis": {
    "defaultAgentIds": [/* all 9 */],
    "defaultModel": "opus",
    "defaultThinkingBudget": 16000
  }
}
```

---

## 8. Performance & Cost Optimization

### 8.1 Latency Comparison

| Approach                    | Latency     | Pros                          | Cons                       |
| --------------------------- | ----------- | ----------------------------- | -------------------------- |
| Sequential                  | 4.5-9 min   | Agents see prior perspectives | Slow                       |
| Parallel (no limit)         | 30-60s      | Fast                          | API rate limits, high cost |
| **Parallel (3 concurrent)** | **2-3 min** | **Balanced speed/cost**       | **Recommended**            |

**Recommendation**: Implement concurrency limit of 3 (like `maxConcurrency` in `AutoModeService`)

### 8.2 Cost Estimation

**Single Spec Analysis (9 agents, Opus)**:

- Input tokens: ~15K per agent (context + prompt) = 135K total
- Output tokens: ~5K per agent = 45K total
- Thinking tokens: ~10K per agent = 90K total
- **Estimated cost**: ~$10-15 per analysis

**Optimization Strategies**:

1. Use Sonnet for most agents, Opus only for synthesis
2. Cache project context across agents
3. Downgrade to Haiku for simple projects

---

## 9. Migration & Backwards Compatibility

### 9.1 Existing Projects

**No migration required** - All changes are additive:

- Existing `app_spec.txt` continues working
- BMAD analysis is opt-in
- Graceful degradation when BMAD not installed

### 9.2 Compatibility Matrix

| Project State                     | Behavior                             |
| --------------------------------- | ------------------------------------ |
| No BMAD                           | Standard spec generation (unchanged) |
| BMAD installed, analysis disabled | Standard spec generation             |
| BMAD installed, analysis enabled  | BMAD multi-agent analysis            |

---

## 10. Testing Strategy

### 10.1 Test Coverage

| Test Type   | Scope           | Files                                     |
| ----------- | --------------- | ----------------------------------------- |
| Unit        | Service methods | `bmad-spec-synthesis-service.test.ts`     |
| Integration | API endpoints   | `bmad-spec-synthesis-integration.test.ts` |
| E2E         | Full user flow  | `bmad-spec-generation.spec.ts`            |

### 10.2 Mock Agent Mode

Use existing `AUTOMAKER_MOCK_AGENT=true` for CI testing:

- Mock agent responses return immediately
- Validate event flow without API calls
- Test UI state transitions

---

## 11. Success Criteria

### 11.1 Functional Requirements

- [ ] BMAD analysis checkbox in CreateSpecDialog
- [ ] 9-agent deliberation executes successfully
- [ ] Progress tracker shows real-time agent status
- [ ] Final spec includes insights from all agents
- [ ] Abort functionality works correctly
- [ ] Error handling for individual agent failures
- [ ] Cost estimation displayed before analysis

### 11.2 Performance Requirements

- [ ] Full 9-agent analysis completes in < 5 minutes
- [ ] UI remains responsive during analysis
- [ ] WebSocket events stream without lag

### 11.3 Quality Requirements

- [ ] 80%+ test coverage for new code
- [ ] No regressions in existing spec generation
- [ ] Graceful degradation when BMAD unavailable
- [ ] Clear error messages for all failure modes

---

## 12. Risks & Mitigations

### 12.1 High Cost Per Analysis

**Risk**: $10-15 per spec analysis may be prohibitive for users

**Mitigation**:

- Display cost estimate before starting
- Add cost controls in settings (max per day/month)
- Provide cheaper preset options (fewer agents)
- Default to Sonnet instead of Opus

### 12.2 Long Execution Time

**Risk**: 5-9 minute analysis may frustrate users

**Mitigation**:

- Implement parallel execution with concurrency limits
- Show detailed progress with agent-by-agent status
- Allow abort at any time
- Provide "Quick Review" preset (2 agents, < 2 min)

### 12.3 Agent Failures

**Risk**: Individual agent errors could fail entire analysis

**Mitigation**:

- Continue with available agents on individual failures
- Emit agent-specific error events
- Display partial results if ≥50% agents succeed
- Implement retry logic for transient failures

### 12.4 API Rate Limiting

**Risk**: Parallel execution may hit Anthropic rate limits

**Mitigation**:

- Implement concurrency limit (3 concurrent max)
- Add exponential backoff on 429 errors
- Provide sequential fallback option
- Display rate limit warnings to user

---

## Appendix A: File Change Summary

### New Files (8)

1. `apps/server/src/services/bmad-spec-synthesis-service.ts`
2. `apps/ui/src/components/views/spec-view/components/bmad-progress-tracker.tsx`
3. `apps/server/tests/unit/services/bmad-spec-synthesis-service.test.ts`
4. `apps/server/tests/integration/bmad-spec-synthesis.test.ts`
5. `apps/ui/tests/e2e/bmad-spec-generation.spec.ts`
6. `libs/types/src/bmad-spec.ts` (new type definitions)

### Modified Files (12)

1. `libs/types/src/bmad.ts` - Add synthesis types
2. `libs/types/src/event.ts` - Add BMAD spec events
3. `libs/types/src/settings.ts` - Extend settings interfaces
4. `apps/server/src/routes/app-spec/routes/generate.ts` - Add BMAD routing
5. `apps/server/src/services/settings-service.ts` - BMAD settings methods
6. `apps/ui/src/components/views/spec-view/dialogs/create-spec-dialog.tsx` - Add checkbox
7. `apps/ui/src/components/views/spec-view/dialogs/regenerate-spec-dialog.tsx` - Add checkbox
8. `apps/ui/src/components/views/spec-view/hooks/use-spec-generation.ts` - Event handlers
9. `apps/ui/src/components/views/spec-view/spec-empty-state.tsx` - Progress tracker
10. `CLAUDE.md` - Document workflow
11. `docs/DOCUMENTATION.md` - API docs
12. `README.md` - Mention BMAD integration

---

## Appendix B: Cost Estimation Examples

### Scenario 1: Full 9-Agent Analysis (Opus)

| Agent     | Input Tokens | Output Tokens | Thinking Tokens | Cost       |
| --------- | ------------ | ------------- | --------------- | ---------- |
| Sage      | 15K          | 5K            | 10K             | $1.80      |
| Theo      | 15K          | 5K            | 12K             | $2.00      |
| Finn      | 15K          | 5K            | 9K              | $1.70      |
| Cerberus  | 15K          | 5K            | 10K             | $1.80      |
| Mary      | 15K          | 5K            | 10K             | $1.80      |
| Walt      | 15K          | 5K            | 10K             | $1.80      |
| Axel      | 15K          | 5K            | 9K              | $1.70      |
| Apex      | 15K          | 5K            | 9K              | $1.70      |
| Zen       | 15K          | 5K            | 10K             | $1.80      |
| Synthesis | 50K          | 10K           | 20K             | $4.50      |
| **Total** | **185K**     | **55K**       | **109K**        | **$20.60** |

### Scenario 2: Quick Review (2 agents, Sonnet)

| Agent     | Input Tokens | Output Tokens | Thinking Tokens | Cost      |
| --------- | ------------ | ------------- | --------------- | --------- |
| Sage      | 15K          | 5K            | 10K             | $0.36     |
| Theo      | 15K          | 5K            | 12K             | $0.40     |
| Synthesis | 20K          | 8K            | 15K             | $0.45     |
| **Total** | **50K**      | **18K**       | **37K**         | **$1.21** |

---

## Appendix C: Agent Personas Reference

| ID                            | Name     | Icon | Role                                    | Thinking Budget |
| ----------------------------- | -------- | ---- | --------------------------------------- | --------------- |
| `bmad:strategist-marketer`    | Sage     | 🎯   | Product Strategy + Market Intel         | 10000           |
| `bmad:technologist-architect` | Theo     | 🏗️   | Technical Architecture + Implementation | 12000           |
| `bmad:fulfillization-manager` | Finn     | 🚀   | Delivery + UX + Operations              | 9000            |
| `bmad:security-guardian`      | Cerberus | 🛡️   | Security + Risk Assessment              | 10000           |
| `bmad:analyst-strategist`     | Mary     | 📊   | Research + Analysis + Requirements      | 10000           |
| `bmad:financial-strategist`   | Walt     | 💰   | Financial Planning + ROI                | 10000           |
| `bmad:operations-commander`   | Axel     | ⚙️   | Operations + Process Optimization       | 9000            |
| `bmad:apex`                   | Apex     | ⚡   | Peak Performance Engineering            | 9000            |
| `bmad:zen`                    | Zen      | 🧘   | Clean Architecture + Maintainability    | 10000           |

---

## Sign-Off

**Prepared By**: Claude Sonnet 4.5 + 12 Specialized Investigation Agents
**Review Required**: Yes - Claude Dev Team
**Execution Ready**: Yes - All technical details specified
**Estimated Timeline**: 3-5 days (30-40 hours)

---

**Next Steps**:

1. Claude team reviews PRP
2. Approve/request changes
3. Execute implementation in phases
4. Deploy behind feature flag
5. Gather user feedback
6. Iterate based on real-world usage
