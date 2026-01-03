import React, { useMemo } from 'react';
import { Users, UserCog, ChevronDown, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useBmadPersonas } from '@/hooks/use-bmad-personas';
import { ALL_BMAD_AGENT_IDS, AGENT_MODULES } from '@/config/bmad-agents';

// Use ALL_BMAD_AGENT_IDS for full access to all 29 agents
const MAX_AGENTS = ALL_BMAD_AGENT_IDS.length; // 29

export interface AgentsTabContentProps {
  /** Set of selected agent IDs */
  selectedAgentIds: Set<string>;
  /** Handler when agent selection changes */
  onSelectedAgentIdsChange: (ids: Set<string>) => void;
  /** Whether Party Mode is enabled (all agents selected) */
  usePartyMode: boolean;
  /** Handler to toggle Party Mode */
  onPartyModeChange: (enabled: boolean) => void;
  /** Set of expanded category keys */
  expandedCategories: Set<string>;
  /** Handler when category expansion changes */
  onExpandedCategoriesChange: (categories: Set<string>) => void;
  /** Whether verbose collaboration is enabled (show agent perspectives) */
  verboseCollaboration?: boolean;
  /** Handler when verbose collaboration changes */
  onVerboseCollaborationChange?: (enabled: boolean) => void;
  /** Whether to show the component (e.g., based on Party Synthesis profile selection) */
  enabled?: boolean;
  /** Optional data-testid prefix for testing */
  testIdPrefix?: string;
  /** Compact mode with simpler tier structure (for edit dialog) */
  compact?: boolean;
}

/**
 * Agent checkbox item component for individual agent selection
 */
function AgentCheckboxItem({
  agent,
  isSelected,
  isDisabled,
  onToggle,
  orderNumber,
}: {
  agent: { id: string; label: string; icon: string };
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: () => void;
  orderNumber: number;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-md transition-colors cursor-pointer',
        isSelected ? 'bg-primary/10' : 'hover:bg-muted/50',
        isDisabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={() => !isDisabled && onToggle()}
    >
      <Checkbox
        checked={isSelected}
        disabled={isDisabled}
        onCheckedChange={onToggle}
        onClick={(e) => e.stopPropagation()}
      />
      <span className="text-base">{agent.icon}</span>
      <span className="text-sm flex-1">{agent.label}</span>
      {isSelected && orderNumber > 0 && (
        <span className="text-xs text-muted-foreground">#{orderNumber}</span>
      )}
    </div>
  );
}

