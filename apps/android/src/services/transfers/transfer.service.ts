import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { NativeModules } from 'react-native';
import { createTransferRecord, cancelTransferRecord } from '../api/client';
import { getCredentials } from '../storage/secureStore';
import { requestStoragePermissions } from '../permissions/storagePermission';
import type { Transfer } from '../../types';

const { DevDropServerModule } = NativeModules;

export interface UploadProgressCallback {
  (progress: { bytesSent: number; totalBytes: number; percentage: number }): void;
}

export interface DownloadProgressCallback {
  (progress: { bytesReceived: number; totalBytes: number; percentage: number }): void;
}

/**
 * Upload a local file to the Windows PC server.
 * Streams binary directly from filesystem into raw HTTP body.
 */
export async function uploadFileToPc(
  file: {
    uri: string;
    name: string;
    size: number;
    mimeType: string;
  },
  onProgress?: UploadProgressCallback,
  targetDeviceId: string = 'pc-host'
): Promise<Transfer> {
  const creds = await getCredentials();
  if (!creds) {
    throw new Error('Device is not paired with a PC server');
  }

  const isSendingToPc = targetDeviceId === 'pc-host';

  const transfer = await createTransferRecord({
    fileName: file.name,
    mimeType: file.mimeType || 'application/octet-stream',
    fileSize: file.size,
    direction: isSendingToPc ? 'mobile-to-pc' : 'pc-to-mobile',
    destinationDeviceId: targetDeviceId,
    idempotencyKey: `upload-${creds.deviceId}-${Date.now()}-${file.name}`,
  });

  const uploadUrl = `${creds.serverUrl.replace(/\/+$/, '')}/api/transfers/${transfer.id}/upload`;

  const uploadTask = FileSystem.createUploadTask(
    uploadUrl,
    file.uri,
    {
      headers: {
        Authorization: `Bearer ${creds.deviceToken}`,
        'Content-Type': file.mimeType || 'application/octet-stream',
      },
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    },
    (data) => {
      const bytesSent = data.totalBytesSent;
      const totalBytes = data.totalBytesExpectedToSend || file.size;
      const percentage = totalBytes > 0 ? Math.round((bytesSent / totalBytes) * 100) : 0;
      onProgress?.({ bytesSent, totalBytes, percentage });
    }
  );

  const response = await uploadTask.uploadAsync();

  if (!response || response.status < 200 || response.status >= 300) {
    throw new Error(`Upload failed with server status ${response?.status || 'unknown'}`);
  }

  return transfer;
}

/**
 * Download a file from the Windows PC server directly into public Downloads/DevDrop folder.
 */
export async function downloadFileFromPc(
  transfer: Transfer,
  onProgress?: DownloadProgressCallback
): Promise<string> {
  await requestStoragePermissions();

  const creds = await getCredentials();
  if (!creds) {
    throw new Error('Device is not paired with a PC server');
  }

  const downloadUrl = `${creds.serverUrl.replace(/\/+$/, '')}/api/transfers/${transfer.id}/download`;

  // Download first to cache directory
  const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  const sanitizedName = transfer.fileName.replace(/[/\\?%*:|"<>]/g, '_');
  const tempUri = `${baseDir}dl_${Date.now()}_${sanitizedName}`;

  const downloadResumable = FileSystem.createDownloadResumable(
    downloadUrl,
    tempUri,
    {
      headers: {
        Authorization: `Bearer ${creds.deviceToken}`,
      },
    },
    (data) => {
      const bytesReceived = data.totalBytesWritten;
      const totalBytes = data.totalBytesExpectedToWrite || transfer.fileSize;
      const percentage = totalBytes > 0 ? Math.round((bytesReceived / totalBytes) * 100) : 0;
      onProgress?.({ bytesReceived, totalBytes, percentage });
    }
  );

  const result = await downloadResumable.downloadAsync();
  if (!result || !result.uri) {
    throw new Error('Download failed: file not written to storage');
  }

  // Move downloaded file to public Downloads/DevDrop folder
  if (DevDropServerModule?.saveDownloadedFile) {
    try {
      const saved = await DevDropServerModule.saveDownloadedFile(result.uri, transfer.fileName);
      if (saved?.path) {
        return `file://${saved.path}`;
      }
    } catch (saveErr) {
      console.warn('Fallback to cache URI after saveDownloadedFile warning:', saveErr);
    }
  }

  return result.uri;
}

/**
 * Open file in external viewer / gallery or open native system share sheet
 */
export async function openFile(fileUri: string, mimeType?: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('File viewer / sharing is not available on this device');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: mimeType || undefined,
    dialogTitle: 'Open DevDrop File',
  });
}

/**
 * Open native share / save dialog for downloaded file
 */
export async function shareOrSaveFile(fileUri: string, mimeType?: string): Promise<void> {
  await openFile(fileUri, mimeType);
}

/**
 * Cancel an active transfer
 */
export async function cancelTransfer(transferId: string): Promise<void> {
  await cancelTransferRecord(transferId);
}
