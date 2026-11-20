import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import type { Device, Transfer, PairingSession, IdempotencyKey } from './schema.js';

let _sqlite: DatabaseSync | null = null;

export function getSqlite(): DatabaseSync {
  if (!_sqlite) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return _sqlite;
}

export const db = {
  devices: {
    findFirst(where: { id?: string; tokenHash?: string }): Device | null {
      const sqlite = getSqlite();
      if (where.id) {
        const stmt = sqlite.prepare('SELECT * FROM devices WHERE id = ? LIMIT 1');
        return (stmt.get(where.id) as Device) || null;
      }
      if (where.tokenHash) {
        const stmt = sqlite.prepare('SELECT * FROM devices WHERE token_hash = ? LIMIT 1');
        const row = stmt.get(where.tokenHash) as any;
        if (!row) return null;
        return {
          id: row.id,
          name: row.name,
          platform: row.platform,
          tokenHash: row.token_hash,
          pairedAt: Number(row.paired_at),
          lastSeenAt: Number(row.last_seen_at),
          revokedAt: row.revoked_at ? Number(row.revoked_at) : null,
        };
      }
      return null;
    },

    findMany(): Device[] {
      const sqlite = getSqlite();
      const stmt = sqlite.prepare('SELECT * FROM devices ORDER BY paired_at DESC');
      const rows = stmt.all() as any[];
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        platform: row.platform,
        tokenHash: row.token_hash,
        pairedAt: Number(row.paired_at),
        lastSeenAt: Number(row.last_seen_at),
        revokedAt: row.revoked_at ? Number(row.revoked_at) : null,
      }));
    },

    insert(device: Device): void {
      const sqlite = getSqlite();
      const stmt = sqlite.prepare(`
        INSERT INTO devices (id, name, platform, token_hash, paired_at, last_seen_at, revoked_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        device.id,
        device.name,
        device.platform,
        device.tokenHash,
        device.pairedAt,
        device.lastSeenAt,
        device.revokedAt ?? null
      );
    },

    update(id: string, updates: Partial<Record<keyof Device, any>>): void {
      const sqlite = getSqlite();
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
      }
      if (updates.lastSeenAt !== undefined) {
        fields.push('last_seen_at = ?');
        values.push(updates.lastSeenAt);
      }
      if (updates.revokedAt !== undefined) {
        fields.push('revoked_at = ?');
        values.push(updates.revokedAt);
      }

      if (fields.length === 0) return;
      values.push(id);

      const stmt = sqlite.prepare(`UPDATE devices SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
    },
  },

  transfers: {
    findFirst(where: { id: string }): Transfer | null {
      const sqlite = getSqlite();
      const stmt = sqlite.prepare('SELECT * FROM transfers WHERE id = ? LIMIT 1');
      const row = stmt.get(where.id) as any;
      if (!row) return null;
      return {
        id: row.id,
        fileName: row.file_name,
        mimeType: row.mime_type,
        fileSize: Number(row.file_size),
        direction: row.direction,
        sourceDeviceId: row.source_device_id,
        destinationDeviceId: row.destination_device_id,
        status: row.status,
        storagePath: row.storage_path,
        bytesTransferred: Number(row.bytes_transferred),
        createdAt: Number(row.created_at),
        completedAt: row.completed_at ? Number(row.completed_at) : null,
      };
    },

    findMany(sourceDeviceId?: string): Transfer[] {
      const sqlite = getSqlite();
      let stmt;
      let rows: any[];
      if (sourceDeviceId) {
        stmt = sqlite.prepare('SELECT * FROM transfers WHERE source_device_id = ? OR destination_device_id = ? ORDER BY created_at DESC');
        rows = stmt.all(sourceDeviceId, sourceDeviceId) as any[];
      } else {
        stmt = sqlite.prepare('SELECT * FROM transfers ORDER BY created_at DESC');
        rows = stmt.all() as any[];
      }
      return rows.map((row) => ({
        id: row.id,
        fileName: row.file_name,
        mimeType: row.mime_type,
        fileSize: Number(row.file_size),
        direction: row.direction,
        sourceDeviceId: row.source_device_id,
        destinationDeviceId: row.destination_device_id,
        status: row.status,
        storagePath: row.storage_path,
        bytesTransferred: Number(row.bytes_transferred),
        createdAt: Number(row.created_at),
        completedAt: row.completed_at ? Number(row.completed_at) : null,
      }));
    },

    insert(transfer: Transfer): void {
      const sqlite = getSqlite();
      const stmt = sqlite.prepare(`
        INSERT INTO transfers (
          id, file_name, mime_type, file_size, direction,
          source_device_id, destination_device_id, status,
          storage_path, bytes_transferred, created_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        transfer.id,
        transfer.fileName,
        transfer.mimeType,
        transfer.fileSize,
        transfer.direction,
        transfer.sourceDeviceId,
        transfer.destinationDeviceId,
        transfer.status,
        transfer.storagePath ?? null,
        transfer.bytesTransferred,
        transfer.createdAt,
        transfer.completedAt ?? null
      );
    },

    update(id: string, updates: Partial<Record<keyof Transfer, any>>): void {
      const sqlite = getSqlite();
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.status !== undefined) {
        fields.push('status = ?');
        values.push(updates.status);
      }
      if (updates.storagePath !== undefined) {
        fields.push('storage_path = ?');
        values.push(updates.storagePath);
      }
      if (updates.bytesTransferred !== undefined) {
        fields.push('bytes_transferred = ?');
        values.push(updates.bytesTransferred);
      }
      if (updates.completedAt !== undefined) {
        fields.push('completed_at = ?');
        values.push(updates.completedAt);
      }

      if (fields.length === 0) return;
      values.push(id);

      const stmt = sqlite.prepare(`UPDATE transfers SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
    },
  },

  pairingSessions: {
    findFirst(where: { tokenHash: string }): PairingSession | null {
      const sqlite = getSqlite();
      const stmt = sqlite.prepare('SELECT * FROM pairing_sessions WHERE token_hash = ? LIMIT 1');
      const row = stmt.get(where.tokenHash) as any;
      if (!row) return null;
      return {
        id: row.id,
        tokenHash: row.token_hash,
        expiresAt: Number(row.expires_at),
        usedAt: row.used_at ? Number(row.used_at) : null,
      };
    },

    insert(session: PairingSession): void {
      const sqlite = getSqlite();
      const stmt = sqlite.prepare(`
        INSERT INTO pairing_sessions (id, token_hash, expires_at, used_at)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(session.id, session.tokenHash, session.expiresAt, session.usedAt ?? null);
    },

    markUsed(id: string, now: number): void {
      const sqlite = getSqlite();
      const stmt = sqlite.prepare('UPDATE pairing_sessions SET used_at = ? WHERE id = ?');
      stmt.run(now, id);
    },

    deleteExpired(now: number): void {
      const sqlite = getSqlite();
      const stmt = sqlite.prepare('DELETE FROM pairing_sessions WHERE expires_at < ?');
      stmt.run(now);
    },
  },

  idempotencyKeys: {
    findFirst(where: { key: string }): IdempotencyKey | null {
      const sqlite = getSqlite();
      const stmt = sqlite.prepare('SELECT * FROM idempotency_keys WHERE key = ? LIMIT 1');
      const row = stmt.get(where.key) as any;
      if (!row) return null;
      return {
        key: row.key,
        deviceId: row.device_id,
        transferId: row.transfer_id,
        createdAt: Number(row.created_at),
      };
    },

    insert(keyRecord: IdempotencyKey): void {
      const sqlite = getSqlite();
      const stmt = sqlite.prepare(`
        INSERT INTO idempotency_keys (key, device_id, transfer_id, created_at)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(keyRecord.key, keyRecord.deviceId, keyRecord.transferId, keyRecord.createdAt);
    },
  },
};

export function getDb() {
  return db;
}

export function initDatabase(): void {
  const dbDir = path.dirname(config.databasePath);
  fs.mkdirSync(dbDir, { recursive: true });

  logger.info(`Initializing SQLite database at ${config.databasePath}`);
  _sqlite = new DatabaseSync(config.databasePath);

  // Enable WAL mode
  _sqlite.exec('PRAGMA journal_mode = WAL;');
  _sqlite.exec('PRAGMA foreign_keys = ON;');

  // Run migrations
  runMigrations(_sqlite);
  logger.info('Database initialized successfully');
}

function runMigrations(sqlite: DatabaseSync): void {
  logger.info('Running database migrations...');

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      platform TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      paired_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL,
      revoked_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS transfers (
      id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      direction TEXT NOT NULL,
      source_device_id TEXT NOT NULL,
      destination_device_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      storage_path TEXT,
      bytes_transferred INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      completed_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS pairing_sessions (
      id TEXT PRIMARY KEY,
      token_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS idempotency_keys (
      key TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      transfer_id TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transfers_source_device ON transfers(source_device_id);
    CREATE INDEX IF NOT EXISTS idx_transfers_destination_device ON transfers(destination_device_id);
    CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
    CREATE INDEX IF NOT EXISTS idx_pairing_sessions_expires ON pairing_sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_idempotency_device ON idempotency_keys(device_id);
  `);

  logger.info('Database migrations complete');
}

export function closeDatabase(): void {
  if (_sqlite) {
    _sqlite.close();
    _sqlite = null;
    logger.info('Database connection closed');
  }
}
