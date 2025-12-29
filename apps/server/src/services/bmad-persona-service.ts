import fs from 'fs/promises';
import path from 'path';
import {
  getBmadAgentManifestPath,
  getBmadBundleDir,
  BMAD_BUNDLE_VERSION,
} from '@automaker/bmad-bundle';
import type { PersonaDescriptor, ResolvedPersona, ResolvedAgentCollab } from '@automaker/types';

/**
 * Public-facing persona IDs exposed in the UI.
 * Only the executive personas plus party-synthesis are shown to users.
 * Other personas remain resolvable for backward compatibility with saved Feature cards.
 */
const PUBLIC_PERSONA_IDS = [
  'bmad:party-synthesis',
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

type AgentManifestRow = {
  name: string;
  displayName: string;
  title: string;
  icon: string;
  role: string;
  identity: string;
  communicationStyle: string;
  principles: string;
  module: string;
  path: string;
};

function decodeHtmlEntities(input: string): string {
  return input
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}

function parseCsv(content: string): Array<Record<string, string>> {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows: Array<Record<string, string>> = [];

  for (const line of lines.slice(1)) {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    for (let i = 0; i < header.length; i++) {
      row[header[i]] = values[i] ?? '';
    }
    rows.push(row);
  }

  return rows;
}

export class BmadPersonaService {
  private cachedRows: AgentManifestRow[] | null = null;

  getBundleVersion(): string {
    return BMAD_BUNDLE_VERSION;
  }

  getBundleDir(): string {
    return getBmadBundleDir();
  }

  async listPersonas(): Promise<PersonaDescriptor[]> {
    const rows = await this.loadManifestRows();

    const personas: PersonaDescriptor[] = rows.map((row) => ({
      id: `bmad:${row.name}`,
      label: `${row.displayName} (${row.title})`,
      description: row.role || row.identity || undefined,
      icon: row.icon || undefined,
      module: row.module || undefined,
      sourcePath: row.path || undefined,
    }));

    // Special personas (not in manifest)
    personas.unshift({
      id: 'bmad:party-synthesis',
      label: 'Party Mode Synthesis (one-shot)',
      description:
        'Simulates executive deliberation (Sage, Theo, Finn, and others) and outputs a single synthesized recommendation',
      icon: '🎉',
      module: 'core',
      sourcePath: path.join(getBmadBundleDir(), 'core', 'workflows', 'party-mode', 'workflow.md'),
    });

    // Filter to only public-facing personas for UI exposure
    // (Other personas remain resolvable via resolvePersona for backward compatibility)
    return personas.filter((p) => PUBLIC_PERSONA_IDS.includes(p.id as any));
  }

  async resolvePersona(params: {
    personaId?: string | null;
    artifactsDir?: string;
    projectPath?: string;
  }): Promise<ResolvedPersona | null> {
    const personaId = params.personaId?.trim();
    if (!personaId) return null;

    if (personaId === 'bmad:party-synthesis') {
      return {
        systemPrompt: [
          `You are running "Party Mode Synthesis" inside AutoMaker.`,
          `Simulate a short internal deliberation between the 9 executive personas:`,
          `- Sage (strategist-marketer): Business WHY/WHO, product strategy, requirements`,
          `- Theo (technologist-architect): Technical HOW, architecture, implementation`,
          `- Finn (fulfillization-manager): SHIP + UX/docs/ops + end-user experience`,
          `- Cerberus (security-guardian): Security posture, risk assessment, supply chain`,
          `- Mary (analyst-strategist): Research, analysis, requirements elicitation`,
          `- Walt (financial-strategist): Financial planning, ROI, resource allocation`,
          `- Axel (operations-commander): Operations, process optimization, delivery`,
          `- Apex (apex): Peak performance engineering, optimization, rapid implementation`,
          `- Zen (zen): Clean architecture, maintainability, refactoring, test strategy`,
          `Then output a single synthesized recommendation.`,
          `You MUST be concise, specific, and actionable.`,
          params.artifactsDir
            ? `Write any requested BMAD artifacts to: ${params.artifactsDir}`
            : undefined,
        ]
          .filter(Boolean)
          .join('\n'),
        model: 'opus',
        thinkingBudget: 16000,
      };
    }

    if (!personaId.startsWith('bmad:')) {
      return null;
    }

    const agentName = personaId.slice('bmad:'.length);
    const rows = await this.loadManifestRows();
    const row = rows.find((r) => r.name === agentName);
    if (!row) {
      return null;
    }

    const promptParts = [
      `You are acting as BMAD agent "${row.displayName}" (${row.title}).`,
      row.role ? `Role: ${row.role}` : undefined,
      row.identity ? `Identity: ${row.identity}` : undefined,
      row.communicationStyle ? `Communication Style: ${row.communicationStyle}` : undefined,
      row.principles ? `Principles: ${row.principles}` : undefined,
      '',
      `You are operating inside the AutoMaker application.`,
      `Follow all project context rules loaded by AutoMaker before making changes.`,
      params.artifactsDir
        ? `BMAD artifacts directory (git-friendly): ${params.artifactsDir}`
        : undefined,
      params.projectPath
        ? `If BMAD workflows are installed, they will be at: ${path.join(params.projectPath, '_bmad')}`
        : undefined,
    ].filter(Boolean);

    const fullPrompt = promptParts.join('\n');
    const agentDefaults = this.getAgentDefaults(personaId);
    return {
      systemPrompt: fullPrompt,
      model: agentDefaults.model,
      thinkingBudget: agentDefaults.thinkingBudget,
    };
  }

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
      model: leadDefaults?.model,
      thinkingBudget: leadDefaults?.thinkingBudget,
    };
  }

  private async loadManifestRows(): Promise<AgentManifestRow[]> {
    if (this.cachedRows) return this.cachedRows;

    const manifestPath = getBmadAgentManifestPath();
    let csv: string;
    try {
      csv = await fs.readFile(manifestPath, 'utf-8');
    } catch (err) {
      console.warn(`[BmadPersonaService] Could not load agent manifest at ${manifestPath}:`, err);
      this.cachedRows = [];
      return [];
    }
    const parsed = parseCsv(csv);

    const rows = parsed.map((r) => {
      const row: AgentManifestRow = {
        name: decodeHtmlEntities((r.name ?? '').trim()),
        displayName: decodeHtmlEntities((r.displayName ?? '').trim()),
        title: decodeHtmlEntities((r.title ?? '').trim()),
        icon: decodeHtmlEntities((r.icon ?? '').trim()),
        role: decodeHtmlEntities((r.role ?? '').trim()),
        identity: decodeHtmlEntities((r.identity ?? '').trim()),
        communicationStyle: decodeHtmlEntities((r.communicationStyle ?? '').trim()),
        principles: decodeHtmlEntities((r.principles ?? '').trim()),
        module: decodeHtmlEntities((r.module ?? '').trim()),
        path: decodeHtmlEntities((r.path ?? '').trim()),
      };
      return row;
    });

    this.cachedRows = rows;
    return rows;
  }

  private async getAgentManifestRow(personaId: string): Promise<AgentManifestRow | null> {
    if (!personaId.startsWith('bmad:')) {
      return null;
    }
    const agentName = personaId.slice('bmad:'.length);
    const rows = await this.loadManifestRows();
    return rows.find((r) => r.name === agentName) || null;
  }

  private buildCollaborativePrompt(
    agents: Array<{ id: string; name: string; icon: string; systemPrompt: string }>
  ): string {
    if (agents.length === 1) {
      return agents[0].systemPrompt;
    }

    const agentRoster = agents.map((a, i) => `${i + 1}. ${a.icon} **${a.name}**`).join('\n');

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

  private getAgentDefaults(personaId: string): { model?: string; thinkingBudget?: number } {
    const defaults: Record<string, { model: string; thinkingBudget: number }> = {
      // Strategic/analytical roles - more thinking
      'bmad:architect': { model: 'sonnet', thinkingBudget: 12000 },
      'bmad:pm': { model: 'sonnet', thinkingBudget: 10000 },
      'bmad:analyst': { model: 'sonnet', thinkingBudget: 10000 },
      'bmad:innovation-strategist': { model: 'sonnet', thinkingBudget: 10000 },

      // Implementation roles - balanced
      'bmad:dev': { model: 'sonnet', thinkingBudget: 8000 },
      'bmad:sm': { model: 'sonnet', thinkingBudget: 6000 },
      'bmad:tea': { model: 'sonnet', thinkingBudget: 8000 },

      // Quick execution roles
      'bmad:quick-flow-solo-dev': { model: 'sonnet', thinkingBudget: 5000 },

      // Creative roles
      'bmad:ux-designer': { model: 'sonnet', thinkingBudget: 8000 },
      'bmad:storyteller': { model: 'sonnet', thinkingBudget: 8000 },
      'bmad:brainstorming-coach': { model: 'sonnet', thinkingBudget: 8000 },

      // Builder roles
      'bmad:agent-builder': { model: 'sonnet', thinkingBudget: 8000 },
      'bmad:module-builder': { model: 'sonnet', thinkingBudget: 8000 },
      'bmad:workflow-builder': { model: 'sonnet', thinkingBudget: 8000 },

      // Executive personas - BMM framework roles
      'bmad:strategist-marketer': { model: 'sonnet', thinkingBudget: 10000 },
      'bmad:technologist-architect': { model: 'sonnet', thinkingBudget: 12000 },
      'bmad:fulfillization-manager': { model: 'sonnet', thinkingBudget: 9000 },

      // Executive Suite - new agents
      'bmad:security-guardian': { model: 'sonnet', thinkingBudget: 10000 },
      'bmad:analyst-strategist': { model: 'sonnet', thinkingBudget: 10000 },
      'bmad:financial-strategist': { model: 'sonnet', thinkingBudget: 10000 },
      'bmad:operations-commander': { model: 'sonnet', thinkingBudget: 9000 },
      'bmad:apex': { model: 'sonnet', thinkingBudget: 9000 },
      'bmad:zen': { model: 'sonnet', thinkingBudget: 10000 },
    };

    return defaults[personaId] || { model: 'sonnet', thinkingBudget: 8000 };
  }
}
