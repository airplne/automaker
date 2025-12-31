/**
 * Utilities for parsing and manipulating @ file mentions in text
 *
 * A file mention is a project-relative path token like: @src/routes/index.js
 * Parsing rule: @ followed by non-whitespace up to the next whitespace
 */

/**
 * Extract all @file mentions from text
 *
 * @param text - The text to parse
 * @returns Array of file paths (without the @ prefix)
 *
 * @example
 * extractFileMentions('Check @src/index.ts and @lib/utils.ts')
 * // Returns: ['src/index.ts', 'lib/utils.ts']
 */
export function extractFileMentions(text: string): string[] {
  if (!text) return [];

  // Match @ followed by non-whitespace characters
  // Exclude mentions that are:
  // - Empty (@)
  // - Absolute paths (start with / or drive letter like C:\)
  // - Contain .. (path traversal)
  const mentionRegex = /@([^\s@]+)/g;
  const mentions: string[] = [];

  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    const path = match[1];

    // Skip invalid mentions
    if (!path) continue;
    if (path.startsWith('/')) continue; // Absolute Unix path
    if (/^[a-zA-Z]:/.test(path)) continue; // Absolute Windows path (C:\...)
    if (path.includes('..')) continue; // Path traversal attempt
    if (path.startsWith('.')) continue; // Hidden files/relative paths like ./

    // Deduplicate
    if (!mentions.includes(path)) {
      mentions.push(path);
    }
  }

  return mentions;
}

/**
 * Remove a specific @file mention from text
 *
 * @param text - The original text
 * @param mention - The file path to remove (without @)
 * @returns Text with the mention removed
 *
 * @example
 * removeFileMention('Check @src/index.ts now', 'src/index.ts')
 * // Returns: 'Check  now'
 */
export function removeFileMention(text: string, mention: string): string {
  if (!text || !mention) return text;

  // Escape special regex characters in the mention
  const escapedMention = mention.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Match the @mention, optionally followed by whitespace
  const regex = new RegExp(`@${escapedMention}\\s?`, 'g');

  return text.replace(regex, '').trim();
}

/**
 * Check if text contains any @file mentions
 *
 * @param text - The text to check
 * @returns True if text contains at least one valid @mention
 */
export function hasFileMentions(text: string): boolean {
  return extractFileMentions(text).length > 0;
}

/**
 * Get the current mention being typed (for autocomplete)
 * Returns the partial mention at the cursor position
 *
 * @param text - The full text
 * @param cursorPosition - Current cursor position in text
 * @returns The partial mention being typed, or null if not in a mention
 *
 * @example
 * getCurrentMention('Check @src/ind', 14)
 * // Returns: 'src/ind'
 */
export function getCurrentMention(text: string, cursorPosition: number): string | null {
  if (!text || cursorPosition < 0) return null;

  // Look backwards from cursor to find @
  const textBeforeCursor = text.slice(0, cursorPosition);
  const lastAtIndex = textBeforeCursor.lastIndexOf('@');

  if (lastAtIndex === -1) return null;

  // Check if there's whitespace between @ and cursor
  const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
  if (/\s/.test(textAfterAt)) return null;

  return textAfterAt || '';
}

/**
 * Replace a partial mention with a complete file path
 *
 * @param text - The original text
 * @param cursorPosition - Current cursor position
 * @param newPath - The complete file path to insert
 * @returns Object with new text and new cursor position
 */
export function replaceMention(
  text: string,
  cursorPosition: number,
  newPath: string
): { text: string; cursorPosition: number } {
  const textBeforeCursor = text.slice(0, cursorPosition);
  const textAfterCursor = text.slice(cursorPosition);

  const lastAtIndex = textBeforeCursor.lastIndexOf('@');
  if (lastAtIndex === -1) {
    return { text, cursorPosition };
  }

  const beforeMention = text.slice(0, lastAtIndex);
  const newText = `${beforeMention}@${newPath} ${textAfterCursor}`;
  const newCursorPos = lastAtIndex + 1 + newPath.length + 1; // After @path and space

  return { text: newText, cursorPosition: newCursorPos };
}
