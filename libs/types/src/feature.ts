/**
 * Feature types for AutoMaker feature management
 */

import type { PlanningMode } from './settings.js';

export interface FeatureImagePath {
  id: string;
  path: string;
  filename: string;
  mimeType: string;
  [key: string]: unknown;
}

export interface FeatureTextFilePath {
  id: string;
  path: string;
  filename: string;
  mimeType: string;
  content: string; // Text content of the file
  [key: string]: unknown;
}

/**
 * WizardOption - Single option in a wizard question
 */
export interface WizardOption {
  label: string; // Display label (e.g., "Comprehensive")
  description: string; // Help text (e.g., "Includes deployment notes, security...")
  value: string; // Value to store (e.g., "comprehensive")
}

/**
 * WizardQuestion - A single wizard question
 */
export interface WizardQuestion {
  id: string; // Question ID (e.g., "Q1", "Q2")
  question: string; // Full question text
  header: string; // Short label (max 12 chars, e.g., "Template Type")
  options: WizardOption[]; // 2-4 choices
  multiSelect: boolean; // Whether user can pick multiple options
}

/**
 * WizardState - State of the wizard question flow for a feature
 */
export interface WizardState {
  status: 'pending' | 'asking' | 'complete';
  currentQuestionId?: string;
  questionsAsked: WizardQuestion[];
  answers: Record<string, string | string[]>; // questionId -> selected value(s)
  startedAt?: string;
  completedAt?: string;
}

export interface Feature {
  id: string;
  title?: string;
  titleGenerating?: boolean;
  category: string;
  description: string;
  /** Optional AI profile id selected at creation time */
  aiProfileId?: string;
  /**
   * Optional persona selection (e.g., "bmad:pm", "bmad:analyst", "bmad:party-synthesis")
   * @deprecated Use agentIds instead
   */
  personaId?: string;
  /** Selected BMAD agents for collaboration (max 4) */
  agentIds?: string[];
  /** Show explicit agent perspectives in output during multi-agent collaboration */
  verboseCollaboration?: boolean;
  passes?: boolean;
  priority?: number;
  status?: string;
  dependencies?: string[];
  spec?: string;
  model?: string;
  imagePaths?: Array<string | FeatureImagePath | { path: string; [key: string]: unknown }>;
  textFilePaths?: FeatureTextFilePath[];
  // Branch info - worktree path is derived at runtime from branchName
  branchName?: string; // Name of the feature branch (undefined = use current worktree)
  skipTests?: boolean;
  thinkingLevel?: string;
  planningMode?: PlanningMode;
  requirePlanApproval?: boolean;
  planSpec?: {
    status: 'pending' | 'generating' | 'generated' | 'approved' | 'rejected';
    content?: string;
    version: number;
    generatedAt?: string;
    approvedAt?: string;
    reviewedByUser: boolean;
    tasksCompleted?: number;
    tasksTotal?: number;
  };
  /** Wizard mode state - questions asked and answers provided */
  wizard?: WizardState;
  error?: string;
  summary?: string;
  startedAt?: string;
  [key: string]: unknown; // Keep catch-all for extensibility
}

export type FeatureStatus = 'pending' | 'running' | 'completed' | 'failed' | 'verified';