export function AgentsTabContent({
  selectedAgentIds,
  onSelectedAgentIdsChange,
  usePartyMode,
  onPartyModeChange,
  expandedCategories,
  onExpandedCategoriesChange,
  verboseCollaboration,
  onVerboseCollaborationChange,
  enabled = true,
  testIdPrefix = 'feature',
  compact = false,
}: AgentsTabContentProps) {
  const { personas: bmadPersonas, isLoading: isLoadingPersonas } = useBmadPersonas({
    enabled,
  });

  // Toggle agent selection
  const toggleAgentSelection = (agentId: string) => {
    const next = new Set(selectedAgentIds);
    if (next.has(agentId)) {
      next.delete(agentId);
    } else if (next.size < MAX_AGENTS) {
      next.add(agentId);
    }
    onSelectedAgentIdsChange(next);
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    const next = new Set(expandedCategories);
    if (next.has(category)) {
      next.delete(category);
    } else {
      next.add(category);
    }
    onExpandedCategoriesChange(next);
  };

  // Agent categories - All 5 modules (core, builders, method, executive, creative)
  const agentCategories = useMemo(() => {
    const categories: Record<
      string,
      { label: string; agents: Array<{ id: string; label: string; icon: string }> }
    > = {};

    // Iterate over all 5 BMAD modules
    Object.entries(AGENT_MODULES).forEach(([moduleKey, module]) => {
      const moduleAgents = module.agents
        .map((agentId) => bmadPersonas.find((p) => p.id === agentId))
        .filter((agent): agent is NonNullable<typeof agent> => agent !== undefined)
        .map((agent) => ({
          id: agent.id,
          label: agent.label,
          icon: agent.icon ?? '',
        }));

      if (moduleAgents.length > 0) {
        categories[moduleKey] = {
          label: module.label,
          agents: moduleAgents,
        };
      }
    });

    return categories;
  }, [bmadPersonas]);

  if (!enabled) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Executive Agent Collaboration</Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {selectedAgentIds.size}/{MAX_AGENTS} selected
          </span>
          {!usePartyMode && selectedAgentIds.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onSelectedAgentIdsChange(new Set())}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {isLoadingPersonas ? (
        <div className="text-sm text-muted-foreground p-4 text-center">Loading agents...</div>
      ) : (
        <div className="space-y-3" data-testid={`${testIdPrefix}-agent-select`}>
          {/* Party Mode Toggle - Primary Option */}
          <div
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
              usePartyMode ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50 border-border'
            )}
            onClick={() => onPartyModeChange(true)}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                usePartyMode ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}
            >
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Party Mode</span>
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {compact
                  ? 'All 29 BMAD agents collaborate across all modules: Core, Builders, Method, Executive, and Creative teams'
                  : 'All 29 BMAD agents collaborate - Finn leads the Executive Suite (9 agents) with support from Core, Builders, Method, and Creative teams (20 agents)'}
              </p>
            </div>
            <Checkbox checked={usePartyMode} onCheckedChange={() => onPartyModeChange(true)} />
          </div>

          {/* Individual Selection Toggle */}
          <div
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
              !usePartyMode ? 'bg-muted/30 border-border' : 'hover:bg-muted/50 border-border'
            )}
            onClick={() => onPartyModeChange(false)}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                !usePartyMode ? 'bg-muted-foreground/20' : 'bg-muted'
              )}
            >
              <UserCog className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="font-medium">Select Individual Agents</span>
              <p className="text-xs text-muted-foreground">
                Choose specific agents (up to {MAX_AGENTS})
              </p>
            </div>
            <Checkbox checked={!usePartyMode} onCheckedChange={() => onPartyModeChange(false)} />
          </div>

          {/* Individual Agent Selection (shown when not in Party Mode) */}
          {!usePartyMode && (
            <div className="border rounded-md p-3 max-h-[300px] overflow-y-auto space-y-3">
              {compact ? (
                // Compact mode: Lead Agent + All Other Agents by Module
                <>
                  {/* Lead Agent: Finn (always shown first) */}
                  {bmadPersonas.find((p) => p.id === 'bmad:fulfillization-manager') && (
                    <div className="pb-2 border-b border-border">
                      <div className="text-xs font-medium text-primary px-2 py-1 mb-1">
                        Lead Agent
                      </div>
                      {(() => {
                        const finn = bmadPersonas.find(
                          (p) => p.id === 'bmad:fulfillization-manager'
                        );
                        if (!finn) return null;
                        const isSelected = selectedAgentIds.has(finn.id);
                        const isDisabled = !isSelected && selectedAgentIds.size >= MAX_AGENTS;
                        const selectedArray = Array.from(selectedAgentIds);
                        const orderNumber = isSelected ? selectedArray.indexOf(finn.id) + 1 : 0;
                        return (
                          <AgentCheckboxItem
                            key={finn.id}
                            agent={{ id: finn.id, label: finn.label, icon: finn.icon ?? '' }}
                            isSelected={isSelected}
                            isDisabled={isDisabled}
                            onToggle={() => toggleAgentSelection(finn.id)}
                            orderNumber={orderNumber}
                          />
                        );
                      })()}
                    </div>
                  )}

                  {/* All Other Agents by Module */}
                  {Object.entries(agentCategories).map(([categoryKey, category]) => {
                    // Skip executive module's Finn since it's shown as lead
                    const filteredAgents = category.agents.filter(
                      (a) => a.id !== 'bmad:fulfillization-manager'
                    );
                    const isExpanded = expandedCategories.has(categoryKey);
                    const selectedInCategory = category.agents.filter((agent) =>
                      selectedAgentIds.has(agent.id)
                    ).length;

                    return (
                      <div key={categoryKey} className="space-y-2">
                        <div
                          className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-1 rounded-md transition-colors"
                          onClick={() => toggleCategory(categoryKey)}
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span className="text-sm font-medium">{category.label}</span>
                            {selectedInCategory > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ({selectedInCategory})
                              </span>
                            )}
                          </div>
                        </div>

                        {isExpanded && filteredAgents.length > 0 && (
                          <div className="space-y-1 ml-6">
                            {filteredAgents.map((agent) => {
                              const isSelected = selectedAgentIds.has(agent.id);
                              const isDisabled = !isSelected && selectedAgentIds.size >= MAX_AGENTS;
                              const selectedArray = Array.from(selectedAgentIds);
                              const orderNumber = isSelected
                                ? selectedArray.indexOf(agent.id) + 1
                                : 0;

                              return (
                                <AgentCheckboxItem
                                  key={agent.id}
                                  agent={agent}
                                  isSelected={isSelected}
                                  isDisabled={isDisabled}
                                  onToggle={() => toggleAgentSelection(agent.id)}
                                  orderNumber={orderNumber}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                // Full mode: Tier 1, 2, 3 structure
                <>
                  {/* TIER 1: Lead Agent - Finn (Selection #1) */}
                  {bmadPersonas.find((p) => p.id === 'bmad:fulfillization-manager') && (
                    <div className="pb-3 border-b-2 border-primary/30">
                      <div className="flex items-center gap-2 px-2 py-1.5 mb-2 bg-primary/10 rounded-md">
                        <span className="text-sm font-semibold text-primary">
                          Tier 1: Lead Agent
                        </span>
                        <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                          #1
                        </span>
                      </div>
                      {(() => {
                        const finn = bmadPersonas.find(
                          (p) => p.id === 'bmad:fulfillization-manager'
                        );
                        if (!finn) return null;
                        const isSelected = selectedAgentIds.has(finn.id);
                        const isDisabled = !isSelected && selectedAgentIds.size >= MAX_AGENTS;
                        const selectedArray = Array.from(selectedAgentIds);
                        const orderNumber = isSelected ? selectedArray.indexOf(finn.id) + 1 : 0;
                        return (
                          <div
                            className={cn(
                              'rounded-md border-2',
                              isSelected ? 'border-primary bg-primary/5' : 'border-transparent'
                            )}
                          >
                            <AgentCheckboxItem
                              key={finn.id}
                              agent={{ id: finn.id, label: finn.label, icon: finn.icon ?? '' }}
                              isSelected={isSelected}
                              isDisabled={isDisabled}
                              onToggle={() => toggleAgentSelection(finn.id)}
                              orderNumber={orderNumber}
                            />
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* TIER 2: Executive Suite (Selections #2-#10) */}
                  {agentCategories['executive'] && (
                    <div className="pb-3 border-b border-border">
                      <div className="flex items-center gap-2 px-2 py-1.5 mb-2 bg-muted/50 rounded-md">
                        <span className="text-sm font-semibold text-foreground">
                          Tier 2: Executive Suite
                        </span>
                        <span className="text-xs text-muted-foreground">#2-#10</span>
                      </div>
                      {(() => {
                        const executiveAgents = agentCategories['executive'].agents.filter(
                          (a) => a.id !== 'bmad:fulfillization-manager'
                        );
                        const isExpanded = expandedCategories.has('executive');
                        const selectedInCategory = executiveAgents.filter((agent) =>
                          selectedAgentIds.has(agent.id)
                        ).length;

                        return (
                          <div className="space-y-2">
                            <div
                              className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-1 rounded-md transition-colors"
                              onClick={() => toggleCategory('executive')}
                            >
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                                <span className="text-sm font-medium">9 Executive Agents</span>
                                {selectedInCategory > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    ({selectedInCategory} selected)
                                  </span>
                                )}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="space-y-1 ml-6">
                                {executiveAgents.map((agent) => {
                                  const isSelected = selectedAgentIds.has(agent.id);
                                  const isDisabled =
                                    !isSelected && selectedAgentIds.size >= MAX_AGENTS;
                                  const selectedArray = Array.from(selectedAgentIds);
                                  const orderNumber = isSelected
                                    ? selectedArray.indexOf(agent.id) + 1
                                    : 0;

                                  return (
                                    <AgentCheckboxItem
                                      key={agent.id}
                                      agent={agent}
                                      isSelected={isSelected}
                                      isDisabled={isDisabled}
                                      onToggle={() => toggleAgentSelection(agent.id)}
                                      orderNumber={orderNumber}
                                    />
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* TIER 3: Other BMAD Agents (Selections #11-#29) */}
                  <div>
                    <div className="flex items-center gap-2 px-2 py-1.5 mb-2 bg-muted/30 rounded-md">
                      <span className="text-sm font-semibold text-muted-foreground">
                        Tier 3: Other BMAD Agents
                      </span>
                      <span className="text-xs text-muted-foreground">#11-#29</span>
                    </div>
                    {Object.entries(agentCategories)
                      .filter(([key]) => key !== 'executive')
                      .map(([categoryKey, category]) => {
                        const isExpanded = expandedCategories.has(categoryKey);
                        const selectedInCategory = category.agents.filter((agent) =>
                          selectedAgentIds.has(agent.id)
                        ).length;

                        return (
                          <div key={categoryKey} className="space-y-2 mb-2">
                            <div
                              className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-1 rounded-md transition-colors"
                              onClick={() => toggleCategory(categoryKey)}
                            >
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                                <span className="text-sm font-medium">{category.label}</span>
                                {selectedInCategory > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    ({selectedInCategory})
                                  </span>
                                )}
                              </div>
                            </div>

                            {isExpanded && category.agents.length > 0 && (
                              <div className="space-y-1 ml-6">
                                {category.agents.map((agent) => {
                                  const isSelected = selectedAgentIds.has(agent.id);
                                  const isDisabled =
                                    !isSelected && selectedAgentIds.size >= MAX_AGENTS;
                                  const selectedArray = Array.from(selectedAgentIds);
                                  const orderNumber = isSelected
                                    ? selectedArray.indexOf(agent.id) + 1
                                    : 0;

                                  return (
                                    <AgentCheckboxItem
                                      key={agent.id}
                                      agent={agent}
                                      isSelected={isSelected}
                                      isDisabled={isDisabled}
                                      onToggle={() => toggleAgentSelection(agent.id)}
                                      orderNumber={orderNumber}
                                    />
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Verbose Collaboration Toggle */}
      {(usePartyMode || selectedAgentIds.size > 1) && (
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id={`${testIdPrefix}-verbose-collab`}
              checked={verboseCollaboration ?? false}
              onCheckedChange={onVerboseCollaborationChange}
              data-testid={`${testIdPrefix}-verbose-collaboration-toggle`}
            />
            <div className="flex-1">
              <Label
                htmlFor={`${testIdPrefix}-verbose-collab`}
                className="font-medium cursor-pointer"
              >
                Show Agent Perspectives
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Display each agent's contribution separately with explicit attribution (vs.
                invisible synthesis)
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {usePartyMode
          ? `Party Mode: All ${MAX_AGENTS} BMAD agents deliberate and synthesize a unified recommendation.`
          : `Select up to ${MAX_AGENTS} BMAD agents for collaborative execution.`}
      </p>
    </div>
  );
}
