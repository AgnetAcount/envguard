# 🛡️ envguard

> **Zero-dependency environment auditor, secret entropy scanner, and automated TypeScript definition generator.**

[![CI Status](https://github.com/AgnetAcount/envguard/actions/workflows/ci.yml/badge.svg)](https://github.com/AgnetAcount/envguard/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)](tsconfig.json)
[![YouTube Shorts](https://img.shields.io/badge/YouTube_Shorts-Watch_Demo-red?logo=youtube)](https://youtube.com/shorts/ZTAoaJsmTxw)

---

## ⚡ Overview

Environment variable desynchronization and accidental credential leaks cause critical outages and security breaches:
- Variables are referenced in code (`process.env.STRIPE_KEY` or `import.meta.env.VITE_API_URL`) but omitted from `.env` or production deployment environments.
- `.env.example` templates fall out of date as codebases evolve.
- Engineers accidentally commit live API keys or high-entropy tokens into `.env.example`.
- TypeScript developers endure manual typing overhead or bloated runtime validation libraries.

**`envguard`** solves these problems with a single, blazing-fast, **zero-dependency** CLI and programmatic TypeScript library.

---

## ✨ Features

- **🚀 Zero Runtime Dependencies:** Powered entirely by native Node.js standard libraries (`node:fs`, `node:path`, `node:crypto`). Starts in `< 20ms`.
- **🔍 Deep Codebase Scanner:** Scans `.js`, `.ts`, `.jsx`, `.tsx`, `.vue`, `.svelte` files for both `process.env` and `import.meta.env` references (dot and bracket notation).
- **🔒 Shannon Entropy & Credential Scanner:** Analyzes information entropy and scans for 15+ known credential formats (OpenAI, AWS, GitHub, Stripe, Anthropic, Slack, JWT, Private Keys) to prevent committing secrets to `.env.example`.
- **🔄 Auto-Sync Engine:** Automatically extracts undocumented variables from code and appends them to `.env.example` with safe placeholder values (`npx envguard sync`).
- **📝 Automatic TypeScript Typegen:** Generates type-safe `env.d.ts` extending `NodeJS.ProcessEnv` and `ImportMetaEnv` with full autocomplete and documentation comments.
- **🤖 Native CI/CD & GitHub Actions:** Emits native `::error` and `::warning` workflow annotations on pull requests.

---

## 🏗️ Architecture

```
                      ┌────────────────────────────┐
                      │    Your Application Code   │
                      │  (.ts, .js, .jsx, .tsx)    │
                      └─────────────┬──────────────┘
                                    │ AST / Regex Scanner
                                    ▼
┌──────────────────┐      ┌────────────────────┐      ┌─────────────────────┐
│    .env file     │ ───► │  envguard Engine   │ ◄─── │   .env.example      │
└──────────────────┘      │  - Code Parser     │      └─────────────────────┘
                          │  - Entropy Check   │                 ▲
                          │  - Reconciliation  │                 │
                          └─────────┬──────────┘                 │
                                    │                            │
             ┌──────────────────────┼──────────────────────┐     │ Auto-Sync
             ▼                      ▼                      ▼     │
     ┌───────────────┐     ┌──────────────────┐     ┌────────────┴─────┐
     │  CLI Terminal │     │ TypeScript Types │     │  GitHub Actions  │
     │  Audit Report │     │    (env.d.ts)    │     │   Annotations    │
     └───────────────┘     └──────────────────┘     └──────────────────┘
```

---

## 📦 Installation

Run instantly via `npx`:

```bash
npx envguard
```

Or install locally / globally:

```bash
# npm
npm install -D envguard

# pnpm
pnpm add -D envguard

# yarn
yarn add -D envguard
```

---

## 🚀 Quick Start & CLI Usage

### 1. Audit Environment & Code (`check` / `audit`)

Audits `.env`, `.env.example`, and your source files in the current repository:

```bash
npx envguard
```

Sample output:
```
🛡  envguard v0.1.0 — Environment & Security Audit
─────────────────────────────────────────────────────────────────
✖ ERROR DATABASE_URL
  Message:    Variable 'DATABASE_URL' is used in application code but missing from .env
  Location:   src/db/client.ts:4:25
  Snippet:    process.env.DATABASE_URL
  Fix:        Add 'DATABASE_URL=' to .env

⚠ WARN  REDIS_URL
  Message:    Variable 'REDIS_URL' is missing from .env.example
  Location:   .env.example
  Fix:        Add 'REDIS_URL=your_redis_url_here' to .env.example

─────────────────────────────────────────────────────────────────
Summary: 1 error, 1 warning, 0 info | Scanned 48 files, 12 code vars in 14ms
Audit failed. Resolve errors above or check documentation.
```

### 2. Auto-Generate TypeScript Definitions (`typegen`)

Generates a fully typed `env.d.ts`:

```bash
npx envguard typegen
```

Generates:
```typescript
// Auto-generated by envguard (Agnet Software Corp.)
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /** Server port */
      PORT?: string;
      DATABASE_URL?: string;
      JWT_SECRET?: string;
    }
  }
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};
```

### 3. Sync Missing Variables into `.env.example` (`sync`)

Adds missing variables discovered in code directly to `.env.example` with safe placeholders:

```bash
npx envguard sync
```

### 4. Shannon Entropy & Secret Check (`entropy`)

Evaluates strings or tokens for suspicious entropy:

```bash
npx envguard entropy "sk-proj-abc12345678901234567890"
```

---

## ⚙️ CLI Options & Flags

| Flag | Short | Default | Description |
|---|---|---|---|
| `--env <path>` | `-e` | `.env` | Path to active `.env` file |
| `--example <path>` | `-x` | `.env.example` | Path to template `.env.example` file |
| `--path <dir>` | `-p` | `.` | Source directory to scan |
| `--strict` | `-s` | `false` | Fail with exit code `1` on warnings |
| `--json` | | `false` | Output audit report in machine-readable JSON |
| `--github` | | `false` | Emit GitHub Actions `::error` annotations |
| `--verbose` | `-v` | `false` | Display info-level messages (e.g. unused vars) |

---

## 🤖 GitHub Actions CI/CD Integration

Catch missing environment variables and leaked credentials before merging:

```yaml
name: Environment Audit

on: [push, pull_request]

jobs:
  envguard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Run envguard audit
        run: npx envguard audit --github --strict
```

---

## 💻 Programmatic API

You can import `envguard` directly in your TypeScript / JavaScript scripts or build tools:

```typescript
import { runAudit, runTypegen, analyzeSecret } from 'envguard';

// Run an audit
const result = runAudit({
  cwd: process.cwd(),
  failOnWarnings: true
});

if (!result.summary.valid) {
  console.error(`Audit failed with ${result.summary.errorCount} error(s)!`);
}

// Generate type declarations
runTypegen({
  outputPath: './src/types/env.d.ts'
});

// Calculate secret entropy
const analysis = analyzeSecret('API_KEY', 'some-random-string-token-123456');
console.log(`Entropy: ${analysis.entropy}, Secret: ${analysis.isLikelySecret}`);
```

---

## 🧪 Testing

`envguard` uses Node.js's native test runner (`node:test`):

```bash
pnpm test
```

---

## 📄 License

MIT © [Agnet Software Corp.](https://github.com/AgnetAcount)
