# PRP: BMAD Integration for Agent Runner

## Overview

Add BMAD persona/agent selection to the Agent Runner section, allowing users to start interactive agent sessions with specific BMAD personas (John, Mary, Winston, etc.) or launch Party Mode for multi-agent collaboration.

## Problem Statement

Currently, Agent Runner sessions use a generic AI agent without persona customization. Users who want to interact with specific BMAD agents (PM, Architect, Analyst, etc.) cannot do so in the conversational Agent Runner interface—they can only use personas in Auto Mode task execution.

## Goals

1. Enable persona selection when creating new agent sessions
2. Apply persona system prompts throughout the session
3. Support Party Mode as an interactive multi-agent conversation
4. Provide quick-start options for common BMAD agents
5. Display active persona in session list and header

## Non-Goals

- Changing how Auto Mode/task execution works (already implemented)
- Modifying the BMAD bundle or persona definitions
- Adding new BMAD agents (use existing manifest)

---

## Technical Design

### 1. Data Model Changes

#### Agent Session Type

**File:** `libs/types/src/` (find agent session interface)

```typescript
interface AgentSession {
  id: string;
  name: string;
  projectPath: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  // NEW FIELDS:
  personaId?: string; // BMAD persona ID (e.g., "bmad:pm", "bmad:architect")
  personaName?: string; // Display name for UI (e.g., "John (PM)")
  personaIcon?: string; // Icon/emoji for display
}
```

### 2. UI Changes

#### 2.1 New Session Dialog

**Location:** Find new session dialog component

**Add persona selector:**

```tsx
import { useBmadPersonas } from '@/hooks/use-bmad-personas';

// In component:
const { personas: bmadPersonas, isLoading: isLoadingPersonas } = useBmadPersonas({ enabled: open });
const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);

// In render:
<div className="space-y-2">
  <Label>BMAD Agent (optional)</Label>
  <Select
    value={selectedPersonaId ?? 'none'}
    onValueChange={(value) => setSelectedPersonaId(value === 'none' ? null : value)}
    disabled={isLoadingPersonas}
  >
    <SelectTrigger data-testid="session-persona-select">
      <SelectValue placeholder={isLoadingPersonas ? 'Loading...' : 'Default (no persona)'} />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="none">Default (no persona)</SelectItem>

      <SelectGroup>
        <SelectLabel>Special Modes</SelectLabel>
        <SelectItem value="bmad:party-mode">🎉 Party Mode (Multi-Agent Collaboration)</SelectItem>
      </SelectGroup>

      <SelectGroup>
        <SelectLabel>Strategy & Planning</SelectLabel>
        <SelectItem value="bmad:pm">📋 John (Product Manager)</SelectItem>
        <SelectItem value="bmad:analyst">📊 Mary (Business Analyst)</SelectItem>
        <SelectItem value="bmad:architect">🏗️ Winston (Architect)</SelectItem>
      </SelectGroup>

      <SelectGroup>
        <SelectLabel>Implementation</SelectLabel>
        <SelectItem value="bmad:dev">💻 Amelia (Developer)</SelectItem>
        <SelectItem value="bmad:sm">🏃 Bob (Scrum Master)</SelectItem>
        <SelectItem value="bmad:tea">🧪 Murat (Test Architect)</SelectItem>
        <SelectItem value="bmad:quick-flow-solo-dev">🚀 Barry (Quick Flow)</SelectItem>
      </SelectGroup>

      <SelectGroup>
        <SelectLabel>Design & Documentation</SelectLabel>
        <SelectItem value="bmad:ux-designer">🎨 Sally (UX Designer)</SelectItem>
        <SelectItem value="bmad:tech-writer">📚 Paige (Tech Writer)</SelectItem>
      </SelectGroup>

      <SelectGroup>
        <SelectLabel>Creative & Innovation</SelectLabel>
        <SelectItem value="bmad:brainstorming-coach">🧠 Carson (Brainstorming)</SelectItem>
        <SelectItem value="bmad:creative-problem-solver">🔬 Dr. Quinn (Problem Solver)</SelectItem>
        <SelectItem value="bmad:innovation-strategist">⚡ Victor (Innovation)</SelectItem>
        <SelectItem value="bmad:storyteller">📖 Sophia (Storyteller)</SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
  <p className="text-xs text-muted-foreground">
    Select a BMAD agent to give the session a specialized persona and expertise.
  </p>
</div>;
```

