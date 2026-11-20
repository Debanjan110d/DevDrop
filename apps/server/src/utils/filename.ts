import path from 'path';
import fs from 'fs';

/**
 * Sanitize a filename: reject path separators, null bytes, and reserved names.
 * Returns a safe filename string.
 */
export function sanitizeFilename(raw: string): string {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Filename must be a non-empty string');
  }

  // Reject null bytes
  if (raw.includes('\0')) {
    throw new Error('Filename contains null bytes');
  }

  // Reject path separators
  if (raw.includes('/') || raw.includes('\\')) {
    throw new Error('Filename must not contain path separators');
  }

  // Strip leading/trailing dots and spaces
  let safe = raw.trim().replace(/^\.+/, '');

  // Replace problematic characters with underscores
  safe = safe.replace(/[<>:"|?*]/g, '_');

  if (!safe) {
    throw new Error('Filename is empty after sanitization');
  }

  return safe;
}

/**
 * Resolve a collision-safe file path.
 * If `dir/filename` does not exist, return it.
 * Otherwise try `dir/base (1).ext`, `dir/base (2).ext`, etc.
 */
export function resolveUniqueFilePath(dir: string, filename: string): string {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);

  let candidate = path.join(dir, filename);
  if (!fs.existsSync(candidate)) {
    return candidate;
  }

  let counter = 1;
  while (true) {
    candidate = path.join(dir, `${base} (${counter})${ext}`);
    if (!fs.existsSync(candidate)) {
      return candidate;
    }
    counter++;
    if (counter > 9999) {
      throw new Error('Too many files with the same name');
    }
  }
}
