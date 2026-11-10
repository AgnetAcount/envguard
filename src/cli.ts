#!/usr/bin/env node

/**
 * envguard - CLI Interface
 * Agnet Software Corp.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { runAudit } from './validator.js';
import { runTypegen } from './typegen.js';
import { parseEnvContent, formatEnvEntries } from './parser.js';
import {
  formatTerminalReport,
  formatGitHubActionsAnnotations,
  formatJsonReport
} from './reporter.js';
import { analyzeSecret } from './entropy.js';

const VERSION = '0.2.0';

function printHelp() {
  console.log(`
🛡  envguard v${VERSION} — Zero-dependency environment auditor & type generator
   Developed by Agnet Software Corp. (https://github.com/AgnetAcount/envguard)

USAGE:
  $ npx envguard [command] [options]

COMMANDS:
  audit, check     (default) Audit .env, .env.example, and source code usage
  typegen          Generate type-safe env.d.ts declaration file
  sync             Add missing code variables to .env.example with placeholders
  entropy <str>    Calculate Shannon entropy and check for credential signatures
  version          Print current version
  help             Show this help guide

OPTIONS:
  -e, --env <path>        Path to .env file (default: .env)
  -x, --example <path>    Path to .env.example file (default: .env.example)
  -p, --path <path>       Source directory to scan (default: current working directory)
  -s, --strict            Fail on warnings as well as errors (exit code 1)
  --json                  Output audit result as JSON
  --github                Output GitHub Actions workflow error annotations
  -v, --verbose           Show info-level logs and unused variables
  -h, --help              Show help
`);
}

function parseArgs(args: string[]): {
  command: string;
  options: Record<string, string | boolean>;
  positionals: string[];
} {
  const options: Record<string, string | boolean> = {};
  const positionals: string[] = [];
  let command = 'audit';

  let i = 0;
  while (i < args.length) {
    const arg = args[i]!;

    if (arg === '--help' || arg === '-h') {
      options['help'] = true;
    } else if (arg === '--version') {
      options['version'] = true;
    } else if (arg === '--strict' || arg === '-s') {
      options['strict'] = true;
    } else if (arg === '--json') {
      options['json'] = true;
    } else if (arg === '--github') {
      options['github'] = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options['verbose'] = true;
    } else if (arg === '--env' || arg === '-e') {
      options['env'] = args[++i] || '';
    } else if (arg === '--example' || arg === '-x') {
      options['example'] = args[++i] || '';
    } else if (arg === '--path' || arg === '-p') {
      options['path'] = args[++i] || '';
    } else if (arg.startsWith('--')) {
      const key = arg.slice(2);
      options[key] = true;
    } else if (!arg.startsWith('-')) {
      if (positionals.length === 0 && ['audit', 'check', 'typegen', 'sync', 'entropy', 'version', 'help'].includes(arg)) {
        command = arg;
      } else {
        positionals.push(arg);
      }
    }
    i++;
  }

  return { command, options, positionals };
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const { command, options, positionals } = parseArgs(rawArgs);

  if (options['help'] || command === 'help') {
    printHelp();
    process.exit(0);
  }

  if (options['version'] || command === 'version') {
    console.log(`envguard v${VERSION}`);
    process.exit(0);
  }

  const cwd = process.cwd();
  const envFile = typeof options['env'] === 'string' ? options['env'] : undefined;
  const exampleFile = typeof options['example'] === 'string' ? options['example'] : undefined;
  const codePaths = typeof options['path'] === 'string' ? [options['path']] : undefined;

  switch (command) {
    case 'audit':
    case 'check': {
      const result = runAudit({
        cwd,
        envFile,
        exampleFile,
        codePaths,
        failOnWarnings: Boolean(options['strict'])
      });

      if (options['json']) {
        console.log(formatJsonReport(result));
      } else if (options['github']) {
        console.log(formatGitHubActionsAnnotations(result));
        console.log(formatTerminalReport(result, { verbose: Boolean(options['verbose']) }));
      } else {
        console.log(formatTerminalReport(result, { verbose: Boolean(options['verbose']) }));
      }

      if (!result.summary.valid) {
        process.exit(1);
      }
      break;
    }

    case 'typegen': {
      const genResult = runTypegen({
        cwd,
        envFile,
        exampleFile,
        codePaths
      });

      console.log(`\n✔ Generated TypeScript declarations for ${genResult.variableCount} variables:`);
      console.log(`  → ${genResult.outputPath}\n`);
      break;
    }

    case 'sync': {
      const examplePath = exampleFile
        ? path.resolve(cwd, exampleFile)
        : path.resolve(cwd, '.env.example');

      let currentEntries: Record<string, { value?: string; comment?: string }> = {};
      if (fs.existsSync(examplePath)) {
        const parsed = parseEnvContent(fs.readFileSync(examplePath, 'utf-8'));
        for (const [k, v] of Object.entries(parsed)) {
          currentEntries[k] = { value: v.value, comment: v.comment };
        }
      }

      // Run audit to find missing example variables
      const audit = runAudit({ cwd, envFile, exampleFile, codePaths });
      let addedCount = 0;

      for (const issue of audit.issues) {
        if (issue.type === 'MISSING_IN_EXAMPLE') {
          if (!currentEntries[issue.variable]) {
            currentEntries[issue.variable] = {
              value: `your_${issue.variable.toLowerCase()}_here`,
              comment: 'Auto-synced by envguard'
            };
            addedCount++;
          }
        }
      }

      const formatted = formatEnvEntries(currentEntries, { sort: true });
      fs.writeFileSync(examplePath, formatted + '\n', 'utf-8');

      console.log(`\n✔ Synchronized ${examplePath}`);
      console.log(`  Added ${addedCount} missing variable(s).\n`);
      break;
    }

    case 'entropy': {
      const target = positionals[0];
      if (!target) {
        console.error('Error: Please provide a string or file path to evaluate for entropy.');
        process.exit(1);
      }

      const detection = analyzeSecret('INPUT', target);
      console.log(`\n🛡  Entropy & Credential Analysis:`);
      console.log(`  Shannon Entropy: ${detection.entropy} / 8.0`);
      console.log(`  Likely Secret:   ${detection.isLikelySecret ? 'YES ✖' : 'NO ✔'}`);
      if (detection.patternMatch) {
        console.log(`  Matched Pattern: ${detection.patternMatch}`);
      }
      if (detection.reason) {
        console.log(`  Reason:          ${detection.reason}`);
      }
      console.log('');
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
