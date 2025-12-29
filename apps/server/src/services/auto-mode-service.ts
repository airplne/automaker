/**
 * Auto Mode Service - Autonomous feature implementation using Claude Agent SDK
 *
 * Manages:
 * - Worktree creation for isolated development
 * - Feature execution with Claude
 * - Concurrent execution with max concurrency limits
 * - Progress streaming via events
 * - Verification and merge workflows
 */

import { ProviderFactory } from '../providers/provider-factory.js';
import type {
  ExecuteOptions,
  Feature,
  PartySynthesisResult,
  ResolvedPersona,
  ResolvedAgentCollab,
  PipelineStep,
  PlanningMode,
} from '@automaker/types';
import {
  buildPromptWithImages,
  isAbortError,
  classifyError,
  loadContextFiles,
} from '@automaker/utils';
import { resolveModelString, DEFAULT_MODELS } from '@automaker/model-resolver';
import { resolveDependencies, areDependenciesSatisfied } from '@automaker/dependency-resolver';
import { getFeatureDir, getAutomakerDir, getFeaturesDir } from '@automaker/platform';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import * as secureFs from '../lib/secure-fs.js';
import type { EventEmitter } from '../lib/events.js';
import {
  createAutoModeOptions,
  createCustomOptions,
  validateWorkingDirectory,
} from '../lib/sdk-options.js';
import { FeatureLoader } from './feature-loader.js';
import { BmadPersonaService } from './bmad-persona-service.js';
import type { SettingsService } from './settings-service.js';
import { pipelineService, PipelineService } from './pipeline-service.js';
import {
  getAutoLoadClaudeMdSetting,
  getEnableSandboxModeSetting,
  filterClaudeMdFromContext,
} from '../lib/settings-helpers.js';

const execAsync = promisify(exec);

interface ParsedTask {
  id: string; // e.g., "T001"
  description: string; // e.g., "Create user model"
  filePath?: string; // e.g., "src/models/user.ts"
  phase?: string; // e.g., "Phase 1: Foundation" (for full mode)
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface PlanSpec {
  status: 'pending' | 'generating' | 'generated' | 'approved' | 'rejected';
  content?: string;
  version: number;
  generatedAt?: string;
  approvedAt?: string;
  reviewedByUser: boolean;
  tasksCompleted?: number;
  tasksTotal?: number;
  currentTaskId?: string;
  tasks?: ParsedTask[];
}

const PLANNING_PROMPTS = {
  lite: `## Planning Phase (Lite Mode)

IMPORTANT: Do NOT output exploration text, tool usage, or thinking before the plan. Start DIRECTLY with the planning outline format below. Silently analyze the codebase first, then output ONLY the structured plan.

Create a brief planning outline:

1. **Goal**: What are we accomplishing? (1 sentence)
2. **Approach**: How will we do it? (2-3 sentences)
3. **Files to Touch**: List files and what changes
4. **Tasks**: Numbered task list (3-7 items)
5. **Risks**: Any gotchas to watch for

After generating the outline, output:
"[PLAN_GENERATED] Planning outline complete."

Then proceed with implementation.`,

  lite_with_approval: `## Planning Phase (Lite Mode)

IMPORTANT: Do NOT output exploration text, tool usage, or thinking before the plan. Start DIRECTLY with the planning outline format below. Silently analyze the codebase first, then output ONLY the structured plan.

Create a brief planning outline:

1. **Goal**: What are we accomplishing? (1 sentence)
2. **Approach**: How will we do it? (2-3 sentences)
3. **Files to Touch**: List files and what changes
4. **Tasks**: Numbered task list (3-7 items)
5. **Risks**: Any gotchas to watch for

After generating the outline, output:
"[SPEC_GENERATED] Please review the planning outline above. Reply with 'approved' to proceed or provide feedback for revisions."

DO NOT proceed with implementation until you receive explicit approval.`,

  spec: `## Specification Phase (Spec Mode)

IMPORTANT: Do NOT output exploration text, tool usage, or thinking before the spec. Start DIRECTLY with the specification format below. Silently analyze the codebase first, then output ONLY the structured specification.

Generate a specification with an actionable task breakdown. WAIT for approval before implementing.

### Specification Format

1. **Problem**: What problem are we solving? (user perspective)

2. **Solution**: Brief approach (1-2 sentences)

3. **Acceptance Criteria**: 3-5 items in GIVEN-WHEN-THEN format
   - GIVEN [context], WHEN [action], THEN [outcome]

4. **Files to Modify**:
   | File | Purpose | Action |
   |------|---------|--------|
   | path/to/file | description | create/modify/delete |

5. **Implementation Tasks**:
   Use this EXACT format for each task (the system will parse these):
   \`\`\`tasks
   - [ ] T001: [Description] | File: [path/to/file]
   - [ ] T002: [Description] | File: [path/to/file]
   - [ ] T003: [Description] | File: [path/to/file]
   \`\`\`

   Task ID rules:
   - Sequential: T001, T002, T003, etc.
   - Description: Clear action (e.g., "Create user model", "Add API endpoint")
   - File: Primary file affected (helps with context)
   - Order by dependencies (foundational tasks first)

6. **Verification**: How to confirm feature works

After generating the spec, output on its own line:
"[SPEC_GENERATED] Please review the specification above. Reply with 'approved' to proceed or provide feedback for revisions."

DO NOT proceed with implementation until you receive explicit approval.

When approved, execute tasks SEQUENTIALLY in order. For each task:
1. BEFORE starting, output: "[TASK_START] T###: Description"
2. Implement the task
3. AFTER completing, output: "[TASK_COMPLETE] T###: Brief summary"

This allows real-time progress tracking during implementation.`,

  full: `## Full Specification Phase (Full SDD Mode)

IMPORTANT: Do NOT output exploration text, tool usage, or thinking before the spec. Start DIRECTLY with the specification format below. Silently analyze the codebase first, then output ONLY the structured specification.

Generate a comprehensive specification with phased task breakdown. WAIT for approval before implementing.

### Specification Format

1. **Problem Statement**: 2-3 sentences from user perspective

2. **User Story**: As a [user], I want [goal], so that [benefit]

3. **Acceptance Criteria**: Multiple scenarios with GIVEN-WHEN-THEN
   - **Happy Path**: GIVEN [context], WHEN [action], THEN [expected outcome]
   - **Edge Cases**: GIVEN [edge condition], WHEN [action], THEN [handling]
   - **Error Handling**: GIVEN [error condition], WHEN [action], THEN [error response]

4. **Technical Context**:
   | Aspect | Value |
   |--------|-------|
   | Affected Files | list of files |
   | Dependencies | external libs if any |
   | Constraints | technical limitations |
   | Patterns to Follow | existing patterns in codebase |

5. **Non-Goals**: What this feature explicitly does NOT include

6. **Implementation Tasks**:
   Use this EXACT format for each task (the system will parse these):
   \`\`\`tasks
   ## Phase 1: Foundation
   - [ ] T001: [Description] | File: [path/to/file]
   - [ ] T002: [Description] | File: [path/to/file]

   ## Phase 2: Core Implementation
   - [ ] T003: [Description] | File: [path/to/file]
   - [ ] T004: [Description] | File: [path/to/file]

   ## Phase 3: Integration & Testing
   - [ ] T005: [Description] | File: [path/to/file]
   - [ ] T006: [Description] | File: [path/to/file]
   \`\`\`

   Task ID rules:
   - Sequential across all phases: T001, T002, T003, etc.
   - Description: Clear action verb + target
   - File: Primary file affected
   - Order by dependencies within each phase
   - Phase structure helps organize complex work

7. **Success Metrics**: How we know it's done (measurable criteria)

8. **Risks & Mitigations**:
   | Risk | Mitigation |
   |------|------------|
   | description | approach |

After generating the spec, output on its own line:
"[SPEC_GENERATED] Please review the comprehensive specification above. Reply with 'approved' to proceed or provide feedback for revisions."

DO NOT proceed with implementation until you receive explicit approval.

When approved, execute tasks SEQUENTIALLY by phase. For each task:
1. BEFORE starting, output: "[TASK_START] T###: Description"
2. Implement the task
3. AFTER completing, output: "[TASK_COMPLETE] T###: Brief summary"

After completing all tasks in a phase, output:
"[PHASE_COMPLETE] Phase N complete"

This allows real-time progress tracking during implementation.`,
};

const WIZARD_SYSTEM_PROMPT = `You are in WIZARD MODE. Your job is to ask 2-5 clarifying questions before planning.

## Output Format
For each question, output exactly:
   [WIZARD_QUESTION]{"id":"Q1","header":"Short Label","question":"Full question?","multiSelect":false,"options":[{"label":"Option 1","description":"Description","value":"value1"},{"label":"Option 2","description":"Description","value":"value2"}]}

When done asking questions:
   [WIZARD_COMPLETE]

## Rules
- Ask 2-5 total questions (not more)
- Each question must have 2-4 options
- Questions should clarify: scope, approach, constraints, or preferences
- Be specific to the task, not generic
- After [WIZARD_COMPLETE], you will write the plan using all answers
`;

const PARTY_SYNTHESIS_SCHEMA = {
  type: 'object',
  properties: {
    agents: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Agent identifier (e.g., "bmad:pm")' },
          position: { type: 'string', description: "Agent's position or contribution summary" },
        },
        required: ['id', 'position'],
      },
      description: 'Agents who participated in the synthesis',
    },
    consensus: {
      type: ['string', 'null'],
      description: 'Synthesized consensus, or null if no agreement',
    },
    dissent: {
      type: 'array',
      items: { type: 'string' },
      description: 'Points of disagreement',
    },
    recommendation: {
      type: 'string',
      description: 'Final actionable recommendation',
    },
    markdownSummary: {
      type: 'string',
      description: 'Human-readable markdown summary',
    },
  },
  required: ['agents', 'consensus', 'dissent', 'recommendation', 'markdownSummary'],
  additionalProperties: false,
} as const;

/**
 * Parse tasks from generated spec content
 * Looks for the ```tasks code block and extracts task lines
 * Format: - [ ] T###: Description | File: path/to/file
 */
function parseTasksFromSpec(specContent: string): ParsedTask[] {
  const tasks: ParsedTask[] = [];

  // Extract content within ```tasks ... ``` block
  const tasksBlockMatch = specContent.match(/```tasks\s*([\s\S]*?)```/);
  if (!tasksBlockMatch) {
    // Try fallback: look for task lines anywhere in content
    const taskLines = specContent.match(/- \[ \] T\d{3}:.*$/gm);
    if (!taskLines) {
      return tasks;
    }
    // Parse fallback task lines
    let currentPhase: string | undefined;
    for (const line of taskLines) {
      const parsed = parseTaskLine(line, currentPhase);
      if (parsed) {
        tasks.push(parsed);
      }
    }
    return tasks;
  }

  const tasksContent = tasksBlockMatch[1];
  const lines = tasksContent.split('\n');

  let currentPhase: string | undefined;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check for phase header (e.g., "## Phase 1: Foundation")
    const phaseMatch = trimmedLine.match(/^##\s*(.+)$/);
    if (phaseMatch) {
      currentPhase = phaseMatch[1].trim();
      continue;
    }

    // Check for task line
    if (trimmedLine.startsWith('- [ ]')) {
      const parsed = parseTaskLine(trimmedLine, currentPhase);
      if (parsed) {
        tasks.push(parsed);
      }
    }
  }

  return tasks;
}

/**
 * Parse a single task line
 * Format: - [ ] T###: Description | File: path/to/file
 */
function parseTaskLine(line: string, currentPhase?: string): ParsedTask | null {
  // Match pattern: - [ ] T###: Description | File: path
  const taskMatch = line.match(/- \[ \] (T\d{3}):\s*([^|]+)(?:\|\s*File:\s*(.+))?$/);
  if (!taskMatch) {
    // Try simpler pattern without file
    const simpleMatch = line.match(/- \[ \] (T\d{3}):\s*(.+)$/);
    if (simpleMatch) {
      return {
        id: simpleMatch[1],
        description: simpleMatch[2].trim(),
        phase: currentPhase,
        status: 'pending',
      };
    }
    return null;
  }

  return {
    id: taskMatch[1],
    description: taskMatch[2].trim(),
    filePath: taskMatch[3]?.trim(),
    phase: currentPhase,
    status: 'pending',
  };
}

// Feature type is imported from feature-loader.js
// Extended type with planning fields for local use
interface FeatureWithPlanning extends Feature {
  planningMode?: PlanningMode;
  planSpec?: PlanSpec;
  requirePlanApproval?: boolean;
}

interface RunningFeature {
  featureId: string;
  projectPath: string;
  worktreePath: string | null;
  branchName: string | null;
  abortController: AbortController;
  isAutoMode: boolean;
  startTime: number;
}

interface AutoLoopState {
  projectPath: string;
  maxConcurrency: number;
  abortController: AbortController;
  isRunning: boolean;
}

interface PendingApproval {
  resolve: (result: { approved: boolean; editedPlan?: string; feedback?: string }) => void;
  reject: (error: Error) => void;
  featureId: string;
  projectPath: string;
}

interface AutoModeConfig {
  maxConcurrency: number;
  useWorktrees: boolean;
  projectPath: string;
}

export class AutoModeService {
  private events: EventEmitter;
  private runningFeatures = new Map<string, RunningFeature>();
  private autoLoop: AutoLoopState | null = null;
  private featureLoader = new FeatureLoader();
  private bmadPersonaService = new BmadPersonaService();
  private autoLoopRunning = false;
  private autoLoopAbortController: AbortController | null = null;
  private config: AutoModeConfig | null = null;
  private pendingApprovals = new Map<string, PendingApproval>();
  private pendingWizardAnswers = new Map<
    string,
    {
      resolve: (answer: string | string[]) => void;
      reject: (reason: Error) => void;
      featureId: string;
      projectPath: string;
      questionId: string;
    }
  >();
  private settingsService: SettingsService | null = null;

  constructor(events: EventEmitter, settingsService?: SettingsService) {
    this.events = events;
    this.settingsService = settingsService ?? null;
  }

  /**
   * Start the auto mode loop - continuously picks and executes pending features
   */
  async startAutoLoop(projectPath: string, maxConcurrency = 3): Promise<void> {
    if (this.autoLoopRunning) {
      throw new Error('Auto mode is already running');
    }

    this.autoLoopRunning = true;
    this.autoLoopAbortController = new AbortController();
    this.config = {
      maxConcurrency,
      useWorktrees: true,
      projectPath,
    };

    this.emitAutoModeEvent('auto_mode_started', {
      message: `Auto mode started with max ${maxConcurrency} concurrent features`,
      projectPath,
    });

    // Run the loop in the background
    this.runAutoLoop().catch((error) => {
      console.error('[AutoMode] Loop error:', error);
      const errorInfo = classifyError(error);
      this.emitAutoModeEvent('auto_mode_error', {
        error: errorInfo.message,
        errorType: errorInfo.type,
      });
    });
  }

