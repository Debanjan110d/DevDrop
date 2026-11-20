export interface Device {
  id: string;
  name: string;
  platform: string;
  tokenHash: string;
  pairedAt: number;
  lastSeenAt: number;
  revokedAt?: number | null;
}

export interface Transfer {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  direction: 'pc-to-mobile' | 'mobile-to-pc';
  sourceDeviceId: string;
  destinationDeviceId: string;
  status: string;
  storagePath?: string | null;
  bytesTransferred: number;
  createdAt: number;
  completedAt?: number | null;
}

export interface PairingSession {
  id: string;
  tokenHash: string;
  expiresAt: number;
  usedAt?: number | null;
}

export interface IdempotencyKey {
  key: string;
  deviceId: string;
  transferId: string;
  createdAt: number;
}
