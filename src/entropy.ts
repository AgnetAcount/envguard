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

export interface KnownPattern {
  name: string;
  pattern: RegExp;
  description: string;
}

export const KNOWN_SECRET_PATTERNS: KnownPattern[] = [
  {
    name: 'Private Key Header',
    pattern: /-----BEGIN (?:(?:RSA|EC|DSA|OPENSSH|PGP|ENCRYPTED) )?(?:PRIVATE )?KEY-----/,
    description: 'Cryptographic Private Key Block'
  },
  {
    name: 'Supabase Service Role JWT',
    pattern: /\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]*(?:service_role|InJvbGUiOiJzZXJ2aWNlX3JvbGUi|Icm9sZSI6InNlcnZpY2Vfcm9sZSI)[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]{10,}\b/,
    description: 'Supabase Service Role JWT with administrative bypass privileges'
  },
  {
    name: 'Supabase Personal Access Token',
    pattern: /\bsbp_[a-zA-Z0-9]{40}\b/,
    description: 'Supabase Personal Access Token'
  },
  {
    name: 'AWS Access Key',
    pattern: /\bAKIA[0-9A-Z]{16}\b/,
    description: 'AWS IAM User Access Key ID'
  },
  {
    name: 'Google / DeepSeek API Key',
    pattern: /\bsk-[a-f0-9]{32}\b/,
    description: 'Google / DeepSeek AI Secret API Key (sk-[a-f0-9]{32})'
  },
  {
    name: 'Groq API Key',
    pattern: /\bgsk_[a-zA-Z0-9]{48,}\b/,
    description: 'Groq Cloud High-Speed Inference API Key (gsk_[a-zA-Z0-9]{48})'
  },
  {
    name: 'Google Gemini API Key',
    pattern: /\bAIza[0-9A-Za-z-_]{30,45}\b/,
    description: 'Google Cloud / Gemini AI Secret API Key'
  },
  {
    name: 'HuggingFace Access Token',
    pattern: /\bhf_[a-zA-Z0-9]{34,}\b/,
    description: 'HuggingFace User Access Token (hf_[a-zA-Z0-9]{34})'
  },
  {
    name: 'Replicate API Token',
    pattern: /\br8_[a-zA-Z0-9]{32,}\b/,
    description: 'Replicate API Secret Token (r8_...)'
  },
  {
    name: 'Anthropic API Key',
    pattern: /\bsk-ant-[a-zA-Z0-9_-]{20,}\b/,
    description: 'Anthropic Claude API Key'
  },
  {
    name: 'OpenAI API Key',
    pattern: /\bsk-(?:proj-|live-|svcacct-)?[a-zA-Z0-9_-]{20,}\b/,
    description: 'OpenAI Secret API Key'
  },
  {
    name: 'Perplexity API Key',
    pattern: /\bpplx-[a-zA-Z0-9]{48}\b|\bpplx-[a-f0-9]{40,}\b/,
    description: 'Perplexity AI Secret Key'
  },
  {
    name: 'Cohere API Key',
    pattern: /\bco_[a-zA-Z0-9]{37,}\b/,
    description: 'Cohere AI Secret API Key'
  },
  {
    name: 'GitHub Fine-Grained Token',
    pattern: /\bgithub_pat_[a-zA-Z0-9_]{40,120}\b/,
    description: 'GitHub Fine-Grained Personal Access Token'
  },
  {
    name: 'GitHub Personal Access Token',
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}\b/,
    description: 'GitHub Personal Access / OAuth Token'
  },
  {
    name: 'Stripe Secret Key',
    pattern: /\b[rs]k_(?:live|test)_[0-9a-zA-Z]{24,}\b/,
    description: 'Stripe Secret Key'
  },
  {
    name: 'Slack Bot / User Token',
    pattern: /\bxox[baprs]-[0-9a-zA-Z]{10,48}\b/,
    description: 'Slack Authentication Token'
  },
  {
    name: 'Discord Bot Token',
    pattern: /\b[MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27,}\b/,
    description: 'Discord Bot Authentication Token'
  },
  {
    name: 'SendGrid API Key',
    pattern: /\bSG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}\b/,
    description: 'SendGrid Secret API Key'
  },
  {
    name: 'Twilio API Key',
    pattern: /\bSK[0-9a-fA-F]{32}\b/,
    description: 'Twilio Secret API Key'
  },
  {
    name: 'Database URI with Password',
    pattern: /\b[a-zA-Z+]+:\/\/[^:]+:[^@\s]+@[a-zA-Z0-9.-]+/,
    description: 'Database Connection String containing plaintext credentials'
  },
  {
    name: 'JSON Web Token (JWT)',
    pattern: /\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/,
    description: 'Hardcoded JSON Web Token'
  },
  {
    name: 'Google / Mistral API Key',
    pattern: /\b[a-zA-Z0-9]{32}\b/,
    description: 'Google / Mistral 32-character Secret API Key'
  }
];

