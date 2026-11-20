import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/state/AppContext';
import { fetchDevices, createPairingSession } from '../../src/services/api/client';
import { COLORS } from '../../src/constants';
import type { Device } from '../../src/types';

export default function DevicesScreen() {
  const router = useRouter();
  const { credentials, serverOnline, checkConnection, unpairDevice } = useApp();
  const [checking, setChecking] = useState(false);
  const [networkDevices, setNetworkDevices] = useState<Device[]>([]);

  // QR Share / Pair Another Phone Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [pairingToken, setPairingToken] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(120);

  const loadNetworkDevices = async () => {
    try {
      const list = await fetchDevices();
      setNetworkDevices(list.filter((d) => d.id !== credentials?.deviceId));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadNetworkDevices();
    const interval = setInterval(loadNetworkDevices, 6000);
    return () => clearInterval(interval);
  }, [credentials?.deviceId]);

  // Countdown timer for pairing QR code
  useEffect(() => {
    if (!isQrModalOpen || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isQrModalOpen, countdown]);

  const handleOpenPairingQr = async () => {
    try {
      setIsQrModalOpen(true);
      setQrLoading(true);
      setCountdown(120);
      const session = await createPairingSession();
      setQrDataUrl(session.qrCodeDataUrl);
      setPairingToken(session.pairingToken);
    } catch (err: any) {
      Alert.alert('Pairing Error', err.message || 'Failed to generate pairing QR code');
      setIsQrModalOpen(false);
    } finally {
      setQrLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setChecking(true);
    const ok = await checkConnection();
    setChecking(false);
    if (ok) {
      Alert.alert('Connection OK', 'Successfully reached DevDrop PC server!');
    } else {
      Alert.alert(
        'Connection Failed',
        'Could not reach the PC server. Make sure PC DevDrop server is running and both devices are on the same Wi-Fi.'
      );
    }
  };

  const handleUnpair = () => {
    Alert.alert(
      'Disconnect from PC?',
      'You will need to scan the QR code again to reconnect with this computer.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await unpairDevice();
            router.replace('/pairing');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* PC Host Card */}
      <View style={styles.card}>
        <Text style={styles.deviceIcon}>💻</Text>
        <Text style={styles.deviceName}>Host Computer</Text>
        <Text style={styles.serverUrl}>{credentials?.serverUrl || 'Not paired'}</Text>

        <View
          style={[
            styles.badge,
            serverOnline ? styles.badgeOnline : styles.badgeOffline,
          ]}
        >
          <Text style={styles.badgeText}>
            {serverOnline ? '● Online & Reachable' : '○ Offline / Unreachable'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>This Phone:</Text>
          <Text style={styles.value}>{credentials?.deviceName || 'Android'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Device ID:</Text>
          <Text style={styles.value} numberOfLines={1}>
            {credentials?.deviceId || '-'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Paired Date:</Text>
          <Text style={styles.value}>
            {credentials?.pairedAt
              ? new Date(credentials.pairedAt).toLocaleDateString()
              : '-'}
          </Text>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.testBtn}
            onPress={handleTestConnection}
            disabled={checking}
          >
            {checking ? (
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <Text style={styles.testBtnText}>Test Connection</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.unpairBtn} onPress={handleUnpair}>
            <Text style={styles.unpairBtnText}>Disconnect Device</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Connect Two Phones / Share Connection Section */}
      <View style={[styles.card, { marginTop: 16 }]}>
        <Text style={styles.sectionTitle}>Connect Another Phone</Text>
        <Text style={styles.sectionSubtitle}>
          Want to connect another phone on the same Wi-Fi? Show a pairing QR code directly on this phone screen so the second phone can scan and connect instantly!
        </Text>

        <TouchableOpacity style={styles.sharePairBtn} onPress={handleOpenPairingQr}>
          <Text style={styles.sharePairIcon}>📲</Text>
          <Text style={styles.sharePairBtnText}>Pair Another Phone (Show QR)</Text>
        </TouchableOpacity>
      </View>

      {/* Other Network Devices List */}
      <View style={[styles.card, { marginTop: 16 }]}>
        <Text style={styles.sectionTitle}>Other Devices on Network ({networkDevices.length})</Text>
        <Text style={styles.sectionSubtitle}>
          Devices currently registered in your local DevDrop workspace.
        </Text>

        {networkDevices.length === 0 ? (
          <Text style={styles.emptyText}>No other devices found on this Wi-Fi yet.</Text>
        ) : (
          networkDevices.map((dev) => {
            const isOnline = dev.status === 'online';
            return (
              <View key={dev.id} style={styles.deviceItem}>
                <Text style={styles.itemIcon}>{dev.platform === 'android' || dev.platform === 'ios' ? '📱' : '💻'}</Text>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{dev.name}</Text>
                  <Text style={styles.itemSub}>
                    Platform: {dev.platform} • Last seen: {new Date(dev.lastSeenAt).toLocaleTimeString()}
                  </Text>
                </View>
                <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
                <Text style={[styles.statusLabel, isOnline ? styles.labelOnline : styles.labelOffline]}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {/* Pairing QR Code Modal */}
      <Modal visible={isQrModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pair Another Phone</Text>
            <Text style={styles.modalSub}>
              Open DevDrop on the other phone and scan this QR code to join the same network:
            </Text>

            {qrLoading ? (
              <ActivityIndicator color={COLORS.primary} size="large" style={{ marginVertical: 40 }} />
            ) : qrDataUrl ? (
              <View style={styles.qrContainer}>
                <Image source={{ uri: qrDataUrl }} style={styles.qrImage} resizeMode="contain" />
                <Text style={styles.tokenLabel}>Manual Code:</Text>
                <Text style={styles.tokenText}>{pairingToken}</Text>
                <Text style={styles.timerText}>Expires in {countdown}s</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setIsQrModalOpen(false)}
            >
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  deviceIcon: {
    fontSize: 48,
    marginBottom: 8,
    alignSelf: 'center',
  },
  deviceName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  serverUrl: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 12,
    alignSelf: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: 'center',
  },
  badgeOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeOffline: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  badgeText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  value: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
    maxWidth: '60%',
  },
  btnRow: {
    width: '100%',
    marginTop: 16,
    gap: 10,
  },
  testBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  unpairBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: COLORS.danger,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  unpairBtnText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: 'bold',
  },
  sharePairBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
  },
  sharePairIcon: {
    fontSize: 20,
  },
  sharePairBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  itemIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  itemSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotOnline: {
    backgroundColor: '#34d399',
  },
  dotOffline: {
    backgroundColor: '#94a3b8',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  labelOnline: {
    color: '#34d399',
  },
  labelOffline: {
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 18,
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 8,
  },
  tokenLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 14,
  },
  tokenText: {
    color: '#38bdf8',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: 2,
  },
  timerText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 6,
    marginBottom: 16,
  },
  closeModalBtn: {
    width: '100%',
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  closeModalText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
