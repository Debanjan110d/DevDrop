import * as Network from 'expo-network';

export interface DiscoveredPeer {
  id: string;
  name: string;
  ip: string;
  port: number;
  nodeType: 'pc' | 'android-peer';
  isOnline: boolean;
  lastSeen: number;
}

export class PeerDiscoveryService {
  private localIp: string | null = null;
  private knownPeers: Map<string, DiscoveredPeer> = new Map();

  async getLocalIp(): Promise<string | null> {
    try {
      this.localIp = await Network.getIpAddressAsync();
      return this.localIp;
    } catch {
      return null;
    }
  }

  /**
   * Fast, non-blocking subnet scan to discover DevDrop nodes (PC or other phones)
   * on the current Wi-Fi network.
   */
  async scanSubnet(
    targetPort: number = 4545,
    onPeerFound?: (peer: DiscoveredPeer) => void
  ): Promise<DiscoveredPeer[]> {
    const myIp = await this.getLocalIp();
    if (!myIp || !myIp.includes('.')) {
      return Array.from(this.knownPeers.values());
    }

    const parts = myIp.split('.');
    if (parts.length !== 4) return Array.from(this.knownPeers.values());
    const subnetBase = `${parts[0]}.${parts[1]}.${parts[2]}.`;
    const myLastOctet = parseInt(parts[3], 10);

    const candidateIps: string[] = [];
    for (let i = 1; i <= 254; i++) {
      if (i !== myLastOctet) {
        candidateIps.push(`${subnetBase}${i}`);
      }
    }

    // Process in batches of 25 concurrent requests with 400ms timeout
    const batchSize = 25;
    for (let i = 0; i < candidateIps.length; i += batchSize) {
      const batch = candidateIps.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (ip) => {
          const peer = await this.probeNode(ip, targetPort);
          if (peer) {
            this.knownPeers.set(peer.id, peer);
            onPeerFound?.(peer);
          }
        })
      );
    }

    return Array.from(this.knownPeers.values());
  }

  /**
   * Probes a specific IP and port to check if it's a running DevDrop node.
   */
  async probeNode(ip: string, port: number = 4545, timeoutMs: number = 400): Promise<DiscoveredPeer | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`http://${ip}:${port}/api/health`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeout);

      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      if (data && (data.ok === true || data.status === 'ok' || data.success === true)) {
        const isMobilePeer = data.nodeType === 'android-peer';
        const name = data.deviceName || (isMobilePeer ? `Phone (${ip})` : `PC Host (${ip})`);
        return {
          id: `${ip}:${port}`,
          name,
          ip,
          port,
          nodeType: isMobilePeer ? 'android-peer' : 'pc',
          isOnline: true,
          lastSeen: Date.now(),
        };
      }
    } catch {
      clearTimeout(timeout);
    }
    return null;
  }

  getCachedPeers(): DiscoveredPeer[] {
    return Array.from(this.knownPeers.values());
  }
}

export const peerDiscovery = new PeerDiscoveryService();
