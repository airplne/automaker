/**
 * All executive agent IDs for the BMAD Executive Suite (10 agents)
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
  'bmad:echon',
] as const;

/**
 * Maximum number of executive agents that can be selected
 * Derived from array length to prevent hardcoding errors
 */
export const MAX_EXECUTIVE_AGENTS = ALL_EXECUTIVE_AGENT_IDS.length; // 10

export type ExecutiveAgentId = (typeof ALL_EXECUTIVE_AGENT_IDS)[number];
