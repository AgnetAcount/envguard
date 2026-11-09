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

test('analyzeSecret: allows harmless placeholders', () => {
  const result = analyzeSecret('DATABASE_URL', 'your_database_url_here');
  assert.equal(result.isLikelySecret, false);
});
