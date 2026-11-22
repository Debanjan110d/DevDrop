import React, { useState, useMemo } from 'react';
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
import { downloadFileFromPc, openFile } from '../../src/services/transfers/transfer.service';
import { requestStoragePermissions } from '../../src/services/permissions/storagePermission';
import { COLORS } from '../../src/constants';
import type { Transfer } from '../../src/types';

type DateFilter = 'all' | 'today' | 'yesterday' | 'previous';

interface DateGroupedTransfers {
  title: string;
  key: DateFilter;
  transfers: Transfer[];
}

export default function ReceiveScreen() {
  const { credentials, transfers, refreshTransfers, isLoadingTransfers } = useApp();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [activeFilter, setActiveFilter] = useState<DateFilter>('all');

  // Filter out transfers initiated by this phone to PC
  const incomingFiles = useMemo(() => {
    return transfers.filter((t) => {
      if (credentials?.deviceId && t.sourceDeviceId === credentials.deviceId) {
        return false;
      }
      return true;
    });
  }, [transfers, credentials?.deviceId]);

  // Date categorization (Today, Yesterday, Previous)
  const groupedSections = useMemo(() => {
    const now = new Date();
    const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const yesterdayStr = todayStr - oneDayMs;

    const todayItems: Transfer[] = [];
    const yesterdayItems: Transfer[] = [];
    const previousItems: Transfer[] = [];

    for (const t of incomingFiles) {
      const itemTime = new Date(t.createdAt).getTime();
      if (itemTime >= todayStr) {
        todayItems.push(t);
      } else if (itemTime >= yesterdayStr) {
        yesterdayItems.push(t);
      } else {
        previousItems.push(t);
      }
    }

    const groups: DateGroupedTransfers[] = [];
    if (todayItems.length > 0) {
      groups.push({ title: 'Today', key: 'today', transfers: todayItems });
    }
    if (yesterdayItems.length > 0) {
      groups.push({ title: 'Yesterday', key: 'yesterday', transfers: yesterdayItems });
    }
    if (previousItems.length > 0) {
      groups.push({ title: 'Previous Dates', key: 'previous', transfers: previousItems });
    }

    return groups;
  }, [incomingFiles]);

  // Filtered list based on active pill
  const displayedGroups = useMemo(() => {
    if (activeFilter === 'all') return groupedSections;
    return groupedSections.filter((g) => g.key === activeFilter);
  }, [groupedSections, activeFilter]);

  const handleOpenFile = async (transfer: Transfer) => {
    try {
      await requestStoragePermissions();

      // If already downloaded or received via direct drop
      if (transfer.status === 'completed') {
        const destPath = (transfer as any).storagePath || (transfer as any).filePath;
        if (destPath) {
          const fileUri = destPath.startsWith('file://') ? destPath : `file://${destPath}`;
          await openFile(fileUri, transfer.mimeType);
          return;
        }
      }

      // If not yet downloaded, download first then open
      setDownloadingId(transfer.id);
      setDownloadProgress(0);

      const localUri = await downloadFileFromPc(transfer, ({ percentage }) => {
        setDownloadProgress(percentage);
      });

      await refreshTransfers();
      await openFile(localUri, transfer.mimeType);
    } catch (err: any) {
      Alert.alert('Cannot Open File', err.message || 'Error downloading or opening file.');
    } finally {
      setDownloadingId(null);
    }
  };

  const getSenderName = (t: Transfer) => {
    if (t.sourceDeviceId === 'pc-host') return 'Host PC';
    return t.sourceDeviceId || 'Nearby Device';
  };

  const getFileIcon = (name: string, mime?: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '') || mime?.startsWith('image/')) return '🖼️';
    if (['mp4', 'mkv', 'mov', 'avi'].includes(ext || '') || mime?.startsWith('video/')) return '🎬';
    if (['pdf'].includes(ext || '')) return '📕';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return '📦';
    if (['apk'].includes(ext || '')) return '🤖';
    if (['mp3', 'wav', 'aac', 'flac'].includes(ext || '') || mime?.startsWith('audio/')) return '🎵';
    if (['txt', 'md', 'json', 'ts', 'js'].includes(ext || '')) return '📝';
    return '📄';
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
        <Text style={styles.title}>Received Files</Text>
        <Text style={styles.subtitle}>
          Tap any file to open it directly in your default viewer.
        </Text>
      </View>

      {/* Storage Folder Indicator */}
      <View style={styles.folderNotice}>
        <Text style={styles.folderNoticeIcon}>📁</Text>
        <Text style={styles.folderNoticeText}>
          Saved to: <Text style={styles.folderNoticePath}>Downloads/DevDrop</Text>
        </Text>
      </View>

      {/* Date Filter Pills */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterPill, activeFilter === 'all' && styles.filterPillActive]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterPillText, activeFilter === 'all' && styles.filterPillTextActive]}>
            All ({incomingFiles.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, activeFilter === 'today' && styles.filterPillActive]}
          onPress={() => setActiveFilter('today')}
        >
          <Text style={[styles.filterPillText, activeFilter === 'today' && styles.filterPillTextActive]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, activeFilter === 'yesterday' && styles.filterPillActive]}
          onPress={() => setActiveFilter('yesterday')}
        >
          <Text style={[styles.filterPillText, activeFilter === 'yesterday' && styles.filterPillTextActive]}>
            Yesterday
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, activeFilter === 'previous' && styles.filterPillActive]}
          onPress={() => setActiveFilter('previous')}
        >
          <Text style={[styles.filterPillText, activeFilter === 'previous' && styles.filterPillTextActive]}>
            Older
          </Text>
        </TouchableOpacity>
      </View>

      {displayedGroups.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📥</Text>
          <Text style={styles.emptyTitle}>No files found</Text>
          <Text style={styles.emptyText}>
            {activeFilter === 'all'
              ? 'Files sent from your PC or other phones on the Wi-Fi network will appear here.'
              : `No files found for this time filter (${activeFilter}).`}
          </Text>
        </View>
      ) : (
        displayedGroups.map((group) => (
          <View key={group.key} style={styles.groupSection}>
            <View style={styles.groupHeaderRow}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <Text style={styles.groupCount}>{group.transfers.length} files</Text>
            </View>

            {group.transfers.map((transfer) => {
              const isDownloading = downloadingId === transfer.id;
              const isCompleted = transfer.status === 'completed';
              const sender = getSenderName(transfer);

              return (
                <TouchableOpacity
                  key={transfer.id}
                  style={styles.card}
                  activeOpacity={0.7}
                  onPress={() => handleOpenFile(transfer)}
                  disabled={isDownloading}
                >
                  <View style={styles.fileRow}>
                    <Text style={styles.fileIcon}>
                      {getFileIcon(transfer.fileName, transfer.mimeType)}
                    </Text>
                    <View style={styles.fileDetails}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {transfer.fileName}
                      </Text>
                      <Text style={styles.fileMeta}>
                        {(transfer.fileSize / 1024 / 1024).toFixed(2)} MB • From {sender}
                      </Text>
                      <Text style={styles.fileTime}>
                        {new Date(transfer.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>

                    <View style={styles.actionCol}>
                      {isDownloading ? (
                        <View style={styles.progressContainer}>
                          <ActivityIndicator size="small" color={COLORS.primary} />
                          <Text style={styles.progressText}>{downloadProgress}%</Text>
                        </View>
                      ) : isCompleted ? (
                        <View style={styles.openBadge}>
                          <Text style={styles.openBadgeText}>Tap to Open 📂</Text>
                        </View>
                      ) : (
                        <View style={styles.downloadBadge}>
                          <Text style={styles.downloadBadgeText}>Download 📥</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
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
    paddingBottom: 40,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  folderNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  folderNoticeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  folderNoticeText: {
    fontSize: 12,
    color: '#c7d2fe',
  },
  folderNoticePath: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  groupSection: {
    marginBottom: 18,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupCount: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    fontSize: 26,
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  fileMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  fileTime: {
    fontSize: 10,
    color: '#64748b',
  },
  actionCol: {
    marginLeft: 8,
  },
  openBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  openBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34d399',
  },
  downloadBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  downloadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  progressText: {
    fontSize: 10,
    color: COLORS.primary,
    marginTop: 2,
    fontWeight: 'bold',
  },
});
