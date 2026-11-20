import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateToken, hashToken, compareTokens } from './tokens.js';

describe('Security Tokens', () => {
  test('generates cryptographically random 64-hex-char tokens', () => {
    const t1 = generateToken();
    const t2 = generateToken();
    assert.equal(t1.length, 64);
    assert.equal(t2.length, 64);
    assert.notEqual(t1, t2);
  });

  test('hashes tokens deterministically with SHA-256', () => {
    const token = 'test-token-value-12345';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64);
  });

  test('compares tokens using timing-safe comparison', () => {
    const token = generateToken();
    assert.equal(compareTokens(token, token), true);
    assert.equal(compareTokens(token, generateToken()), false);
    assert.equal(compareTokens(token, 'short'), false);
  });
});

