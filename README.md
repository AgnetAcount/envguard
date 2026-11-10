# 🛡️ envguard

> **Zero-dependency environment auditor, secret entropy scanner, and automated TypeScript definition generator.**

[![CI Status](https://github.com/AgnetAcount/envguard/actions/workflows/ci.yml/badge.svg)](https://github.com/AgnetAcount/envguard/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)](tsconfig.json)
[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](package.json)
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

## 🚀 What's New in v0.2.0

- **Expanded 2026/2027 AI & Cloud Provider Credential Signatures:**
  - **Google / DeepSeek AI:** 32-hex secret keys (`sk-[a-f0-9]{32}`).
  - **Groq Cloud:** High-speed inference keys (`gsk_[a-zA-Z0-9]{48}`).
  - **Google Gemini & Cloud:** Gemini API keys (`AIzaSy...`, `AIza...`).
  - **Google / Mistral AI:** 32-character high-entropy secret keys.
  - **HuggingFace:** Modern User Access Tokens (`hf_[a-zA-Z0-9]{34}`).
  - **Replicate:** Inference secret tokens (`r8_[a-zA-Z0-9]{32}`).
  - **Supabase Service Role JWTs:** Deep payload claim inspection (`service_role`, `supabase`) to prevent critical administrative privilege leaks.
  - **Supabase Personal Access Tokens:** Modern management tokens (`sbp_[a-zA-Z0-9]{40}`).
  - **GitHub Fine-Grained Tokens:** Modern scoped PATs (`github_pat_...`).
- **Independent Adversarial Secret Leak Benchmark:**
  - 20 real/synthetic leak formats benchmarked with 100% detection rate.
  - 10 false positive edge cases (placeholders, local URLs, dummy variables) with zero false alarms.
- **Enhanced False Positive Rejection:** Robust detection for hyphenated placeholders (`your-api-key-here`), local development endpoints (`http://localhost:3000`), and template strings.

---

## ✨ Features

- **🚀 Zero Runtime Dependencies:** Powered entirely by native Node.js standard libraries (`node:fs`, `node:path`, `node:crypto`). Starts in `< 20ms`.
- **🔍 Deep Codebase Scanner:** Scans `.js`, `.ts`, `.jsx`, `.tsx`, `.vue`, `.svelte` files for both `process.env` and `import.meta.env` references (dot and bracket notation).
- **🔒 Shannon Entropy & Credential Scanner:** Analyzes information entropy and scans for 20+ known credential formats (Google, Groq, HuggingFace, Supabase, Replicate, OpenAI, Anthropic, AWS, GitHub, Stripe, Private Keys) to prevent committing secrets to `.env.example`.
- **🔄 Auto-Sync Engine:** Automatically extracts undocumented variables from code and appends them to `.env.example` with safe placeholder values (`npx envguard sync`).
- **📝 Automatic TypeScript Typegen:** Generates type-safe `env.d.ts` extending `NodeJS.ProcessEnv` and `ImportMetaEnv` with full autocomplete and documentation comments.
- **🤖 Native CI/CD & GitHub Actions:** Emits native `::error` and `::warning` workflow annotations on pull requests.

---

## 🔐 Supported Credential Signatures (2026/2027 Stack)

`envguard` detects both structural signatures and anomalous Shannon information entropy:

| Provider / Type | Signature Pattern | Risk Level |
|---|---|---|
| **Google / DeepSeek AI** | `sk-[a-f0-9]{32}` | CRITICAL |
| **Groq Cloud** | `gsk_[a-zA-Z0-9]{48}` | CRITICAL |
| **Google Gemini & Cloud** | `AIza[0-9A-Za-z-_]{30,45}` | CRITICAL |
| **Google / Mistral AI** | `[a-zA-Z0-9]{32}` (entropy >= 3.0) | CRITICAL |
| **HuggingFace** | `hf_[a-zA-Z0-9]{34}` | CRITICAL |
| **Supabase Service Role JWT** | JWT with `service_role` claim payload | CRITICAL |
| **Supabase Personal Token** | `sbp_[a-zA-Z0-9]{40}` | HIGH |
| **Replicate AI** | `r8_[a-zA-Z0-9]{32}` | CRITICAL |
| **OpenAI** | `sk-(?:proj-\|live-\|svcacct-)?[a-zA-Z0-9_-]{20,}` | CRITICAL |
| **Anthropic Claude** | `sk-ant-[a-zA-Z0-9_-]{20,}` | CRITICAL |
| **Perplexity AI** | `pplx-[a-zA-Z0-9]{48}` | CRITICAL |
| **Cohere AI** | `co_[a-zA-Z0-9]{37,}` | CRITICAL |
| **AWS IAM Access Key ID** | `AKIA[0-9A-Z]{16}` | CRITICAL |
| **Stripe Secret Key** | `[rs]k_(?:live\|test)_[0-9a-zA-Z]{24,}` | CRITICAL |
| **GitHub Fine-Grained PAT** | `github_pat_[a-zA-Z0-9_]{40,120}` | CRITICAL |
| **GitHub Classic PAT** | `(?:ghp\|gho\|ghu\|ghs\|ghr)_[A-Za-z0-9_]{36,}` | CRITICAL |
| **Cryptographic Private Key** | `-----BEGIN ... KEY-----` | CRITICAL |
| **Slack Bot / User Token** | `xox[baprs]-[0-9a-zA-Z]{10,48}` | HIGH |
| **Discord Bot Token** | `[MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27,}` | HIGH |
| **SendGrid API Key** | `SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}` | CRITICAL |
| **Twilio API Key** | `SK[0-9a-fA-F]{32}` | CRITICAL |
| **Database URI with Password** | `protocol://user:password@host` | CRITICAL |
| **High Shannon Entropy** | Entropy >= 4.2 (or >= 3.6 for secret keys) | HIGH |

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
🛡  envguard v0.2.0 — Environment & Security Audit
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
      GROQ_API_KEY?: string;
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
npx envguard entropy "gsk_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789aBcDeFgHiJkL"
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

// Calculate secret entropy & detect signatures
const analysis = analyzeSecret('GROQ_API_KEY', 'gsk_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789aBcDeFgHiJkL');
console.log(`Entropy: ${analysis.entropy}, Secret: ${analysis.isLikelySecret}, Pattern: ${analysis.patternMatch}`);
```

---

## 🧪 Testing

`envguard` uses Node.js's native test runner (`node:test`):

```bash
npm test
```

Includes the independent adversarial benchmark suite with 100% pass rate over 55 tests.

---

## 📄 License

MIT © [Agnet Software Corp.](https://github.com/AgnetAcount)
