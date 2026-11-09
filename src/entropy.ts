/**
 * envguard - Shannon Entropy & High-Confidence Secret Detection Engine
 * Agnet Software Corp.
 */

import type { SecretDetection } from './types.js';

/**
 * Calculates Shannon entropy for a given string:
 * H(X) = - Σ (P(x) * log2(P(x)))
 */
export function calculateShannonEntropy(str: string): number {
  if (!str || str.length === 0) return 0;

  const charFrequencies: Record<string, number> = {};
  for (let i = 0; i < str.length; i++) {
    const char = str[i]!;
    charFrequencies[char] = (charFrequencies[char] || 0) + 1;
  }

  const length = str.length;
  let entropy = 0;

  for (const char in charFrequencies) {
    const p = (charFrequencies[char] || 0) / length;
    entropy -= p * Math.log2(p);
  }

  return Number(entropy.toFixed(3));
}

interface KnownPattern {
  name: string;
  pattern: RegExp;
  description: string;
}

const KNOWN_SECRET_PATTERNS: KnownPattern[] = [
  {
    name: 'AWS Access Key',
    pattern: /\bAKIA[0-9A-Z]{16}\b/,
    description: 'AWS IAM User Access Key ID'
  },
  {
    name: 'OpenAI API Key',
    pattern: /\bsk-(?:proj-|live-)?[a-zA-Z0-9_-]{20,}\b/,
    description: 'OpenAI Secret API Key'
  },
  {
    name: 'Anthropic API Key',
    pattern: /\bsk-ant-[a-zA-Z0-9_-]{20,}\b/,
    description: 'Anthropic Claude API Key'
  },
  {
    name: 'GitHub Personal Access Token',
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}\b/,
    description: 'GitHub Personal Access / OAuth Token'
  },
  {
    name: 'Stripe Secret Key',
    pattern: /\b[rs]k_live_[0-9a-zA-Z]{24,}\b/,
    description: 'Stripe Live Secret Key'
  },
  {
    name: 'Slack Bot / User Token',
    pattern: /\bxox[baprs]-[0-9a-zA-Z]{10,48}\b/,
    description: 'Slack Authentication Token'
  },
  {
    name: 'JSON Web Token (JWT)',
    pattern: /\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/,
    description: 'Hardcoded JSON Web Token'
  },
  {
    name: 'Private Key Header',
    pattern: /-----BEGIN (?:RSA|EC|DSA|OPENSSH|PGP|PRIVATE) KEY-----/,
    description: 'Cryptographic Private Key Block'
  },
  {
    name: 'Database URI with Password',
    pattern: /\b[a-zA-Z+]+:\/\/[^:]+:[^@\s]+@[a-zA-Z0-9.-]+/,
    description: 'Database Connection String containing plaintext credentials'
  }
];

const SAFE_PLACEHOLDERS = new Set([
  'your_api_key_here',
  'your_secret_here',
  'placeholder',
  'example',
  'changeme',
  'change_me',
  'replace_me',
  'dummy',
  'test',
  'development',
  'production',
  'localhost',
  '127.0.0.1',
  'none',
  'true',
  'false',
  '0',
  '1'
]);

/**
 * Evaluates whether an environment variable value is a detected secret or has suspicious entropy.
 */
export function analyzeSecret(
  key: string,
  value: string,
  entropyThreshold = 4.2
): SecretDetection {
  const trimmed = value.trim();

  // Ignore typical placeholder values
  const lower = trimmed.toLowerCase();
  if (
    !trimmed ||
    SAFE_PLACEHOLDERS.has(lower) ||
    lower.includes('placeholder') ||
    lower.includes('your_') ||
    lower.includes('replace_') ||
    lower.includes('dummy') ||
    lower.startsWith('xxx')
  ) {
    return {
      key,
      value: trimmed,
      entropy: calculateShannonEntropy(trimmed),
      isLikelySecret: false
    };
  }

  // 1. Check known signature patterns
  for (const kp of KNOWN_SECRET_PATTERNS) {
    if (kp.pattern.test(trimmed)) {
      return {
        key,
        value: trimmed,
        entropy: calculateShannonEntropy(trimmed),
        isLikelySecret: true,
        patternMatch: kp.name,
        reason: kp.description
      };
    }
  }

  // 2. Entropy and character set evaluation
  const entropy = calculateShannonEntropy(trimmed);

  // Short strings (< 16 chars) rarely qualify as leaked keys without a pattern match
  if (trimmed.length >= 16) {
    // Keys often have identifiers in their name
    const keySuggestsSecret = /SECRET|KEY|TOKEN|PASSWORD|PASS|AUTH|PRIVATE|CREDENTIAL/i.test(key);

    if (keySuggestsSecret && entropy >= 3.6) {
      return {
        key,
        value: trimmed,
        entropy,
        isLikelySecret: true,
        reason: `High entropy (${entropy}) for credential variable ${key}`
      };
    }

    if (entropy >= entropyThreshold) {
      return {
        key,
        value: trimmed,
        entropy,
        isLikelySecret: true,
        reason: `High Shannon entropy (${entropy} >= ${entropyThreshold})`
      };
    }
  }

  return {
    key,
    value: trimmed,
    entropy,
    isLikelySecret: false
  };
}
