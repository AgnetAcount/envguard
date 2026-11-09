import test from 'node:test';
import assert from 'node:assert/strict';
import { scanSourceFile } from '../dist/scanner.js';

test('scanSourceFile: detects process.env dot notation', () => {
  const code = `
    const port = process.env.PORT || 8000;
    const db = process.env.DATABASE_URL;
  `;
  const refs = scanSourceFile('server.ts', code);
  assert.equal(refs.length, 2);
  assert.equal(refs[0].key, 'PORT');
  assert.equal(refs[0].source, 'process');
  assert.equal(refs[1].key, 'DATABASE_URL');
});

test('scanSourceFile: detects process.env bracket notation', () => {
  const code = `
    const secret = process.env['JWT_SECRET'];
    const other = process.env["OTHER_VAL"];
  `;
  const refs = scanSourceFile('auth.js', code);
  assert.equal(refs.length, 2);
  assert.equal(refs[0].key, 'JWT_SECRET');
  assert.equal(refs[1].key, 'OTHER_VAL');
});

test('scanSourceFile: detects Vite import.meta.env notation', () => {
  const code = `
    const apiUrl = import.meta.env.VITE_API_URL;
    const mode = import.meta.env['MODE'];
  `;
  const refs = scanSourceFile('client.tsx', code);
  assert.equal(refs.length, 2);
  assert.equal(refs[0].key, 'VITE_API_URL');
  assert.equal(refs[0].source, 'import.meta');
  assert.equal(refs[1].key, 'MODE');
});
