import type { ServerStatus, PairingSession } from '../types';
import type { Device, Transfer } from '@devdrop/shared';

export function getBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    if (window.location.port === '5173') {
      return `http://${window.location.hostname}:4545/api`;
    }
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:4545/api';
}

// ─── Response wrapper types ────────────────────────────────────────────────

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: string;
  code?: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Generic request helper ───────────────────────────────────────────────

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new Error((json as ApiError).error ?? 'Request failed');
  }

  return (json as ApiSuccess<T>).data;
}

// ─── Server ───────────────────────────────────────────────────────────────

export async function getServerStatus(): Promise<ServerStatus> {
  return request<ServerStatus>('/server/status');
}

export interface ServerInfoResponse {
  name: string;
  version: string;
  port: number;
  localAddress: string;
  networkAddress: string;
  lanAddresses: string[];
  storageDir: string;
  maxFileSize: number;
  maxConcurrentTransfers: number;
}

export async function getServerInfo(): Promise<ServerInfoResponse> {
  return request<ServerInfoResponse>('/server/info');
}

export async function updateStorageDir(storageDir: string): Promise<{ storageDir: string }> {
  return request<{ storageDir: string }>('/server/storage', {
    method: 'PATCH',
    body: JSON.stringify({ storageDir }),
  });
}

// ─── Devices ─────────────────────────────────────────────────────────────

export async function getDevices(): Promise<Device[]> {
  return request<Device[]>('/devices');
}

export async function getDevice(id: string): Promise<Device> {
  return request<Device>(`/devices/${id}`);
}

export async function updateDevice(id: string, data: { name?: string }): Promise<Device> {
  return request<Device>(`/devices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function revokeDevice(id: string): Promise<void> {
  return request<void>(`/devices/${id}`, { method: 'DELETE' });
}

// ─── Pairing ─────────────────────────────────────────────────────────────

export async function createPairingSession(): Promise<PairingSession> {
  return request<PairingSession>('/pairing/sessions', { method: 'POST' });
}

export async function completePairing(
  pairingToken: string,
  deviceName: string,
  platform: 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'web' = 'android',
): Promise<{ deviceId: string; deviceToken: string; deviceName: string }> {
  return request<{ deviceId: string; deviceToken: string; deviceName: string }>('/pair', {
    method: 'POST',
    body: JSON.stringify({ pairingToken, deviceName, platform }),
  });
}

// ─── Transfers ───────────────────────────────────────────────────────────

export async function getTransfers(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<Transfer[]> {
  const qs = params
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : '';
  return request<Transfer[]>(`/transfers${qs}`);
}

export async function getTransfer(id: string): Promise<Transfer> {
  return request<Transfer>(`/transfers/${id}`);
}

export async function cancelTransfer(id: string): Promise<Transfer> {
  return request<Transfer>(`/transfers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'cancelled' }),
  });
}

export async function uploadFile(
  deviceId: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<Transfer> {
  // 1. Create transfer record on the server
  const transfer = await request<Transfer>('/transfers', {
    method: 'POST',
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size,
      direction: 'pc-to-mobile',
      destinationDeviceId: deviceId,
    }),
  });

  // 2. Stream binary file directly to /api/transfers/:id/upload
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${getBaseUrl()}/transfers/${transfer.id}/upload`);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (response.success) {
          resolve(transfer);
        } else {
          reject(new Error(response.error?.message || response.error || 'Upload failed'));
        }
      } catch {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(transfer);
        } else {
          reject(new Error(`Server error: HTTP ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error during file upload'));
    xhr.send(file);
  });
}

export async function downloadTransfer(id: string): Promise<Blob> {
  const res = await fetch(`${getBaseUrl()}/transfers/${id}/download`);
  if (!res.ok) throw new Error('Download failed');
  return res.blob();
}
