import { apiRequest, checkServerHealth } from '../api/client';
import { saveCredentials } from '../storage/secureStore';
import type { ServerConnectionConfig, PairingQRData } from '../../types';

export interface PairRequestPayload {
  pairingToken: string;
  deviceName: string;
  platform: 'android';
}

export interface PairResponsePayload {
  deviceId: string;
  deviceToken: string;
  deviceName: string;
}

export function parseQRCode(data: string): PairingQRData | null {
  if (!data) return null;
  const trimmed = data.trim();

  // Try JSON format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        const url = parsed.url || parsed.serverUrl;
        const pairingToken = parsed.pairingToken || parsed.token;
        if (url && pairingToken) {
          return {
            version: parsed.version || 1,
            url: url.replace(/\/+$/, ''),
            pairingToken,
          };
        }
      }
    } catch {
      // not json, continue
    }
  }

  // Try URL format: http://192.168.0.105:4545/devices?pair=TOKEN
  try {
    const urlObj = new URL(trimmed);
    const token = urlObj.searchParams.get('pair') || urlObj.searchParams.get('token');
    if (token) {
      return {
        version: 1,
        url: urlObj.origin,
        pairingToken: token,
      };
    }
  } catch {
    // not a valid standard URL
  }

  return null;
}

export async function pairWithServer(
  serverUrl: string,
  pairingToken: string,
  deviceName: string
): Promise<ServerConnectionConfig> {
  const cleanUrl = serverUrl.replace(/\/+$/, '');

  // 1. Check server health first
  await checkServerHealth(cleanUrl);

  // 2. Perform pairing request
  const body: PairRequestPayload = {
    pairingToken: pairingToken.trim(),
    deviceName: deviceName.trim() || 'Android Device',
    platform: 'android',
  };

  const result = await apiRequest<PairResponsePayload>('/api/pair', {
    method: 'POST',
    body: JSON.stringify(body),
    serverUrl: cleanUrl,
    timeoutMs: 15000,
  });

  const config: ServerConnectionConfig = {
    serverUrl: cleanUrl,
    deviceId: result.deviceId,
    deviceToken: result.deviceToken,
    deviceName: result.deviceName,
    pairedAt: Date.now(),
  };

  // 3. Save to SecureStore
  await saveCredentials(config);

  return config;
}

