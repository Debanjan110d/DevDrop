// Re-export shared types from @devdrop/shared
export type {
  TransferStatus,
  Transfer,
  Device,
} from '@devdrop/shared';

export { SOCKET_EVENTS, TRANSFER_STATE_MACHINE, isValidTransition } from '@devdrop/shared';

// Local UI-only types

export type NavItem = {
  label: string;
  path: string;
  icon: string;
};

export type TransferFilter = 'all' | 'active' | 'completed' | 'failed';

export type ServerStatus = {
  running: boolean;
  host: string;
  port: number;
  version: string;
  startedAt: string;
  connectedDevices: number;
  activeTransfers: number;
};

export type PairingSession = {
  sessionId: string;
  pairingToken: string;
  expiresAt: number;
  qrCodeDataUrl: string;
  qrPayload: {
    version: 1;
    url: string;
    pairingToken: string;
  };
};

export type DropzoneState = 'idle' | 'hovering' | 'uploading' | 'done' | 'error';
