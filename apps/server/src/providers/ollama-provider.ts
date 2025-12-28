/**
 * Ollama Provider - Executes queries against a local Ollama server
 *
 * Implements a lightweight tool loop so local models can:
 * - Read/Write/Edit files (via secureFs)
 * - Search the repo (Glob/Grep)
 * - Run commands (Bash)
 *
 * Tool calling is done via an explicit <tool_call>{...}</tool_call> protocol to
 * remain compatible across Ollama-hosted models.
 */

import path from 'path';
import { BaseProvider } from './base-provider.js';
import type {
  ExecuteOptions,
  ProviderMessage,
  InstallationStatus,
  ModelDefinition,
} from './types.js';
import * as secureFs from '../lib/secure-fs.js';
import { extractTextFromContent } from '@automaker/utils';
import { spawnProcess } from '@automaker/platform';

type OllamaRole = 'system' | 'user' | 'assistant';

type OllamaMessage = {
  role: OllamaRole;
  content: string;
  images?: string[];
};

type ToolCall = {
  name: string;
  input: unknown;
};

type ToolResult = {
  ok: boolean;
  output: string;
};

const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';

function normalizeBaseUrl(raw?: string): string {
  const value = (raw || '').trim();
  if (!value) return DEFAULT_OLLAMA_BASE_URL;
  const withProtocol =
    value.startsWith('http://') || value.startsWith('https://') ? value : `http://${value}`;
  return withProtocol.replace(/\/+$/, '');
}

function getOllamaBaseUrl(): string {
  return normalizeBaseUrl(process.env.AUTOMAKER_OLLAMA_BASE_URL || process.env.OLLAMA_HOST);
}

function stripOllamaPrefix(model: string): string {
  const trimmed = model.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('ollama:')) return trimmed.slice('ollama:'.length).trim();
  if (lower.startsWith('ollama-')) return trimmed.slice('ollama-'.length).trim();
  return trimmed;
}

function buildToolInstructions(allowedTools: string[]): string {
  const toolList = allowedTools.length > 0 ? allowedTools.join(', ') : '(no tools allowed)';

  return [
    '## Tool Use',
    `Allowed tools: ${toolList}`,
    '',
    'To call a tool, output one or more blocks using EXACTLY this format:',
    '<tool_call>{"name":"Read","input":{"path":"package.json"}}</tool_call>',
    '',
    'Rules:',
    '- The JSON inside <tool_call> must be valid JSON (double quotes, no trailing commas).',
    '- Use only allowed tools and only the documented inputs below.',
    '- You may output multiple <tool_call> blocks in one message.',
    '- After tool results are returned in <tool_result> blocks, continue the task.',
    "- Never invent tool results; if you didn't receive a <tool_result>, you don't know it.",
    '',
    'Tool inputs:',
    '- Read:   {"path": string}',
    '- Write:  {"path": string, "content": string}',
    '- Edit:   {"path": string, "edits": [{"oldText": string, "newText": string, "replaceAll"?: boolean}] }',
    '- Glob:   {"pattern": string}',
    '- Grep:   {"pattern": string, "path"?: string}',
    '- Bash:   {"command": string, "timeoutMs"?: number}',
  ].join('\n');
}

function parseToolCalls(text: string): { toolCalls: ToolCall[]; remainingText: string } {
  const toolCalls: ToolCall[] = [];
  let remaining = text;

  const regex = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const rawJson = match[1]?.trim();
    if (!rawJson) continue;
    try {
      const parsed = JSON.parse(rawJson) as { name?: unknown; input?: unknown };
      if (typeof parsed?.name === 'string') {
        toolCalls.push({ name: parsed.name, input: parsed.input });
      }
    } catch {
      // Ignore malformed tool call blocks; model will see an error via tool_result below if needed.
    }
  }

  remaining = remaining.replace(regex, '').trim();
  return { toolCalls, remainingText: remaining };
}

