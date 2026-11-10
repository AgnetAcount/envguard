import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSecret } from '../dist/entropy.js';

test('ADVERSARIAL SUITE: 20 Real/Synthetic High-Risk Secret Leak Signatures', async (t) => {
  const supabasePayload = Buffer.from(
    JSON.stringify({ iss: 'supabase', ref: 'auth', role: 'service_role' })
  ).toString('base64url');

  const secretTestCases = [
    {
      id: '01',
      name: 'Google / DeepSeek API Key (32-hex)',
      envKey: 'GOOGLE_API_KEY',
      value: ['sk', '0123456789abcdef0123456789abcdef'].join('-'),
      expectedMatch: 'Google / DeepSeek API Key'
    },
    {
      id: '02',
      name: 'Groq Cloud Inference API Key',
      envKey: 'GROQ_API_KEY',
      value: ['gsk', 'AbCdEfGhIjKlMnOpQrStUvWxYz0123456789aBcDeFgHiJkL'].join('_'),
      expectedMatch: 'Groq API Key'
    },
    {
      id: '03',
      name: 'Google Gemini API Key (AIzaSy)',
      envKey: 'GEMINI_API_KEY',
      value: ['AIzaSy', 'D-7Xabcdefghijklmnopqrstuvwxyz1'].join(''),
      expectedMatch: 'Google Gemini API Key'
    },
    {
      id: '04',
      name: 'Google / Mistral 32-Char Secret Key',
      envKey: 'MISTRAL_API_KEY',
      value: 'vXk8L2mP9qR4tY7wZ1bC5dE8fG2hJ4kM',
      expectedMatch: 'Google / Mistral API Key'
    },
    {
      id: '05',
      name: 'HuggingFace User Access Token',
      envKey: 'HUGGINGFACE_TOKEN',
      value: ['hf', 'AbCdEfGhIjKlMnOpQrStUvWxYz01234567'].join('_'),
      expectedMatch: 'HuggingFace Access Token'
    },
    {
      id: '06',
      name: 'Supabase Service Role JWT',
      envKey: 'SUPABASE_SERVICE_ROLE_KEY',
      value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${supabasePayload}.signature1234567890abcdef1234567890`,
      expectedMatch: 'Supabase Service Role JWT'
    },
    {
      id: '07',
      name: 'Supabase Personal Access Token (sbp_)',
      envKey: 'SUPABASE_ACCESS_TOKEN',
      value: ['sbp', '1234567890abcdefghijklmnopqrstuvwxyz1234'].join('_'),
      expectedMatch: 'Supabase Personal Access Token'
    },
    {
      id: '08',
      name: 'Replicate API Secret Token',
      envKey: 'REPLICATE_API_TOKEN',
      value: ['r8', '1234567890abcdef1234567890abcdef'].join('_'),
      expectedMatch: 'Replicate API Token'
    },
    {
      id: '09',
      name: 'AWS IAM User Access Key ID',
      envKey: 'AWS_ACCESS_KEY_ID',
      value: 'AKIAIOSFODNN7EXAMPLE',
      expectedMatch: 'AWS Access Key'
    },
    {
      id: '10',
      name: 'Stripe Secret Key (live)',
      envKey: 'STRIPE_SECRET_KEY',
      value: ['s' + 'k', 'live', '51AbCdEfGhIjKlMnOpQrStUvWxYz0123456'].join('_'),
      expectedMatch: 'Stripe Secret Key'
    },
    {
      id: '11',
      name: 'GitHub Classic Personal Access Token',
      envKey: 'GITHUB_TOKEN',
      value: ['gh' + 'p', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'].join('_'),
      expectedMatch: 'GitHub Personal Access Token'
    },
    {
      id: '12',
      name: 'GitHub Fine-Grained Personal Access Token',
      envKey: 'GH_FINE_GRAINED_TOKEN',
      value: ['github', 'pat', '11AAAAAAA0123456789abcdef_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'].join('_'),
      expectedMatch: 'GitHub Fine-Grained Token'
    },
    {
      id: '13',
      name: 'Cryptographic Private Key Header',
      envKey: 'SSH_PRIVATE_KEY',
      value: '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...\n-----END RSA PRIVATE KEY-----',
      expectedMatch: 'Private Key Header'
    },
    {
      id: '14',
      name: 'OpenAI Secret API Key',
      envKey: 'OPENAI_API_KEY',
      value: ['s' + 'k', 'proj', 'abc123456789012345678901234567890'].join('-'),
      expectedMatch: 'OpenAI API Key'
    },
    {
      id: '15',
      name: 'Anthropic Claude Secret API Key',
      envKey: 'ANTHROPIC_API_KEY',
      value: ['s' + 'k', 'ant', 'api03-abcdefghijklmnopqrstuvwxyz1234567890'].join('-'),
      expectedMatch: 'Anthropic API Key'
    },
    {
      id: '16',
      name: 'Slack Bot Authentication Token',
      envKey: 'SLACK_BOT_TOKEN',
      value: ['xo' + 'xb', '123456789012', '1234567890123', 'abcdefghijklmnopqrstuvwx'].join('-'),
      expectedMatch: 'Slack Bot / User Token'
    },
    {
      id: '17',
      name: 'Discord Bot Authentication Token',
      envKey: 'DISCORD_BOT_TOKEN',
      value: ['MTAyNDU2Nzg5MDEyMzQ1Njc4OQ', 'Gk7_aB', 'abcdefghijklmnopqrstuvwxyz1234567890'].join('.'),
      expectedMatch: 'Discord Bot Token'
    },
    {
      id: '18',
      name: 'SendGrid Secret API Key',
      envKey: 'SENDGRID_API_KEY',
      value: ['S' + 'G', 'abcdefghijklmnopqrstuv', '1234567890abcdefghijklmnopqrstuvwxyz1234567'].join('.'),
      expectedMatch: 'SendGrid API Key'
    },
    {
      id: '19',
      name: 'Twilio Secret API Key',
      envKey: 'TWILIO_AUTH_TOKEN',
      value: ['S' + 'K', '0123456789abcdef0123456789abcdef'].join(''),
      expectedMatch: 'Twilio API Key'
    },
    {
      id: '20',
      name: 'Database Connection URI with Embedded Plaintext Password',
      envKey: 'DATABASE_URL',
      value: ['postgres:/', 'admin:s3cr3t_p@ssw0rd!@db.internal:5432/production'].join('/'),
      expectedMatch: 'Database URI with Password'
    }
  ];

  assert.equal(secretTestCases.length, 20, 'Suite must test exactly 20 secret formats');

  for (const tc of secretTestCases) {
    await t.test(`Secret #${tc.id}: ${tc.name}`, () => {
      const result = analyzeSecret(tc.envKey, tc.value);
      assert.equal(
        result.isLikelySecret,
        true,
        `Expected ${tc.name} to be flagged as secret (key: ${tc.envKey})`
      );
      assert.equal(
        result.patternMatch,
        tc.expectedMatch,
        `Expected patternMatch for ${tc.name} to be '${tc.expectedMatch}', got '${result.patternMatch}'`
      );
    });
  }
});

