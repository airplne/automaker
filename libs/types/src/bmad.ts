/**
 * BMAD types
 *
 * Shared contracts for integrating BMAD personas, installs, and synthesis outputs
 * across the Automaker UI and server.
 */

/**
 * A persona identifier (e.g., "bmad:pm", "bmad:analyst", "bmad:party-synthesis")
 */
export type PersonaId = string;

/**
 * Minimal, UI-friendly persona descriptor.
 */
export interface PersonaDescriptor {
  id: PersonaId;
  label: string;
  description?: string;
  icon?: string;
  module?: string;
  sourcePath?: string;
}

/**
 * Resolved persona configuration used at execution time.
 */
export interface ResolvedPersona {
  systemPrompt: string;
  model?: string;
  thinkingBudget?: number;
  mcpServers?: Record<string, unknown>;
  hooks?: string[];
}

/** Resolved multi-agent collaboration configuration */
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

/**
 * One-shot Party Mode Synthesis output contract.
 *
 * This is designed to be git-friendly: stable schema, stable key ordering,
 * and no binary artifacts.
 */
export interface PartySynthesisResult {
  /** Agents who participated with their positions/contributions */
  agents: { id: string; position: string }[];
  /** Synthesized consensus, or null if agents disagreed */
  consensus: string | null;
  /** Points of disagreement between agents */
  dissent: string[];
  /** Final actionable recommendation */
  recommendation: string;
  /** Human-readable markdown summary for agent-output.md */
  markdownSummary: string;
}
