/**
 * Shared utilities for "Enhance with AI" feature
 *
 * Builds enhancement input with attached text files and @-referenced file context
 */

import type { FeatureTextFilePath } from '@/store/app-store';
import { extractFileMentions } from './file-mentions';

// Limits for context inclusion
const MAX_LINES_PER_FILE = 200;
const MAX_CHARS_PER_FILE = 12000;

/**
 * Truncate content to limits
 */
function truncateContent(content: string, maxLines: number, maxChars: number): string {
  if (!content) return '';

  // First truncate by character count
  let truncated = content.slice(0, maxChars);

  // Then truncate by line count
  const lines = truncated.split('\n');
  if (lines.length > maxLines) {
    truncated = lines.slice(0, maxLines).join('\n') + '\n... (truncated)';
  } else if (content.length > maxChars) {
    truncated += '\n... (truncated)';
  }

  return truncated;
}

/**
 * Format attached text files as context
 */
function formatAttachedTextFiles(textFiles: FeatureTextFilePath[]): string {
  if (!textFiles || textFiles.length === 0) return '';

  const sections: string[] = [];

  for (const file of textFiles) {
    if (!file.content || file.content.trim().length === 0) continue;

    const truncatedContent = truncateContent(file.content, MAX_LINES_PER_FILE, MAX_CHARS_PER_FILE);
    sections.push(`--- ${file.filename} ---\n${truncatedContent}`);
  }

  if (sections.length === 0) return '';

  return `Context (attached text files):\n${sections.join('\n\n')}\n\n---\n`;
}

/**
 * Format @-referenced files as context
 */
function formatReferencedFiles(references: Array<{ path: string; content: string }>): string {
  if (!references || references.length === 0) return '';

  const sections: string[] = [];

  for (const ref of references) {
    if (!ref.content || ref.content.trim().length === 0) continue;

    const truncatedContent = truncateContent(ref.content, MAX_LINES_PER_FILE, MAX_CHARS_PER_FILE);
    sections.push(`--- @${ref.path} ---\n${truncatedContent}`);
  }

  if (sections.length === 0) return '';

  return `Context (referenced files):\n${sections.join('\n\n')}\n\n---\n`;
}

export interface BuildEnhanceInputOptions {
  /** The user's description text */
  description: string;
  /** Attached text files from the dropzone */
  attachedTextFiles?: FeatureTextFilePath[];
  /** Referenced files from @ mentions (already loaded) */
  referencedFiles?: Array<{ path: string; content: string }>;
}

export interface EnhanceInput {
  /** The full text to send to the enhancement API */
  originalText: string;
  /** Number of attached text files included */
  attachedFileCount: number;
  /** Number of @ referenced files included */
  referencedFileCount: number;
}

/**
 * Build the enhancement input text with all context
 *
 * @param options - The input options
 * @returns The formatted input for the enhance API
 *
 * @example
 * const input = buildEnhanceInput({
 *   description: 'Add dark mode @src/theme.ts',
 *   attachedTextFiles: [{ filename: 'notes.md', content: '...' }],
 *   referencedFiles: [{ path: 'src/theme.ts', content: '...' }],
 * });
 * // input.originalText includes all context formatted appropriately
 */
export function buildEnhanceInput(options: BuildEnhanceInputOptions): EnhanceInput {
  const { description, attachedTextFiles = [], referencedFiles = [] } = options;

  const parts: string[] = [];

  // Add attached text files context
  const attachedContext = formatAttachedTextFiles(attachedTextFiles);
  if (attachedContext) {
    parts.push(attachedContext);
  }

  // Add referenced files context
  const referencedContext = formatReferencedFiles(referencedFiles);
  if (referencedContext) {
    parts.push(referencedContext);
  }

  // Add the user's description
  if (parts.length > 0) {
    parts.push('User request:\n' + description);
  } else {
    parts.push(description);
  }

  return {
    originalText: parts.join('\n'),
    attachedFileCount: attachedTextFiles.filter((f) => f.content?.trim()).length,
    referencedFileCount: referencedFiles.filter((f) => f.content?.trim()).length,
  };
}

/**
 * Load content for @-mentioned files
 *
 * @param description - Text containing @ mentions
 * @param projectPath - Project root path
 * @param readFile - Function to read file content
 * @returns Array of referenced files with their content
 */
export async function loadReferencedFiles(
  description: string,
  projectPath: string,
  readFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>
): Promise<Array<{ path: string; content: string }>> {
  const mentions = extractFileMentions(description);
  if (mentions.length === 0) return [];

  const results: Array<{ path: string; content: string }> = [];

  for (const mention of mentions) {
    try {
      const absolutePath = `${projectPath}/${mention}`;
      const result = await readFile(absolutePath);

      if (result.success && result.content) {
        results.push({
          path: mention,
          content: result.content,
        });
      }
    } catch (err) {
      // Skip files we can't read
      console.debug(`[enhance-with-ai] Could not read @${mention}:`, err);
    }
  }

  return results;
}
