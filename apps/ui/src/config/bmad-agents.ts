/**
 * BMAD Agent Configuration - All 29 Agents Organized by Module
 * Single source of truth for agent IDs and module organization
 */

// ============================================================
// CORE MODULE (1 agent)
// ============================================================
export const CORE_AGENT_IDS = ['bmad:bmad-master'] as const;

// ============================================================
// BMB - BUILDERS MODULE (3 agents)
// ============================================================
export const BUILDER_AGENT_IDS = [
  'bmad:agent-builder',
  'bmad:module-builder',
  'bmad:workflow-builder',
] as const;

// ============================================================
// BMM - METHOD MODULE (9 agents)
// ============================================================
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

// ============================================================
// BMM-EXECUTIVE MODULE (10 agents)
// Note: Mary (Analyst) was moved to Method module - not duplicated in Executive
// ============================================================
export const EXECUTIVE_AGENT_IDS = [
  'bmad:strategist-marketer',
  'bmad:technologist-architect',
  'bmad:fulfillization-manager',
  'bmad:security-guardian',
  'bmad:financial-strategist',
  'bmad:operations-commander',
  'bmad:apex',
  'bmad:zen',
  'bmad:echon',
  'bmad:marketing-outreach', // Ajwash - Marketing & Outreach
] as const;

// ============================================================
// CIS - CREATIVE INNOVATION SUITE MODULE (6 agents)
// ============================================================
export const CREATIVE_AGENT_IDS = [
  'bmad:brainstorming-coach',
  'bmad:creative-problem-solver',
  'bmad:design-thinking-coach',
  'bmad:innovation-strategist',
  'bmad:presentation-master',
  'bmad:storyteller',
] as const;

// ============================================================
// ALL AGENTS COMBINED (29 total)
// ============================================================
export const ALL_BMAD_AGENT_IDS = [
  ...CORE_AGENT_IDS,
  ...BUILDER_AGENT_IDS,
  ...METHOD_AGENT_IDS,
  ...EXECUTIVE_AGENT_IDS,
  ...CREATIVE_AGENT_IDS,
] as const;

// ============================================================
// MODULE METADATA FOR UI ORGANIZATION
// ============================================================
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
    label: 'Method',
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

// ============================================================
// TYPE EXPORTS
// ============================================================
export type BmadAgentId = (typeof ALL_BMAD_AGENT_IDS)[number];
export type AgentModule = keyof typeof AGENT_MODULES;

// ============================================================
// BACKWARD COMPATIBILITY - Legacy exports
// These maintain compatibility with existing code that references
// the old executive-only exports. Can be removed in future waves.
// ============================================================
export const ALL_EXECUTIVE_AGENT_IDS = EXECUTIVE_AGENT_IDS;
export type ExecutiveAgentId = (typeof EXECUTIVE_AGENT_IDS)[number];
