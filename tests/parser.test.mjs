import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEnvContent, formatEnvEntries } from '../dist/parser.js';

test('parseEnvContent: parses basic key-value pairs', () => {
  const content = `
# Comment line
PORT=3000
HOST=localhost
DEBUG=true
`;
  const parsed = parseEnvContent(content);
  assert.equal(parsed.PORT.value, '3000');
  assert.equal(parsed.HOST.value, 'localhost');
  assert.equal(parsed.DEBUG.value, 'true');
});

test('parseEnvContent: handles export prefix and quotes', () => {
  const content = `
export API_URL="https://api.example.com/v1"
SECRET_KEY='my-secret-value'
`;
  const parsed = parseEnvContent(content);
  assert.equal(parsed.API_URL.value, 'https://api.example.com/v1');
  assert.equal(parsed.API_URL.isExported, true);
  assert.equal(parsed.SECRET_KEY.value, 'my-secret-value');
});

test('parseEnvContent: handles multiline values', () => {
  const content = `
CERT="-----BEGIN CERTIFICATE-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A
-----END CERTIFICATE-----"
`;
  const parsed = parseEnvContent(content);
  assert.ok(parsed.CERT);
  assert.ok(parsed.CERT.value.includes('MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A'));
});

test('formatEnvEntries: serializes entries with sorting', () => {
  const entries = {
    PORT: { value: '8080' },
    APP_NAME: { value: 'My App', comment: 'Application Title' }
  };
  const formatted = formatEnvEntries(entries, { sort: true });
  assert.ok(formatted.startsWith('APP_NAME="My App" # Application Title'));
  assert.ok(formatted.includes('PORT=8080'));
});
