import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../src/state/AppContext';
import { updateService, type UpdateInfo } from '../src/services/updates/update.service';
import { COLORS } from '../src/constants';

export default function DashboardScreen() {
  const router = useRouter();
  const {
    isPaired,
    credentials,
    serverOnline,
    socketStatus,
    transfers,
    refreshTransfers,
    isLoadingTransfers,
    localIp,
    listeningPort,
    isServerRunning,
    nearbyPeers,
    isScanningPeers,
    scanNearbyPeers,
    latestDirectDrop,
    clearLatestDirectDrop,
  } = useApp();

  // In-app Update state
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isDownloadingUpdate, setIsDownloadingUpdate] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const info = await updateService.checkForUpdates(credentials?.serverUrl);
        if (info && info.hasUpdate) {
          setUpdateInfo(info);
        }
      } catch {
        // ignore
      }
    })();
  }, [credentials?.serverUrl]);

  const handleDownloadUpdate = async () => {
    if (!updateInfo?.downloadUrl) return;
    try {
      setIsDownloadingUpdate(true);
      setUpdateProgress(0);
      await updateService.downloadAndInstallUpdate(
        updateInfo.downloadUrl,
        ({ percentage }) => setUpdateProgress(percentage)
      );
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not download or install update.');
    } finally {
      setIsDownloadingUpdate(false);
    }
  };

  const availableToDownload = transfers.filter(
    (t) => t.status === 'available' && t.sourceDeviceId !== credentials?.deviceId
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isLoadingTransfers || isScanningPeers}
          onRefresh={() => {
            refreshTransfers();
            scanNearbyPeers();
          }}
        />
      }
    >
      {/* Update Available Notification Banner */}
      {updateInfo && updateInfo.hasUpdate ? (
        <View style={styles.updateBanner}>
          <View style={styles.updateLeft}>
            <Text style={styles.updateTitle}>
              🚀 New Update Available (v{updateInfo.version})
            </Text>
            <Text style={styles.updateSub}>
              {isDownloadingUpdate
                ? `Downloading update: ${updateProgress}%`
                : 'Tap Install to update DevDrop directly on this device.'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.updateBtn, isDownloadingUpdate && styles.updateBtnBusy]}
            onPress={handleDownloadUpdate}
            disabled={isDownloadingUpdate}
          >
            {isDownloadingUpdate ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.updateBtnText}>Install</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Direct Drop Alert Banner */}
      {latestDirectDrop ? (
        <View style={styles.directDropBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.directDropTitle}>
              {latestDirectDrop.type === 'file' ? '📁 File Received' : '💬 Quick Text Received'}
            </Text>
            <Text style={styles.directDropSub} numberOfLines={1}>
              {latestDirectDrop.type === 'file'
                ? `"${latestDirectDrop.name}" from ${latestDirectDrop.sender}`
                : `"${latestDirectDrop.text}" from ${latestDirectDrop.sender}`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.directDropBtn}
            onPress={() => {
              clearLatestDirectDrop();
              router.push(latestDirectDrop.type === 'file' ? '/receive' : '/text');
            }}
          >
            <Text style={styles.directDropBtnText}>View</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Network & Host Status Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>
              {serverOnline ? 'Host Computer (PC)' : 'Local Wi-Fi Network'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {serverOnline
                ? credentials?.serverUrl
                : `Autonomous P2P • Direct IP: ${localIp || 'Connecting...'}:${listeningPort}`}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              serverOnline
                ? styles.statusOnline
                : isServerRunning
                ? styles.statusP2P
                : styles.statusOffline,
            ]}
          >
            <Text style={styles.statusText}>
              {serverOnline ? 'PC Online' : isServerRunning ? 'P2P Active' : 'Offline'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Device:</Text>
          <Text style={styles.metaValue}>{credentials?.deviceName || 'Android Device'}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Save Folder:</Text>
          <Text style={[styles.metaValue, { color: '#818cf8', fontWeight: 'bold' }]}>
            Downloads/DevDrop
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Local Listener:</Text>
          <Text style={styles.metaValue}>
            {isServerRunning ? `Listening on port ${listeningPort}` : 'Starting...'}
          </Text>
        </View>
      </View>

      {/* Quick QR Connect Bar */}
      <View style={styles.qrBarContainer}>
        <TouchableOpacity
          style={[styles.qrBarBtn, styles.qrBarScan]}
          onPress={() => router.push('/pairing')}
        >
          <Text style={styles.qrBarBtnIcon}>📷</Text>
          <Text style={styles.qrBarBtnText}>Scan QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.qrBarBtn, styles.qrBarShow]}
          onPress={() => router.push('/devices')}
        >
          <Text style={styles.qrBarBtnIcon}>📲</Text>
          <Text style={styles.qrBarBtnText}>Show My QR</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionSend]}
          onPress={() => router.push('/send')}
        >
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionBtnTitle}>Send Files</Text>
          <Text style={styles.actionBtnSub}>PC or Nearby Phones</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionReceive]}
          onPress={() => router.push('/receive')}
        >
          <View style={styles.receiveIconRow}>
            <Text style={styles.actionIcon}>📥</Text>
            {availableToDownload.length > 0 ? (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{availableToDownload.length}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.actionBtnTitle}>Received Files</Text>
          <Text style={styles.actionBtnSub}>
            {availableToDownload.length > 0
              ? `${availableToDownload.length} waiting • Tap to open`
              : 'Tap to open files'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Links */}
      <View style={styles.quickLinksRow}>
        <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/text')}>
          <Text style={styles.quickLinkText}>💬 Quick Text</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/history')}>
          <Text style={styles.quickLinkText}>📜 History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/devices')}>
          <Text style={styles.quickLinkText}>📱 Devices</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/settings')}>
          <Text style={styles.quickLinkText}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Discovered Nearby Devices on Wi-Fi */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Nearby Devices on Wi-Fi ({nearbyPeers.length})
        </Text>
        <TouchableOpacity onPress={scanNearbyPeers} disabled={isScanningPeers}>
          <Text style={styles.refreshLink}>
            {isScanningPeers ? 'Scanning...' : 'Scan Subnet'}
          </Text>
        </TouchableOpacity>
      </View>

      {nearbyPeers.length === 0 ? (
        <View style={styles.emptyPeerCard}>
          <Text style={styles.emptyPeerText}>
            {isScanningPeers
              ? 'Searching for other DevDrop devices on Wi-Fi...'
              : 'No other devices detected on this Wi-Fi yet. Tap "Scan Subnet" to search.'}
          </Text>
        </View>
      ) : (
        nearbyPeers.map((peer) => (
          <View key={peer.id} style={styles.peerCard}>
            <View style={styles.peerIconBox}>
              <Text style={{ fontSize: 20 }}>
                {peer.nodeType === 'android-peer' ? '📱' : '💻'}
              </Text>
            </View>
            <View style={styles.peerDetails}>
              <Text style={styles.peerName}>{peer.name}</Text>
              <Text style={styles.peerIp}>
                {peer.ip}:{peer.port} • {peer.nodeType === 'android-peer' ? 'Android' : 'PC'}
              </Text>
            </View>
            <View style={styles.peerActions}>
              <TouchableOpacity
                style={styles.peerBtn}
                onPress={() => router.push('/send')}
              >
                <Text style={styles.peerBtnText}>Send</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.peerBtn, { backgroundColor: '#38bdf8' }]}
                onPress={() => router.push('/text')}
              >
                <Text style={styles.peerBtnText}>Text</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Active & Recent Transfers */}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.sectionTitle}>Recent Transfers</Text>
        <TouchableOpacity onPress={refreshTransfers}>
          <Text style={styles.refreshLink}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {transfers.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No transfers yet</Text>
          <Text style={styles.emptyText}>
            Tap "Send Files" above to send your first file to your computer or another phone.
          </Text>
        </View>
      ) : (
        transfers.slice(0, 5).map((t) => (
          <TouchableOpacity
            key={t.id}
            style={styles.transferItem}
            activeOpacity={0.7}
            onPress={() => router.push('/receive')}
          >
            <View style={styles.transferIconBox}>
              <Text style={{ fontSize: 18 }}>
                {t.direction === 'pc-to-mobile' ? '📥' : '📤'}
              </Text>
            </View>
            <View style={styles.transferDetails}>
              <Text style={styles.transferName} numberOfLines={1}>
                {t.fileName}
              </Text>
              <Text style={styles.transferMeta}>
                {(t.fileSize / 1024 / 1024).toFixed(2)} MB • {t.status}
              </Text>
            </View>
            <View style={styles.transferStatusBox}>
              <Text
                style={[
                  styles.transferStatusText,
                  t.status === 'completed'
                    ? styles.statusCompleted
                    : styles.statusPending,
                ]}
              >
                {t.status === 'completed' ? 'Open' : t.status}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  updateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366f1',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  updateLeft: {
    flex: 1,
    marginRight: 10,
  },
  updateTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  updateSub: {
    fontSize: 11,
    color: '#c7d2fe',
    lineHeight: 15,
  },
  updateBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  updateBtnBusy: {
    backgroundColor: '#4338ca',
  },
  updateBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  directDropBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  directDropTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#34d399',
  },
  directDropSub: {
    fontSize: 11,
    color: '#e2e8f0',
    marginTop: 2,
  },
  directDropBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  directDropBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusP2P: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  statusOffline: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  metaValue: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  qrBarContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  qrBarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  qrBarScan: {
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderColor: '#0284c7',
  },
  qrBarShow: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366f1',
  },
  qrBarBtnIcon: {
    fontSize: 16,
  },
  qrBarBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSend: {
    backgroundColor: '#4f46e5',
  },
  actionReceive: {
    backgroundColor: '#059669',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  actionBtnTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  actionBtnSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  receiveIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeCount: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
    marginBottom: 6,
  },
  badgeCountText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  quickLinksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  quickLink: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  quickLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refreshLink: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyPeerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
  },
  emptyPeerText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  peerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  peerIconBox: {
    marginRight: 10,
  },
  peerDetails: {
    flex: 1,
  },
  peerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  peerIp: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  peerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  peerBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  peerBtnText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  transferItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  transferIconBox: {
    marginRight: 10,
  },
  transferDetails: {
    flex: 1,
  },
  transferName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  transferMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  transferStatusBox: {
    marginLeft: 8,
  },
  transferStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    color: '#34d399',
  },
  statusPending: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    color: '#facc15',
  },
});
