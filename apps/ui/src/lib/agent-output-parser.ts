/**
 * Parser for multi-agent verbose collaboration output
 * Extracts agent sections and synthesis from XML-tagged output
 */

export interface AgentSection {
  name: string;
  icon: string;
  role?: 'lead' | undefined;
  content: string;
}

export interface ParsedAgentOutput {
  agents: AgentSection[];
  synthesis: string;
  raw: string;
  hasStructure: boolean;
}

/**
 * Parse agent-tagged output into structured sections
 */
export function parseAgentSections(output: string): ParsedAgentOutput {
  // Regex to match <agent name="..." icon="..." role="...">content</agent>
  const agentRegex =
    /<agent\s+name="([^"]+)"\s+icon="([^"]+)"(?:\s+role="([^"]+)")?>([\s\S]*?)<\/agent>/g;

  // Regex to match <synthesis>content</synthesis>
  const synthesisRegex = /<synthesis>([\s\S]*?)<\/synthesis>/;

  const agents: AgentSection[] = [];
  let match;

  // Extract all agent sections
  while ((match = agentRegex.exec(output)) !== null) {
    agents.push({
      name: match[1],
      icon: match[2],
      role: match[3] === 'lead' ? 'lead' : undefined,
      content: match[4].trim(),
    });
  }

  // Extract synthesis section
  const synthesisMatch = output.match(synthesisRegex);
  const synthesis = synthesisMatch ? synthesisMatch[1].trim() : '';

  return {
    agents,
    synthesis,
    raw: output,
    hasStructure: agents.length > 0 || synthesis.length > 0,
  };
}

/**
 * Check if output contains agent sections
 */
export function hasAgentSections(output: string): boolean {
  return output.includes('<agent ') && output.includes('</agent>');
}
