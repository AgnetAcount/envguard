/**
 * envguard - Core Type Definitions
 * Agnet Software Corp.
 */

export type VariableSource = 'process' | 'import.meta';

export type IssueSeverity = 'error' | 'warning' | 'info';

export type IssueType =
  | 'MISSING_IN_ENV'
  | 'MISSING_IN_EXAMPLE'
  | 'UNUSED_IN_CODE'
  | 'HIGH_ENTROPY_SECRET'
  | 'KNOWN_SECRET_PATTERN'
  | 'EMPTY_VALUE'
  | 'SYNTAX_ERROR';

export interface EnvEntry {
  key: string;
  value: string;
  raw: string;
  line: number;
  hasQuotes: boolean;
  isExported: boolean;
  comment?: string;
}

export interface CodeEnvReference {
  key: string;
  source: VariableSource;
  filePath: string;
  line: number;
  column: number;
  raw: string;
}

export interface SecretDetection {
  key: string;
  value: string;
  entropy: number;
  isLikelySecret: boolean;
  patternMatch?: string;
  reason?: string;
}

export interface AuditIssue {
  type: IssueType;
  severity: IssueSeverity;
  variable: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  snippet?: string;
  suggestion?: string;
}

export interface AuditSummary {
  valid: boolean;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  totalEnvVars: number;
  totalExampleVars: number;
  totalCodeReferences: number;
  uniqueVarsInCode: number;
  scannedFilesCount: number;
  durationMs: number;
}

export interface AuditResult {
  summary: AuditSummary;
  issues: AuditIssue[];
  envVars: Record<string, EnvEntry>;
  exampleVars: Record<string, EnvEntry>;
  codeReferences: CodeEnvReference[];
  secrets: SecretDetection[];
}

export interface AuditOptions {
  cwd?: string;
  envFile?: string;
  exampleFile?: string;
  codePaths?: string[];
  extensions?: string[];
  ignorePaths?: string[];
  entropyThreshold?: number;
  strict?: boolean;
  failOnWarnings?: boolean;
}

export interface TypegenOptions {
  source?: 'env' | 'example' | 'code' | 'merged';
  envFile?: string;
  exampleFile?: string;
  codePaths?: string[];
  outputPath?: string;
  cwd?: string;
  includeVite?: boolean;
}
