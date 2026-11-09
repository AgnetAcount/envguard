/**
 * envguard - Environment Audit & Reconciliation Engine
 * Agnet Software Corp.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseEnvContent } from './parser.js';
import { scanCodebase } from './scanner.js';
import { analyzeSecret } from './entropy.js';
import type {
  AuditOptions,
  AuditResult,
  AuditIssue,
  EnvEntry,
  SecretDetection
} from './types.js';

export function runAudit(options: AuditOptions = {}): AuditResult {
  const startTime = Date.now();
  const cwd = options.cwd || process.cwd();

  const envFilePath = options.envFile
    ? path.resolve(cwd, options.envFile)
    : path.resolve(cwd, '.env');

  const exampleFilePath = options.exampleFile
    ? path.resolve(cwd, options.exampleFile)
    : path.resolve(cwd, '.env.example');

  // 1. Read and parse .env if exists
  let envVars: Record<string, EnvEntry> = {};
  if (fs.existsSync(envFilePath)) {
    try {
      const content = fs.readFileSync(envFilePath, 'utf-8');
      envVars = parseEnvContent(content);
    } catch (err: unknown) {
      // Handled in issues
    }
  }

  // 2. Read and parse .env.example if exists
  let exampleVars: Record<string, EnvEntry> = {};
  const hasExampleFile = fs.existsSync(exampleFilePath);
  if (hasExampleFile) {
    try {
      const content = fs.readFileSync(exampleFilePath, 'utf-8');
      exampleVars = parseEnvContent(content);
    } catch (err: unknown) {
      // Handled in issues
    }
  }

  // 3. Scan codebase for environment variable usages
  const scanResult = scanCodebase({
    cwd,
    codePaths: options.codePaths,
    extensions: options.extensions,
    ignorePaths: options.ignorePaths
  });

  const codeReferences = scanResult.references;
  const uniqueCodeVarKeys = new Set(codeReferences.map((r) => r.key));

  const issues: AuditIssue[] = [];
  const detectedSecrets: SecretDetection[] = [];

  // Rule 1: Check secrets in .env.example (CRITICAL SECURITY CHECK)
  // An example file committed to repo must NEVER contain high entropy or real credentials
  if (hasExampleFile) {
    for (const [key, entry] of Object.entries(exampleVars)) {
      if (entry.value) {
        const sec = analyzeSecret(key, entry.value, options.entropyThreshold);
        if (sec.isLikelySecret) {
          detectedSecrets.push(sec);
          issues.push({
            type: sec.patternMatch ? 'KNOWN_SECRET_PATTERN' : 'HIGH_ENTROPY_SECRET',
            severity: 'error',
            variable: key,
            message: `Potential credential leaked in example file: ${sec.reason || 'High entropy value'}`,
            file: exampleFilePath,
            line: entry.line,
            snippet: entry.raw,
            suggestion: `Replace with placeholder e.g. '${key}=your_${key.toLowerCase()}_here'`
          });
        }
      }
    }
  }

  // Rule 2: Code variables missing in .env
  const hasEnvFile = fs.existsSync(envFilePath);
  if (hasEnvFile) {
    for (const codeKey of uniqueCodeVarKeys) {
      // Standard Node runtime vars that are usually system-provided
      if (['NODE_ENV', 'PORT', 'TZ'].includes(codeKey)) {
        continue;
      }

      if (!(codeKey in envVars)) {
        const firstRef = codeReferences.find((r) => r.key === codeKey);
        issues.push({
          type: 'MISSING_IN_ENV',
          severity: 'error',
          variable: codeKey,
          message: `Variable '${codeKey}' is used in application code but missing from ${path.basename(envFilePath)}`,
          file: firstRef?.filePath,
          line: firstRef?.line,
          column: firstRef?.column,
          snippet: firstRef?.raw,
          suggestion: `Add '${codeKey}=' to ${path.basename(envFilePath)}`
        });
      }
    }
  }

  // Rule 3: Variables missing in .env.example
  if (hasExampleFile) {
    const allKnownKeys = new Set([...Object.keys(envVars), ...uniqueCodeVarKeys]);
    for (const key of allKnownKeys) {
      if (['NODE_ENV'].includes(key)) continue;

      if (!(key in exampleVars)) {
        issues.push({
          type: 'MISSING_IN_EXAMPLE',
          severity: 'warning',
          variable: key,
          message: `Variable '${key}' is missing from ${path.basename(exampleFilePath)}`,
          file: exampleFilePath,
          suggestion: `Add '${key}=your_${key.toLowerCase()}_here' to ${path.basename(exampleFilePath)}`
        });
      }
    }
  }

  // Rule 4: Unused variables (declared in .env but nowhere in code)
  if (hasEnvFile && scanResult.scannedFiles.length > 0) {
    for (const envKey of Object.keys(envVars)) {
      if (['NODE_ENV', 'PORT', 'HOST', 'DEBUG'].includes(envKey)) continue;

      if (!uniqueCodeVarKeys.has(envKey)) {
        const entry = envVars[envKey]!;
        issues.push({
          type: 'UNUSED_IN_CODE',
          severity: 'info',
          variable: envKey,
          message: `Variable '${envKey}' is defined in ${path.basename(envFilePath)} but never referenced in code`,
          file: envFilePath,
          line: entry.line,
          snippet: entry.raw,
          suggestion: `Remove '${envKey}' if obsolete, or verify references`
        });
      }
    }
  }

  const durationMs = Date.now() - startTime;
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  const valid = options.failOnWarnings
    ? errorCount === 0 && warningCount === 0
    : errorCount === 0;

  return {
    summary: {
      valid,
      errorCount,
      warningCount,
      infoCount,
      totalEnvVars: Object.keys(envVars).length,
      totalExampleVars: Object.keys(exampleVars).length,
      totalCodeReferences: codeReferences.length,
      uniqueVarsInCode: uniqueCodeVarKeys.size,
      scannedFilesCount: scanResult.scannedFiles.length,
      durationMs
    },
    issues,
    envVars,
    exampleVars,
    codeReferences,
    secrets: detectedSecrets
  };
}