#### 2.2 Session List Item

**Location:** Session list component

**Show persona indicator:**

```tsx
<div className="flex items-center gap-2">
  {session.personaIcon && (
    <span className="text-sm" title={session.personaName}>
      {session.personaIcon}
    </span>
  )}
  <span className="font-medium">{session.name}</span>
</div>;
{
  session.personaName && (
    <span className="text-xs text-muted-foreground">{session.personaName}</span>
  );
}
```

#### 2.3 Session Header

**Location:** Agent session header/toolbar

**Show active persona badge:**

```tsx
<div className="flex items-center gap-2">
  <h2 className="text-lg font-semibold">{session.name}</h2>
  {session.personaId && (
    <Badge variant="outline" className="text-xs">
      {session.personaIcon} {session.personaName}
    </Badge>
  )}
</div>
```

#### 2.4 Agent Runner Header Quick Actions

**Location:** Agent Runner view header (near "+ New" button)

**Add BMAD dropdown:**

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button size="sm" variant="outline" data-testid="agent-runner-bmad-menu">
      <Puzzle className="w-4 h-4 mr-2" />
      BMAD
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-64">
    <DropdownMenuItem onClick={() => createSessionWithPersona('bmad:party-mode')}>
      <span className="mr-2">🎉</span>
      Start Party Mode Session
      <DropdownMenuShortcut>Multi-agent</DropdownMenuShortcut>
    </DropdownMenuItem>

    <DropdownMenuSeparator />
    <DropdownMenuLabel>Quick Start Agent</DropdownMenuLabel>

    <DropdownMenuItem onClick={() => createSessionWithPersona('bmad:pm')}>
      <span className="mr-2">📋</span>
      John (Product Manager)
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => createSessionWithPersona('bmad:architect')}>
      <span className="mr-2">🏗️</span>
      Winston (Architect)
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => createSessionWithPersona('bmad:analyst')}>
      <span className="mr-2">📊</span>
      Mary (Business Analyst)
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => createSessionWithPersona('bmad:dev')}>
      <span className="mr-2">💻</span>
      Amelia (Developer)
    </DropdownMenuItem>

    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={() => openNewSessionDialogWithPersonaTab()}>
      <Users className="w-4 h-4 mr-2" />
      Browse All Agents...
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 3. Server-Side Changes

#### 3.1 Session Creation Endpoint

**Location:** Agent session routes/service

**Store persona info on session creation:**

```typescript
async createSession(params: {
  projectPath: string;
  name?: string;
  personaId?: string;
}): Promise<AgentSession> {
  let personaName: string | undefined;
  let personaIcon: string | undefined;

  if (params.personaId) {
    const persona = await this.bmadPersonaService.getPersonaMetadata(params.personaId);
    if (persona) {
      personaName = persona.displayName;
      personaIcon = persona.icon;
    }
  }

  const session: AgentSession = {
    id: generateId(),
    name: params.name || this.generateSessionName(),
    projectPath: params.projectPath,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archived: false,
    personaId: params.personaId,
    personaName,
    personaIcon,
  };

  await this.saveSession(session);
  return session;
}
```

#### 3.2 Message Handling with Persona

**Location:** Agent runner service (where messages are sent to Claude)

**Apply persona system prompt:**

