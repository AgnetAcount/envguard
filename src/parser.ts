/**
 * envguard - Robust .env & .env.example Parser
 * Agnet Software Corp.
 */

import type { EnvEntry } from './types.js';

export function parseEnvContent(content: string): Record<string, EnvEntry> {
  const result: Record<string, EnvEntry> = {};
  const lines = content.split(/\r?\n/);

  let currentMultilineKey: string | null = null;
  let currentMultilineValue: string[] = [];
  let multilineStartLine = 0;
  let multilineQuoteChar = '';
  let multilineExported = false;

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i]!;

    if (currentMultilineKey !== null) {
      // We are in a multiline quoted string
      const endQuoteIndex = line.indexOf(multilineQuoteChar);
      if (endQuoteIndex !== -1) {
        currentMultilineValue.push(line.slice(0, endQuoteIndex));
        const fullValue = currentMultilineValue.join('\n');
        result[currentMultilineKey] = {
          key: currentMultilineKey,
          value: fullValue,
          raw: `${currentMultilineKey}=${multilineQuoteChar}${fullValue}${multilineQuoteChar}`,
          line: multilineStartLine,
          hasQuotes: true,
          isExported: multilineExported
        };
        currentMultilineKey = null;
        currentMultilineValue = [];
      } else {
        currentMultilineValue.push(line);
      }
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    let processingLine = trimmed;
    let isExported = false;

    if (processingLine.startsWith('export ')) {
      isExported = true;
      processingLine = processingLine.slice(7).trim();
    }

    const equalsIdx = processingLine.indexOf('=');
    if (equalsIdx === -1) {
      // Variable declared without equals or syntax error
      const key = processingLine.trim();
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
        result[key] = {
          key,
          value: '',
          raw: line,
          line: lineNumber,
          hasQuotes: false,
          isExported
        };
      }
      continue;
    }

    const key = processingLine.slice(0, equalsIdx).trim();
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      continue;
    }

    let rawVal = processingLine.slice(equalsIdx + 1).trim();
    let hasQuotes = false;
    let comment: string | undefined;

    // Check quotes
    if (
      (rawVal.startsWith('"') && !rawVal.endsWith('"')) ||
      (rawVal.startsWith("'") && !rawVal.endsWith("'"))
    ) {
      // Unclosed quote: multiline start
      multilineQuoteChar = rawVal[0]!;
      currentMultilineKey = key;
      multilineStartLine = lineNumber;
      multilineExported = isExported;
      currentMultilineValue = [rawVal.slice(1)];
      continue;
    }

    if (
      (rawVal.startsWith('"') && rawVal.endsWith('"') && rawVal.length >= 2) ||
      (rawVal.startsWith("'") && rawVal.endsWith("'") && rawVal.length >= 2)
    ) {
      hasQuotes = true;
      const quoteChar = rawVal[0];
      rawVal = rawVal.slice(1, -1);
      if (quoteChar === '"') {
        // Expand escaped characters
        rawVal = rawVal.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');
      }
    } else {
      // Unquoted: check for inline comments
      const commentIdx = rawVal.indexOf(' #');
      if (commentIdx !== -1) {
        comment = rawVal.slice(commentIdx + 2).trim();
        rawVal = rawVal.slice(0, commentIdx).trim();
      }
    }

    result[key] = {
      key,
      value: rawVal,
      raw: line,
      line: lineNumber,
      hasQuotes,
      isExported,
      comment
    };
  }

  return result;
}

export function formatEnvEntries(
  entries: Record<string, { value?: string; comment?: string }>,
  options: { sort?: boolean } = {}
): string {
  const keys = Object.keys(entries);
  if (options.sort) {
    keys.sort();
  }

  return keys
    .map((key) => {
      const item = entries[key]!;
      const val = item.value ?? '';
      const comment = item.comment ? ` # ${item.comment}` : '';
      const needsQuotes = /\s|#|"|'|\n/.test(val);
      const formattedVal = needsQuotes ? `"${val.replace(/"/g, '\\"')}"` : val;
      return `${key}=${formattedVal}${comment}`;
    })
    .join('\n');
}