  private async runAutoLoop(): Promise<void> {
    while (
      this.autoLoopRunning &&
      this.autoLoopAbortController &&
      !this.autoLoopAbortController.signal.aborted
    ) {
      try {
        // Check if we have capacity
        if (this.runningFeatures.size >= (this.config?.maxConcurrency || 3)) {
          await this.sleep(5000);
          continue;
        }

        // Load pending features
        const pendingFeatures = await this.loadPendingFeatures(this.config!.projectPath);

        if (pendingFeatures.length === 0) {
          this.emitAutoModeEvent('auto_mode_idle', {
            message: 'No pending features - auto mode idle',
            projectPath: this.config!.projectPath,
          });
          await this.sleep(10000);
          continue;
        }

        // Find a feature not currently running
        const nextFeature = pendingFeatures.find((f) => !this.runningFeatures.has(f.id));

        if (nextFeature) {
          // Start feature execution in background
          this.executeFeature(
            this.config!.projectPath,
            nextFeature.id,
            this.config!.useWorktrees,
            true
          ).catch((error) => {
            console.error(`[AutoMode] Feature ${nextFeature.id} error:`, error);
          });
        }

        await this.sleep(2000);
      } catch (error) {
        console.error('[AutoMode] Loop iteration error:', error);
        await this.sleep(5000);
      }
    }

    this.autoLoopRunning = false;
  }

  /**
   * Stop the auto mode loop
   */
  async stopAutoLoop(): Promise<number> {
    const wasRunning = this.autoLoopRunning;
    this.autoLoopRunning = false;
    if (this.autoLoopAbortController) {
      this.autoLoopAbortController.abort();
      this.autoLoopAbortController = null;
    }

    // Emit stop event immediately when user explicitly stops
    if (wasRunning) {
      this.emitAutoModeEvent('auto_mode_stopped', {
        message: 'Auto mode stopped',
        projectPath: this.config?.projectPath,
      });
    }

    return this.runningFeatures.size;
  }

  /**
   * Execute a single feature
   * @param projectPath - The main project path
   * @param featureId - The feature ID to execute
   * @param useWorktrees - Whether to use worktrees for isolation
   * @param isAutoMode - Whether this is running in auto mode
   */
  async executeFeature(
    projectPath: string,
    featureId: string,
    useWorktrees = false,
    isAutoMode = false,
    providedWorktreePath?: string,
    options?: {
      continuationPrompt?: string;
    }
  ): Promise<void> {
    if (this.runningFeatures.has(featureId)) {
      throw new Error('already running');
    }

    // Add to running features immediately to prevent race conditions
    const abortController = new AbortController();
    const tempRunningFeature: RunningFeature = {
      featureId,
      projectPath,
      worktreePath: null,
      branchName: null,
      abortController,
      isAutoMode,
      startTime: Date.now(),
    };
    this.runningFeatures.set(featureId, tempRunningFeature);

    try {
      // Validate that project path is allowed using centralized validation
      validateWorkingDirectory(projectPath);

      // Check if feature has existing context - if so, resume instead of starting fresh
      // Skip this check if we're already being called with a continuation prompt (from resumeFeature)
      if (!options?.continuationPrompt) {
        const hasExistingContext = await this.contextExists(projectPath, featureId);
        if (hasExistingContext) {
          console.log(
            `[AutoMode] Feature ${featureId} has existing context, resuming instead of starting fresh`
          );
          // Remove from running features temporarily, resumeFeature will add it back
          this.runningFeatures.delete(featureId);
          return this.resumeFeature(projectPath, featureId, useWorktrees);
        }
      }

      // Emit feature start event early
      this.emitAutoModeEvent('auto_mode_feature_start', {
        featureId,
        projectPath,
        feature: {
          id: featureId,
          title: 'Loading...',
          description: 'Feature is starting',
        },
      });
      // Load feature details FIRST to get branchName
      const feature = await this.loadFeature(projectPath, featureId);
      if (!feature) {
        throw new Error(`Feature ${featureId} not found`);
      }

      // Derive workDir from feature.branchName
      // Worktrees should already be created when the feature is added/edited
      let worktreePath: string | null = null;
      const branchName = feature.branchName;

      if (useWorktrees && branchName) {
        // Try to find existing worktree for this branch
        // Worktree should already exist (created when feature was added/edited)
        worktreePath = await this.findExistingWorktreeForBranch(projectPath, branchName);

        if (worktreePath) {
          console.log(`[AutoMode] Using worktree for branch "${branchName}": ${worktreePath}`);
        } else {
          // Worktree doesn't exist - log warning and continue with project path
          console.warn(
            `[AutoMode] Worktree for branch "${branchName}" not found, using project path`
          );
        }
      }

      // Ensure workDir is always an absolute path for cross-platform compatibility
      const workDir = worktreePath ? path.resolve(worktreePath) : path.resolve(projectPath);

      // Validate that working directory is allowed using centralized validation
      validateWorkingDirectory(workDir);

      // Update running feature with actual worktree info
      tempRunningFeature.worktreePath = worktreePath;
      tempRunningFeature.branchName = branchName ?? null;

      // Update feature status to in_progress
      await this.updateFeatureStatus(projectPath, featureId, 'in_progress');

      // Load autoLoadClaudeMd setting to determine context loading strategy
      const autoLoadClaudeMd = await getAutoLoadClaudeMdSetting(
        projectPath,
        this.settingsService,
        '[AutoMode]'
      );

      // Build the prompt - use continuation prompt if provided (for recovery after plan approval)
      let prompt: string;
      // Load project context files (CLAUDE.md, CODE_QUALITY.md, etc.) - passed as system prompt
      const contextResult = await loadContextFiles({
        projectPath,
        fsModule: secureFs as Parameters<typeof loadContextFiles>[0]['fsModule'],
      });

      // When autoLoadClaudeMd is enabled, filter out CLAUDE.md to avoid duplication
      // (SDK handles CLAUDE.md via settingSources), but keep other context files like CODE_QUALITY.md
      const contextFilesPrompt = filterClaudeMdFromContext(contextResult, autoLoadClaudeMd);

      // Resolve BMAD persona + optional profile prompt
      const projectSettings = this.settingsService
        ? await this.settingsService.getProjectSettings(projectPath)
        : null;
      const bmadArtifactsDir = this.normalizeBmadArtifactsDir(projectSettings?.bmad?.artifactsDir);

      const globalSettings = this.settingsService
        ? await this.settingsService.getGlobalSettings()
        : null;
      const selectedProfile =
        feature.aiProfileId && globalSettings
          ? globalSettings.aiProfiles.find((p) => p.id === feature.aiProfileId)
          : undefined;

      // Determine effective agent IDs with backward compatibility for personaId
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

      const agentSystemPrompt =
        resolvedCollab?.combinedSystemPrompt || resolvedPersona?.systemPrompt;

      const baseSystemPrompt = this.getAutoModeBaseSystemPrompt({
        bmadArtifactsDir,
      });

      const combinedSystemPrompt = [
        contextFilesPrompt,
        agentSystemPrompt,
        selectedProfile?.systemPrompt,
        baseSystemPrompt,
      ]
        .filter(Boolean)
        .join('\n\n');

      // Party Mode Synthesis (one-shot)
      if (effectiveAgentIds?.length === 1 && effectiveAgentIds[0] === 'bmad:party-synthesis') {
        const model = resolveModelString(
          resolvedPersona?.model || feature.model,
          DEFAULT_MODELS.claude
        );
        const maxThinkingTokens =
          resolvedPersona?.thinkingBudget ??
          this.thinkingLevelToMaxThinkingTokens(feature.thinkingLevel);

        const synthesisPrompt = this.buildPartySynthesisPrompt({ feature });

        await this.runPartySynthesis({
          projectPath,
          workDir,
          feature,
          featureId,
          prompt: synthesisPrompt,
          systemPrompt: combinedSystemPrompt || undefined,
          model,
          maxThinkingTokens,
          autoLoadClaudeMd,
          bmadArtifactsDir,
          abortController,
        });

        const finalStatus = feature.skipTests ? 'waiting_approval' : 'verified';
        await this.updateFeatureStatus(projectPath, featureId, finalStatus);

        this.emitAutoModeEvent('auto_mode_feature_complete', {
          featureId,
          passes: true,
          message: `Party synthesis completed${finalStatus === 'verified' ? ' - auto-verified' : ''}`,
          projectPath,
        });

        return;
      }

      if (options?.continuationPrompt) {
        // Continuation prompt is used when recovering from a plan approval
        // The plan was already approved, so skip the planning phase
        prompt = options.continuationPrompt;
        console.log(`[AutoMode] Using continuation prompt for feature ${featureId}`);
      } else {
        // Normal flow: build prompt with planning phase
        const featurePrompt = this.buildFeaturePrompt(feature);
        const planningPrefix = this.getPlanningPromptPrefix(feature);
        prompt = planningPrefix + featurePrompt;

        // Emit planning mode info
        if (feature.planningMode && feature.planningMode !== 'skip') {
          this.emitAutoModeEvent('planning_started', {
            featureId: feature.id,
            mode: feature.planningMode,
            message: `Starting ${feature.planningMode} planning phase`,
          });
        }
      }

      // Extract image paths from feature
      const imagePaths = feature.imagePaths?.map((img) =>
        typeof img === 'string' ? img : img.path
      );

      // Get model from feature
      const model = resolveModelString(
        resolvedPersona?.model || feature.model,
        DEFAULT_MODELS.claude
      );
      const maxThinkingTokens =
        resolvedPersona?.thinkingBudget ??
        this.thinkingLevelToMaxThinkingTokens(feature.thinkingLevel);
      console.log(`[AutoMode] Executing feature ${featureId} with model: ${model} in ${workDir}`);

      // Run the agent with the feature's model and images
      // Context files are passed as system prompt for higher priority
      await this.runAgent(
        workDir,
        featureId,
        prompt,
        abortController,
        projectPath,
        imagePaths,
        model,
        {
          projectPath,
          planningMode: feature.planningMode,
          requirePlanApproval: feature.requirePlanApproval,
          systemPrompt: combinedSystemPrompt || undefined,
          autoLoadClaudeMd,
          maxThinkingTokens,
          mcpServers: resolvedPersona?.mcpServers,
        }
      );

      // Check for pipeline steps and execute them
      const pipelineConfig = await pipelineService.getPipelineConfig(projectPath);
      const sortedSteps = [...(pipelineConfig?.steps || [])].sort((a, b) => a.order - b.order);

      if (sortedSteps.length > 0) {
        // Execute pipeline steps sequentially
        await this.executePipelineSteps(
          projectPath,
          featureId,
          feature,
          sortedSteps,
          workDir,
          abortController,
          autoLoadClaudeMd
        );
      }

      // Determine final status based on testing mode:
      // - skipTests=false (automated testing): go directly to 'verified' (no manual verify needed)
      // - skipTests=true (manual verification): go to 'waiting_approval' for manual review
      const finalStatus = feature.skipTests ? 'waiting_approval' : 'verified';
      await this.updateFeatureStatus(projectPath, featureId, finalStatus);

      this.emitAutoModeEvent('auto_mode_feature_complete', {
        featureId,
        passes: true,
        message: `Feature completed in ${Math.round(
          (Date.now() - tempRunningFeature.startTime) / 1000
        )}s${finalStatus === 'verified' ? ' - auto-verified' : ''}`,
        projectPath,
      });
    } catch (error) {
      const errorInfo = classifyError(error);

      if (errorInfo.isAbort) {
        this.emitAutoModeEvent('auto_mode_feature_complete', {
          featureId,
          passes: false,
          message: 'Feature stopped by user',
          projectPath,
        });
      } else {
        console.error(`[AutoMode] Feature ${featureId} failed:`, error);
        await this.updateFeatureStatus(projectPath, featureId, 'backlog');
        this.emitAutoModeEvent('auto_mode_error', {
          featureId,
          error: errorInfo.message,
          errorType: errorInfo.type,
          projectPath,
        });
      }
    } finally {
      console.log(`[AutoMode] Feature ${featureId} execution ended, cleaning up runningFeatures`);
      console.log(
        `[AutoMode] Pending approvals at cleanup: ${Array.from(this.pendingApprovals.keys()).join(', ') || 'none'}`
      );
      this.runningFeatures.delete(featureId);
    }
  }

  /**
   * Execute pipeline steps sequentially after initial feature implementation
   */
  private async executePipelineSteps(
    projectPath: string,
    featureId: string,
    feature: Feature,
    steps: PipelineStep[],
    workDir: string,
    abortController: AbortController,
    autoLoadClaudeMd: boolean
  ): Promise<void> {
    console.log(`[AutoMode] Executing ${steps.length} pipeline step(s) for feature ${featureId}`);

    // Load context files once
    const contextResult = await loadContextFiles({
      projectPath,
      fsModule: secureFs as Parameters<typeof loadContextFiles>[0]['fsModule'],
    });
    const contextFilesPrompt = filterClaudeMdFromContext(contextResult, autoLoadClaudeMd);

    // Load previous agent output for context continuity
    const featureDir = getFeatureDir(projectPath, featureId);
    const contextPath = path.join(featureDir, 'agent-output.md');
    let previousContext = '';
    try {
      previousContext = (await secureFs.readFile(contextPath, 'utf-8')) as string;
    } catch {
      // No previous context
    }

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const pipelineStatus = `pipeline_${step.id}`;

      // Update feature status to current pipeline step
      await this.updateFeatureStatus(projectPath, featureId, pipelineStatus);

      this.emitAutoModeEvent('auto_mode_progress', {
        featureId,
        content: `Starting pipeline step ${i + 1}/${steps.length}: ${step.name}`,
        projectPath,
      });

      this.emitAutoModeEvent('pipeline_step_started', {
        featureId,
        stepId: step.id,
        stepName: step.name,
        stepIndex: i,
        totalSteps: steps.length,
        projectPath,
      });

      // Build prompt for this pipeline step
      const prompt = this.buildPipelineStepPrompt(step, feature, previousContext);

      // Get model from feature
      const model = resolveModelString(feature.model, DEFAULT_MODELS.claude);

      // Run the agent for this pipeline step
      await this.runAgent(
        workDir,
        featureId,
        prompt,
        abortController,
        projectPath,
        undefined, // no images for pipeline steps
        model,
        {
          projectPath,
          planningMode: 'skip', // Pipeline steps don't need planning
          requirePlanApproval: false,
          previousContent: previousContext,
          systemPrompt: contextFilesPrompt || undefined,
          autoLoadClaudeMd,
        }
      );

      // Load updated context for next step
      try {
        previousContext = (await secureFs.readFile(contextPath, 'utf-8')) as string;
      } catch {
        // No context update
      }

      this.emitAutoModeEvent('pipeline_step_complete', {
        featureId,
        stepId: step.id,
        stepName: step.name,
        stepIndex: i,
        totalSteps: steps.length,
        projectPath,
      });

      console.log(
        `[AutoMode] Pipeline step ${i + 1}/${steps.length} (${step.name}) completed for feature ${featureId}`
      );
    }