export const SAFE_PLACEHOLDERS = new Set([
  '',
  'your_api_key_here',
  'your-api-key-here',
  'your_secret_here',
  'your-secret-here',
  'your_token_here',
  'your-token-here',
  'placeholder',
  'example',
  'example_key',
  'example-key',
  'changeme',
  'change_me',
  'change-me',
  'replace_me',
  'replace-me',
  'replace_with_your_key',
  'dummy',
  'dummy_key',
  'dummy-key',
  'dummy-secret-value',
  'test',
  'testing',
  'development',
  'staging',
  'production',
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'none',
  'null',
  'undefined',
  'true',
  'false',
  '0',
  '1'
]);

/**
 * Checks if a value is an obvious safe placeholder, local dev URL, or edge case.
 */
export function isSafePlaceholderOrUrl(val: string): boolean {
  if (!val || val.length === 0) return true;
  const trimmed = val.trim();
  if (trimmed.length === 0) return true;
  const lower = trimmed.toLowerCase();

  if (SAFE_PLACEHOLDERS.has(lower)) return true;

  // Local URLs / endpoints without embedded auth
  if (
    /^(https?|ws|wss|redis|postgres|mysql|mongodb):\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/.*)?$/i.test(
      trimmed
    )
  ) {
    return true;
  }

  // Common placeholder patterns
  if (
    lower.includes('placeholder') ||
    lower.includes('your_') ||
    lower.includes('your-') ||
    lower.includes('changeme') ||
    lower.includes('change_me') ||
    lower.includes('change-me') ||
    lower.includes('replace_me') ||
    lower.includes('replace-me') ||
    lower.includes('dummy') ||
    lower.includes('sample') ||
    lower.includes('goes_here') ||
    lower.includes('goes-here') ||
    lower.includes('<insert') ||
    lower.includes('insert_') ||
    lower.includes('insert-') ||
    lower.startsWith('xxx') ||
    lower.endsWith('_here') ||
    lower.endsWith('-here')
  ) {
    return true;
  }

  return false;
}

/**
 * Evaluates whether an environment variable value is a detected secret or has suspicious entropy.
 */
export function analyzeSecret(
  key: string,
  value: string,
  entropyThreshold = 4.2
): SecretDetection {
  const trimmed = value.trim();

  // 1. Ignore typical placeholder values and safe local URLs
  if (isSafePlaceholderOrUrl(trimmed)) {
    return {
      key,
      value: trimmed,
      entropy: calculateShannonEntropy(trimmed),
      isLikelySecret: false
    };
  }

  // 2. Dedicated Supabase Service Role JWT detection (payload inspection)
  if (/^eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}$/.test(trimmed)) {
    let isServiceRole = false;
    try {
      const parts = trimmed.split('.');
      if (parts.length >= 2) {
        const payloadJson = Buffer.from(parts[1]!, 'base64').toString('utf8');
        if (
          payloadJson.includes('service_role') ||
          (payloadJson.includes('supabase') && /role/i.test(payloadJson))
        ) {
          isServiceRole = true;
        }
      }
    } catch {
      // ignore base64 parse errors
    }

    if (isServiceRole || (/supabase/i.test(key) && /service|role|admin|secret/i.test(key))) {
      return {
        key,
        value: trimmed,
        entropy: calculateShannonEntropy(trimmed),
        isLikelySecret: true,
        patternMatch: 'Supabase Service Role JWT',
        reason: 'Supabase Service Role JWT containing elevated administrative permissions'
      };
    }
  }

  // 3. Check known signature patterns
  for (const kp of KNOWN_SECRET_PATTERNS) {
    if (kp.pattern.test(trimmed)) {
      const entropy = calculateShannonEntropy(trimmed);

      // Avoid false positive on low-entropy repetitive 32-char strings for generic pattern
      if (kp.name === 'Google / Mistral API Key' && entropy < 3.0) {
        continue;
      }

      return {
        key,
        value: trimmed,
        entropy,
        isLikelySecret: true,
        patternMatch: kp.name,
        reason: kp.description
      };
    }
  }

  // 4. Entropy and character set evaluation
  const entropy = calculateShannonEntropy(trimmed);

  // Short strings (< 16 chars) rarely qualify as leaked keys without a pattern match
  if (trimmed.length >= 16) {
    // Keys often have identifiers in their name
    const keySuggestsSecret = /SECRET|KEY|TOKEN|PASSWORD|PASS|AUTH|PRIVATE|CREDENTIAL|APIKEY|API_KEY/i.test(
      key
    );

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
