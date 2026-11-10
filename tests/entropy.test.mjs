import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateShannonEntropy, analyzeSecret } from '../dist/entropy.js';

test('calculateShannonEntropy: computes zero for empty or single char', () => {
  assert.equal(calculateShannonEntropy(''), 0);
  assert.equal(calculateShannonEntropy('aaaaa'), 0);
});

test('calculateShannonEntropy: computes higher entropy for random string', () => {
  const lowEntropy = calculateShannonEntropy('abcabcabc');
  const highEntropy = calculateShannonEntropy('w9X!qP$7mZ#2@vL1*dK');
  assert.ok(highEntropy > lowEntropy);
  assert.ok(highEntropy > 3.8);
});

test('analyzeSecret: flags known OpenAI key pattern', () => {
  const result = analyzeSecret('OPENAI_API_KEY', 'sk-proj-abc123456789012345678901234567890');
  assert.equal(result.isLikelySecret, true);
  assert.equal(result.patternMatch, 'OpenAI API Key');
});

test('analyzeSecret: flags known AWS access key pattern', () => {
  const result = analyzeSecret('AWS_KEY', 'AKIAIOSFODNN7EXAMPLE');
  assert.equal(result.isLikelySecret, true);
  assert.equal(result.patternMatch, 'AWS Access Key');
});

test('analyzeSecret: flags GitHub Personal Access Token', () => {
  const result = analyzeSecret('GH_TOKEN', 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
  assert.equal(result.isLikelySecret, true);
  assert.equal(result.patternMatch, 'GitHub Personal Access Token');
});

test('analyzeSecret: flags Google / DeepSeek API key pattern', () => {
  const result = analyzeSecret('GOOGLE_AI_KEY', 'sk-0123456789abcdef0123456789abcdef');
  assert.equal(result.isLikelySecret, true);
  assert.ok(result.patternMatch?.includes('Google') || result.patternMatch?.includes('DeepSeek'));
});

test('analyzeSecret: flags Groq API key pattern', () => {
  const result = analyzeSecret('GROQ_API_KEY', 'gsk_1234567890abcdefghijklmnopqrstuvwxyz1234567890ab');
  assert.equal(result.isLikelySecret, true);
  assert.equal(result.patternMatch, 'Groq API Key');
});

test('analyzeSecret: flags Google Gemini API key pattern', () => {
  const result = analyzeSecret('GEMINI_API_KEY', 'AIzaSyD-7Xabcdefghijklmnopqrstuvwxyz1');
  assert.equal(result.isLikelySecret, true);
  assert.equal(result.patternMatch, 'Google Gemini API Key');
});

test('analyzeSecret: flags HuggingFace user token', () => {
  const result = analyzeSecret('HF_TOKEN', 'hf_1234567890abcdefghijklmnopqrstuvwx');
  assert.equal(result.isLikelySecret, true);
  assert.equal(result.patternMatch, 'HuggingFace Access Token');
});

test('analyzeSecret: flags Replicate API token', () => {
  const result = analyzeSecret('REPLICATE_API_TOKEN', 'r8_1234567890abcdef1234567890abcdef');
  assert.equal(result.isLikelySecret, true);
  assert.equal(result.patternMatch, 'Replicate API Token');
});

test('analyzeSecret: flags Supabase Service Role JWT', () => {
  const payload = Buffer.from(JSON.stringify({ iss: 'supabase', role: 'service_role' })).toString('base64url');
  const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payload}.signature1234567890abcdef1234567890`;
  const result = analyzeSecret('SUPABASE_SERVICE_ROLE_KEY', token);
  assert.equal(result.isLikelySecret, true);
  assert.equal(result.patternMatch, 'Supabase Service Role JWT');
});

test('analyzeSecret: allows harmless placeholders', () => {
  const result = analyzeSecret('DATABASE_URL', 'your_database_url_here');
  assert.equal(result.isLikelySecret, false);
});

test('analyzeSecret: allows kebab-case placeholders and local URLs', () => {
  assert.equal(analyzeSecret('API_KEY', 'your-api-key-here').isLikelySecret, false);
  assert.equal(analyzeSecret('API_URL', 'http://localhost:3000').isLikelySecret, false);
  assert.equal(analyzeSecret('EMPTY_VAL', '').isLikelySecret, false);
});
