/**
 * envguard - Public Programmatic API
 * Agnet Software Corp.
 */

export * from './types.js';
export { parseEnvContent, formatEnvEntries } from './parser.js';
export {
  calculateShannonEntropy,
  analyzeSecret,
  isSafePlaceholderOrUrl,
  KNOWN_SECRET_PATTERNS,
  SAFE_PLACEHOLDERS
} from './entropy.js';
export { scanCodebase, scanSourceFile } from './scanner.js';
export { runAudit } from './validator.js';
export { runTypegen, generateTypeScriptDeclarations } from './typegen.js';
export {
  formatTerminalReport,
  formatGitHubActionsAnnotations,
  formatJsonReport
} from './reporter.js';
