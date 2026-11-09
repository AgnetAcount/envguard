/**
 * envguard - Terminal & CI/CD Reporters
 * Agnet Software Corp.
 */

import type { AuditResult, AuditIssue } from './types.js';

// Minimal ANSI colors without external dependencies
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function formatSeverity(sev: AuditIssue['severity']): string {
  switch (sev) {
    case 'error':
      return `${colors.red}${colors.bold}✖ ERROR${colors.reset}`;
    case 'warning':
      return `${colors.yellow}${colors.bold}⚠ WARN ${colors.reset}`;
    case 'info':
      return `${colors.cyan}${colors.bold}ℹ INFO ${colors.reset}`;
  }
}

export function formatTerminalReport(result: AuditResult, options: { verbose?: boolean } = {}): string {
  const lines: string[] = [];
  const { summary, issues } = result;

  lines.push('');
  lines.push(`${colors.bold}${colors.cyan}🛡  envguard${colors.reset} ${colors.dim}v0.1.0 — Environment & Security Audit${colors.reset}`);
  lines.push(`${colors.dim}─────────────────────────────────────────────────────────────────${colors.reset}`);

  if (issues.length === 0) {
    lines.push(`${colors.green}${colors.bold}✔ Clean environment!${colors.reset} No missing variables or secret leaks detected.`);
  } else {
    for (const issue of issues) {
      if (!options.verbose && issue.severity === 'info') {
        continue;
      }

      lines.push(`${formatSeverity(issue.severity)} ${colors.bold}${issue.variable}${colors.reset}`);
      lines.push(`  ${colors.dim}Message:${colors.reset}    ${issue.message}`);

      if (issue.file) {
        const loc = issue.line ? `:${issue.line}${issue.column ? `:${issue.column}` : ''}` : '';
        lines.push(`  ${colors.dim}Location:${colors.reset}   ${colors.blue}${issue.file}${loc}${colors.reset}`);
      }

      if (issue.snippet) {
        lines.push(`  ${colors.dim}Snippet:${colors.reset}    ${colors.gray}${issue.snippet.trim()}${colors.reset}`);
      }

      if (issue.suggestion) {
        lines.push(`  ${colors.dim}Fix:${colors.reset}        ${colors.green}${issue.suggestion}${colors.reset}`);
      }

      lines.push('');
    }
  }

  lines.push(`${colors.dim}─────────────────────────────────────────────────────────────────${colors.reset}`);
  lines.push(
    `${colors.bold}Summary:${colors.reset} ` +
      `${colors.red}${summary.errorCount} error${summary.errorCount === 1 ? '' : 's'}${colors.reset}, ` +
      `${colors.yellow}${summary.warningCount} warning${summary.warningCount === 1 ? '' : 's'}${colors.reset}, ` +
      `${colors.cyan}${summary.infoCount} info${colors.reset} | ` +
      `${colors.dim}Scanned ${summary.scannedFilesCount} files, ` +
      `${summary.uniqueVarsInCode} code vars in ${summary.durationMs}ms${colors.reset}`
  );

  if (!summary.valid) {
    lines.push(`${colors.red}${colors.bold}Audit failed.${colors.reset} Resolve errors above or check documentation.`);
  } else {
    lines.push(`${colors.green}${colors.bold}Audit passed.${colors.reset}`);
  }
  lines.push('');

  return lines.join('\n');
}

export function formatGitHubActionsAnnotations(result: AuditResult): string {
  const lines: string[] = [];

  for (const issue of result.issues) {
    const command = issue.severity === 'error' ? 'error' : issue.severity === 'warning' ? 'warning' : 'notice';
    const fileProp = issue.file ? `file=${issue.file}` : '';
    const lineProp = issue.line ? `line=${issue.line}` : '';
    const colProp = issue.column ? `col=${issue.column}` : '';

    const props = [fileProp, lineProp, colProp].filter(Boolean).join(',');
    const propStr = props ? ` ${props}` : '';

    lines.push(`::${command}${propStr}::[envguard] ${issue.variable}: ${issue.message}`);
  }

  return lines.join('\n');
}

export function formatJsonReport(result: AuditResult): string {
  return JSON.stringify(result, null, 2);
}
