import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { HotkeyButton } from '@/components/ui/hotkey-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CategoryAutocomplete } from '@/components/ui/category-autocomplete';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DescriptionImageDropZone,
  FeatureImagePath as DescriptionImagePath,
  FeatureTextFilePath as DescriptionTextFilePath,
  ImagePreviewMap,
} from '@/components/ui/description-image-dropzone';
import {
  MessageSquare,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';
import { getElectronAPI } from '@/lib/electron';
import { modelSupportsThinking, cn } from '@/lib/utils';
import { useBmadPersonas } from '@/hooks/use-bmad-personas';
import {
  useAppStore,
  AgentModel,
  ThinkingLevel,
  FeatureImage,
  AIProfile,
  PlanningMode,
  Feature,
} from '@/store/app-store';
import {
  ModelSelector,
  ThinkingLevelSelector,
  ProfileQuickSelect,
  TestingTabContent,
  PrioritySelector,
  BranchSelector,
  PlanningModeSelector,
  AncestorContextSection,
} from '../shared';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from '@tanstack/react-router';
import {
  getAncestors,
  formatAncestorContextForPrompt,
  type AncestorContext,
} from '@automaker/dependency-resolver';

type FeatureData = {
  title: string;
  category: string;
  description: string;
  images: FeatureImage[];
  imagePaths: DescriptionImagePath[];
  textFilePaths: DescriptionTextFilePath[];
  skipTests: boolean;
  model: AgentModel;
  thinkingLevel: ThinkingLevel;
  branchName: string; // Can be empty string to use current branch
  priority: number;
  planningMode: PlanningMode;
  requirePlanApproval: boolean;
  dependencies?: string[];
};

interface AddFeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (feature: {
    title: string;
    category: string;
    description: string;
    images: FeatureImage[];
    imagePaths: DescriptionImagePath[];
    textFilePaths: DescriptionTextFilePath[];
    skipTests: boolean;
    model: AgentModel;
    thinkingLevel: ThinkingLevel;
    aiProfileId?: string | null;
    personaId?: string | null;
    agentIds?: string[];
    branchName: string; // Can be empty string to use current branch
    priority: number;
    planningMode: PlanningMode;
    requirePlanApproval: boolean;
    dependencies?: string[];
  }) => void;
  categorySuggestions: string[];
  branchSuggestions: string[];
  branchCardCounts?: Record<string, number>; // Map of branch name to unarchived card count
  defaultSkipTests: boolean;
  defaultBranch?: string;
  currentBranch?: string;
  isMaximized: boolean;
  showProfilesOnly: boolean;
  aiProfiles: AIProfile[];
  // Spawn task mode props
  parentFeature?: Feature | null;
  allFeatures?: Feature[];
}

