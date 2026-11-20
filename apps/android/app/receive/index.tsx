import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useApp } from '../../src/state/AppContext';
import { downloadFileFromPc, shareOrSaveFile } from '../../src/services/transfers/transfer.service';
import { requestStoragePermissions } from '../../src/services/permissions/storagePermission';
import { COLORS } from '../../src/constants';
import type { Transfer } from '../../src/types';

export default function ReceiveScreen() {
  const { credentials, transfers, refreshTransfers, isLoadingTransfers } = useApp();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Incoming files sent to this phone (from PC or another phone)
  const incomingFiles = transfers.filter((t) => {
    if (credentials?.deviceId && t.sourceDeviceId === credentials.deviceId) {
      return false; // Files sent BY this phone
    }
    return true;
  });

  const handleDownload = async (transfer: Transfer) => {
    try {
      await requestStoragePermissions();
      setDownloadingId(transfer.id);
      setDownloadProgress(0);

      const localUri = await downloadFileFromPc(transfer, ({ percentage }) => {
        setDownloadProgress(percentage);
      });

      await refreshTransfers();

      Alert.alert(
        'Download Complete',
        `"${transfer.fileName}" downloaded successfully! Do you want to save or share it?`,
        [
          { text: 'Later' },
          {
            text: 'Save / Share',
            onPress: () => shareOrSaveFile(localUri, transfer.mimeType).catch(() => {}),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Download Failed', err.message || 'Error downloading file');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoadingTransfers} onRefresh={refreshTransfers} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Incoming Files</Text>
        <Text style={styles.subtitle}>
          Files sent from PC or other phones on the Wi-Fi network appear here ready for download.
        </Text>
      </View>

      {incomingFiles.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📥</Text>
          <Text style={styles.emptyTitle}>No incoming files</Text>
          <Text style={styles.emptyText}>
            When someone sends a file from the PC dashboard or another phone, it will appear here.
          </Text>
        </View>
      ) : (
        incomingFiles.map((transfer) => {
          const isCurrent = downloadingId === transfer.id;
          const senderLabel =
            transfer.sourceDeviceId === 'pc-host' ? 'Host PC' : 'Network Device';

          return (
            <View key={transfer.id} style={styles.card}>
              <View style={styles.fileRow}>
                <Text style={styles.fileIcon}>📄</Text>
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {transfer.fileName}
                  </Text>
                  <Text style={styles.fileMeta}>
                    {(transfer.fileSize / 1024 / 1024).toFixed(2)} MB • From {senderLabel} • {transfer.status}
                  </Text>
                </View>

                {transfer.status === 'available' && !isCurrent ? (
                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={() => handleDownload(transfer)}
                  >
                    <Text style={styles.downloadBtnText}>Download</Text>
                  </TouchableOpacity>
                ) : transfer.status === 'completed' ? (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedText}>✓ Saved</Text>
                  </View>
                ) : null}
              </View>

              {isCurrent ? (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[styles.progressBarFill, { width: `${downloadProgress}%` }]}
                    />
                  </View>
                  <Text style={styles.progressText}>Downloading {downloadProgress}%</Text>
                </View>
              ) : null}
            </View>
          );
        })
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
  header: {
    marginBottom: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
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
    lineHeight: 18,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
    marginRight: 12,
  },
  fileName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  fileMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  downloadBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  downloadBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  completedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  completedText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
});

