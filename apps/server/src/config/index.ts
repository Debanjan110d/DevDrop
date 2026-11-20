import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const userProfile = process.env.USERPROFILE || process.env.HOME || '';
const configFilePath = path.join(userProfile, 'DevDrop', 'config.json');

function loadCustomConfig(): { storageDir?: string } {
  try {
    if (fs.existsSync(configFilePath)) {
      return JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    }
  } catch {}
  return {};
}

const customConfig = loadCustomConfig();

export const config = {
  port: parseInt(process.env.PORT || '4545', 10),
  host: process.env.HOST || '0.0.0.0',
  storageDir: customConfig.storageDir || process.env.STORAGE_DIR || path.join(userProfile, 'DevDrop', 'Files'),
  databasePath: process.env.DATABASE_PATH || path.join(userProfile, 'DevDrop', 'Database', 'devdrop.sqlite'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5368709120', 10),
  maxConcurrentTransfers: parseInt(process.env.MAX_CONCURRENT_TRANSFERS || '3', 10),
  pairingExpirySeconds: parseInt(process.env.PAIRING_EXPIRY_SECONDS || '120', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
};

export function updateStorageDir(newDir: string): string {
  const resolved = path.resolve(newDir);
  config.storageDir = resolved;
  try {
    const existing = loadCustomConfig();
    fs.mkdirSync(path.dirname(configFilePath), { recursive: true });
    fs.writeFileSync(configFilePath, JSON.stringify({ ...existing, storageDir: resolved }, null, 2));
  } catch (err) {
    console.error('Failed to save config.json:', err);
  }
  return resolved;
}

export type Config = typeof config;
