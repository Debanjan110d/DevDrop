import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeFilename, resolveUniqueFilePath } from './filename.js';
import path from 'path';
import os from 'os';
import fs from 'fs';

describe('Filename Sanitization', () => {
  test('rejects directory traversal and path separators', () => {
    assert.throws(() => sanitizeFilename('../../etc/passwd'), /path separators/);
    assert.throws(() => sanitizeFilename('..\\Windows\\cmd.exe'), /path separators/);
  });

  test('rejects null bytes', () => {
    assert.throws(() => sanitizeFilename('test\0file.txt'), /null bytes/);
  });

  test('preserves legitimate safe filenames', () => {
    assert.equal(sanitizeFilename('my_document-2026.pdf'), 'my_document-2026.pdf');
    assert.equal(sanitizeFilename('photo (1).jpeg'), 'photo (1).jpeg');
  });

  test('rejects empty or whitespace-only inputs', () => {
    assert.throws(() => sanitizeFilename(''), /non-empty string/);
    assert.throws(() => sanitizeFilename('   '), /empty after sanitization/);
    assert.throws(() => sanitizeFilename('..'), /empty after sanitization/);
  });

  test('replaces illegal Windows characters with underscores', () => {
    assert.equal(sanitizeFilename('video:1*?.mp4'), 'video_1__.mp4');
  });

  test('handles unique destination paths without overwriting', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devdrop-test-'));
    try {
      const file1 = path.join(tmpDir, 'video.mp4');
      fs.writeFileSync(file1, 'data');

      const uniquePath1 = resolveUniqueFilePath(tmpDir, 'video.mp4');
      assert.equal(path.basename(uniquePath1), 'video (1).mp4');

      fs.writeFileSync(uniquePath1, 'data');
      const uniquePath2 = resolveUniqueFilePath(tmpDir, 'video.mp4');
      assert.equal(path.basename(uniquePath2), 'video (2).mp4');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
