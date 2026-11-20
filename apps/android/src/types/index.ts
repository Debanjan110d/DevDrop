import type { Transfer, Device, TransferStatus } from '@devdrop/shared';
import type { ServerInfo, HealthResponse } from '@devdrop/api-types';

export type { Transfer, Device, TransferStatus, ServerInfo, HealthResponse };

export interface ServerConnectionConfig {
  serverUrl: string;
  deviceId: string;
  deviceToken: string;
  deviceName: string;
  pairedAt: number;
}

export interface PairingQRData {
  version?: number;
  url: string;
  pairingToken: string;
}

export interface LocalTransferItem {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  direction: 'pc-to-mobile' | 'mobile-to-pc';
  status: TransferStatus;
  bytesTransferred: number;
  localUri?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

