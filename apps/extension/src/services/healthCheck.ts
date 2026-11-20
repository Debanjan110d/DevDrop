const BASE_URL = 'http://localhost:4545';

export interface DeviceInfo {
  id: string;
  name: string;
  platform: string;
  status: 'online' | 'offline';
}

export interface HealthResult {
  ok: boolean;
  address?: string | undefined;
  networkAddress?: string | undefined;
  version?: string | undefined;
  devices?: DeviceInfo[] | undefined;
  storageDir?: string | undefined;
  error?: string | undefined;
}

export async function checkHealth(): Promise<HealthResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    // Try /api/health first, then /health
    let healthRes: Response | null = null;
    try {
      healthRes = await fetch(`${BASE_URL}/api/health`, {
        signal: controller.signal,
        cache: 'no-store',
      });
    } catch {
      healthRes = await fetch(`${BASE_URL}/health`, {
        signal: controller.signal,
        cache: 'no-store',
      });
    }

    clearTimeout(timeoutId);

    if (!healthRes.ok) {
      return { ok: false, error: `HTTP ${healthRes.status}` };
    }

    // Try to get server info
    let networkAddress: string | undefined;
    let version = '1.0.0';
    let storageDir: string | undefined;

    try {
      const infoRes = await fetch(`${BASE_URL}/api/server/info`);
      if (infoRes.ok) {
        const infoData = await infoRes.json();
        networkAddress = infoData.data?.networkAddress;
        version = infoData.data?.version ?? version;
        storageDir = infoData.data?.storageDir;
      }
    } catch {
      // Non-critical
    }

    // Try to get paired devices
    let devices: DeviceInfo[] = [];
    try {
      const devRes = await fetch(`${BASE_URL}/api/devices`);
      if (devRes.ok) {
        const devData = await devRes.json();
        if (Array.isArray(devData.data)) {
          devices = devData.data.map((d: any) => ({
            id: d.id,
            name: d.name,
            platform: d.platform,
            status: d.status ?? 'offline',
          }));
        }
      }
    } catch {
      // Non-critical
    }

    return {
      ok: true,
      address: BASE_URL,
      networkAddress,
      version,
      devices,
      storageDir,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connection failed';
    return { ok: false, error: message };
  }
}
