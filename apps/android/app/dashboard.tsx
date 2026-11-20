import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../src/state/AppContext';
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
  } = useApp();

  const activeTransfers = transfers.filter(
    (t) => t.status === 'uploading' || t.status === 'downloading' || t.status === 'pending'
  );
  const availableToDownload = transfers.filter(
    (t) => t.status === 'available' && t.sourceDeviceId !== credentials?.deviceId
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoadingTransfers} onRefresh={refreshTransfers} />
      }
    >
      {/* PC Status Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Host Computer</Text>
            <Text style={styles.cardSubtitle}>
              {credentials?.serverUrl || 'Not Connected'}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              serverOnline ? styles.statusOnline : styles.statusOffline,
            ]}
          >
            <Text style={styles.statusText}>
              {serverOnline ? 'Connected' : 'Offline'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Device:</Text>
          <Text style={styles.metaValue}>{credentials?.deviceName || 'Android'}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Socket:</Text>
          <Text style={styles.metaValue}>{socketStatus}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionSend]}
          onPress={() => router.push('/send')}
        >
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionBtnTitle}>Send Files</Text>
          <Text style={styles.actionBtnSub}>Upload to PC</Text>
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
          <Text style={styles.actionBtnTitle}>Receive</Text>
          <Text style={styles.actionBtnSub}>
            {availableToDownload.length > 0
              ? `${availableToDownload.length} waiting`
              : 'Incoming files'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Links */}
      <View style={styles.quickLinksRow}>
        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => router.push('/text')}
        >
          <Text style={styles.quickLinkText}>💬 Quick Text</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => router.push('/history')}
        >
          <Text style={styles.quickLinkText}>📜 History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => router.push('/devices')}
        >
          <Text style={styles.quickLinkText}>📱 Devices</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.quickLinkText}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Active & Recent Transfers */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Transfers</Text>
        <TouchableOpacity onPress={refreshTransfers}>
          <Text style={styles.refreshLink}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {transfers.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No transfers yet</Text>
          <Text style={styles.emptyText}>
            Tap "Send Files" above to send your first file to your computer.
          </Text>
        </View>
      ) : (
        transfers.slice(0, 5).map((t) => (
          <View key={t.id} style={styles.transferItem}>
            <View style={styles.transferIconBox}>
              <Text style={styles.transferIcon}>
                {t.direction === 'mobile-to-pc' ? '⬆️' : '⬇️'}
              </Text>
            </View>
            <View style={styles.transferInfo}>
              <Text style={styles.fileName} numberOfLines={1}>
                {t.fileName}
              </Text>
              <Text style={styles.fileSize}>
                {(t.fileSize / 1024 / 1024).toFixed(2)} MB • {t.status}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                t.status === 'completed'
                  ? styles.badgeSuccess
                  : t.status === 'failed'
                  ? styles.badgeDanger
                  : styles.badgeWarning,
              ]}
            >
              <Text style={styles.badgeText}>{t.status}</Text>
            </View>
          </View>
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
    alignItems: 'center',
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
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
  statusOffline: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
    color: COLORS.textMuted,
    fontSize: 13,
  },
  metaValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  actionSend: {
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  actionReceive: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  receiveIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeCount: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeCountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionBtnTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionBtnSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  quickLinksRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  quickLink: {
    flex: 1,
    backgroundColor: COLORS.card,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  quickLinkText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  refreshLink: {
    color: COLORS.primary,
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
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
    marginRight: 12,
  },
  transferIcon: {
    fontSize: 20,
  },
  transferInfo: {
    flex: 1,
    marginRight: 8,
  },
  fileName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  fileSize: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  badgeDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  badgeText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