function truncateForContext(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[TRUNCATED: ${text.length - maxChars} chars omitted]`;
}

function escapeRegexLiteral(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function globToRegExp(pattern: string): RegExp {
  const normalized = pattern.replace(/\\/g, '/');
  let re = '^';

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (ch === '*') {
      if (normalized[i + 1] === '*') {
        // ** => match anything, including '/'
        while (normalized[i + 1] === '*') i++;
        re += '.*';
      } else {
        // * => match anything except '/'
        re += '[^/]*';
      }
      continue;
    }
    if (ch === '?') {
      re += '[^/]';
      continue;
    }
    re += escapeRegexLiteral(ch);
  }

  re += '$';
  return new RegExp(re);
}

async function runBashCommand(
  command: string,
  cwd: string,
  abortController?: AbortController,
  timeoutMs: number = 120_000
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  const localAbort = new AbortController();

  const abort = () => localAbort.abort();
  if (abortController) {
    if (abortController.signal.aborted) abort();
    abortController.signal.addEventListener('abort', abort, { once: true });
  }

  const timeout = setTimeout(() => {
    localAbort.abort();
  }, timeoutMs);

  try {
    const result = await spawnProcess({
      command: 'bash',
      args: ['-lc', command],
      cwd,
      abortController: localAbort,
    });

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
    };
  } finally {
    clearTimeout(timeout);
    if (abortController) {
      abortController.signal.removeEventListener('abort', abort);
    }
  }
}

async function executeToolCall(
  toolCall: ToolCall,
  {
    cwd,
    allowedTools,
    abortController,
  }: { cwd: string; allowedTools: Set<string>; abortController?: AbortController }
): Promise<ToolResult> {
  const name = toolCall.name;
  if (!allowedTools.has(name)) {
    return { ok: false, output: `Tool "${name}" is not allowed in this context.` };
  }

  try {
    switch (name) {
      case 'Read': {
        const { path: inputPath } = toolCall.input as { path?: unknown };
        if (typeof inputPath !== 'string' || !inputPath.trim()) {
          return { ok: false, output: 'Read tool requires {"path": string}' };
        }
        const resolvedPath = path.isAbsolute(inputPath) ? inputPath : path.join(cwd, inputPath);
        const content = (await secureFs.readFile(resolvedPath, 'utf-8')) as string;
        return { ok: true, output: content };
      }

      case 'Write': {
        const { path: inputPath, content } = toolCall.input as {
          path?: unknown;
          content?: unknown;
        };
        if (typeof inputPath !== 'string' || !inputPath.trim() || typeof content !== 'string') {
          return { ok: false, output: 'Write tool requires {"path": string, "content": string}' };
        }
        const resolvedPath = path.isAbsolute(inputPath) ? inputPath : path.join(cwd, inputPath);
        await secureFs.mkdir(path.dirname(resolvedPath), { recursive: true });
        await secureFs.writeFile(resolvedPath, content, 'utf-8');
        return { ok: true, output: `Wrote ${content.length} chars to ${inputPath}` };
      }

      case 'Edit': {
        const { path: inputPath, edits } = toolCall.input as { path?: unknown; edits?: unknown };
        if (typeof inputPath !== 'string' || !inputPath.trim() || !Array.isArray(edits)) {
          return {
            ok: false,
            output:
              'Edit tool requires {"path": string, "edits": [{"oldText": string, "newText": string, "replaceAll"?: boolean}] }',
          };
        }

        const resolvedPath = path.isAbsolute(inputPath) ? inputPath : path.join(cwd, inputPath);
        const original = (await secureFs.readFile(resolvedPath, 'utf-8')) as string;
        let updated = original;

        for (const edit of edits) {
          const { oldText, newText, replaceAll } = edit as {
            oldText?: unknown;
            newText?: unknown;
            replaceAll?: unknown;
          };
          if (typeof oldText !== 'string' || typeof newText !== 'string') {
            return { ok: false, output: 'Each edit must include "oldText" and "newText" strings.' };
          }
          if (!updated.includes(oldText)) {
            return { ok: false, output: `Edit failed: could not find oldText in ${inputPath}` };
          }

          if (replaceAll === true) {
            updated = updated.split(oldText).join(newText);
          } else {
            updated = updated.replace(oldText, newText);
          }
        }

        if (updated !== original) {
          await secureFs.writeFile(resolvedPath, updated, 'utf-8');
        }

        return { ok: true, output: `Edited ${inputPath}` };
      }

      case 'Glob': {
        const { pattern } = toolCall.input as { pattern?: unknown };
        if (typeof pattern !== 'string' || !pattern.trim()) {
          return { ok: false, output: 'Glob tool requires {"pattern": string}' };
        }

        // Prefer git-tracked files to avoid huge scans; include untracked (exclude-standard).
        const { stdout, stderr, exitCode } = await runBashCommand(
          `git ls-files --cached --others --exclude-standard`,
          cwd,
          abortController,
          30_000
        );

        if (exitCode !== 0) {
          return { ok: false, output: stderr || `git ls-files exited with code ${exitCode}` };
        }

        const files = stdout
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

        // Very small glob matcher supporting **, *, ?
        const re = globToRegExp(pattern.trim());
        const matches = files.filter((f) => re.test(f));

        const limited = matches.slice(0, 2000);
        const suffix =
          matches.length > limited.length
            ? `\n[TRUNCATED: ${matches.length - limited.length} more]`
            : '';
        return { ok: true, output: `${limited.join('\n')}${suffix}` };
      }

      case 'Grep': {
        const { pattern, path: searchPath } = toolCall.input as {
          pattern?: unknown;
          path?: unknown;
        };
        if (typeof pattern !== 'string' || !pattern.trim()) {
          return { ok: false, output: 'Grep tool requires {"pattern": string, "path"?: string}' };
        }

        const args = [
          '--color=never',
          '--no-heading',
          '--line-number',
          '--column',
          '--hidden',
          '--glob',
          '!**/node_modules/**',
          '--glob',
          '!**/.git/**',
          pattern,
        ];

        if (typeof searchPath === 'string' && searchPath.trim()) {
          args.push(searchPath.trim());
        }

        const localAbort = new AbortController();
        const abort = () => localAbort.abort();
        if (abortController) {
          if (abortController.signal.aborted) abort();
          abortController.signal.addEventListener('abort', abort, { once: true });
        }

        try {
          const result = await spawnProcess({
            command: 'rg',
            args,
            cwd,
            abortController: localAbort,
          });

          // rg exit code 1 means "no matches" - treat as success with empty output.
          if (result.exitCode === 1) {
            return { ok: true, output: '' };
          }
          if (result.exitCode !== 0) {
            return { ok: false, output: result.stderr || `rg exited with code ${result.exitCode}` };
          }

          return { ok: true, output: truncateForContext(result.stdout, 200_000) };
        } finally {
          if (abortController) {
            abortController.signal.removeEventListener('abort', abort);
          }
        }
      }

      case 'Bash': {
        const { command, timeoutMs } = toolCall.input as { command?: unknown; timeoutMs?: unknown };
        if (typeof command !== 'string' || !command.trim()) {
          return {
            ok: false,
            output: 'Bash tool requires {"command": string, "timeoutMs"?: number}',
          };
        }
        const timeout =
          typeof timeoutMs === 'number' && Number.isFinite(timeoutMs) && timeoutMs > 0
            ? timeoutMs
            : 120_000;

        const result = await runBashCommand(command, cwd, abortController, timeout);
        const output = [
          result.stdout ? `STDOUT:\n${result.stdout}` : '',
          result.stderr ? `STDERR:\n${result.stderr}` : '',
          `EXIT_CODE: ${result.exitCode}`,
        ]
          .filter(Boolean)
          .join('\n\n');

        return { ok: true, output: truncateForContext(output, 200_000) };
      }

      default:
        return { ok: false, output: `Unknown tool "${name}"` };
    }
  } catch (error) {
    return { ok: false, output: (error as Error).message };
  }
}

async function ollamaChat(
  baseUrl: string,
  {
    model,
    messages,
    abortController,
  }: { model: string; messages: OllamaMessage[]; abortController?: AbortController }
): Promise<{ content: string }> {
  const url = `${baseUrl}/api/chat`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages,
    }),
    signal: abortController?.signal,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Ollama chat failed (${resp.status}): ${text || resp.statusText}`);
  }

  const data = (await resp.json()) as { message?: { content?: unknown } };
  const content = typeof data?.message?.content === 'string' ? data.message.content : '';
  return { content };
}

