import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { runAudit } from '../dist/validator.js';

test('runAudit: catches missing env variables and secret in example', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envguard-test-'));

  try {
    // 1. Create source file using JWT_SECRET and DATABASE_URL
    fs.writeFileSync(
      path.join(tmpDir, 'index.ts'),
      `const secret = process.env.JWT_SECRET;\nconst db = process.env.DATABASE_URL;`
    );

    // 2. Create .env missing DATABASE_URL
    fs.writeFileSync(
      path.join(tmpDir, '.env'),
      `JWT_SECRET=super-secret-local-key`
    );

    // 3. Create .env.example with a real API key leak
    fs.writeFileSync(
      path.join(tmpDir, '.env.example'),
      `JWT_SECRET=your_jwt_secret\nOPENAI_KEY=sk-proj-1234567890abcdef1234567890abcdef`
    );

    const audit = runAudit({ cwd: tmpDir });

    // Missing DATABASE_URL in .env
    const missingInEnv = audit.issues.find(
      (i) => i.type === 'MISSING_IN_ENV' && i.variable === 'DATABASE_URL'
    );
    assert.ok(missingInEnv, 'Should flag missing DATABASE_URL in .env');

    // Leaked secret in .env.example
    const secretLeak = audit.issues.find(
      (i) => i.type === 'KNOWN_SECRET_PATTERN' && i.variable === 'OPENAI_KEY'
    );
    assert.ok(secretLeak, 'Should flag OpenAI key in .env.example');

    // Summary valid must be false
    assert.equal(audit.summary.valid, false);
    assert.ok(audit.summary.errorCount >= 2);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
