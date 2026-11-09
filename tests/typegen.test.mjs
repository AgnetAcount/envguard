import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTypeScriptDeclarations } from '../dist/typegen.js';

test('generateTypeScriptDeclarations: generates NodeJS.ProcessEnv interface', () => {
  const vars = {
    PORT: { value: '3000', comment: 'Server port' },
    DATABASE_URL: { value: 'postgres://...', comment: 'Database' }
  };
  const dts = generateTypeScriptDeclarations(vars);
  assert.ok(dts.includes('namespace NodeJS'));
  assert.ok(dts.includes('interface ProcessEnv'));
  assert.ok(dts.includes('PORT?: string;'));
  assert.ok(dts.includes('DATABASE_URL?: string;'));
  assert.ok(dts.includes('/** Server port */'));
});

test('generateTypeScriptDeclarations: includes Vite types when VITE_ is present', () => {
  const vars = {
    VITE_APP_TITLE: { value: 'My App', isVite: true }
  };
  const dts = generateTypeScriptDeclarations(vars);
  assert.ok(dts.includes('interface ImportMetaEnv'));
  assert.ok(dts.includes('readonly VITE_APP_TITLE: string;'));
});