```typescript
async sendMessage(sessionId: string, userMessage: string): Promise<AssistantMessage> {
  const session = await this.getSession(sessionId);

  // Build system prompt
  let systemPrompt = this.getBaseSystemPrompt(session.projectPath);

  // Apply persona if set
  if (session.personaId) {
    const resolvedPersona = await this.bmadPersonaService.resolvePersona({
      personaId: session.personaId,
      projectPath: session.projectPath,
      artifactsDir: await this.getArtifactsDir(session.projectPath),
    });

    if (resolvedPersona?.systemPrompt) {
      // Prepend persona prompt to base prompt
      systemPrompt = `${resolvedPersona.systemPrompt}\n\n---\n\n${systemPrompt}`;
    }
  }

  // Special handling for Party Mode
  if (session.personaId === 'bmad:party-mode') {
    return this.handlePartyModeMessage(session, userMessage, systemPrompt);
  }

  // Standard message handling
  const response = await this.claudeService.sendMessage({
    messages: [...session.messages, { role: 'user', content: userMessage }],
    systemPrompt,
    model: resolvedPersona?.model || 'sonnet',
    // ... other params
  });

  // Save messages to session
  await this.appendMessages(sessionId, [
    { role: 'user', content: userMessage },
    { role: 'assistant', content: response.content },
  ]);

  return response;
}
```

#### 3.3 Party Mode Handler

**Location:** Agent runner service

```typescript
private async handlePartyModeMessage(
  session: AgentSession,
  userMessage: string,
  baseSystemPrompt: string
): Promise<AssistantMessage> {
  // Load party mode workflow prompt
  const partyModePrompt = await this.loadPartyModePrompt(session.projectPath);

  // Load agent manifest for party mode
  const agentManifest = await this.bmadPersonaService.loadManifestRows();

  // Build party mode system prompt with agent roster
  const systemPrompt = this.buildPartyModeSystemPrompt({
    basePrompt: partyModePrompt,
    agents: agentManifest,
    projectContext: baseSystemPrompt,
  });

  const response = await this.claudeService.sendMessage({
    messages: [...session.messages, { role: 'user', content: userMessage }],
    systemPrompt,
    model: 'sonnet', // Party mode uses sonnet for multi-agent simulation
  });

  await this.appendMessages(session.id, [
    { role: 'user', content: userMessage },
    { role: 'assistant', content: response.content },
  ]);

  return response;
}

private buildPartyModeSystemPrompt(params: {
  basePrompt: string;
  agents: AgentManifestRow[];
  projectContext: string;
}): string {
  const agentRoster = params.agents
    .map(a => `- ${a.icon} **${a.displayName}** (${a.title}): ${a.role}`)
    .join('\n');

  return `${params.basePrompt}

## Available Agents
${agentRoster}

## Project Context
${params.projectContext}

## Instructions
You are facilitating a party mode discussion. For each user message:
1. Analyze which 2-3 agents would most naturally contribute
2. Write responses from each selected agent's perspective, maintaining their personality
3. Use their documented communication style and principles
4. Enable natural cross-talk and building on each other's points
5. Format agent responses clearly with their icon and name as headers`;
}
```

### 4. API Endpoints

#### New/Modified Endpoints

| Method | Path                      | Description                             |
| ------ | ------------------------- | --------------------------------------- |
| POST   | `/api/agent-sessions`     | Create session (add `personaId` param)  |
| GET    | `/api/agent-sessions/:id` | Get session (returns persona info)      |
| GET    | `/api/bmad/personas`      | List available BMAD personas (existing) |

---

## Investigation Tasks

### Phase 1: Discovery (5 Agents)

```
Agent 1: Find agent session types and interfaces
- grep -rn "AgentSession\|interface.*Session" libs/types/ apps/server/
- Report type definition location and current fields

Agent 2: Find new session UI components
- grep -rn "new.*session\|create.*session" apps/ui/src/ --include="*.tsx"
- Find the dialog/modal for creating new sessions

Agent 3: Find session list component
- Locate component showing Active/Archived sessions
- Note current session item rendering

Agent 4: Find agent runner service
- grep -rn "AgentRunner\|sendMessage\|runAgent" apps/server/src/
- Find where messages are sent to Claude API

Agent 5: Find session storage mechanism
- How are sessions persisted? (file, db, memory?)
- Where is session CRUD implemented?
```