export function AddFeatureDialog({
  open,
  onOpenChange,
  onAdd,
  onAddAndStart,
  categorySuggestions,
  branchSuggestions,
  branchCardCounts,
  defaultSkipTests,
  defaultBranch = 'main',
  currentBranch,
  isMaximized,
  showProfilesOnly,
  aiProfiles,
  parentFeature = null,
  allFeatures = [],
}: AddFeatureDialogProps) {
  const isSpawnMode = !!parentFeature;
  const navigate = useNavigate();
  const [useCurrentBranch, setUseCurrentBranch] = useState(true);
  const [newFeature, setNewFeature] = useState({
    title: '',
    category: '',
    description: '',
    images: [] as FeatureImage[],
    imagePaths: [] as DescriptionImagePath[],
    textFilePaths: [] as DescriptionTextFilePath[],
    skipTests: false,
    model: 'opus' as AgentModel,
    thinkingLevel: 'none' as ThinkingLevel,
    branchName: '',
    priority: 2 as number, // Default to medium priority
  });
  const [newFeaturePreviewMap, setNewFeaturePreviewMap] = useState<ImagePreviewMap>(
    () => new Map()
  );
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementMode, setEnhancementMode] = useState<
    'improve' | 'technical' | 'simplify' | 'acceptance'
  >('improve');
  const [planningMode, setPlanningMode] = useState<PlanningMode>('skip');
  const [requirePlanApproval, setRequirePlanApproval] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['executive']));

  const { personas: bmadPersonas, isLoading: isLoadingPersonas } = useBmadPersonas({
    enabled: open,
  });

  // Spawn mode state
  const [ancestors, setAncestors] = useState<AncestorContext[]>([]);
  const [selectedAncestorIds, setSelectedAncestorIds] = useState<Set<string>>(new Set());

  // Get enhancement model, planning mode defaults, and worktrees setting from store
  const {
    enhancementModel,
    defaultPlanningMode,
    defaultRequirePlanApproval,
    defaultAIProfileId,
    useWorktrees,
  } = useAppStore();

  // Sync defaults when dialog opens
  useEffect(() => {
    if (open) {
      // Find the default profile if one is set
      const defaultProfile = defaultAIProfileId
        ? aiProfiles.find((p) => p.id === defaultAIProfileId)
        : null;

      setNewFeature((prev) => ({
        ...prev,
        skipTests: defaultSkipTests,
        branchName: defaultBranch || '',
        // Use default profile's model/thinkingLevel if set, else fallback to defaults
        model: defaultProfile?.model ?? 'opus',
        thinkingLevel: defaultProfile?.thinkingLevel ?? 'none',
      }));
      setSelectedProfileId(defaultProfile?.id ?? null);
      setSelectedPersonaId(defaultProfile?.personaId ?? null);
      setUseCurrentBranch(true);
      setPlanningMode(defaultPlanningMode);
      setRequirePlanApproval(defaultRequirePlanApproval);

      // Initialize ancestors for spawn mode
      if (parentFeature) {
        const ancestorList = getAncestors(parentFeature, allFeatures);
        setAncestors(ancestorList);
        // Only select parent by default - ancestors are optional context
        setSelectedAncestorIds(new Set([parentFeature.id]));
      } else {
        setAncestors([]);
        setSelectedAncestorIds(new Set());
      }
    }
  }, [
    open,
    defaultSkipTests,
    defaultBranch,
    defaultPlanningMode,
    defaultRequirePlanApproval,
    defaultAIProfileId,
    aiProfiles,
    parentFeature,
    allFeatures,
  ]);

  const buildFeatureData = (): FeatureData | null => {
    if (!newFeature.description.trim()) {
      setDescriptionError(true);
      return null;
    }

    // Validate branch selection when "other branch" is selected
    if (useWorktrees && !useCurrentBranch && !newFeature.branchName.trim()) {
      toast.error('Please select a branch name');
      return null;
    }

    const category = newFeature.category || 'Uncategorized';
    const selectedModel = newFeature.model;
    const normalizedThinking = modelSupportsThinking(selectedModel)
      ? newFeature.thinkingLevel
      : 'none';

    // Use current branch if toggle is on
    // If currentBranch is provided (non-primary worktree), use it
    // Otherwise (primary worktree), use empty string which means "unassigned" (show only on primary)
    const finalBranchName = useCurrentBranch ? currentBranch || '' : newFeature.branchName || '';

    // Build final description - prepend ancestor context in spawn mode
    let finalDescription = newFeature.description;
    if (isSpawnMode && parentFeature && selectedAncestorIds.size > 0) {
      // Create parent context as an AncestorContext
      const parentContext: AncestorContext = {
        id: parentFeature.id,
        title: parentFeature.title,
        description: parentFeature.description,
        spec: parentFeature.spec,
        summary: parentFeature.summary,
        depth: -1,
      };

      const allAncestorsWithParent = [parentContext, ...ancestors];
      const contextText = formatAncestorContextForPrompt(
        allAncestorsWithParent,
        selectedAncestorIds
      );

      if (contextText) {
        finalDescription = `${contextText}\n\n---\n\n## Task Description\n\n${newFeature.description}`;
      }
    }

    return {
      title: newFeature.title,
      category,
      description: finalDescription,
      images: newFeature.images,
      imagePaths: newFeature.imagePaths,
      textFilePaths: newFeature.textFilePaths,
      skipTests: newFeature.skipTests,
      model: selectedModel,
      thinkingLevel: normalizedThinking,
      aiProfileId: selectedProfileId,
      personaId: selectedPersonaId,
      agentIds: selectedAgentIds.size > 0 ? Array.from(selectedAgentIds) : undefined,
      branchName: finalBranchName,
      priority: newFeature.priority,
      planningMode,
      requirePlanApproval,
      // In spawn mode, automatically add parent as dependency
      dependencies: isSpawnMode && parentFeature ? [parentFeature.id] : undefined,
    };
  };

  const resetForm = () => {
    setNewFeature({
      title: '',
      category: '',
      description: '',
      images: [],
      imagePaths: [],
      textFilePaths: [],
      skipTests: defaultSkipTests,
      model: 'opus',
      priority: 2,
      thinkingLevel: 'none',
      branchName: '',
    });
    setUseCurrentBranch(true);
    setPlanningMode(defaultPlanningMode);
    setRequirePlanApproval(defaultRequirePlanApproval);
    setSelectedProfileId(defaultAIProfileId ?? null);
    setSelectedPersonaId(
      defaultAIProfileId
        ? (aiProfiles.find((p) => p.id === defaultAIProfileId)?.personaId ?? null)
        : null
    );
    setSelectedAgentIds(new Set());
    setNewFeaturePreviewMap(new Map());
    setShowAdvancedOptions(false);
    setDescriptionError(false);
    onOpenChange(false);
  };

  const handleAction = (actionFn?: (data: FeatureData) => void) => {
    if (!actionFn) return;

    const featureData = buildFeatureData();
    if (!featureData) return;

    actionFn(featureData);
    resetForm();
  };

  const handleAdd = () => handleAction(onAdd);

  const handleAddAndStart = () => handleAction(onAddAndStart);

  const handleDialogClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setNewFeaturePreviewMap(new Map());
      setShowAdvancedOptions(false);
      setDescriptionError(false);
    }
  };

  const handleEnhanceDescription = async () => {
    if (!newFeature.description.trim() || isEnhancing) return;

    setIsEnhancing(true);
    try {
      const api = getElectronAPI();
      const result = await api.enhancePrompt?.enhance(
        newFeature.description,
        enhancementMode,
        enhancementModel
      );

      if (result?.success && result.enhancedText) {
        const enhancedText = result.enhancedText;
        setNewFeature((prev) => ({ ...prev, description: enhancedText }));
        toast.success('Description enhanced!');
      } else {
        toast.error(result?.error || 'Failed to enhance description');
      }
    } catch (error) {
      console.error('Enhancement failed:', error);
      toast.error('Failed to enhance description');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleModelSelect = (model: AgentModel) => {
    setSelectedProfileId(null);
    setNewFeature({
      ...newFeature,
      model,
      thinkingLevel: modelSupportsThinking(model) ? newFeature.thinkingLevel : 'none',
    });
  };

  const handleProfileSelect = (profile: AIProfile) => {
    setSelectedProfileId(profile.id);
    if (profile.personaId) {
      setSelectedPersonaId(profile.personaId);
    }
    setNewFeature({
      ...newFeature,
      model: profile.model,
      thinkingLevel: profile.thinkingLevel,
    });
  };

  const newModelAllowsThinking = modelSupportsThinking(newFeature.model);

  // Filter out BMAD profiles (those with personaId) from Quick Select
  // BMAD personas are now selected on the Prompt tab, not via profiles
  const modelOnlyProfiles = useMemo(() => aiProfiles.filter((p) => !p.personaId), [aiProfiles]);

  // Multi-select agent toggle function
  const toggleAgentSelection = (agentId: string) => {
    setSelectedAgentIds((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else if (next.size < 4) {
        next.add(agentId);
      }
      return next;
    });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Agent categories - Executive Suite agents only
  const agentCategories = useMemo(() => {
    const executiveAgentIds = [
      'bmad:strategist-marketer',
      'bmad:technologist-architect',
      'bmad:fulfillization-manager',
      'bmad:security-guardian',
      'bmad:analyst-strategist',
      'bmad:financial-strategist',
      'bmad:operations-commander',
    ];

    const executiveAgents = executiveAgentIds
      .map((agentId) => bmadPersonas.find((p) => p.id === agentId))
      .filter((agent): agent is NonNullable<typeof agent> => agent !== undefined)
      .map((agent) => ({
        id: agent.id,
        label: agent.label,
        icon: agent.icon ?? '🤖',
      }));

    const filteredCategories: Record<string, { label: string; agents: typeof executiveAgents }> =
      {};

    if (executiveAgents.length > 0) {
      filteredCategories.executive = {
        label: 'Executive Agents',
        agents: executiveAgents,
      };
    }

    return filteredCategories;
  }, [bmadPersonas]);

  // Agent checkbox item component
  const AgentCheckboxItem = ({
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
  }) => {
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
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent
        compact={!isMaximized}
        data-testid="add-feature-dialog"
        onPointerDownOutside={(e: CustomEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('[data-testid="category-autocomplete-list"]')) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e: CustomEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('[data-testid="category-autocomplete-list"]')) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{isSpawnMode ? 'Spawn Sub-Task' : 'Add New Feature'}</DialogTitle>
          <DialogDescription>
            {isSpawnMode
              ? `Create a sub-task that depends on "${parentFeature?.title || parentFeature?.description.slice(0, 50)}..."`
              : 'Create a new feature card for the Kanban board.'}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="prompt" className="py-4 flex-1 min-h-0 flex flex-col">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="prompt" data-testid="tab-prompt">
              <MessageSquare className="w-4 h-4 mr-2" />
              Prompt
            </TabsTrigger>
            <TabsTrigger value="model" data-testid="tab-model">
              <Settings2 className="w-4 h-4 mr-2" />
              Model
            </TabsTrigger>
            <TabsTrigger value="options" data-testid="tab-options">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Options
            </TabsTrigger>
          </TabsList>

          {/* Prompt Tab */}
          <TabsContent value="prompt" className="space-y-4 overflow-y-auto cursor-default">
            {/* Ancestor Context Section - only in spawn mode */}
            {isSpawnMode && parentFeature && (
              <AncestorContextSection
                parentFeature={{
                  id: parentFeature.id,
                  title: parentFeature.title,
                  description: parentFeature.description,
                  spec: parentFeature.spec,
                  summary: parentFeature.summary,
                }}
                ancestors={ancestors}
                selectedAncestorIds={selectedAncestorIds}
                onSelectionChange={setSelectedAncestorIds}
              />
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <DescriptionImageDropZone
                value={newFeature.description}
                onChange={(value) => {
                  setNewFeature({ ...newFeature, description: value });
                  if (value.trim()) {
                    setDescriptionError(false);
                  }
                }}
                images={newFeature.imagePaths}
                onImagesChange={(images) => setNewFeature({ ...newFeature, imagePaths: images })}
                textFiles={newFeature.textFilePaths}
                onTextFilesChange={(textFiles) =>
                  setNewFeature({ ...newFeature, textFilePaths: textFiles })
                }
                placeholder="Describe the feature..."
                previewMap={newFeaturePreviewMap}
                onPreviewMapChange={setNewFeaturePreviewMap}
                autoFocus
                error={descriptionError}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                value={newFeature.title}
                onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })}
                placeholder="Leave blank to auto-generate"
              />
            </div>
            <div className="flex w-fit items-center gap-3 select-none cursor-default">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-[200px] justify-between">
                    {enhancementMode === 'improve' && 'Improve Clarity'}
                    {enhancementMode === 'technical' && 'Add Technical Details'}
                    {enhancementMode === 'simplify' && 'Simplify'}
                    {enhancementMode === 'acceptance' && 'Add Acceptance Criteria'}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setEnhancementMode('improve')}>
                    Improve Clarity
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEnhancementMode('technical')}>
                    Add Technical Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEnhancementMode('simplify')}>
                    Simplify
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEnhancementMode('acceptance')}>
                    Add Acceptance Criteria
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEnhanceDescription}
                disabled={!newFeature.description.trim() || isEnhancing}
                loading={isEnhancing}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Enhance with AI
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category (optional)</Label>
              <CategoryAutocomplete
                value={newFeature.category}
                onChange={(value) => setNewFeature({ ...newFeature, category: value })}
                suggestions={categorySuggestions}
                placeholder="e.g., Core, UI, API"
                data-testid="feature-category-input"
              />
            </div>

            {/* BMAD Agent Collaboration Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Add Executive Agents to Task</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {selectedAgentIds.size}/4 selected
                  </span>
                  {selectedAgentIds.size > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setSelectedAgentIds(new Set())}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </div>

              {isLoadingPersonas ? (
                <div className="text-sm text-muted-foreground p-4 text-center">
                  Loading agents...
                </div>
              ) : (
                <div
                  className="space-y-3 border rounded-md p-3 max-h-[400px] overflow-y-auto"
                  data-testid="feature-agent-select"
                >
                  {Object.entries(agentCategories).map(([categoryKey, category]) => {
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

                        {isExpanded && (
                          <div className="space-y-1 ml-6">
                            {category.agents.map((agent) => {
                              const isSelected = selectedAgentIds.has(agent.id);
                              const isDisabled = !isSelected && selectedAgentIds.size >= 4;
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
              )}

              <p className="text-xs text-muted-foreground">
                Select up to 4 executive agents for collaborative execution.
              </p>
            </div>

            {useWorktrees && (
              <BranchSelector
                useCurrentBranch={useCurrentBranch}
                onUseCurrentBranchChange={setUseCurrentBranch}
                branchName={newFeature.branchName}
                onBranchNameChange={(value) => setNewFeature({ ...newFeature, branchName: value })}
                branchSuggestions={branchSuggestions}
                branchCardCounts={branchCardCounts}
                currentBranch={currentBranch}
                testIdPrefix="feature"
              />
            )}

            {/* Priority Selector */}
            <PrioritySelector
              selectedPriority={newFeature.priority}
              onPrioritySelect={(priority) => setNewFeature({ ...newFeature, priority })}
              testIdPrefix="priority"
            />
          </TabsContent>

          {/* Model Tab */}
          <TabsContent value="model" className="space-y-4 overflow-y-auto cursor-default">
            {/* Show Advanced Options Toggle */}
            {showProfilesOnly && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Simple Mode Active</p>
                  <p className="text-xs text-muted-foreground">
                    Only showing AI profiles. Advanced model tweaking is hidden.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  data-testid="show-advanced-options-toggle"
                >
                  <Settings2 className="w-4 h-4 mr-2" />
                  {showAdvancedOptions ? 'Hide' : 'Show'} Advanced
                </Button>
              </div>
            )}

            {/* Quick Select Profile Section - filtered to model-only profiles */}
            <ProfileQuickSelect
              profiles={modelOnlyProfiles}
              selectedProfileId={selectedProfileId}
              selectedModel={newFeature.model}
              selectedThinkingLevel={newFeature.thinkingLevel}
              onSelect={handleProfileSelect}
              showManageLink
              onManageLinkClick={() => {
                onOpenChange(false);
                navigate({ to: '/profiles' });
              }}
            />

            {/* Separator */}
            {modelOnlyProfiles.length > 0 && (!showProfilesOnly || showAdvancedOptions) && (
              <div className="border-t border-border" />
            )}

            {/* Claude Models Section */}
            {(!showProfilesOnly || showAdvancedOptions) && (
              <>
                <ModelSelector selectedModel={newFeature.model} onModelSelect={handleModelSelect} />
                {newModelAllowsThinking && (
                  <ThinkingLevelSelector
                    selectedLevel={newFeature.thinkingLevel}
                    onLevelSelect={(level) => {
                      setSelectedProfileId(null);
                      setNewFeature({ ...newFeature, thinkingLevel: level });
                    }}
                  />
                )}
              </>
            )}
          </TabsContent>

          {/* Options Tab */}
          <TabsContent value="options" className="space-y-4 overflow-y-auto cursor-default">
            {/* Planning Mode Section */}
            <PlanningModeSelector
              mode={planningMode}
              onModeChange={setPlanningMode}
              requireApproval={requirePlanApproval}
              onRequireApprovalChange={setRequirePlanApproval}
              featureDescription={newFeature.description}
              testIdPrefix="add-feature"
              compact
            />

            <div className="border-t border-border my-4" />

            {/* Testing Section */}
            <TestingTabContent
              skipTests={newFeature.skipTests}
              onSkipTestsChange={(skipTests) => setNewFeature({ ...newFeature, skipTests })}
            />
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {onAddAndStart && (
            <Button
              onClick={handleAddAndStart}
              variant="secondary"
              data-testid="confirm-add-and-start-feature"
              disabled={useWorktrees && !useCurrentBranch && !newFeature.branchName.trim()}
            >
              <Play className="w-4 h-4 mr-2" />
              Make
            </Button>
          )}
          <HotkeyButton
            onClick={handleAdd}
            hotkey={{ key: 'Enter', cmdCtrl: true }}
            hotkeyActive={open}
            data-testid="confirm-add-feature"
            disabled={useWorktrees && !useCurrentBranch && !newFeature.branchName.trim()}
          >
            {isSpawnMode ? 'Spawn Task' : 'Add Feature'}
          </HotkeyButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
