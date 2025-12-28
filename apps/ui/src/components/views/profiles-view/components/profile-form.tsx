import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { HotkeyButton } from '@/components/ui/hotkey-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn, modelSupportsThinking } from '@/lib/utils';
import { DialogFooter } from '@/components/ui/dialog';
import { Brain, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { AIProfile, AgentModel, ThinkingLevel } from '@/store/app-store';
import { useBmadPersonas } from '@/hooks/use-bmad-personas';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CLAUDE_MODELS, THINKING_LEVELS, ICON_OPTIONS } from '../constants';
import { getProviderFromModel } from '../utils';

interface ProfileFormProps {
  profile: Partial<AIProfile>;
  onSave: (profile: Omit<AIProfile, 'id'>) => void;
  onCancel: () => void;
  isEditing: boolean;
  hotkeyActive: boolean;
}

export function ProfileForm({
  profile,
  onSave,
  onCancel,
  isEditing,
  hotkeyActive,
}: ProfileFormProps) {
  const { personas: bmadPersonas, isLoading: isLoadingPersonas } = useBmadPersonas();
  const [formData, setFormData] = useState({
    name: profile.name || '',
    description: profile.description || '',
    model: profile.model || ('opus' as AgentModel),
    thinkingLevel: profile.thinkingLevel || ('none' as ThinkingLevel),
    icon: profile.icon || 'Brain',
    personaId: profile.personaId || null,
    systemPrompt: profile.systemPrompt || '',
  });
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());

  const provider = getProviderFromModel(formData.model);
  const supportsThinking = modelSupportsThinking(formData.model);

  // Initialize agent selection from existing profile (with backward compat)
  useEffect(() => {
    if (profile?.agentIds?.length) {
      setSelectedAgentIds(new Set(profile.agentIds));
    } else if (profile?.personaId) {
      setSelectedAgentIds(new Set([profile.personaId]));
    }
  }, [profile]);

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

  const handleModelChange = (model: AgentModel) => {
    setFormData({
      ...formData,
      model,
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a profile name');
      return;
    }

    onSave({
      name: formData.name.trim(),
      description: formData.description.trim(),
      model: formData.model,
      thinkingLevel: supportsThinking ? formData.thinkingLevel : 'none',
      provider,
      isBuiltIn: false,
      icon: formData.icon,
      personaId: formData.personaId || undefined,
      agentIds: selectedAgentIds.size > 0 ? Array.from(selectedAgentIds) : undefined,
      systemPrompt: formData.systemPrompt.trim() || undefined,
    });
  };

  return (
    <>
      <div className="overflow-y-auto flex-1 min-h-0 space-y-4 pr-3 -mr-3 pl-1">
        {/* Name */}
        <div className="mt-2 space-y-2">
          <Label htmlFor="profile-name">Profile Name</Label>
          <Input
            id="profile-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Heavy Task, Quick Fix"
            data-testid="profile-name-input"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="profile-description">Description</Label>
          <Textarea
            id="profile-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe when to use this profile..."
            rows={2}
            data-testid="profile-description-input"
          />
        </div>

        {/* Persona */}
        <div className="space-y-2">
          <Label>Persona (optional)</Label>
          <Select
            value={formData.personaId ?? 'none'}
            onValueChange={(value) =>
              setFormData({ ...formData, personaId: value === 'none' ? null : value })
            }
            disabled={isLoadingPersonas}
          >
            <SelectTrigger data-testid="profile-persona-select">
              <SelectValue placeholder={isLoadingPersonas ? 'Loading personas…' : 'Default'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Default</SelectItem>
              {bmadPersonas.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Assign a BMAD persona (e.g., PM/Architect) to apply a consistent style and role.
          </p>
        </div>

        {/* System Prompt */}
        <div className="space-y-2">
          <Label htmlFor="profile-system-prompt">System Prompt (optional)</Label>
          <Textarea
            id="profile-system-prompt"
            value={formData.systemPrompt}
            onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
            placeholder="Add extra guardrails or style guidelines..."
            rows={3}
            data-testid="profile-system-prompt-input"
          />
        </div>

        {/* Default BMAD Agents */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <Label>Default BMAD Agents</Label>
              <span className="text-xs text-muted-foreground">({selectedAgentIds.size}/4 max)</span>
            </div>
            {selectedAgentIds.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAgentIds(new Set())}
                className="h-7 px-2"
              >
                Clear All
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Default agents used when no feature-specific agents are selected.
          </p>

          {isLoadingPersonas ? (
            <div className="text-sm text-muted-foreground">Loading agents...</div>
          ) : bmadPersonas.length > 0 ? (
            <div className="space-y-1 max-h-[200px] overflow-y-auto border rounded-lg p-2 bg-muted/20">
              {/* BMM Triad Agents */}
              <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                BMM Triad Agents
              </div>
              {bmadPersonas
                .filter((p) =>
                  [
                    'bmad:strategist-marketer',
                    'bmad:technologist-architect',
                    'bmad:fulfillization-manager',
                  ].includes(p.id)
                )
                .map((agent) => {
                  const isSelected = selectedAgentIds.has(agent.id);
                  const isDisabled = !isSelected && selectedAgentIds.size >= 4;
                  return (
                    <div
                      key={agent.id}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-md transition-colors',
                        isSelected ? 'bg-primary/10' : 'hover:bg-muted/50',
                        isDisabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <Checkbox
                        id={`agent-${agent.id}`}
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={() => toggleAgentSelection(agent.id)}
                      />
                      <span className="text-base">{agent.icon}</span>
                      <label
                        htmlFor={`agent-${agent.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {agent.label}
                      </label>
                      {isSelected && selectedAgentIds.size > 1 && (
                        <span className="text-xs text-muted-foreground">
                          #{Array.from(selectedAgentIds).indexOf(agent.id) + 1}
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No BMAD agents available</div>
          )}
        </div>

        {/* Icon Selection */}
        <div className="space-y-2">
          <Label>Icon</Label>
          <div className="flex gap-2 flex-wrap">
            {ICON_OPTIONS.map(({ name, icon: Icon }) => (
              <button
                key={name}
                type="button"
                onClick={() => setFormData({ ...formData, icon: name })}
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center border transition-colors',
                  formData.icon === name
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-accent border-border'
                )}
                data-testid={`icon-select-${name}`}
              >
                <Icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            Model
          </Label>
          <div className="flex gap-2 flex-wrap">
            {CLAUDE_MODELS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleModelChange(id)}
                className={cn(
                  'flex-1 min-w-[100px] px-3 py-2 rounded-md border text-sm font-medium transition-colors',
                  formData.model === id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-accent border-border'
                )}
                data-testid={`model-select-${id}`}
              >
                {label.replace('Claude ', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Thinking Level */}
        {supportsThinking && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-amber-500" />
              Thinking Level
            </Label>
            <div className="flex gap-2 flex-wrap">
              {THINKING_LEVELS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, thinkingLevel: id });
                    if (id === 'ultrathink') {
                      toast.warning('Ultrathink uses extensive reasoning', {
                        description:
                          'Best for complex architecture, migrations, or deep debugging (~$0.48/task).',
                        duration: 4000,
                      });
                    }
                  }}
                  className={cn(
                    'flex-1 min-w-[70px] px-3 py-2 rounded-md border text-sm font-medium transition-colors',
                    formData.thinkingLevel === id
                      ? 'bg-amber-500 text-white border-amber-400'
                      : 'bg-background hover:bg-accent border-border'
                  )}
                  data-testid={`thinking-select-${id}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Higher levels give more time to reason through complex problems.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <DialogFooter className="pt-4 border-t border-border mt-4 shrink-0">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <HotkeyButton
          onClick={handleSubmit}
          hotkey={{ key: 'Enter', cmdCtrl: true }}
          hotkeyActive={hotkeyActive}
          data-testid="save-profile-button"
        >
          {isEditing ? 'Save Changes' : 'Create Profile'}
        </HotkeyButton>
      </DialogFooter>
    </>
  );
}
