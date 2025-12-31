/**
 * Hook for building a bounded file index for @ mention autocomplete
 *
 * Performs a BFS directory walk with guardrails to avoid performance issues:
 * - Skips common large directories (node_modules, .git, etc.)
 * - Has hard limits on directories visited and files indexed
 * - Caches results per project path
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getElectronAPI } from '@/lib/electron';

// Directories to skip during indexing
const SKIP_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.automaker',
  'dist',
  'build',
  '.next',
  '.nuxt',
  'coverage',
  '.cache',
  '__pycache__',
  '.venv',
  'venv',
  'vendor',
  '.idea',
  '.vscode',
]);

// File extensions to include (common code files)
const INCLUDE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.py',
  '.rb',
  '.go',
  '.rs',
  '.java',
  '.kt',
  '.c',
  '.cpp',
  '.h',
  '.hpp',
  '.cs',
  '.json',
  '.yaml',
  '.yml',
  '.toml',
  '.md',
  '.txt',
  '.html',
  '.css',
  '.scss',
  '.sql',
  '.graphql',
  '.prisma',
  '.sh',
  '.bash',
  '.zsh',
  '.env',
  '.env.example',
]);

// Hard limits
const MAX_DIRECTORIES = 500;
const MAX_FILES = 2000;
const INDEX_TIMEOUT_MS = 3000;

export interface FileIndexEntry {
  path: string; // Relative path from project root
  filename: string;
  extension: string;
}

interface UseFileIndexOptions {
  projectPath: string | null;
  enabled?: boolean;
}

interface UseFileIndexResult {
  files: FileIndexEntry[];
  isIndexing: boolean;
  error: string | null;
  search: (query: string, limit?: number) => FileIndexEntry[];
  refresh: () => void;
}

// Global cache to persist across component mounts
const indexCache = new Map<string, FileIndexEntry[]>();

export function useFileIndex({
  projectPath,
  enabled = true,
}: UseFileIndexOptions): UseFileIndexResult {
  const [files, setFiles] = useState<FileIndexEntry[]>([]);
  const [isIndexing, setIsIndexing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const buildIndex = useCallback(async () => {
    if (!projectPath || !enabled) return;

    // Check cache first
    const cached = indexCache.get(projectPath);
    if (cached) {
      setFiles(cached);
      return;
    }

    setIsIndexing(true);
    setError(null);
    abortRef.current = false;

    const api = getElectronAPI();
    const indexedFiles: FileIndexEntry[] = [];
    const visitedDirs = new Set<string>();
    const queue: string[] = [projectPath];
    const startTime = Date.now();

    try {
      while (queue.length > 0 && !abortRef.current) {
        // Check timeout
        if (Date.now() - startTime > INDEX_TIMEOUT_MS) {
          console.warn('[useFileIndex] Timeout reached, stopping index');
          break;
        }

        // Check limits
        if (visitedDirs.size >= MAX_DIRECTORIES || indexedFiles.length >= MAX_FILES) {
          break;
        }

        const currentDir = queue.shift()!;

        // Skip if already visited
        if (visitedDirs.has(currentDir)) continue;
        visitedDirs.add(currentDir);

        try {
          const result = await api.readdir?.(currentDir);
          if (!result?.success || !result.entries) continue;

          for (const entry of result.entries) {
            if (abortRef.current) break;

            const entryPath = `${currentDir}/${entry.name}`;
            const relativePath = entryPath.slice(projectPath.length + 1);

            if (entry.isDirectory) {
              // Skip excluded directories
              if (!SKIP_DIRECTORIES.has(entry.name)) {
                queue.push(entryPath);
              }
            } else {
              // Check file extension
              const ext = entry.name.includes('.')
                ? '.' + entry.name.split('.').pop()!.toLowerCase()
                : '';

              if (INCLUDE_EXTENSIONS.has(ext) || entry.name.startsWith('.env')) {
                indexedFiles.push({
                  path: relativePath,
                  filename: entry.name,
                  extension: ext,
                });
              }
            }
          }
        } catch (dirError) {
          // Silently skip directories we can't read
          console.debug(`[useFileIndex] Skipping ${currentDir}:`, dirError);
        }
      }

      // Cache and set results
      indexCache.set(projectPath, indexedFiles);
      setFiles(indexedFiles);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to index files';
      setError(message);
      console.error('[useFileIndex] Index failed:', err);
    } finally {
      setIsIndexing(false);
    }
  }, [projectPath, enabled]);

  // Build index on mount or when project changes
  useEffect(() => {
    buildIndex();

    return () => {
      abortRef.current = true;
    };
  }, [buildIndex]);

  // Search function for filtering files
  const search = useCallback(
    (query: string, limit = 20): FileIndexEntry[] => {
      if (!query) return files.slice(0, limit);

      const lowerQuery = query.toLowerCase();

      // Score-based matching: prefer filename matches over path matches
      const scored = files
        .map((file) => {
          const filenameLower = file.filename.toLowerCase();
          const pathLower = file.path.toLowerCase();

          let score = 0;
          if (filenameLower === lowerQuery)
            score = 100; // Exact filename match
          else if (filenameLower.startsWith(lowerQuery))
            score = 80; // Filename starts with
          else if (filenameLower.includes(lowerQuery))
            score = 60; // Filename contains
          else if (pathLower.includes(lowerQuery)) score = 40; // Path contains

          return { file, score };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ file }) => file);

      return scored;
    },
    [files]
  );

  // Manual refresh function
  const refresh = useCallback(() => {
    if (projectPath) {
      indexCache.delete(projectPath);
      buildIndex();
    }
  }, [projectPath, buildIndex]);

  return { files, isIndexing, error, search, refresh };
}
