/**
 * envguard - Fast Codebase Environment Scanner
 * Agnet Software Corp.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { CodeEnvReference } from './types.js';

const DEFAULT_EXTENSIONS = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.jsx',
  '.ts',
  '.mts',
  '.cts',
  '.tsx',
  '.vue',
  '.svelte'
]);

const DEFAULT_IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'out',
  '.git',
  '.next',
  '.nuxt',
  '.turbo',
  'coverage',
  '.cache',
  '.output'
]);

// Regular expressions to capture environment variables:
// 1. process.env.VAR_NAME or process.env['VAR_NAME'] / process.env["VAR_NAME"]
const PROCESS_ENV_REGEX = /\bprocess\.env(?:\.([a-zA-Z_][a-zA-Z0-9_]*)|\[['"`]([a-zA-Z_][a-zA-Z0-9_]*)['"`]\])/g;

// 2. import.meta.env.VAR_NAME or import.meta.env['VAR_NAME'] / import.meta.env["VAR_NAME"]
const IMPORT_META_ENV_REGEX = /\bimport\.meta\.env(?:\.([a-zA-Z_][a-zA-Z0-9_]*)|\[['"`]([a-zA-Z_][a-zA-Z0-9_]*)['"`]\])/g;

export interface ScanCodeOptions {
  cwd?: string;
  codePaths?: string[];
  extensions?: string[];
  ignorePaths?: string[];
}

export function scanSourceFile(filePath: string, content: string): CodeEnvReference[] {
  const references: CodeEnvReference[] = [];
  const lines = content.split(/\r?\n/);

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx]!;
    const lineNum = lineIdx + 1;

    // Fast preliminary bail-out if line contains neither keyword
    if (!line.includes('process.env') && !line.includes('import.meta.env')) {
      continue;
    }

    // Check process.env
    PROCESS_ENV_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = PROCESS_ENV_REGEX.exec(line)) !== null) {
      const key = match[1] || match[2];
      if (key) {
        references.push({
          key,
          source: 'process',
          filePath,
          line: lineNum,
          column: match.index + 1,
          raw: match[0]
        });
      }
    }

    // Check import.meta.env
    IMPORT_META_ENV_REGEX.lastIndex = 0;
    while ((match = IMPORT_META_ENV_REGEX.exec(line)) !== null) {
      const key = match[1] || match[2];
      if (key) {
        references.push({
          key,
          source: 'import.meta',
          filePath,
          line: lineNum,
          column: match.index + 1,
          raw: match[0]
        });
      }
    }
  }

  return references;
}

export function findFilesToScan(
  dir: string,
  options: {
    extensions?: Set<string>;
    ignoredDirs?: Set<string>;
  } = {}
): string[] {
  const extensions = options.extensions || DEFAULT_EXTENSIONS;
  const ignoredDirs = options.ignoredDirs || DEFAULT_IGNORED_DIRS;
  const matchedFiles: string[] = [];

  function walk(currentDir: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const name = entry.name;
      if (ignoredDirs.has(name) || name.startsWith('.')) {
        continue;
      }

      const fullPath = path.join(currentDir, name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(name).toLowerCase();
        if (extensions.has(ext)) {
          matchedFiles.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return matchedFiles;
}

export function scanCodebase(options: ScanCodeOptions = {}): {
  references: CodeEnvReference[];
  scannedFiles: string[];
} {
  const cwd = options.cwd || process.cwd();
  const searchRoots = options.codePaths && options.codePaths.length > 0
    ? options.codePaths.map((p) => path.resolve(cwd, p))
    : [cwd];

  const extensions = options.extensions
    ? new Set(options.extensions.map((e) => (e.startsWith('.') ? e.toLowerCase() : `.${e.toLowerCase()}`)))
    : DEFAULT_EXTENSIONS;

  const ignoredDirs = options.ignorePaths
    ? new Set([...DEFAULT_IGNORED_DIRS, ...options.ignorePaths])
    : DEFAULT_IGNORED_DIRS;

  const allFiles: string[] = [];
  for (const root of searchRoots) {
    if (fs.existsSync(root)) {
      const stat = fs.statSync(root);
      if (stat.isDirectory()) {
        allFiles.push(...findFilesToScan(root, { extensions, ignoredDirs }));
      } else if (stat.isFile()) {
        const ext = path.extname(root).toLowerCase();
        if (extensions.has(ext)) {
          allFiles.push(root);
        }
      }
    }
  }

  // De-duplicate file paths
  const uniqueFiles = Array.from(new Set(allFiles));
  const allReferences: CodeEnvReference[] = [];

  for (const file of uniqueFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const refs = scanSourceFile(file, content);
      allReferences.push(...refs);
    } catch {
      // Continue on unreadable files
    }
  }

  return {
    references: allReferences,
    scannedFiles: uniqueFiles
  };
}
