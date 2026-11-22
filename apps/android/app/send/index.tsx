import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { uploadFileToPc } from '../../src/services/transfers/transfer.service';
import { sendDirectFile } from '../../src/services/network/directTransfer.service';
import { fetchDevices } from '../../src/services/api/client';
import { requestStoragePermissions } from '../../src/services/permissions/storagePermission';
import { useApp } from '../../src/state/AppContext';
import { COLORS } from '../../src/constants';
import type { Device } from '../../src/types';

interface SelectedFile {
  name: string;
  size: number;
  uri: string;
  mimeType: string;
}

export default function SendScreen() {
  const router = useRouter();
  const { credentials, refreshTransfers, nearbyPeers, serverOnline } = useApp();
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [currentFileProgress, setCurrentFileProgress] = useState(0);
  const [currentBytesSent, setCurrentBytesSent] = useState(0);
  const [currentTotalBytes, setCurrentTotalBytes] = useState(0);

  // Device destination state
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('pc-host');
  const [loadingDevices, setLoadingDevices] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoadingDevices(true);
        const list = await fetchDevices();
        // Filter out current phone
        const others = list.filter((d) => d.id !== credentials?.deviceId && d.platform !== 'server');
        setDevices(others);
      } catch (err) {
        // PC is always default target
      } finally {
        setLoadingDevices(false);
      }
    })();
  }, [credentials?.deviceId]);

  const handlePickDocuments = async () => {
    try {
      await requestStoragePermissions();

      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newFiles: SelectedFile[] = result.assets.map((asset) => ({
          name: asset.name,
          size: asset.size || 0,
          uri: asset.uri,
          mimeType: asset.mimeType || 'application/octet-stream',
        }));

        setSelectedFiles((prev) => {
          // Deduplicate by uri
          const existingUris = new Set(prev.map((f) => f.uri));
          const filtered = newFiles.filter((f) => !existingUris.has(f.uri));
          return [...prev, ...filtered];
        });
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to pick files: ' + err.message);
    }
  };

  const removeFile = (index: number) => {
    if (isUploading) return;
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    if (isUploading) return;
    setSelectedFiles([]);
  };

  const getTargetName = () => {
    if (selectedTargetId === 'pc-host') return 'Host PC';
    if (selectedTargetId.startsWith('peer:')) {
      const parts = selectedTargetId.split(':');
      const peer = nearbyPeers.find((p) => p.ip === parts[1]);
      return peer ? peer.name : `Peer (${parts[1]})`;
    }
    const d = devices.find((dev) => dev.id === selectedTargetId);
    return d?.name || 'Selected Device';
  };

  const totalBatchSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setIsUploading(true);

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]!;
        setCurrentFileIndex(i);
        setCurrentFileProgress(0);
        setCurrentBytesSent(0);
        setCurrentTotalBytes(file.size);

        if (selectedTargetId.startsWith('peer:')) {
          const parts = selectedTargetId.split(':');
          const peerIp = parts[1];
          const peerPort = parseInt(parts[2], 10) || 4545;
          await sendDirectFile(
            peerIp,
            peerPort,
            file,
            credentials?.deviceName || 'Android Device',
            ({ percentage, bytesSent, totalBytes }) => {
              setCurrentFileProgress(percentage);
              setCurrentBytesSent(bytesSent);
              setCurrentTotalBytes(totalBytes);
            }
          );
        } else {
          await uploadFileToPc(
            file,
            ({ percentage, bytesSent, totalBytes }) => {
              setCurrentFileProgress(percentage);
              setCurrentBytesSent(bytesSent);
              setCurrentTotalBytes(totalBytes);
            },
            selectedTargetId
          );
        }
      }

      await refreshTransfers();

      Alert.alert(
        'Success',
        `Successfully transferred all ${selectedFiles.length} file(s) to ${getTargetName()}!`,
        [{ text: 'OK', onPress: () => router.replace('/dashboard') }]
      );
    } catch (err: any) {
      Alert.alert('Upload Interrupted', err.message || 'Network error during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const currentFile = selectedFiles[currentFileIndex];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Target Device Selection */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Select Destination</Text>
        <Text style={styles.subtitle}>
          Send directly to your PC or another phone on the same Wi-Fi network.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deviceRow}>
          {/* PC Host Option */}
          <TouchableOpacity
            style={[
              styles.deviceChip,
              selectedTargetId === 'pc-host' && styles.deviceChipSelected,
            ]}
            onPress={() => !isUploading && setSelectedTargetId('pc-host')}
          >
            <Text style={styles.chipIcon}>💻</Text>
            <View>
              <Text
                style={[
                  styles.chipName,
                  selectedTargetId === 'pc-host' && styles.chipNameSelected,
                ]}
              >
                Host PC
              </Text>
              <Text style={styles.chipSub}>
                {serverOnline ? 'Online (Hub)' : 'Offline'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Discovered Wi-Fi Peers (Phones, Tablets) */}
          {nearbyPeers.map((peer) => {
            const peerTargetId = `peer:${peer.ip}:${peer.port}`;
            const isSelected = selectedTargetId === peerTargetId;
            return (
              <TouchableOpacity
                key={peer.id}
                style={[
                  styles.deviceChip,
                  isSelected && styles.deviceChipSelected,
                  { borderColor: isSelected ? COLORS.primary : 'rgba(99, 102, 241, 0.4)' },
                ]}
                onPress={() => !isUploading && setSelectedTargetId(peerTargetId)}
              >
                <Text style={styles.chipIcon}>
                  {peer.nodeType === 'android-peer' ? '📱' : '💻'}
                </Text>
                <View>
                  <Text
                    style={[
                      styles.chipName,
                      isSelected && styles.chipNameSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {peer.name}
                  </Text>
                  <Text style={[styles.chipSub, styles.onlineText]}>
                    Wi-Fi Direct
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Other Phones / Devices */}
          {devices.map((device) => {
            const isSelected = selectedTargetId === device.id;
            const isOnline = device.status === 'online';
            return (
              <TouchableOpacity
                key={device.id}
                style={[
                  styles.deviceChip,
                  isSelected && styles.deviceChipSelected,
                ]}
                onPress={() => !isUploading && setSelectedTargetId(device.id)}
              >
                <Text style={styles.chipIcon}>📱</Text>
                <View>
                  <Text
                    style={[
                      styles.chipName,
                      isSelected && styles.chipNameSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {device.name}
                  </Text>
                  <Text
                    style={[
                      styles.chipSub,
                      isOnline ? styles.onlineText : styles.offlineText,
                    ]}
                  >
                    {isOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* File Selection Card */}
      <View style={[styles.card, { marginTop: 16 }]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Files to Send</Text>
          {selectedFiles.length > 0 && !isUploading && (
            <TouchableOpacity onPress={clearAllFiles}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.subtitle}>
          Select one or multiple files to stream over your local Wi-Fi.
        </Text>

        {selectedFiles.length === 0 ? (
          <TouchableOpacity style={styles.dropZone} onPress={handlePickDocuments}>
            <Text style={styles.dropIcon}>📁</Text>
            <Text style={styles.dropText}>Tap to select files (Multiple allowed)</Text>
            <Text style={styles.dropSub}>Photos, Videos, PDFs, ZIPs, APKs, or any file</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.fileListCard}>
            {/* Header info */}
            <View style={styles.batchSummaryRow}>
              <Text style={styles.batchCountText}>
                {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
              </Text>
              <Text style={styles.batchSizeText}>
                {(totalBatchSize / 1024 / 1024).toFixed(2)} MB total
              </Text>
            </View>

            {/* List of files */}
            <View style={styles.itemsList}>
              {selectedFiles.map((file, idx) => {
                const isCurrentlyUploading = isUploading && currentFileIndex === idx;
                const isDone = isUploading && currentFileIndex > idx;

                return (
                  <View key={file.uri + idx} style={styles.fileItemRow}>
                    <Text style={styles.fileRowIcon}>
                      {isDone ? '✓' : isCurrentlyUploading ? '⏳' : '📄'}
                    </Text>
                    <View style={styles.fileRowDetails}>
                      <Text style={styles.fileRowName} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Text style={styles.fileRowMeta}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                        {isDone ? ' • Transferred' : isCurrentlyUploading ? ' • Uploading...' : ''}
                      </Text>
                    </View>
                    {!isUploading && (
                      <TouchableOpacity
                        onPress={() => removeFile(idx)}
                        style={styles.removeBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={styles.removeBtnText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>

            {/* In-Flight Upload Progress */}
            {isUploading && currentFile && (
              <View style={styles.progressContainer}>
                <View style={styles.currentUploadHeader}>
                  <Text style={styles.currentUploadTitle} numberOfLines={1}>
                    Sending ({currentFileIndex + 1}/{selectedFiles.length}): {currentFile.name}
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${currentFileProgress}%` }]} />
                </View>
                <View style={styles.progressMeta}>
                  <Text style={styles.progressText}>{currentFileProgress}%</Text>
                  <Text style={styles.progressText}>
                    {(currentBytesSent / 1024 / 1024).toFixed(2)} / {(currentTotalBytes / 1024 / 1024).toFixed(2)} MB
                  </Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.btnRow}>
              {!isUploading ? (
                <>
                  <TouchableOpacity
                    style={styles.btnSecondary}
                    onPress={handlePickDocuments}
                  >
                    <Text style={styles.btnSecondaryText}>+ Add More</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnPrimary} onPress={handleUploadAll}>
                    <Text style={styles.btnPrimaryText}>
                      Send {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''} Now
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.uploadingNotice}>
                  <ActivityIndicator color={COLORS.primary} size="small" />
                  <Text style={styles.uploadingText}>
                    Streaming file {currentFileIndex + 1} of {selectedFiles.length} to {getTargetName()}...
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
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
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearAllText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '500',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14,
  },
  deviceRow: {
    flexDirection: 'row',
  },
  deviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  deviceChipSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: COLORS.primary,
  },
  chipIcon: {
    fontSize: 20,
  },
  chipName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 120,
  },
  chipNameSelected: {
    color: '#818cf8',
  },
  chipSub: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  onlineText: {
    color: '#34d399',
  },
  offlineText: {
    color: '#94a3b8',
  },
  dropZone: {
    borderWidth: 2,
    borderColor: '#374151',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
  },
  dropIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  dropText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  dropSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  fileListCard: {
    backgroundColor: '#1f2937',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  batchSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    marginBottom: 10,
  },
  batchCountText: {
    color: '#818cf8',
    fontSize: 13,
    fontWeight: '600',
  },
  batchSizeText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  itemsList: {
    gap: 8,
    maxHeight: 260,
  },
  fileItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  fileRowIcon: {
    fontSize: 18,
    marginRight: 10,
    color: '#818cf8',
  },
  fileRowDetails: {
    flex: 1,
  },
  fileRowName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  fileRowMeta: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  removeBtn: {
    padding: 6,
  },
  removeBtnText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  currentUploadHeader: {
    marginBottom: 6,
  },
  currentUploadTitle: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  btnPrimary: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4b5563',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: COLORS.text,
    fontSize: 14,
  },
  uploadingNotice: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  uploadingText: {
    color: COLORS.text,
    fontSize: 13,
  },
});
