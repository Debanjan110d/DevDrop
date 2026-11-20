import { getCredentials } from '../storage/secureStore';
import type { Transfer, Device } from '../../types';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  serverUrl?: string;
  token?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { timeoutMs = 10000, serverUrl: explicitUrl, token: explicitToken, ...fetchOptions } = options;

  let baseUrl = explicitUrl;
  let authToken = explicitToken;

  if (!baseUrl || !authToken) {
    const creds = await getCredentials();
    if (!baseUrl && creds) baseUrl = creds.serverUrl;
    if (!authToken && creds) authToken = creds.deviceToken;
  }

  if (!baseUrl) {
    throw new ApiError(0, 'NO_SERVER_URL', 'Server URL is not configured');
  }

  // Strip trailing slash
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${cleanBase}${cleanEndpoint}`;

  const headers = new Headers(fetchOptions.headers || {});
  headers.set('Accept', 'application/json');

  if (authToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  if (fetchOptions.body && !headers.has('Content-Type') && typeof fetchOptions.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const code = json?.error?.code || `HTTP_${response.status}`;
      const message = json?.error?.message || response.statusText || 'Request failed';
      throw new ApiError(response.status, code, message, json?.error?.details);
    }

    if (json && typeof json === 'object' && 'success' in json) {
      if (json.success === false) {
        throw new ApiError(
          response.status,
          json.error?.code || 'UNKNOWN_ERROR',
          json.error?.message || 'Server returned an error',
          json.error?.details
        );
      }
      return json.data as T;
    }

    return json as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new ApiError(408, 'TIMEOUT', `Request timed out after ${timeoutMs}ms`);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(0, 'NETWORK_ERROR', err.message || 'Network connection failed');
  }
}

export async function checkServerHealth(serverUrl: string): Promise<{ status: string }> {
  return apiRequest<{ status: string }>('/api/health', {
    serverUrl,
    timeoutMs: 5000,
  });
}

export async function fetchServerInfo(serverUrl?: string): Promise<any> {
  return apiRequest<any>('/api/server/info', { serverUrl, timeoutMs: 5000 });
}

export async function fetchDevices(): Promise<Device[]> {
  return apiRequest<Device[]>('/api/devices');
}

export async function fetchTransfers(): Promise<Transfer[]> {
  return apiRequest<Transfer[]>('/api/transfers');
}

export async function createTransferRecord(params: {
  fileName: string;
  mimeType: string;
  fileSize: number;
  direction: 'pc-to-mobile' | 'mobile-to-pc';
  destinationDeviceId: string;
  idempotencyKey?: string;
}): Promise<Transfer> {
  const headers: Record<string, string> = {};
  if (params.idempotencyKey) {
    headers['Idempotency-Key'] = params.idempotencyKey;
  }

  return apiRequest<Transfer>('/api/transfers', {
    method: 'POST',
    body: JSON.stringify(params),
    headers,
  });
}

export async function cancelTransferRecord(transferId: string): Promise<Transfer> {
  return apiRequest<Transfer>(`/api/transfers/${transferId}`, {
    method: 'DELETE',
  });
}

export async function createPairingSession(): Promise<{
  sessionId: string;
  pairingToken: string;
  expiresAt: number;
  qrCodeDataUrl: string;
  qrPayload: string;
}> {
  return apiRequest('/api/pairing/sessions', {
    method: 'POST',
  });
}

