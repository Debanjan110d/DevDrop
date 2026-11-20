import os from 'os';

export interface NetworkAddress {
  address: string;
  family: string;
  interface: string;
}

/**
 * Returns all usable LAN IPv4 addresses (non-loopback, non-APIPA).
 */
export function getLanAddresses(): NetworkAddress[] {
  const interfaces = os.networkInterfaces();
  const results: NetworkAddress[] = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (
        addr.family === 'IPv4' &&
        !addr.internal &&
        !addr.address.startsWith('169.254.')
      ) {
        results.push({ address: addr.address, family: addr.family, interface: name });
      }
    }
  }

  return results;
}

/**
 * Returns the first usable LAN IP, or '127.0.0.1' as fallback.
 */
export function getPrimaryLanAddress(): string {
  const addrs = getLanAddresses();
  return addrs[0]?.address ?? '127.0.0.1';
}