test('ADVERSARIAL SUITE: 10 False Positive Edge Cases', async (t) => {
  const falsePositiveCases = [
    {
      id: 'FP-01',
      description: 'Empty string environment value',
      key: 'EMPTY_VARIABLE',
      value: ''
    },
    {
      id: 'FP-02',
      description: 'Kebab-case placeholder (your-api-key-here)',
      key: 'API_KEY',
      value: 'your-api-key-here'
    },
    {
      id: 'FP-03',
      description: 'Snake-case placeholder (your_api_key_here)',
      key: 'SECRET_KEY',
      value: 'your_secret_key_here'
    },
    {
      id: 'FP-04',
      description: 'Uppercase placeholder template value',
      key: 'AUTH_TOKEN',
      value: 'YOUR_AUTH_TOKEN_GOES_HERE'
    },
    {
      id: 'FP-05',
      description: 'Localhost development HTTP URL with port',
      key: 'BACKEND_URL',
      value: 'http://localhost:3000'
    },
    {
      id: 'FP-06',
      description: 'Loopback 127.0.0.1 IP address with service path',
      key: 'SERVICE_ENDPOINT',
      value: 'http://127.0.0.1:8080/v1/health'
    },
    {
      id: 'FP-07',
      description: 'Standard runtime environment name',
      key: 'NODE_ENV',
      value: 'development'
    },
    {
      id: 'FP-08',
      description: 'Common boolean / flag string configuration',
      key: 'ENABLE_CACHE',
      value: 'false'
    },
    {
      id: 'FP-09',
      description: 'Explicit dummy template placeholder',
      key: 'STRIPE_WEBHOOK_SECRET',
      value: 'dummy-secret-value'
    },
    {
      id: 'FP-10',
      description: 'Prefixed placeholder (starts with key prefix but contains placeholder)',
      key: 'GROQ_API_KEY',
      value: 'gsk_your_groq_api_key_goes_here_placeholder'
    }
  ];

  assert.equal(falsePositiveCases.length, 10, 'Suite must test exactly 10 false positive edge cases');

  for (const fp of falsePositiveCases) {
    await t.test(`Edge Case #${fp.id}: ${fp.description}`, () => {
      const result = analyzeSecret(fp.key, fp.value);
      assert.equal(
        result.isLikelySecret,
        false,
        `Expected '${fp.value}' for ${fp.key} NOT to be flagged as secret! Got reason: ${result.reason}`
      );
    });
  }
});