### Phase 2: Implementation (5 Agents)

```
Agent 6: Implement data model changes
- Add personaId, personaName, personaIcon to session type
- Update session creation to accept persona

Agent 7: Implement new session dialog changes
- Add persona selector using useBmadPersonas hook
- Pass personaId to session creation

Agent 8: Implement session list/header UI
- Show persona icon in session list
- Show persona badge in session header

Agent 9: Implement server-side persona application
- Resolve persona in message handler
- Prepend persona system prompt

Agent 10: Implement BMAD quick actions dropdown
- Add dropdown to Agent Runner header
- Wire up quick-start session creation
```

---

## Acceptance Criteria

- [ ] New session dialog has persona selector dropdown
- [ ] Personas grouped by category (Strategy, Implementation, Creative, etc.)
- [ ] Party Mode is prominently available as first option
- [ ] Selected persona persists on session object
- [ ] Session list shows persona icon when set
- [ ] Session header displays persona badge when active
- [ ] Agent responses use persona's system prompt and style
- [ ] Party Mode sessions show multi-agent formatted responses
- [ ] BMAD quick actions dropdown in Agent Runner header
- [ ] "Quick Start Agent" options for common personas
- [ ] Works for both BMAD-enabled and non-BMAD projects (graceful fallback)

---

## Test Scenarios

### Manual Testing

1. **Create session with persona:**
   - Click "+ New" in Agent Runner
   - Select "📋 John (Product Manager)" from persona dropdown
   - Create session
   - Verify session shows John's icon and name
   - Send message, verify response has PM-style communication

2. **Party Mode session:**
   - Use BMAD dropdown → "Start Party Mode Session"
   - Send a topic for discussion
   - Verify response includes multiple agents with different perspectives
   - Verify agents reference each other naturally

3. **Quick start agent:**
   - Click BMAD dropdown → "Winston (Architect)"
   - Verify session created immediately with Winston persona
   - Send architecture question, verify Winston's communication style

4. **Session persistence:**
   - Create session with persona
   - Close and reopen app
   - Verify session still shows persona
   - Continue conversation, verify persona still applied

### Automated Tests

```typescript
describe('Agent Runner BMAD Integration', () => {
  it('creates session with persona', async () => {
    const session = await agentService.createSession({
      projectPath: '/test',
      personaId: 'bmad:pm',
    });
    expect(session.personaId).toBe('bmad:pm');
    expect(session.personaName).toBe('John');
    expect(session.personaIcon).toBe('📋');
  });

  it('applies persona system prompt to messages', async () => {
    // ... test that persona prompt is prepended
  });

  it('handles party mode messages', async () => {
    // ... test multi-agent response format
  });
});
```

---

## Dependencies

- BMAD Initialize bug must be fixed first (path resolution issue)
- `useBmadPersonas` hook (already exists from feature dialog work)
- `bmad-persona-service.ts` (already exists)
- BMAD bundle with agent manifest (already exists)

---

## Rollout Plan

1. Fix BMAD Initialize path bug (BLOCKING)
2. Implement data model changes
3. Implement UI changes (dialog, list, header)
4. Implement server-side persona application
5. Implement Party Mode handler
6. Add BMAD quick actions dropdown
7. Testing and verification
8. Create PR

---

## Open Questions

1. Should persona selection be available for existing sessions (change persona mid-session)?
2. Should there be a visual indicator in the chat for which persona is responding?
3. For Party Mode, should each agent's response be a separate message bubble or combined?
4. Should we track which agents participated in Party Mode for analytics?