    console.log(`[AutoMode] All pipeline steps completed for feature ${featureId}`);
  }

  /**
   * Build the prompt for a pipeline step
   */
  private buildPipelineStepPrompt(
    step: PipelineStep,
    feature: Feature,
    previousContext: string
  ): string {
    let prompt = `## Pipeline Step: ${step.name}

This is an automated pipeline step following the initial feature implementation.

### Feature Context
${this.buildFeaturePrompt(feature)}

`;

    if (previousContext) {
      prompt += `### Previous Work
The following is the output from the previous work on this feature:

${previousContext}

`;
    }

    prompt += `### Pipeline Step Instructions
${step.instructions}

### Task
Complete the pipeline step instructions above. Review the previous work and apply the required changes or actions.`;

    return prompt;
  }

  /**
   * Stop a specific feature
   */
  async stopFeature(featureId: string): Promise<boolean> {
    const running = this.runningFeatures.get(featureId);
    if (!running) {
      return false;
    }

    // Cancel any pending plan approval for this feature
    this.cancelPlanApproval(featureId);

    running.abortController.abort();
    return true;
  }

  /**
   * Resume a feature (continues from saved context)
   */
  async resumeFeature(projectPath: string, featureId: string, useWorktrees = false): Promise<void> {
    if (this.runningFeatures.has(featureId)) {
      throw new Error('already running');
    }

    // Check if context exists in .automaker directory
    const featureDir = getFeatureDir(projectPath, featureId);
    const contextPath = path.join(featureDir, 'agent-output.md');

    let hasContext = false;
    try {
      await secureFs.access(contextPath);
      hasContext = true;
    } catch {
      // No context
    }

    if (hasContext) {
      // Load previous context and continue
      const context = (await secureFs.readFile(contextPath, 'utf-8')) as string;
      return this.executeFeatureWithContext(projectPath, featureId, context, useWorktrees);
    }

    // No context, start fresh - executeFeature will handle adding to runningFeatures
    // Remove the temporary entry we added
    this.runningFeatures.delete(featureId);
    return this.executeFeature(projectPath, featureId, useWorktrees, false);
  }

  /**
   * Follow up on a feature with additional instructions
   */
  async followUpFeature(
    projectPath: string,
    featureId: string,
    prompt: string,
    imagePaths?: string[],
    useWorktrees = true
  ): Promise<void> {
    // Validate project path early for fast failure
    validateWorkingDirectory(projectPath);

    if (this.runningFeatures.has(featureId)) {
      throw new Error(`Feature ${featureId} is already running`);
    }

    const abortController = new AbortController();

    // Load feature info for context FIRST to get branchName
    const feature = await this.loadFeature(projectPath, featureId);

    // Derive workDir from feature.branchName
    // If no branchName, derive from feature ID: feature/{featureId}
    let workDir = path.resolve(projectPath);
    let worktreePath: string | null = null;
    const branchName = feature?.branchName || `feature/${featureId}`;

    if (useWorktrees && branchName) {
      // Try to find existing worktree for this branch
      worktreePath = await this.findExistingWorktreeForBranch(projectPath, branchName);

      if (worktreePath) {
        workDir = worktreePath;
        console.log(`[AutoMode] Follow-up using worktree for branch "${branchName}": ${workDir}`);
      }
    }

    // Load previous agent output if it exists
    const featureDir = getFeatureDir(projectPath, featureId);
    const contextPath = path.join(featureDir, 'agent-output.md');
    let previousContext = '';
    try {
      previousContext = (await secureFs.readFile(contextPath, 'utf-8')) as string;
    } catch {
      // No previous context
    }

    // Load autoLoadClaudeMd setting to determine context loading strategy
    const autoLoadClaudeMd = await getAutoLoadClaudeMdSetting(
      projectPath,
      this.settingsService,
      '[AutoMode]'
    );

    // Load project context files (CLAUDE.md, CODE_QUALITY.md, etc.) - passed as system prompt
    const contextResult = await loadContextFiles({
      projectPath,
      fsModule: secureFs as Parameters<typeof loadContextFiles>[0]['fsModule'],
    });

    // When autoLoadClaudeMd is enabled, filter out CLAUDE.md to avoid duplication
    // (SDK handles CLAUDE.md via settingSources), but keep other context files like CODE_QUALITY.md
    const contextFilesPrompt = filterClaudeMdFromContext(contextResult, autoLoadClaudeMd);

    // Resolve BMAD persona + optional profile prompt
    const projectSettings = this.settingsService
      ? await this.settingsService.getProjectSettings(projectPath)
      : null;
    const bmadArtifactsDir = this.normalizeBmadArtifactsDir(projectSettings?.bmad?.artifactsDir);

    const globalSettings = this.settingsService
      ? await this.settingsService.getGlobalSettings()
      : null;
    const selectedProfile =
      feature?.aiProfileId && globalSettings
        ? globalSettings.aiProfiles.find((p) => p.id === feature.aiProfileId)
        : undefined;

    // Determine effective agent IDs with backward compatibility for personaId
    const effectiveAgentIds = feature?.agentIds?.length
      ? feature.agentIds
      : feature?.personaId // Backward compat
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

    const baseSystemPrompt = this.getAutoModeBaseSystemPrompt({
      bmadArtifactsDir,
    });

    const combinedSystemPrompt = [
      contextFilesPrompt,
      agentSystemPrompt,
      selectedProfile?.systemPrompt,
      baseSystemPrompt,
    ]
      .filter(Boolean)
      .join('\n\n');

    // Party Mode Synthesis follow-up (one-shot)
    if (
      effectiveAgentIds?.length === 1 &&
      effectiveAgentIds[0] === 'bmad:party-synthesis' &&
      feature
    ) {
      this.runningFeatures.set(featureId, {
        featureId,
        projectPath,
        worktreePath,
        branchName,
        abortController,
        isAutoMode: false,
        startTime: Date.now(),
      });

      this.emitAutoModeEvent('auto_mode_feature_start', {
        featureId,
        projectPath,
        feature: feature || {
          id: featureId,
          title: 'Party Synthesis Follow-up',
          description: prompt.substring(0, 100),
        },
      });

      try {
        await this.updateFeatureStatus(projectPath, featureId, 'in_progress');

        const model = resolveModelString(
          resolvedPersona?.model || feature.model,
          DEFAULT_MODELS.claude
        );
        const maxThinkingTokens =
          resolvedPersona?.thinkingBudget ??
          this.thinkingLevelToMaxThinkingTokens(feature.thinkingLevel);

        const synthesisPrompt = this.buildPartySynthesisPrompt({
          feature,
          previousContext: previousContext || undefined,
          followUpInstructions: prompt,
        });

        await this.runPartySynthesis({
          projectPath,
          workDir,
          feature,
          featureId,
          prompt: synthesisPrompt,
          systemPrompt: combinedSystemPrompt || undefined,
          model,
          maxThinkingTokens,
          autoLoadClaudeMd,
          bmadArtifactsDir,
          abortController,
        });

        const finalStatus = feature.skipTests ? 'waiting_approval' : 'verified';
        await this.updateFeatureStatus(projectPath, featureId, finalStatus);

        this.emitAutoModeEvent('auto_mode_feature_complete', {
          featureId,
          passes: true,
          message: `Party synthesis follow-up completed${finalStatus === 'verified' ? ' - auto-verified' : ''}`,
          projectPath,
        });
      } catch (error) {
        const errorInfo = classifyError(error);
        if (!errorInfo.isCancellation) {
          this.emitAutoModeEvent('auto_mode_error', {
            featureId,
            error: errorInfo.message,
            errorType: errorInfo.type,
            projectPath,
          });
        }
      } finally {
        this.runningFeatures.delete(featureId);
      }

      return;
    }

    // Build complete prompt with feature info, previous context, and follow-up instructions
    let fullPrompt = `## Follow-up on Feature Implementation

${feature ? this.buildFeaturePrompt(feature) : `**Feature ID:** ${featureId}`}
`;

    if (previousContext) {
      fullPrompt += `
## Previous Agent Work
The following is the output from the previous implementation attempt:

${previousContext}
`;
    }

    fullPrompt += `
## Follow-up Instructions
${prompt}

## Task
Address the follow-up instructions above. Review the previous work and make the requested changes or fixes.`;

    this.runningFeatures.set(featureId, {
      featureId,
      projectPath,
      worktreePath,
      branchName,
      abortController,
      isAutoMode: false,
      startTime: Date.now(),
    });

    this.emitAutoModeEvent('auto_mode_feature_start', {
      featureId,
      projectPath,
      feature: feature || {
        id: featureId,
        title: 'Follow-up',
        description: prompt.substring(0, 100),
      },
    });

    try {
      // Get model from feature (already loaded above)
      const model = resolveModelString(
        resolvedPersona?.model || feature?.model,
        DEFAULT_MODELS.claude
      );
      const maxThinkingTokens =
        resolvedPersona?.thinkingBudget ??
        this.thinkingLevelToMaxThinkingTokens(feature?.thinkingLevel);
      console.log(`[AutoMode] Follow-up for feature ${featureId} using model: ${model}`);

      // Update feature status to in_progress
      await this.updateFeatureStatus(projectPath, featureId, 'in_progress');

      // Copy follow-up images to feature folder
      const copiedImagePaths: string[] = [];
      if (imagePaths && imagePaths.length > 0) {
        const featureDirForImages = getFeatureDir(projectPath, featureId);
        const featureImagesDir = path.join(featureDirForImages, 'images');

        await secureFs.mkdir(featureImagesDir, { recursive: true });

        for (const imagePath of imagePaths) {
          try {
            // Get the filename from the path
            const filename = path.basename(imagePath);
            const destPath = path.join(featureImagesDir, filename);

            // Copy the image
            await secureFs.copyFile(imagePath, destPath);

            // Store the absolute path (external storage uses absolute paths)
            copiedImagePaths.push(destPath);
          } catch (error) {
            console.error(`[AutoMode] Failed to copy follow-up image ${imagePath}:`, error);
          }
        }
      }

      // Update feature object with new follow-up images BEFORE building prompt
      if (copiedImagePaths.length > 0 && feature) {
        const currentImagePaths = feature.imagePaths || [];
        const newImagePaths = copiedImagePaths.map((p) => ({
          path: p,
          filename: path.basename(p),
          mimeType: 'image/png', // Default, could be improved
        }));

        feature.imagePaths = [...currentImagePaths, ...newImagePaths];
      }

      // Combine original feature images with new follow-up images
      const allImagePaths: string[] = [];

      // Add all images from feature (now includes both original and new)
      if (feature?.imagePaths) {
        const allPaths = feature.imagePaths.map((img) =>
          typeof img === 'string' ? img : img.path
        );
        allImagePaths.push(...allPaths);
      }

      // Save updated feature.json with new images
      if (copiedImagePaths.length > 0 && feature) {
        const featureDirForSave = getFeatureDir(projectPath, featureId);
        const featurePath = path.join(featureDirForSave, 'feature.json');

        try {
          await secureFs.writeFile(featurePath, JSON.stringify(feature, null, 2));
        } catch (error) {
          console.error(`[AutoMode] Failed to save feature.json:`, error);
        }
      }

      // Use fullPrompt (already built above) with model and all images
      // Note: Follow-ups skip planning mode - they continue from previous work
      // Pass previousContext so the history is preserved in the output file
      // Context files are passed as system prompt for higher priority
      await this.runAgent(
        workDir,
        featureId,
        fullPrompt,
        abortController,
        projectPath,
        allImagePaths.length > 0 ? allImagePaths : imagePaths,
        model,
        {
          projectPath,
          planningMode: 'skip', // Follow-ups don't require approval
          previousContent: previousContext || undefined,
          systemPrompt: combinedSystemPrompt || undefined,
          autoLoadClaudeMd,
          maxThinkingTokens,
          mcpServers: resolvedPersona?.mcpServers,
        }
      );

      // Determine final status based on testing mode:
      // - skipTests=false (automated testing): go directly to 'verified' (no manual verify needed)
      // - skipTests=true (manual verification): go to 'waiting_approval' for manual review
      const finalStatus = feature?.skipTests ? 'waiting_approval' : 'verified';
      await this.updateFeatureStatus(projectPath, featureId, finalStatus);

      this.emitAutoModeEvent('auto_mode_feature_complete', {
        featureId,
        passes: true,
        message: `Follow-up completed successfully${finalStatus === 'verified' ? ' - auto-verified' : ''}`,
        projectPath,
      });
    } catch (error) {
      const errorInfo = classifyError(error);
      if (!errorInfo.isCancellation) {
        this.emitAutoModeEvent('auto_mode_error', {
          featureId,
          error: errorInfo.message,
          errorType: errorInfo.type,
          projectPath,
        });
      }
    } finally {
      this.runningFeatures.delete(featureId);
    }
  }

  /**
   * Verify a feature's implementation
   */
  async verifyFeature(projectPath: string, featureId: string): Promise<boolean> {
    // Worktrees are in project dir
    const worktreePath = path.join(projectPath, '.worktrees', featureId);
    let workDir = projectPath;

    try {
      await secureFs.access(worktreePath);
      workDir = worktreePath;
    } catch {
      // No worktree
    }

    // Run verification - check if tests pass, build works, etc.
    const verificationChecks = [
      { cmd: 'npm run lint', name: 'Lint' },
      { cmd: 'npm run typecheck', name: 'Type check' },
      { cmd: 'npm test', name: 'Tests' },
      { cmd: 'npm run build', name: 'Build' },
    ];

    let allPassed = true;
    const results: Array<{ check: string; passed: boolean; output?: string }> = [];

    for (const check of verificationChecks) {
      try {
        const { stdout, stderr } = await execAsync(check.cmd, {
          cwd: workDir,
          timeout: 120000,
        });
        results.push({
          check: check.name,
          passed: true,
          output: stdout || stderr,
        });
      } catch (error) {
        allPassed = false;
        results.push({
          check: check.name,
          passed: false,
          output: (error as Error).message,
        });
        break; // Stop on first failure
      }
    }

    this.emitAutoModeEvent('auto_mode_feature_complete', {
      featureId,
      passes: allPassed,
      message: allPassed
        ? 'All verification checks passed'
        : `Verification failed: ${results.find((r) => !r.passed)?.check || 'Unknown'}`,
    });

    return allPassed;
  }

  /**
   * Commit feature changes
   * @param projectPath - The main project path
   * @param featureId - The feature ID to commit
   * @param providedWorktreePath - Optional: the worktree path where the feature's changes are located
   */
  async commitFeature(
    projectPath: string,
    featureId: string,
    providedWorktreePath?: string
  ): Promise<string | null> {
    let workDir = projectPath;

    // Use the provided worktree path if given
    if (providedWorktreePath) {
      try {
        await secureFs.access(providedWorktreePath);
        workDir = providedWorktreePath;
        console.log(`[AutoMode] Committing in provided worktree: ${workDir}`);
      } catch {
        console.log(
          `[AutoMode] Provided worktree path doesn't exist: ${providedWorktreePath}, using project path`
        );
      }
    } else {
      // Fallback: try to find worktree at legacy location
      const legacyWorktreePath = path.join(projectPath, '.worktrees', featureId);
      try {
        await secureFs.access(legacyWorktreePath);
        workDir = legacyWorktreePath;
        console.log(`[AutoMode] Committing in legacy worktree: ${workDir}`);
      } catch {
        console.log(`[AutoMode] No worktree found, committing in project path: ${workDir}`);
      }
    }

    try {
      // Check for changes
      const { stdout: status } = await execAsync('git status --porcelain', {
        cwd: workDir,
      });
      if (!status.trim()) {
        return null; // No changes
      }

      // Load feature for commit message
      const feature = await this.loadFeature(projectPath, featureId);
      const commitMessage = feature
        ? `feat: ${this.extractTitleFromDescription(
            feature.description
          )}\n\nImplemented by Automaker auto-mode`
        : `feat: Feature ${featureId}`;

      // Stage and commit
      await execAsync('git add -A', { cwd: workDir });
      await execAsync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, {
        cwd: workDir,
      });

      // Get commit hash
      const { stdout: hash } = await execAsync('git rev-parse HEAD', {
        cwd: workDir,
      });

      this.emitAutoModeEvent('auto_mode_feature_complete', {
        featureId,
        passes: true,
        message: `Changes committed: ${hash.trim().substring(0, 8)}`,
      });

      return hash.trim();
    } catch (error) {
      console.error(`[AutoMode] Commit failed for ${featureId}:`, error);
      return null;
    }
  }

  /**
   * Check if context exists for a feature
   */
  async contextExists(projectPath: string, featureId: string): Promise<boolean> {
    // Context is stored in .automaker directory
    const featureDir = getFeatureDir(projectPath, featureId);
    const contextPath = path.join(featureDir, 'agent-output.md');

    try {
      await secureFs.access(contextPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Analyze project to gather context
   */
  async analyzeProject(projectPath: string): Promise<void> {
    const abortController = new AbortController();

    const analysisFeatureId = `analysis-${Date.now()}`;
    this.emitAutoModeEvent('auto_mode_feature_start', {
      featureId: analysisFeatureId,
      projectPath,
      feature: {
        id: analysisFeatureId,
        title: 'Project Analysis',
        description: 'Analyzing project structure',
      },
    });

    const prompt = `Analyze this project and provide a summary of:
1. Project structure and architecture
2. Main technologies and frameworks used
3. Key components and their responsibilities
4. Build and test commands
5. Any existing conventions or patterns

Format your response as a structured markdown document.`;

    try {
      // Use default Claude model for analysis (can be overridden in the future)
      const analysisModel = resolveModelString(undefined, DEFAULT_MODELS.claude);
      const provider = ProviderFactory.getProviderForModel(
        analysisModel,
        this.settingsService ?? undefined
      );

      // Load autoLoadClaudeMd setting
      const autoLoadClaudeMd = await getAutoLoadClaudeMdSetting(
        projectPath,
        this.settingsService,
        '[AutoMode]'
      );

      // Use createCustomOptions for centralized SDK configuration with CLAUDE.md support
      const sdkOptions = createCustomOptions({
        cwd: projectPath,
        model: analysisModel,
        maxTurns: 5,
        allowedTools: ['Read', 'Glob', 'Grep'],
        abortController,
        autoLoadClaudeMd,
      });

      const options: ExecuteOptions = {
        prompt,
        model: sdkOptions.model ?? analysisModel,
        cwd: sdkOptions.cwd ?? projectPath,
        maxTurns: sdkOptions.maxTurns,
        allowedTools: sdkOptions.allowedTools as string[],
        abortController,
        settingSources: sdkOptions.settingSources,
        sandbox: sdkOptions.sandbox, // Pass sandbox configuration
      };

      const stream = provider.executeQuery(options);
      let analysisResult = '';

      for await (const msg of stream) {
        if (msg.type === 'assistant' && msg.message?.content) {
          for (const block of msg.message.content) {
            if (block.type === 'text') {
              analysisResult = block.text || '';
              this.emitAutoModeEvent('auto_mode_progress', {
                featureId: analysisFeatureId,
                content: block.text,
                projectPath,
              });
            }
          }
        } else if (msg.type === 'result' && msg.subtype === 'success') {
          analysisResult = msg.result || analysisResult;
        }
      }

      // Save analysis to .automaker directory
      const automakerDir = getAutomakerDir(projectPath);
      const analysisPath = path.join(automakerDir, 'project-analysis.md');
      await secureFs.mkdir(automakerDir, { recursive: true });
      await secureFs.writeFile(analysisPath, analysisResult);

      this.emitAutoModeEvent('auto_mode_feature_complete', {
        featureId: analysisFeatureId,
        passes: true,
        message: 'Project analysis completed',
        projectPath,
      });
    } catch (error) {
      const errorInfo = classifyError(error);
      this.emitAutoModeEvent('auto_mode_error', {
        featureId: analysisFeatureId,
        error: errorInfo.message,
        errorType: errorInfo.type,
        projectPath,
      });
    }
  }

  /**
   * Get current status
   */
  getStatus(): {
    isRunning: boolean;
    runningFeatures: string[];
    runningCount: number;
  } {
    return {
      isRunning: this.runningFeatures.size > 0,
      runningFeatures: Array.from(this.runningFeatures.keys()),
      runningCount: this.runningFeatures.size,
    };
  }

  /**
   * Get detailed info about all running agents
   */
  getRunningAgents(): Array<{
    featureId: string;
    projectPath: string;
    projectName: string;
    isAutoMode: boolean;
  }> {
    return Array.from(this.runningFeatures.values()).map((rf) => ({
      featureId: rf.featureId,
      projectPath: rf.projectPath,
      projectName: path.basename(rf.projectPath),
      isAutoMode: rf.isAutoMode,
    }));
  }

  /**
   * Wait for plan approval from the user.
   * Returns a promise that resolves when the user approves/rejects the plan.
   */
  waitForPlanApproval(
    featureId: string,
    projectPath: string
  ): Promise<{ approved: boolean; editedPlan?: string; feedback?: string }> {
    console.log(`[AutoMode] Registering pending approval for feature ${featureId}`);
    console.log(
      `[AutoMode] Current pending approvals: ${Array.from(this.pendingApprovals.keys()).join(', ') || 'none'}`
    );
    return new Promise((resolve, reject) => {
      this.pendingApprovals.set(featureId, {
        resolve,
        reject,
        featureId,
        projectPath,
      });
      console.log(`[AutoMode] Pending approval registered for feature ${featureId}`);
    });
  }

  /**
   * Resolve a pending plan approval.
   * Called when the user approves or rejects the plan via API.
   */
  async resolvePlanApproval(
    featureId: string,
    approved: boolean,
    editedPlan?: string,
    feedback?: string,
    projectPathFromClient?: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log(
      `[AutoMode] resolvePlanApproval called for feature ${featureId}, approved=${approved}`
    );
    console.log(
      `[AutoMode] Current pending approvals: ${Array.from(this.pendingApprovals.keys()).join(', ') || 'none'}`
    );
    const pending = this.pendingApprovals.get(featureId);

    if (!pending) {
      console.log(`[AutoMode] No pending approval in Map for feature ${featureId}`);

      // RECOVERY: If no pending approval but we have projectPath from client,
      // check if feature's planSpec.status is 'generated' and handle recovery
      if (projectPathFromClient) {
        console.log(`[AutoMode] Attempting recovery with projectPath: ${projectPathFromClient}`);
        const feature = await this.loadFeature(projectPathFromClient, featureId);

        if (feature?.planSpec?.status === 'generated') {
          console.log(
            `[AutoMode] Feature ${featureId} has planSpec.status='generated', performing recovery`
          );

          if (approved) {
            // Update planSpec to approved
            await this.updateFeaturePlanSpec(projectPathFromClient, featureId, {
              status: 'approved',
              approvedAt: new Date().toISOString(),
              reviewedByUser: true,
              content: editedPlan || feature.planSpec.content,
            });

            // Build continuation prompt and re-run the feature
            const planContent = editedPlan || feature.planSpec.content || '';
            let continuationPrompt = `The plan/specification has been approved. `;
            if (feedback) {
              continuationPrompt += `\n\nUser feedback: ${feedback}\n\n`;
            }
            continuationPrompt += `Now proceed with the implementation as specified in the plan:\n\n${planContent}\n\nImplement the feature now.`;

            console.log(`[AutoMode] Starting recovery execution for feature ${featureId}`);

            // Start feature execution with the continuation prompt (async, don't await)
            // Pass undefined for providedWorktreePath, use options for continuation prompt
            this.executeFeature(projectPathFromClient, featureId, true, false, undefined, {
              continuationPrompt,
            }).catch((error) => {
              console.error(
                `[AutoMode] Recovery execution failed for feature ${featureId}:`,
                error
              );
            });

            return { success: true };
          } else {
            // Rejected - update status and emit event
            await this.updateFeaturePlanSpec(projectPathFromClient, featureId, {
              status: 'rejected',
              reviewedByUser: true,
            });

            await this.updateFeatureStatus(projectPathFromClient, featureId, 'backlog');

            this.emitAutoModeEvent('plan_rejected', {
              featureId,
              projectPath: projectPathFromClient,
              feedback,
            });

            return { success: true };
          }
        }
      }

      console.log(
        `[AutoMode] ERROR: No pending approval found for feature ${featureId} and recovery not possible`
      );
      return {
        success: false,
        error: `No pending approval for feature ${featureId}`,
      };
    }
    console.log(`[AutoMode] Found pending approval for feature ${featureId}, proceeding...`);

    const { projectPath } = pending;

    // Update feature's planSpec status
    await this.updateFeaturePlanSpec(projectPath, featureId, {
      status: approved ? 'approved' : 'rejected',
      approvedAt: approved ? new Date().toISOString() : undefined,
      reviewedByUser: true,
      content: editedPlan, // Update content if user provided an edited version
    });

    // If rejected with feedback, we can store it for the user to see
    if (!approved && feedback) {
      // Emit event so client knows the rejection reason
      this.emitAutoModeEvent('plan_rejected', {
        featureId,
        projectPath,
        feedback,
      });
    }

    // Resolve the promise with all data including feedback
    pending.resolve({ approved, editedPlan, feedback });
    this.pendingApprovals.delete(featureId);

    return { success: true };
  }

  /**
   * Cancel a pending plan approval (e.g., when feature is stopped).
   */
  cancelPlanApproval(featureId: string): void {
    console.log(`[AutoMode] cancelPlanApproval called for feature ${featureId}`);
    console.log(
      `[AutoMode] Current pending approvals: ${Array.from(this.pendingApprovals.keys()).join(', ') || 'none'}`
    );
    const pending = this.pendingApprovals.get(featureId);
    if (pending) {
      console.log(`[AutoMode] Found and cancelling pending approval for feature ${featureId}`);
      pending.reject(new Error('Plan approval cancelled - feature was stopped'));
      this.pendingApprovals.delete(featureId);
    } else {
      console.log(`[AutoMode] No pending approval to cancel for feature ${featureId}`);
    }
  }

  /**
   * Check if a feature has a pending plan approval.
   */
  hasPendingApproval(featureId: string): boolean {
    return this.pendingApprovals.has(featureId);
  }

  // Private helpers

  /**
   * Find an existing worktree for a given branch by checking git worktree list
   */
  private async findExistingWorktreeForBranch(
    projectPath: string,
    branchName: string
  ): Promise<string | null> {
    try {
      const { stdout } = await execAsync('git worktree list --porcelain', {
        cwd: projectPath,
      });

      const lines = stdout.split('\n');
      let currentPath: string | null = null;
      let currentBranch: string | null = null;

      for (const line of lines) {
        if (line.startsWith('worktree ')) {
          currentPath = line.slice(9);
        } else if (line.startsWith('branch ')) {
          currentBranch = line.slice(7).replace('refs/heads/', '');
        } else if (line === '' && currentPath && currentBranch) {
          // End of a worktree entry
          if (currentBranch === branchName) {
            // Resolve to absolute path - git may return relative paths
            // On Windows, this is critical for cwd to work correctly
            // On all platforms, absolute paths ensure consistent behavior
            const resolvedPath = path.isAbsolute(currentPath)
              ? path.resolve(currentPath)
              : path.resolve(projectPath, currentPath);
            return resolvedPath;
          }
          currentPath = null;
          currentBranch = null;
        }
      }

      // Check the last entry (if file doesn't end with newline)
      if (currentPath && currentBranch && currentBranch === branchName) {
        // Resolve to absolute path for cross-platform compatibility
        const resolvedPath = path.isAbsolute(currentPath)
          ? path.resolve(currentPath)
          : path.resolve(projectPath, currentPath);
        return resolvedPath;
      }

      return null;
    } catch {
      return null;
    }
  }

  private async loadFeature(projectPath: string, featureId: string): Promise<Feature | null> {
    // Features are stored in .automaker directory
    const featureDir = getFeatureDir(projectPath, featureId);
    const featurePath = path.join(featureDir, 'feature.json');

    try {
      const data = (await secureFs.readFile(featurePath, 'utf-8')) as string;
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  private async updateFeatureStatus(
    projectPath: string,
    featureId: string,
    status: string
  ): Promise<void> {
    // Features are stored in .automaker directory
    const featureDir = getFeatureDir(projectPath, featureId);
    const featurePath = path.join(featureDir, 'feature.json');

    try {
      const data = (await secureFs.readFile(featurePath, 'utf-8')) as string;
      const feature = JSON.parse(data);
      feature.status = status;
      feature.updatedAt = new Date().toISOString();
      // Set justFinishedAt timestamp when moving to waiting_approval (agent just completed)
      // Badge will show for 2 minutes after this timestamp
      if (status === 'waiting_approval') {
        feature.justFinishedAt = new Date().toISOString();
      } else {
        // Clear the timestamp when moving to other statuses
        feature.justFinishedAt = undefined;
      }
      await secureFs.writeFile(featurePath, JSON.stringify(feature, null, 2));
    } catch {
      // Feature file may not exist
    }
  }

  /**
   * Update the planSpec of a feature
   */
  private async updateFeaturePlanSpec(
    projectPath: string,
    featureId: string,
    updates: Partial<PlanSpec>
  ): Promise<void> {
    const featurePath = path.join(projectPath, '.automaker', 'features', featureId, 'feature.json');

    try {
      const data = (await secureFs.readFile(featurePath, 'utf-8')) as string;
      const feature = JSON.parse(data);

      // Initialize planSpec if it doesn't exist
      if (!feature.planSpec) {
        feature.planSpec = {
          status: 'pending',
          version: 1,
          reviewedByUser: false,
        };
      }

      // Apply updates
      Object.assign(feature.planSpec, updates);

      // If content is being updated and it's a new version, increment version
      if (updates.content && updates.content !== feature.planSpec.content) {
        feature.planSpec.version = (feature.planSpec.version || 0) + 1;
      }

      feature.updatedAt = new Date().toISOString();
      await secureFs.writeFile(featurePath, JSON.stringify(feature, null, 2));
    } catch (error) {
      console.error(`[AutoMode] Failed to update planSpec for ${featureId}:`, error);
    }
  }

  // ========================================
  // WIZARD MODE METHODS
  // ========================================

  /**
   * Submit a wizard answer and continue the wizard flow.
   * Called from the /wizard-answer API endpoint.
   */
  async submitWizardAnswer(
    projectPath: string,
    featureId: string,
    questionId: string,
    answer: string | string[]
  ): Promise<{
    success: boolean;
    error?: string;
    questionsRemaining?: number;
    wizardComplete?: boolean;
  }> {
    console.log(
      `[AutoMode] submitWizardAnswer called for feature ${featureId}, question ${questionId}`
    );

    const pending = this.pendingWizardAnswers.get(featureId);
    if (!pending) {
      return { success: false, error: `No pending wizard question for feature ${featureId}` };
    }

    // Update feature with the answer
    await this.updateFeatureWizardState(projectPath, featureId, {
      answers: { [questionId]: answer },
    });

    // Load feature to get current question count
    const feature = await this.loadFeature(projectPath, featureId);
    const questionsAsked = feature?.wizard?.questionsAsked?.length || 0;
    const MAX_QUESTIONS = 5;

    // Calculate remaining questions (could be 0 to MAX_QUESTIONS - current)
    const questionsRemaining = Math.max(0, MAX_QUESTIONS - questionsAsked);

    // Resolve the promise to continue wizard loop execution
    pending.resolve(answer);
    this.pendingWizardAnswers.delete(featureId);

    return {
      success: true,
      questionsRemaining,
      wizardComplete: false, // Will be true only after [WIZARD_COMPLETE] is emitted
    };
  }

  /**
   * Wait for user to answer a wizard question.
   * Returns a promise that resolves when submitWizardAnswer is called.
   */
  private waitForWizardAnswer(
    featureId: string,
    projectPath: string,
    questionId: string
  ): Promise<string | string[]> {
    console.log(
      `[AutoMode] Waiting for wizard answer for feature ${featureId}, question ${questionId}`
    );
    return new Promise((resolve, reject) => {
      this.pendingWizardAnswers.set(featureId, {
        resolve,
        reject,
        featureId,
        projectPath,
        questionId,
      });
    });
  }

  /**
   * Update wizard state in feature.json
   */
  private async updateFeatureWizardState(
    projectPath: string,
    featureId: string,
    updates: {
      status?: 'pending' | 'asking' | 'complete';
      currentQuestionId?: string;
      questionsAsked?: Array<{
        id: string;
        question: string;
        header: string;
        options: Array<{ label: string; description: string; value: string }>;
        multiSelect: boolean;
      }>;
      answers?: Record<string, string | string[]>;
      startedAt?: string;
      completedAt?: string;
    }
  ): Promise<void> {
    const featureDir = getFeatureDir(projectPath, featureId);
    const featurePath = path.join(featureDir, 'feature.json');

    try {
      const data = (await secureFs.readFile(featurePath, 'utf-8')) as string;
      const feature = JSON.parse(data);

      // Initialize wizard state if needed
      if (!feature.wizard) {
        feature.wizard = {
          status: 'pending',
          questionsAsked: [],
          answers: {},
        };
      }

      // Apply updates
      if (updates.status) feature.wizard.status = updates.status;
      if (updates.currentQuestionId) feature.wizard.currentQuestionId = updates.currentQuestionId;
      if (updates.questionsAsked) {
        feature.wizard.questionsAsked = [
          ...feature.wizard.questionsAsked,
          ...updates.questionsAsked,
        ];
      }
      if (updates.answers) {
        feature.wizard.answers = { ...feature.wizard.answers, ...updates.answers };
      }
      if (updates.startedAt) feature.wizard.startedAt = updates.startedAt;
      if (updates.completedAt) feature.wizard.completedAt = updates.completedAt;

      feature.updatedAt = new Date().toISOString();
      await secureFs.writeFile(featurePath, JSON.stringify(feature, null, 2));
    } catch (error) {
      console.error(`[AutoMode] Failed to update wizard state for ${featureId}:`, error);
    }
  }

  /**
   * Run wizard mode as a multi-turn loop.
   * Makes one LLM call per question, waits for answer, then continues.
   * Returns the collected answers when wizard is complete.
   */
  private async runWizardLoop(params: {
    projectPath: string;
    workDir: string;
    featureId: string;
    feature: Feature;
    model: string;
    systemPrompt?: string;
    maxThinkingTokens?: number;
    abortController: AbortController;
    autoLoadClaudeMd: boolean;
  }): Promise<{ answers: Record<string, string | string[]>; questionsAsked: number }> {
    const {
      projectPath,
      workDir,
      featureId,
      feature,
      model,
      systemPrompt,
      maxThinkingTokens,
      abortController,
      autoLoadClaudeMd,
    } = params;
    const MIN_QUESTIONS = 2;
    const MAX_QUESTIONS = 5;
    let questionsAsked = feature.wizard?.questionsAsked?.length || 0;
    let answers = { ...(feature.wizard?.answers || {}) };
    let wizardComplete = false;
    if (questionsAsked === 0) {
      await this.updateFeatureWizardState(projectPath, featureId, {
        status: 'asking',
        startedAt: new Date().toISOString(),
      });
    }
    console.log(
      `[AutoMode] Starting wizard loop for feature ${featureId}, ${questionsAsked} questions already asked`
    );
    while (!wizardComplete && questionsAsked < MAX_QUESTIONS) {
      if (abortController.signal.aborted) throw new Error('Wizard cancelled');
      const turnPrompt = this.buildWizardTurnPrompt(feature, questionsAsked, answers);
      const turnResult = await this.executeWizardTurn({
        workDir,
        featureId,
        prompt: turnPrompt,
        model,
        systemPrompt,
        maxThinkingTokens,
        abortController,
        autoLoadClaudeMd,
        projectPath,
      });
      if (turnResult.type === 'question') {
        const question = turnResult.question;
        questionsAsked++;
        console.log(
          `[AutoMode] Wizard Q${questionsAsked} for feature ${featureId}: ${question.id}`
        );
        console.log(
          `[AutoMode] Emitting wizard question event: index=${questionsAsked - 1}, total=${MAX_QUESTIONS}`
        );
        await this.updateFeatureWizardState(projectPath, featureId, {
          status: 'asking',
          currentQuestionId: question.id,
          questionsAsked: [question],
        });
        this.emitAutoModeEvent('auto_mode_wizard_question', {
          featureId,
          projectPath,
          question,
          questionIndex: questionsAsked - 1,
          totalQuestions: MAX_QUESTIONS,
        });
        const answer = await this.waitForWizardAnswer(featureId, projectPath, question.id);
        answers[question.id] = answer;
        console.log(`[AutoMode] Wizard answer for ${question.id}: ${JSON.stringify(answer)}`);
        const updatedFeature = await this.loadFeature(projectPath, featureId);
        if (updatedFeature) Object.assign(feature, updatedFeature);
      } else if (turnResult.type === 'complete') {
        if (questionsAsked < MIN_QUESTIONS) {
          console.log(
            `[AutoMode] Wizard tried to complete with only ${questionsAsked} questions (min ${MIN_QUESTIONS}), forcing another question`
          );
          continue;
        }
        wizardComplete = true;
        console.log(
          `[AutoMode] Wizard complete for feature ${featureId} after ${questionsAsked} questions`
        );
      }
    }
    if (questionsAsked >= MAX_QUESTIONS && !wizardComplete) {
      console.log(`[AutoMode] Wizard hit max ${MAX_QUESTIONS} questions, forcing completion`);
      wizardComplete = true;
    }
    await this.updateFeatureWizardState(projectPath, featureId, {
      status: 'complete',
      completedAt: new Date().toISOString(),
    });
    this.emitAutoModeEvent('auto_mode_wizard_complete', { featureId, projectPath, answers });
    return { answers, questionsAsked };
  }

  private buildWizardTurnPrompt(
    feature: Feature,
    questionsAsked: number,
    answers: Record<string, string | string[]>
  ): string {
    let prompt = `You are in WIZARD MODE gathering requirements.\n\nTASK: ${feature.description}`;
    if (questionsAsked > 0)
      prompt += `\n\nQuestions: ${questionsAsked}, Answers: ${JSON.stringify(answers)}`;
    return prompt;
  }

  /**
   * Execute a single wizard turn - makes one LLM call and parses the marker.
   * Returns either a question or completion signal.
   */
  private async executeWizardTurn(params: {
    workDir: string;
    featureId: string;
    prompt: string;
    model: string;
    systemPrompt?: string;
    maxThinkingTokens?: number;
    abortController: AbortController;
    autoLoadClaudeMd: boolean;
    projectPath: string;
  }): Promise<
    | {
        type: 'question';
        question: {
          id: string;
          header: string;
          question: string;
          multiSelect: boolean;
          options: Array<{ label: string; description: string; value: string }>;
        };
      }
    | { type: 'complete' }
  > {
    const {
      workDir,
      featureId,
      prompt,
      model,
      systemPrompt,
      maxThinkingTokens,
      abortController,
      autoLoadClaudeMd,
      projectPath,
    } = params;

    // Get provider for this model
    const provider = ProviderFactory.getProviderForModel(model, this.settingsService ?? undefined);

    // Build SDK options for wizard turn (read-only tools, low max turns)
    const sdkOptions = createCustomOptions({
      cwd: workDir,
      model,
      systemPrompt: systemPrompt || WIZARD_SYSTEM_PROMPT,
      maxTurns: 3, // Wizard turns are simple, don't need many tool calls
      allowedTools: ['Read', 'Glob', 'Grep'], // Read-only exploration
      maxThinkingTokens,
      abortController,
      autoLoadClaudeMd,
    });

    const executeOptions: ExecuteOptions = {
      prompt,
      model: sdkOptions.model!,
      cwd: workDir,
      systemPrompt: sdkOptions.systemPrompt,
      settingSources: sdkOptions.settingSources,
      maxTurns: sdkOptions.maxTurns,
      allowedTools: sdkOptions.allowedTools as string[] | undefined,
      maxThinkingTokens: sdkOptions.maxThinkingTokens,
      abortController,
    };

    console.log(`[AutoMode] Executing wizard turn for feature ${featureId}`);

    const stream = provider.executeQuery(executeOptions);
    let responseText = '';

    // Collect the response
    for await (const msg of stream) {
      if (msg.type === 'assistant' && msg.message?.content) {
        for (const block of msg.message.content) {
          if (block.type === 'text') {
            responseText += block.text || '';
          }
        }
      }
    }

    console.log(
      `[AutoMode] Wizard turn response (${responseText.length} chars) for feature ${featureId}`
    );

    // Save wizard turn output to agent-output.md (append)
    const featureDir = getFeatureDir(projectPath, featureId);
    const outputPath = path.join(featureDir, 'agent-output.md');
    try {
      await secureFs.mkdir(featureDir, { recursive: true });
      let existing = '';
      try {
        existing = (await secureFs.readFile(outputPath, 'utf-8')) as string;
      } catch {
        // No existing file
      }
      const separator = existing ? '\n\n---\n\n' : '';
      await secureFs.writeFile(outputPath, existing + separator + responseText);
    } catch (error) {
      console.error(`[AutoMode] Failed to save wizard turn output:`, error);
    }

    // Parse for [WIZARD_QUESTION] marker
    const questionMatch = responseText.match(/\[WIZARD_QUESTION\](\{[\s\S]*?\})/);
    if (questionMatch) {
      try {
        const questionPayload = JSON.parse(questionMatch[1]);

        // Validate the question structure
        if (
          !questionPayload.id ||
          !questionPayload.question ||
          !Array.isArray(questionPayload.options)
        ) {
          console.error(`[AutoMode] Invalid wizard question structure:`, questionPayload);
          throw new Error('Invalid question structure');
        }

        return {
          type: 'question',
          question: {
            id: questionPayload.id,
            header: questionPayload.header || 'Question',
            question: questionPayload.question,
            multiSelect: questionPayload.multiSelect === true,
            options: questionPayload.options.map((opt: any) => ({
              label: opt.label || '',
              description: opt.description || '',
              value: opt.value || opt.label || '',
            })),
          },
        };
      } catch (parseError) {
        console.error(`[AutoMode] Failed to parse wizard question JSON:`, parseError);
        // Fall through to complete check
      }
    }

    // Check for [WIZARD_COMPLETE] marker
    if (responseText.includes('[WIZARD_COMPLETE]')) {
      return { type: 'complete' };
    }

    // If no valid marker found, log warning and treat as needing more questions
    console.warn(
      `[AutoMode] Wizard turn produced no valid marker for feature ${featureId}, treating as needing more input`
    );

    // Return a fallback question asking for clarification
    return {
      type: 'question',
      question: {
        id: `Q_fallback_${Date.now()}`,
        header: 'Clarify',
        question:
          'I need more information to proceed. What aspect is most important for this feature?',
        multiSelect: false,
        options: [
          {
            label: 'Performance',
            description: 'Speed and efficiency are critical',
            value: 'performance',
          },
          {
            label: 'Simplicity',
            description: 'Keep it simple and maintainable',
            value: 'simplicity',
          },
          { label: 'Features', description: 'Include all requested features', value: 'features' },
          { label: 'Testing', description: 'Comprehensive test coverage', value: 'testing' },
        ],
      },
    };
  }

  private async loadPendingFeatures(projectPath: string): Promise<Feature[]> {
    // Features are stored in .automaker directory
    const featuresDir = getFeaturesDir(projectPath);

    try {
      const entries = await secureFs.readdir(featuresDir, {
        withFileTypes: true,
      });
      const allFeatures: Feature[] = [];
      const pendingFeatures: Feature[] = [];

      // Load all features (for dependency checking)
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const featurePath = path.join(featuresDir, entry.name, 'feature.json');
          try {
            const data = (await secureFs.readFile(featurePath, 'utf-8')) as string;
            const feature = JSON.parse(data);
            allFeatures.push(feature);

            // Track pending features separately
            if (
              feature.status === 'pending' ||
              feature.status === 'ready' ||
              feature.status === 'backlog'
            ) {
              pendingFeatures.push(feature);
            }
          } catch {
            // Skip invalid features
          }
        }
      }

      // Apply dependency-aware ordering
      const { orderedFeatures } = resolveDependencies(pendingFeatures);

      // Filter to only features with satisfied dependencies
      const readyFeatures = orderedFeatures.filter((feature: Feature) =>
        areDependenciesSatisfied(feature, allFeatures)
      );

      return readyFeatures;
    } catch {
      return [];
    }
  }

  /**
   * Extract a title from feature description (first line or truncated)
   */
  private extractTitleFromDescription(description: string): string {
    if (!description || !description.trim()) {
      return 'Untitled Feature';
    }

    // Get first line, or first 60 characters if no newline
    const firstLine = description.split('\n')[0].trim();
    if (firstLine.length <= 60) {
      return firstLine;
    }

    // Truncate to 60 characters and add ellipsis
    return firstLine.substring(0, 57) + '...';
  }

  /**
   * Get the planning prompt prefix based on feature's planning mode
   */
  private getPlanningPromptPrefix(feature: Feature): string {
    const mode = feature.planningMode || 'skip';

    if (mode === 'skip') {
      return ''; // No planning phase
    }

    if (mode === 'wizard') {
      // Wizard mode - the prompt is built differently (by runWizardLoop)
      // Return empty here since wizard handles its own prompts
      return '';
    }

    // For lite mode, use the approval variant if requirePlanApproval is true
    let promptKey: string = mode;
    if (mode === 'lite' && feature.requirePlanApproval === true) {
      promptKey = 'lite_with_approval';
    }

    const planningPrompt = PLANNING_PROMPTS[promptKey as keyof typeof PLANNING_PROMPTS];
    if (!planningPrompt) {
      return '';
    }

    return planningPrompt + '\n\n---\n\n## Feature Request\n\n';
  }

  private buildFeaturePrompt(feature: Feature): string {
    const title = this.extractTitleFromDescription(feature.description);

    let prompt = `## Feature Implementation Task

**Feature ID:** ${feature.id}
**Title:** ${title}
**Description:** ${feature.description}
`;

    if (feature.spec) {
      prompt += `
**Specification:**
${feature.spec}
`;
    }

    // Add images note (like old implementation)
    if (feature.imagePaths && feature.imagePaths.length > 0) {
      const imagesList = feature.imagePaths
        .map((img, idx) => {
          const path = typeof img === 'string' ? img : img.path;
          const filename =
            typeof img === 'string' ? path.split('/').pop() : img.filename || path.split('/').pop();
          const mimeType = typeof img === 'string' ? 'image/*' : img.mimeType || 'image/*';
          return `   ${idx + 1}. ${filename} (${mimeType})\n      Path: ${path}`;
        })
        .join('\n');

      prompt += `
**📎 Context Images Attached:**
The user has attached ${feature.imagePaths.length} image(s) for context. These images are provided both visually (in the initial message) and as files you can read:

${imagesList}

You can use the Read tool to view these images at any time during implementation. Review them carefully before implementing.
`;
    }

    // Add verification instructions based on testing mode
    if (feature.skipTests) {
      // Manual verification - just implement the feature
      prompt += `
## Instructions

Implement this feature by:
1. First, explore the codebase to understand the existing structure
2. Plan your implementation approach
3. Write the necessary code changes
4. Ensure the code follows existing patterns and conventions

When done, wrap your final summary in <summary> tags like this:

<summary>
## Summary: [Feature Title]

### Changes Implemented
- [List of changes made]

### Files Modified
- [List of files]

### Notes for Developer
- [Any important notes]
</summary>

This helps parse your summary correctly in the output logs.`;
    } else {
      // Automated testing - implement and verify with Playwright
      prompt += `
## Instructions

Implement this feature by:
1. First, explore the codebase to understand the existing structure
2. Plan your implementation approach
3. Write the necessary code changes
4. Ensure the code follows existing patterns and conventions

## Verification with Playwright (REQUIRED)

After implementing the feature, you MUST verify it works correctly using Playwright:

1. **Create a temporary Playwright test** to verify the feature works as expected
2. **Run the test** to confirm the feature is working
3. **Delete the test file** after verification - this is a temporary verification test, not a permanent test suite addition

Example verification workflow:
\`\`\`bash
# Create a simple verification test
npx playwright test my-verification-test.spec.ts

# After successful verification, delete the test
rm my-verification-test.spec.ts
\`\`\`

The test should verify the core functionality of the feature. If the test fails, fix the implementation and re-test.

When done, wrap your final summary in <summary> tags like this:

<summary>
## Summary: [Feature Title]

### Changes Implemented
- [List of changes made]

### Files Modified
- [List of files]

### Verification Status
- [Describe how the feature was verified with Playwright]

### Notes for Developer
- [Any important notes]
</summary>

This helps parse your summary correctly in the output logs.`;
    }

    return prompt;
  }

  private buildPartySynthesisPrompt(params: {
    feature: Feature;
    followUpInstructions?: string;
    previousContext?: string;
  }): string {
    const title =
      params.feature.title?.trim() || this.extractTitleFromDescription(params.feature.description);

    const parts = [
      `You are running Party Mode Synthesis.`,
      `Simulate a short internal deliberation between multiple expert personas and return a single synthesized recommendation.`,
      ``,
      `## Task`,
      `**Title:** ${title || params.feature.id}`,
      `**Description:**`,
      params.feature.description,
      params.feature.spec ? `\n\n**Specification:**\n${params.feature.spec}` : undefined,
      params.previousContext ? `\n\n## Previous Context\n${params.previousContext}\n` : undefined,
      params.followUpInstructions
        ? `\n\n## Follow-up Request\n${params.followUpInstructions}\n`
        : undefined,
      ``,
      `## Output Requirements`,
      `- Output MUST conform to the provided JSON schema.`,
      `- Choose 3-6 relevant agents/personas for \`agents\` (e.g., John, Mary, Winston, BMad Master).`,
      `- For each participating agent, return an object with:`,
      `  - id: the agent's persona identifier (e.g., "bmad:pm", "bmad:architect")`,
      `  - position: a 1-2 sentence summary of that agent's stance or contribution`,
      `- If agents cannot reach consensus, set consensus to null (not an empty string).`,
      `- Be concise, specific, and actionable.`,
      `- \`markdownSummary\` should be human-readable Markdown with headings and bullets.`,
    ].filter(Boolean);

    return parts.join('\n');
  }

  private async runPartySynthesis(params: {
    projectPath: string;
    workDir: string;
    feature: Feature;
    featureId: string;
    prompt: string;
    systemPrompt?: string;
    model: string;
    maxThinkingTokens?: number;
    autoLoadClaudeMd: boolean;
    bmadArtifactsDir: string;
    abortController: AbortController;
  }): Promise<PartySynthesisResult> {
    const sdkOptions = createCustomOptions({
      cwd: params.workDir,
      model: params.model,
      systemPrompt: params.systemPrompt,
      maxTurns: 80,
      allowedTools: ['Read', 'Glob', 'Grep'],
      sandbox: { enabled: true, autoAllowBashIfSandboxed: true },
      outputFormat: { type: 'json_schema', schema: PARTY_SYNTHESIS_SCHEMA },
      maxThinkingTokens: params.maxThinkingTokens,
      abortController: params.abortController,
      autoLoadClaudeMd: params.autoLoadClaudeMd,
    });

    const provider = ProviderFactory.getProviderForModel(
      sdkOptions.model!,
      this.settingsService ?? undefined
    );

    const executeOptions: ExecuteOptions = {
      prompt: params.prompt,
      model: sdkOptions.model!,
      cwd: params.workDir,
      systemPrompt: sdkOptions.systemPrompt,
      settingSources: sdkOptions.settingSources,
      maxTurns: sdkOptions.maxTurns,
      allowedTools: sdkOptions.allowedTools as string[] | undefined,
      maxThinkingTokens: sdkOptions.maxThinkingTokens,
      outputFormat: sdkOptions.outputFormat as ExecuteOptions['outputFormat'],
      abortController: params.abortController,
    };

    const stream = provider.executeQuery(executeOptions);
    let structured: PartySynthesisResult | null = null;
    let responseText = '';

    for await (const msg of stream) {
      if (msg.type === 'assistant' && msg.message?.content) {
        for (const block of msg.message.content) {
          if (block.type === 'text') {
            responseText += block.text || '';
          }
        }
      }

      if (msg.type === 'result' && (msg as any).subtype === 'success') {
        const anyMsg = msg as any;
        if (anyMsg.structured_output) {
          structured = anyMsg.structured_output as PartySynthesisResult;
        }
      }

      if (msg.type === 'result' && (msg as any).subtype === 'error_max_structured_output_retries') {
        throw new Error('Could not produce valid party synthesis structured output');
      }
    }

    if (!structured) {
      // Fallback: attempt to parse raw text as JSON (best-effort)
      try {
        structured = JSON.parse(responseText) as PartySynthesisResult;
      } catch {
        throw new Error('Party synthesis did not return structured output');
      }
    }

    const ordered: PartySynthesisResult = {
      agents: structured.agents,
      consensus: structured.consensus,
      dissent: structured.dissent,
      recommendation: structured.recommendation,
      markdownSummary: structured.markdownSummary,
    };

    // Persist artifacts (deterministic filenames)
    const synthesisDir = path.join(params.projectPath, params.bmadArtifactsDir, 'party-synthesis');
    await secureFs.mkdir(synthesisDir, { recursive: true });
    const synthesisJsonPath = path.join(synthesisDir, `${params.featureId}.json`);
    await secureFs.writeFile(synthesisJsonPath, `${JSON.stringify(ordered, null, 2)}\n`, 'utf-8');

    const featureDir = getFeatureDir(params.projectPath, params.featureId);
    await secureFs.mkdir(featureDir, { recursive: true });
    const agentOutputPath = path.join(featureDir, 'agent-output.md');

    let existing = '';
    try {
      existing = (await secureFs.readFile(agentOutputPath, 'utf-8')) as string;
    } catch {
      // No existing output
    }

    const title =
      params.feature.title?.trim() || this.extractTitleFromDescription(params.feature.description);
    const date = new Date().toISOString().slice(0, 10);
    const header = [
      `---`,
      `## Party Synthesis: ${title || params.featureId}`,
      `**Date:** ${date} | **Agents:** ${ordered.agents.map((a) => a.id.replace('bmad:', '')).join(', ')}`,
      `---`,
      ``,
    ].join('\n');

    const appended = `${header}${(ordered.markdownSummary || '').trim()}\n`;
    const nextContent =
      existing.trim().length > 0 ? `${existing.trimEnd()}\n\n${appended}` : appended;
    await secureFs.writeFile(agentOutputPath, nextContent, 'utf-8');

    return ordered;
  }

  private getAutoModeBaseSystemPrompt(params: { bmadArtifactsDir: string }): string {
    return [
      `You are running inside the AutoMaker Auto Mode execution engine.`,
      `Respect project context files and existing codebase conventions.`,
      `Do not directly edit feature metadata under .automaker/features/* (managed by AutoMaker).`,
      `If you create BMAD artifacts, write them as text files under: ${params.bmadArtifactsDir} (relative to project root).`,
      `Keep artifacts git-friendly: no binaries, stable filenames when possible, and predictable formatting.`,
    ].join('\n');
  }

  private normalizeBmadArtifactsDir(input: string | undefined | null): string {
    const trimmed = (input ?? '').trim();
    if (!trimmed) return '.automaker/bmad-output';

    // Enforce project-relative paths (no absolute paths or traversal).
    if (path.isAbsolute(trimmed) || trimmed.includes('..')) {
      return '.automaker/bmad-output';
    }

    return trimmed.replaceAll('\\', '/').replace(/^\/+/, '');
  }

  private thinkingLevelToMaxThinkingTokens(thinkingLevel?: string): number | undefined {
    switch (thinkingLevel) {
      case 'low':
        return 1024;
      case 'medium':
        return 4096;
      case 'high':
        return 8192;
      case 'ultrathink':
        return 16000;
      default:
        return undefined;
    }
  }

  private async runAgent(
    workDir: string,
    featureId: string,
    prompt: string,
    abortController: AbortController,
    projectPath: string,
    imagePaths?: string[],
    model?: string,
    options?: {
      projectPath?: string;
      planningMode?: PlanningMode;
      requirePlanApproval?: boolean;
      previousContent?: string;
      systemPrompt?: string;
      maxThinkingTokens?: number;
      outputFormat?: ExecuteOptions['outputFormat'];
      mcpServers?: ExecuteOptions['mcpServers'];
      hooks?: ExecuteOptions['hooks'];
      autoLoadClaudeMd?: boolean;
    }
  ): Promise<void> {
    const finalProjectPath = options?.projectPath || projectPath;
    const planningMode = options?.planningMode || 'skip';
    const previousContent = options?.previousContent;

    // Check if this planning mode can generate a spec/plan that needs approval
    // - spec and full always generate specs
    // - lite only generates approval-ready content when requirePlanApproval is true
    const planningModeRequiresApproval =
      planningMode === 'spec' ||
      planningMode === 'full' ||
      planningMode === 'wizard' || // Wizard generates specs after Q&A
      (planningMode === 'lite' && options?.requirePlanApproval === true);
    const requiresApproval = planningModeRequiresApproval && options?.requirePlanApproval === true;

    // CI/CD Mock Mode: Return early with mock response when AUTOMAKER_MOCK_AGENT is set
    // This prevents actual API calls during automated testing
    if (process.env.AUTOMAKER_MOCK_AGENT === 'true') {
      console.log(`[AutoMode] MOCK MODE: Skipping real agent execution for feature ${featureId}`);

      // Simulate some work being done
      await this.sleep(500);

      // Emit mock progress events to simulate agent activity
      this.emitAutoModeEvent('auto_mode_progress', {
        featureId,
        content: 'Mock agent: Analyzing the codebase...',
      });

      await this.sleep(300);

      this.emitAutoModeEvent('auto_mode_progress', {
        featureId,
        content: 'Mock agent: Implementing the feature...',
      });

      await this.sleep(300);

      // Create a mock file with "yellow" content as requested in the test
      const mockFilePath = path.join(workDir, 'yellow.txt');
      await secureFs.writeFile(mockFilePath, 'yellow');

      this.emitAutoModeEvent('auto_mode_progress', {
        featureId,
        content: "Mock agent: Created yellow.txt file with content 'yellow'",
      });

      await this.sleep(200);

      // Save mock agent output
      const featureDirForOutput = getFeatureDir(projectPath, featureId);
      const outputPath = path.join(featureDirForOutput, 'agent-output.md');

      const mockOutput = `# Mock Agent Output

## Summary
This is a mock agent response for CI/CD testing.

## Changes Made
- Created \`yellow.txt\` with content "yellow"

## Notes
This mock response was generated because AUTOMAKER_MOCK_AGENT=true was set.
`;

      await secureFs.mkdir(path.dirname(outputPath), { recursive: true });
      await secureFs.writeFile(outputPath, mockOutput);

      console.log(`[AutoMode] MOCK MODE: Completed mock execution for feature ${featureId}`);
      return;
    }

    // Load autoLoadClaudeMd setting (project setting takes precedence over global)
    // Use provided value if available, otherwise load from settings
    const autoLoadClaudeMd =
      options?.autoLoadClaudeMd !== undefined
        ? options.autoLoadClaudeMd
        : await getAutoLoadClaudeMdSetting(finalProjectPath, this.settingsService, '[AutoMode]');

    // Load enableSandboxMode setting (global setting only)
    const enableSandboxMode = await getEnableSandboxModeSetting(this.settingsService, '[AutoMode]');

    // Build SDK options using centralized configuration for feature implementation
    const sdkOptions = createAutoModeOptions({
      cwd: workDir,
      model: model,
      systemPrompt: options?.systemPrompt,
      outputFormat: options?.outputFormat,
      maxThinkingTokens: options?.maxThinkingTokens,
      mcpServers: options?.mcpServers,
      hooks: options?.hooks,
      abortController,
      autoLoadClaudeMd,
      enableSandboxMode,
    });

    // Extract model, maxTurns, and allowedTools from SDK options
    const finalModel = sdkOptions.model!;
    const maxTurns = sdkOptions.maxTurns;
    const allowedTools = sdkOptions.allowedTools as string[] | undefined;

    console.log(
      `[AutoMode] runAgent called for feature ${featureId} with model: ${finalModel}, planningMode: ${planningMode}, requiresApproval: ${requiresApproval}`
    );

    // Execution model/provider (used for implementation tasks)
    const executionModel = finalModel;
    const executionProvider = ProviderFactory.getProviderForModel(
      executionModel,
      this.settingsService ?? undefined
    );

    // Optional: separate model/provider for planning/spec generation (high-level, code-blind if desired)
    const plannerOverride = process.env.AUTOMAKER_MODEL_PLANNER?.trim();
    const plannerModel = plannerOverride
      ? resolveModelString(plannerOverride, DEFAULT_MODELS.claude)
      : executionModel;

    const useSeparatePlanner =
      planningModeRequiresApproval && plannerModel.toLowerCase() !== executionModel.toLowerCase();

    const planningProvider = useSeparatePlanner
      ? ProviderFactory.getProviderForModel(plannerModel, this.settingsService ?? undefined)
      : executionProvider;

    console.log(
      `[AutoMode] Planning model: ${useSeparatePlanner ? plannerModel : executionModel} (provider "${planningProvider.getName()}"), execution model: ${executionModel} (provider "${executionProvider.getName()}")`
    );

    // Build prompt content with images using utility
    let { content: promptContent } = await buildPromptWithImages(
      prompt,
      imagePaths,
      workDir,
      false // don't duplicate paths in text
    );

    // Debug: Log if system prompt is provided
    if (options?.systemPrompt) {
      console.log(
        `[AutoMode] System prompt provided (${options.systemPrompt.length} chars), first 200 chars:\n${options.systemPrompt.substring(0, 200)}...`
      );
    }

    const executeOptions: ExecuteOptions = {
      prompt: promptContent,
      model: executionModel,
      maxThinkingTokens: sdkOptions.maxThinkingTokens,
      outputFormat: sdkOptions.outputFormat as ExecuteOptions['outputFormat'],
      maxTurns: maxTurns,
      cwd: workDir,
      allowedTools: allowedTools,
      mcpServers: sdkOptions.mcpServers as ExecuteOptions['mcpServers'],
      hooks: sdkOptions.hooks as ExecuteOptions['hooks'],
      abortController,
      systemPrompt: sdkOptions.systemPrompt,
      settingSources: sdkOptions.settingSources,
      sandbox: sdkOptions.sandbox, // Pass sandbox configuration
    };

    // If we're using a separate planner, optionally restrict tools + inject a repo map (paths only).
    const parseToolCsv = (value?: string): string[] =>
      (value || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

    const planningAllowedTools = useSeparatePlanner
      ? parseToolCsv(process.env.AUTOMAKER_PLANNER_ALLOWED_TOOLS)
      : (allowedTools ?? []);

    const planningPrompt: ExecuteOptions['prompt'] = useSeparatePlanner
      ? this.prependPlannerContextToPrompt(promptContent, {
          repoMap: await this.buildRepoMapForPlanner(workDir),
          allowedTools: planningAllowedTools,
          plannerModel,
          executionModel,
        })
      : promptContent;

    const initialProvider = useSeparatePlanner ? planningProvider : executionProvider;
    const initialModel = useSeparatePlanner ? plannerModel : executionModel;

    // ========================================
    // WIZARD MODE HANDLING
    // Run wizard loop BEFORE main execution to gather requirements
    // ========================================
    if (planningMode === 'wizard') {
      console.log(`[AutoMode] Running wizard loop for feature ${featureId}`);

      // Emit planning started event
      this.emitAutoModeEvent('planning_started', {
        featureId,
        mode: 'wizard',
        message: 'Starting wizard Q&A phase...',
      });

      // Load feature for wizard context
      const wizardFeature = await this.loadFeature(finalProjectPath, featureId);
      if (!wizardFeature) {
        throw new Error(`Feature ${featureId} not found for wizard mode`);
      }

      // Run the wizard loop
      const wizardResult = await this.runWizardLoop({
        projectPath: finalProjectPath,
        workDir,
        featureId,
        feature: wizardFeature,
        model: finalModel,
        systemPrompt:
          typeof sdkOptions.systemPrompt === 'string' ? sdkOptions.systemPrompt : undefined,
        maxThinkingTokens: sdkOptions.maxThinkingTokens,
        abortController,
        autoLoadClaudeMd,
      });

      console.log(
        `[AutoMode] Wizard complete with ${wizardResult.questionsAsked} questions, proceeding to plan generation`
      );

      // Build a new prompt that includes wizard answers for plan generation
      const answersContext = Object.entries(wizardResult.answers)
        .map(([qId, answer]) => {
          const answerStr = Array.isArray(answer) ? answer.join(', ') : answer;
          return `${qId}: ${answerStr}`;
        })
        .join('\n');

      // Reload feature to get latest state with all Q&A
      const updatedFeature = await this.loadFeature(finalProjectPath, featureId);
      const questionsContext =
        updatedFeature?.wizard?.questionsAsked
          ?.map((q, i) => {
            const answer = wizardResult.answers[q.id];
            const answerStr = Array.isArray(answer) ? answer.join(', ') : answer;
            return `**Q${i + 1}: ${q.question}**\nAnswer: ${answerStr}`;
          })
          .join('\n\n') || '';

      // Modify the prompt to be a plan generation prompt with wizard context
      const wizardPlanPrompt = `## Wizard Requirements Gathered

The user answered the following clarifying questions:

${questionsContext}

---

## Feature to Implement

${wizardFeature.description}

${wizardFeature.spec ? `\n## Additional Specification\n${wizardFeature.spec}` : ''}

---

## Your Task

Based on the wizard answers above, create a detailed implementation plan.
Include all the user's preferences and selections in your plan.

When your plan is complete, output the marker:
[SPEC_GENERATED]

Then proceed with implementation.
`;

      // Replace the prompt content for the main execution
      promptContent = wizardPlanPrompt;

      // Force the planning mode to generate a spec (so approval flow kicks in)
      // The wizard mode is now complete, switch to spec-like behavior
    }

    // Recalculate planningPrompt after wizard may have updated promptContent
    // This ensures wizard answers are incorporated into the plan generation
    const finalPlanningPrompt: ExecuteOptions['prompt'] = useSeparatePlanner
      ? this.prependPlannerContextToPrompt(promptContent, {
          repoMap: await this.buildRepoMapForPlanner(workDir),
          allowedTools: planningAllowedTools,
          plannerModel,
          executionModel,
        })
      : promptContent;

    // Execute initial call (planning/spec generation or full execution when planning is skipped)
    const stream = initialProvider.executeQuery({
      ...executeOptions,
      prompt: finalPlanningPrompt,
      model: initialModel,
      allowedTools: planningAllowedTools,
    });
    // Initialize with previous content if this is a follow-up, with a separator
    let responseText = previousContent
      ? `${previousContent}\n\n---\n\n## Follow-up Session\n\n`
      : '';
    let specDetected = false;

    // Agent output goes to .automaker directory
    // Note: We use projectPath here, not workDir, because workDir might be a worktree path
    const featureDirForOutput = getFeatureDir(projectPath, featureId);
    const outputPath = path.join(featureDirForOutput, 'agent-output.md');

    // Incremental file writing state
    let writeTimeout: ReturnType<typeof setTimeout> | null = null;
    const WRITE_DEBOUNCE_MS = 500; // Batch writes every 500ms

    // Helper to write current responseText to file
    const writeToFile = async (): Promise<void> => {
      try {
        await secureFs.mkdir(path.dirname(outputPath), { recursive: true });
        await secureFs.writeFile(outputPath, responseText);
      } catch (error) {
        // Log but don't crash - file write errors shouldn't stop execution
        console.error(`[AutoMode] Failed to write agent output for ${featureId}:`, error);
      }
    };

    // Debounced write - schedules a write after WRITE_DEBOUNCE_MS
    const scheduleWrite = (): void => {
      if (writeTimeout) {
        clearTimeout(writeTimeout);
      }
      writeTimeout = setTimeout(() => {
        writeToFile();
      }, WRITE_DEBOUNCE_MS);
    };

    streamLoop: for await (const msg of stream) {
      if (msg.type === 'assistant' && msg.message?.content) {
        for (const block of msg.message.content) {
          if (block.type === 'text') {
            // Add separator before new text if we already have content and it doesn't end with newlines
            if (responseText.length > 0 && !responseText.endsWith('\n\n')) {
              if (responseText.endsWith('\n')) {
                responseText += '\n';
              } else {
                responseText += '\n\n';
              }
            }
            responseText += block.text || '';

            // Check for authentication errors in the response
            if (
              block.text &&
              (block.text.includes('Invalid API key') ||
                block.text.includes('authentication_failed') ||
                block.text.includes('Fix external API key'))
            ) {
              throw new Error(
                'Authentication failed: Invalid or expired API key. ' +
                  "Please check your ANTHROPIC_API_KEY, or run 'claude login' to re-authenticate."
              );
            }

            // Schedule incremental file write (debounced)
            scheduleWrite();

            // Check for [SPEC_GENERATED] marker in planning modes (spec or full)
            if (
              planningModeRequiresApproval &&
              !specDetected &&
              responseText.includes('[SPEC_GENERATED]')
            ) {
              specDetected = true;

              // Extract plan content (everything before the marker)
              const markerIndex = responseText.indexOf('[SPEC_GENERATED]');
              const planContent = responseText.substring(0, markerIndex).trim();

              // Parse tasks from the generated spec (for spec and full modes)
              // Use let since we may need to update this after plan revision
              let parsedTasks = parseTasksFromSpec(planContent);
              const tasksTotal = parsedTasks.length;

              console.log(
                `[AutoMode] Parsed ${tasksTotal} tasks from spec for feature ${featureId}`
              );
              if (parsedTasks.length > 0) {
                console.log(`[AutoMode] Tasks: ${parsedTasks.map((t) => t.id).join(', ')}`);
              }

              // Update planSpec status to 'generated' and save content with parsed tasks
              await this.updateFeaturePlanSpec(projectPath, featureId, {
                status: 'generated',
                content: planContent,
                version: 1,
                generatedAt: new Date().toISOString(),
                reviewedByUser: false,
                tasks: parsedTasks,
                tasksTotal,
                tasksCompleted: 0,
              });

              let approvedPlanContent = planContent;
              let userFeedback: string | undefined;
              let currentPlanContent = planContent;
              let planVersion = 1;

              // Only pause for approval if requirePlanApproval is true
              if (requiresApproval) {
                // ========================================
                // PLAN REVISION LOOP
                // Keep regenerating plan until user approves
                // ========================================
                let planApproved = false;

                while (!planApproved) {
                  console.log(
                    `[AutoMode] Spec v${planVersion} generated for feature ${featureId}, waiting for approval`
                  );

                  // CRITICAL: Register pending approval BEFORE emitting event
                  const approvalPromise = this.waitForPlanApproval(featureId, projectPath);

                  // Emit plan_approval_required event
                  this.emitAutoModeEvent('plan_approval_required', {
                    featureId,
                    projectPath,
                    planContent: currentPlanContent,
                    planningMode,
                    planVersion,
                  });

                  // Wait for user response
                  try {
                    const approvalResult = await approvalPromise;

                    if (approvalResult.approved) {
                      // User approved the plan
                      console.log(
                        `[AutoMode] Plan v${planVersion} approved for feature ${featureId}`
                      );
                      planApproved = true;

                      // If user provided edits, use the edited version
                      if (approvalResult.editedPlan) {
                        approvedPlanContent = approvalResult.editedPlan;
                        await this.updateFeaturePlanSpec(projectPath, featureId, {
                          content: approvalResult.editedPlan,
                        });
                      } else {
                        approvedPlanContent = currentPlanContent;
                      }

                      // Capture any additional feedback for implementation
                      userFeedback = approvalResult.feedback;

                      // Emit approval event
                      this.emitAutoModeEvent('plan_approved', {
                        featureId,
                        projectPath,
                        hasEdits: !!approvalResult.editedPlan,
                        planVersion,
                      });
                    } else {
                      // User rejected - check if they provided feedback for revision
                      const hasFeedback =
                        approvalResult.feedback && approvalResult.feedback.trim().length > 0;
                      const hasEdits =
                        approvalResult.editedPlan && approvalResult.editedPlan.trim().length > 0;

                      if (!hasFeedback && !hasEdits) {
                        // No feedback or edits = explicit cancel
                        console.log(
                          `[AutoMode] Plan rejected without feedback for feature ${featureId}, cancelling`
                        );
                        throw new Error('Plan cancelled by user');
                      }

                      // User wants revisions - regenerate the plan
                      console.log(
                        `[AutoMode] Plan v${planVersion} rejected with feedback for feature ${featureId}, regenerating...`
                      );
                      planVersion++;

                      // Emit revision event
                      this.emitAutoModeEvent('plan_revision_requested', {
                        featureId,
                        projectPath,
                        feedback: approvalResult.feedback,
                        hasEdits: !!hasEdits,
                        planVersion,
                      });

                      // Build revision prompt
                      let revisionPrompt = `The user has requested revisions to the plan/specification.

## Previous Plan (v${planVersion - 1})
${hasEdits ? approvalResult.editedPlan : currentPlanContent}

## User Feedback
${approvalResult.feedback || 'Please revise the plan based on the edits above.'}

## Instructions
Please regenerate the specification incorporating the user's feedback.
Keep the same format with the \`\`\`tasks block for task definitions.
After generating the revised spec, output:
"[SPEC_GENERATED] Please review the revised specification above."
`;

                      // Update status to regenerating
                      await this.updateFeaturePlanSpec(projectPath, featureId, {
                        status: 'generating',
                        version: planVersion,
                      });

                      // Make revision call (use planner when configured)
                      const revisionStream = planningProvider.executeQuery({
                        prompt: useSeparatePlanner
                          ? this.prependPlannerContextToPrompt(revisionPrompt, {
                              repoMap: await this.buildRepoMapForPlanner(workDir),
                              allowedTools: planningAllowedTools,
                              plannerModel,
                              executionModel,
                            })
                          : revisionPrompt,
                        model: initialModel,
                        maxTurns: maxTurns || 100,
                        cwd: workDir,
                        allowedTools: planningAllowedTools,
                        abortController,
                      });

                      let revisionText = '';
                      for await (const msg of revisionStream) {
                        if (msg.type === 'assistant' && msg.message?.content) {
                          for (const block of msg.message.content) {
                            if (block.type === 'text') {
                              revisionText += block.text || '';
                              this.emitAutoModeEvent('auto_mode_progress', {
                                featureId,
                                content: block.text,
                              });
                            }
                          }
                        } else if (msg.type === 'error') {
                          throw new Error(msg.error || 'Error during plan revision');
                        } else if (msg.type === 'result' && msg.subtype === 'success') {
                          revisionText += msg.result || '';
                        }
                      }

                      // Extract new plan content
                      const markerIndex = revisionText.indexOf('[SPEC_GENERATED]');
                      if (markerIndex > 0) {
                        currentPlanContent = revisionText.substring(0, markerIndex).trim();
                      } else {
                        currentPlanContent = revisionText.trim();
                      }

                      // Re-parse tasks from revised plan
                      const revisedTasks = parseTasksFromSpec(currentPlanContent);
                      console.log(`[AutoMode] Revised plan has ${revisedTasks.length} tasks`);

                      // Update planSpec with revised content
                      await this.updateFeaturePlanSpec(projectPath, featureId, {
                        status: 'generated',
                        content: currentPlanContent,
                        version: planVersion,
                        tasks: revisedTasks,
                        tasksTotal: revisedTasks.length,
                        tasksCompleted: 0,
                      });

                      // Update parsedTasks for implementation
                      parsedTasks = revisedTasks;

                      responseText += revisionText;
                    }
                  } catch (error) {
                    if ((error as Error).message.includes('cancelled')) {
                      throw error;
                    }
                    throw new Error(`Plan approval failed: ${(error as Error).message}`);
                  }
                }
              } else {
                // Auto-approve: requirePlanApproval is false, just continue without pausing
                console.log(
                  `[AutoMode] Spec generated for feature ${featureId}, auto-approving (requirePlanApproval=false)`
                );

                // Emit info event for frontend
                this.emitAutoModeEvent('plan_auto_approved', {
                  featureId,
                  projectPath,
                  planContent,
                  planningMode,
                });

                approvedPlanContent = planContent;
              }

              // CRITICAL: After approval, we need to make a second call to continue implementation
              // The agent is waiting for "approved" - we need to send it and continue
              console.log(
                `[AutoMode] Making continuation call after plan approval for feature ${featureId}`
              );

              // Update planSpec status to approved (handles both manual and auto-approval paths)
              await this.updateFeaturePlanSpec(projectPath, featureId, {
                status: 'approved',
                approvedAt: new Date().toISOString(),
                reviewedByUser: requiresApproval,
              });

              // ========================================
              // MULTI-AGENT TASK EXECUTION
              // Each task gets its own focused agent call
              // ========================================

              if (parsedTasks.length > 0) {
                console.log(
                  `[AutoMode] Starting multi-agent execution: ${parsedTasks.length} tasks for feature ${featureId}`
                );

                // Execute each task with a separate agent
                for (let taskIndex = 0; taskIndex < parsedTasks.length; taskIndex++) {
                  const task = parsedTasks[taskIndex];

                  // Check for abort
                  if (abortController.signal.aborted) {
                    throw new Error('Feature execution aborted');
                  }

                  // Emit task started
                  console.log(`[AutoMode] Starting task ${task.id}: ${task.description}`);
                  this.emitAutoModeEvent('auto_mode_task_started', {
                    featureId,
                    projectPath,
                    taskId: task.id,
                    taskDescription: task.description,
                    taskIndex,
                    tasksTotal: parsedTasks.length,
                  });

                  // Update planSpec with current task
                  await this.updateFeaturePlanSpec(projectPath, featureId, {
                    currentTaskId: task.id,
                  });

                  // Build focused prompt for this specific task
                  const taskPrompt = this.buildTaskPrompt(
                    task,
                    parsedTasks,
                    taskIndex,
                    approvedPlanContent,
                    userFeedback
                  );

                  // Execute task with dedicated agent
                  const taskStream = executionProvider.executeQuery({
                    prompt: taskPrompt,
                    model: executionModel,
                    maxTurns: Math.min(maxTurns || 100, 50), // Limit turns per task
                    cwd: workDir,
                    allowedTools: allowedTools,
                    abortController,
                  });

                  let taskOutput = '';

                  // Process task stream
                  for await (const msg of taskStream) {
                    if (msg.type === 'assistant' && msg.message?.content) {
                      for (const block of msg.message.content) {
                        if (block.type === 'text') {
                          taskOutput += block.text || '';
                          responseText += block.text || '';
                          this.emitAutoModeEvent('auto_mode_progress', {
                            featureId,
                            content: block.text,
                          });
                        } else if (block.type === 'tool_use') {
                          this.emitAutoModeEvent('auto_mode_tool', {
                            featureId,
                            tool: block.name,
                            input: block.input,
                          });
                        }
                      }
                    } else if (msg.type === 'error') {
                      throw new Error(msg.error || `Error during task ${task.id}`);
                    } else if (msg.type === 'result' && msg.subtype === 'success') {
                      taskOutput += msg.result || '';
                      responseText += msg.result || '';
                    }
                  }

                  // Emit task completed
                  console.log(`[AutoMode] Task ${task.id} completed for feature ${featureId}`);
                  this.emitAutoModeEvent('auto_mode_task_complete', {
                    featureId,
                    projectPath,
                    taskId: task.id,
                    tasksCompleted: taskIndex + 1,
                    tasksTotal: parsedTasks.length,
                  });

                  // Update planSpec with progress
                  await this.updateFeaturePlanSpec(projectPath, featureId, {
                    tasksCompleted: taskIndex + 1,
                  });

                  // Check for phase completion (group tasks by phase)
                  if (task.phase) {
                    const nextTask = parsedTasks[taskIndex + 1];
                    if (!nextTask || nextTask.phase !== task.phase) {
                      // Phase changed, emit phase complete
                      const phaseMatch = task.phase.match(/Phase\s*(\d+)/i);
                      if (phaseMatch) {
                        this.emitAutoModeEvent('auto_mode_phase_complete', {
                          featureId,
                          projectPath,
                          phaseNumber: parseInt(phaseMatch[1], 10),
                        });
                      }
                    }
                  }
                }

                console.log(
                  `[AutoMode] All ${parsedTasks.length} tasks completed for feature ${featureId}`
                );
              } else {
                // No parsed tasks - fall back to single-agent execution
                console.log(
                  `[AutoMode] No parsed tasks, using single-agent execution for feature ${featureId}`
                );

                const continuationPrompt = `The plan/specification has been approved. Now implement it.
${userFeedback ? `\n## User Feedback\n${userFeedback}\n` : ''}
## Approved Plan

${approvedPlanContent}

## Instructions

Implement all the changes described in the plan above.`;

                const continuationStream = executionProvider.executeQuery({
                  prompt: continuationPrompt,
                  model: executionModel,
                  maxTurns: maxTurns,
                  cwd: workDir,
                  allowedTools: allowedTools,
                  abortController,
                });

                for await (const msg of continuationStream) {
                  if (msg.type === 'assistant' && msg.message?.content) {
                    for (const block of msg.message.content) {
                      if (block.type === 'text') {
                        responseText += block.text || '';
                        this.emitAutoModeEvent('auto_mode_progress', {
                          featureId,
                          content: block.text,
                        });
                      } else if (block.type === 'tool_use') {
                        this.emitAutoModeEvent('auto_mode_tool', {
                          featureId,
                          tool: block.name,
                          input: block.input,
                        });
                      }
                    }
                  } else if (msg.type === 'error') {
                    throw new Error(msg.error || 'Unknown error during implementation');
                  } else if (msg.type === 'result' && msg.subtype === 'success') {
                    responseText += msg.result || '';
                  }
                }
              }

              console.log(`[AutoMode] Implementation completed for feature ${featureId}`);
              // Exit the original stream loop since continuation is done
              break streamLoop;
            }

            // Only emit progress for non-marker text (marker was already handled above)
            if (!specDetected) {
              this.emitAutoModeEvent('auto_mode_progress', {
                featureId,
                content: block.text,
              });
            }
          } else if (block.type === 'tool_use') {
            // Emit event for real-time UI
            this.emitAutoModeEvent('auto_mode_tool', {
              featureId,
              tool: block.name,
              input: block.input,
            });

            // Also add to file output for persistence
            if (responseText.length > 0 && !responseText.endsWith('\n')) {
              responseText += '\n';
            }
            responseText += `\n🔧 Tool: ${block.name}\n`;
            if (block.input) {
              responseText += `Input: ${JSON.stringify(block.input, null, 2)}\n`;
            }
            scheduleWrite();
          }
        }
      } else if (msg.type === 'error') {
        // Handle error messages
        throw new Error(msg.error || 'Unknown error');
      } else if (msg.type === 'result' && msg.subtype === 'success') {
        // Don't replace responseText - the accumulated content is the full history
        // The msg.result is just a summary which would lose all tool use details
        // Just ensure final write happens
        scheduleWrite();
      }
    }

    // Clear any pending timeout and do a final write to ensure all content is saved
    if (writeTimeout) {
      clearTimeout(writeTimeout);
    }
    // Final write - ensure all accumulated content is saved
    await writeToFile();
  }

  private async executeFeatureWithContext(
    projectPath: string,
    featureId: string,
    context: string,
    useWorktrees: boolean
  ): Promise<void> {
    const feature = await this.loadFeature(projectPath, featureId);
    if (!feature) {
      throw new Error(`Feature ${featureId} not found`);
    }

    const prompt = `## Continuing Feature Implementation

${this.buildFeaturePrompt(feature)}

## Previous Context
The following is the output from a previous implementation attempt. Continue from where you left off:

${context}

## Instructions
Review the previous work and continue the implementation. If the feature appears complete, verify it works correctly.`;

    return this.executeFeature(projectPath, featureId, useWorktrees, false, undefined, {
      continuationPrompt: prompt,
    });
  }

  /**
   * Build a focused prompt for executing a single task.
   * Each task gets minimal context to keep the agent focused.
   */
  private buildTaskPrompt(
    task: ParsedTask,
    allTasks: ParsedTask[],
    taskIndex: number,
    planContent: string,
    userFeedback?: string
  ): string {
    const completedTasks = allTasks.slice(0, taskIndex);
    const remainingTasks = allTasks.slice(taskIndex + 1);

    let prompt = `# Task Execution: ${task.id}

You are executing a specific task as part of a larger feature implementation.

## Your Current Task

**Task ID:** ${task.id}
**Description:** ${task.description}
${task.filePath ? `**Primary File:** ${task.filePath}` : ''}
${task.phase ? `**Phase:** ${task.phase}` : ''}

## Context

`;

    // Show what's already done
    if (completedTasks.length > 0) {
      prompt += `### Already Completed (${completedTasks.length} tasks)
${completedTasks.map((t) => `- [x] ${t.id}: ${t.description}`).join('\n')}

`;
    }

    // Show remaining tasks
    if (remainingTasks.length > 0) {
      prompt += `### Coming Up Next (${remainingTasks.length} tasks remaining)
${remainingTasks
  .slice(0, 3)
  .map((t) => `- [ ] ${t.id}: ${t.description}`)
  .join('\n')}
${remainingTasks.length > 3 ? `... and ${remainingTasks.length - 3} more tasks` : ''}

`;
    }

    // Add user feedback if any
    if (userFeedback) {
      prompt += `### User Feedback
${userFeedback}

`;
    }

    // Add relevant excerpt from plan (just the task-related part to save context)
    prompt += `### Reference: Full Plan
<details>
${planContent}
</details>

## Instructions

1. Focus ONLY on completing task ${task.id}: "${task.description}"
2. Do not work on other tasks
3. Use the existing codebase patterns
4. When done, summarize what you implemented

Begin implementing task ${task.id} now.`;

    return prompt;
  }

  private async buildRepoMapForPlanner(workDir: string): Promise<string> {
    try {
      const { stdout } = await execAsync('git ls-files --cached --others --exclude-standard', {
        cwd: workDir,
        timeout: 30_000,
        maxBuffer: 10 * 1024 * 1024,
      });

      const files = stdout
        .split('\n')
        .map((l) => l.trim().replace(/\\/g, '/'))
        .filter(Boolean);

      if (files.length === 0) {
        return '(no tracked/untracked files found)';
      }

      const rootFiles: string[] = [];
      const byTopDir = new Map<string, { count: number; samples: string[] }>();

      for (const file of files) {
        const parts = file.split('/');
        if (parts.length === 1) {
          rootFiles.push(file);
          continue;
        }
        const top = `${parts[0]}/`;
        const entry = byTopDir.get(top) || { count: 0, samples: [] };
        entry.count += 1;
        if (entry.samples.length < 8) entry.samples.push(file);
        byTopDir.set(top, entry);
      }

      const topDirs = Array.from(byTopDir.entries()).sort((a, b) => b[1].count - a[1].count);

      const lines: string[] = [];
      if (rootFiles.length > 0) {
        lines.push(
          `Root files (${rootFiles.length}): ${rootFiles.slice(0, 25).join(', ')}${rootFiles.length > 25 ? ', ...' : ''}`
        );
        lines.push('');
      }

      lines.push('Top directories (paths only):');
      for (const [dir, info] of topDirs.slice(0, 12)) {
        const samples = info.samples.join(', ');
        lines.push(`- ${dir} (${info.count} files) e.g., ${samples}`);
      }

      const mapText = lines.join('\n').trim();
      return mapText.length > 20_000 ? `${mapText.slice(0, 20_000)}\n\n[TRUNCATED]` : mapText;
    } catch (error) {
      return `Repo map unavailable: ${(error as Error).message}`;
    }
  }

  private prependPlannerContextToPrompt(
    prompt: ExecuteOptions['prompt'],
    meta: {
      repoMap: string;
      allowedTools: string[];
      plannerModel: string;
      executionModel: string;
    }
  ): ExecuteOptions['prompt'] {
    const allowed =
      meta.allowedTools.length > 0 ? meta.allowedTools.join(', ') : '(no tools allowed)';
    const prefix = `## Planning Context (paths only)

You are generating a plan/specification only. Do NOT implement code in this step.

- Planner model: ${meta.plannerModel}
- Execution model: ${meta.executionModel}
- Planner allowed tools: ${allowed}

### Repo Map (paths only)
${meta.repoMap}

---`;

    if (typeof prompt === 'string') {
      return `${prefix}\n\n${prompt}`;
    }

    const blocks = prompt.map((b) => ({ ...b }));
    const firstTextIndex = blocks.findIndex((b) => b.type === 'text');
    if (firstTextIndex >= 0) {
      const existing = blocks[firstTextIndex].text || '';
      blocks[firstTextIndex] = {
        ...blocks[firstTextIndex],
        text: `${prefix}\n\n${existing}`,
      };
      return blocks;
    }

    return [{ type: 'text', text: prefix }, ...blocks];
  }

  /**
   * Emit an auto-mode event wrapped in the correct format for the client.
   * All auto-mode events are sent as type "auto-mode:event" with the actual
   * event type and data in the payload.
   */
  private emitAutoModeEvent(eventType: string, data: Record<string, unknown>): void {
    // Wrap the event in auto-mode:event format expected by the client
    this.events.emit('auto-mode:event', {
      type: eventType,
      ...data,
    });
  }

  private sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);

      // If signal is provided and already aborted, reject immediately
      if (signal?.aborted) {
        clearTimeout(timeout);
        reject(new Error('Aborted'));
        return;
      }

      // Listen for abort signal
      if (signal) {
        signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timeout);
            reject(new Error('Aborted'));
          },
          { once: true }
        );
      }
    });
  }
}