export class OllamaProvider extends BaseProvider {
  getName(): string {
    return 'ollama';
  }

  /**
   * Execute a query using the Ollama HTTP API with a basic tool loop.
   */
  async *executeQuery(options: ExecuteOptions): AsyncGenerator<ProviderMessage> {
    const {
      prompt,
      model,
      cwd,
      systemPrompt,
      maxTurns = 20,
      allowedTools = [],
      abortController,
      conversationHistory,
    } = options;

    const baseUrl = getOllamaBaseUrl();
    const ollamaModel = stripOllamaPrefix(model);
    if (!ollamaModel) {
      throw new Error(
        `Invalid Ollama model "${model}" (expected "ollama:<model>" or "ollama-<model>")`
      );
    }

    const toolInstructions = buildToolInstructions(allowedTools);
    const systemText =
      typeof systemPrompt === 'string'
        ? `${systemPrompt}\n\n---\n\n${toolInstructions}`
        : `${toolInstructions}`;

    const messages: OllamaMessage[] = [{ role: 'system', content: systemText }];

    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        const content =
          typeof msg.content === 'string' ? msg.content : extractTextFromContent(msg.content);
        messages.push({ role: msg.role, content });
      }
    }

    const userText = typeof prompt === 'string' ? prompt : extractTextFromContent(prompt);

    const images = Array.isArray(prompt)
      ? prompt
          .filter((b) => b.type === 'image' && typeof b.source === 'object' && b.source)
          // Claude-format blocks: { source: { type: 'base64', data: string } }
          .map((b) => (b.source as any)?.data)
          .filter((d) => typeof d === 'string' && d.length > 0)
      : [];

    messages.push({
      role: 'user',
      content: userText,
      ...(images.length > 0 ? { images } : {}),
    });

    const allowedToolSet = new Set(allowedTools);
    let finalText = '';

    for (let turn = 0; turn < maxTurns; turn++) {
      if (abortController?.signal.aborted) {
        throw new Error('Aborted');
      }

      const { content } = await ollamaChat(baseUrl, {
        model: ollamaModel,
        messages,
        abortController,
      });

      const { toolCalls, remainingText } = parseToolCalls(content);

      if (remainingText) {
        yield {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: remainingText }],
          },
          parent_tool_use_id: null,
        };
        finalText += (finalText ? '\n' : '') + remainingText;
      }

      if (toolCalls.length === 0) {
        // No tool calls => final answer for this query.
        yield { type: 'result', subtype: 'success', result: finalText || remainingText || content };
        return;
      }

      // Append assistant content (without tool calls) to conversation.
      messages.push({ role: 'assistant', content: remainingText || '' });

      // Execute tool calls sequentially and feed results back.
      for (const toolCall of toolCalls) {
        yield {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                name: toolCall.name,
                input: toolCall.input,
              },
            ],
          },
          parent_tool_use_id: null,
        };

        const result = await executeToolCall(toolCall, {
          cwd,
          allowedTools: allowedToolSet,
          abortController,
        });

        const resultPayload = truncateForContext(result.output, 120_000);
        messages.push({
          role: 'user',
          content: `<tool_result>${JSON.stringify({
            name: toolCall.name,
            ok: result.ok,
            output: resultPayload,
          })}</tool_result>`,
        });
      }

      // Keep the prompt window from exploding on small-context models.
      const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
      if (totalChars > 800_000 && messages.length > 12) {
        // Keep system + last ~10 messages
        const system = messages[0];
        const tail = messages.slice(-10);
        messages.length = 0;
        messages.push(system, ...tail);
      }
    }

    yield {
      type: 'result',
      subtype: 'error',
      error: `Ollama provider hit maxTurns (${maxTurns}) without producing a final answer.`,
    };
  }

  async detectInstallation(): Promise<InstallationStatus> {
    const baseUrl = getOllamaBaseUrl();
    try {
      const timeoutMs = 1500;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      let resp: Response;
      try {
        resp = await fetch(`${baseUrl}/api/version`, { method: 'GET', signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }

      if (!resp.ok) {
        return {
          installed: false,
          method: 'sdk',
          error: `Ollama server not reachable at ${baseUrl} (HTTP ${resp.status})`,
        };
      }
      const data = (await resp.json()) as { version?: string };
      return {
        installed: true,
        method: 'sdk',
        version: data?.version,
        authenticated: true,
        hasApiKey: false,
      };
    } catch (error) {
      return {
        installed: false,
        method: 'sdk',
        error: `Ollama server not reachable at ${baseUrl}: ${(error as Error).message}`,
      };
    }
  }

  getAvailableModels(): ModelDefinition[] {
    // NOTE: Ollama model availability is instance-specific; this list is a small set of common defaults.
    return [
      {
        id: 'ollama:llama3.2',
        name: 'Ollama Llama 3.2 (local)',
        modelString: 'ollama:llama3.2',
        provider: 'ollama',
        description: 'Local Ollama model (configure actual tags locally)',
        supportsVision: false,
        supportsTools: true,
        tier: 'basic',
      },
      {
        id: 'ollama:qwen2.5-coder:14b',
        name: 'Ollama Qwen 2.5 Coder 14B (local)',
        modelString: 'ollama:qwen2.5-coder:14b',
        provider: 'ollama',
        description: 'Strong local coding model (if installed in Ollama)',
        supportsVision: false,
        supportsTools: true,
        tier: 'standard',
      },
    ];
  }

  supportsFeature(feature: string): boolean {
    const supportedFeatures = ['tools', 'text'];
    return supportedFeatures.includes(feature);
  }
}
