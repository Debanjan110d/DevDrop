import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { createTransferRecord, cancelTransferRecord } from '../api/client';
import { getCredentials } from '../storage/secureStore';
import type { Transfer } from '../../types';

export interface UploadProgressCallback {
  (progress: { bytesSent: number; totalBytes: number; percentage: number }): void;
}

export interface DownloadProgressCallback {
  (progress: { bytesReceived: number; totalBytes: number; percentage: number }): void;
}

/**
 * Upload a local file to the Windows PC server.
 * Streams binary directly from filesystem into raw HTTP body (no Base64, no memory buffering).
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

  // 1. Create transfer record on the server
  const transfer = await createTransferRecord({
    fileName: file.name,
    mimeType: file.mimeType || 'application/octet-stream',
    fileSize: file.size,
    direction: isSendingToPc ? 'mobile-to-pc' : 'pc-to-mobile',
    destinationDeviceId: targetDeviceId,
    idempotencyKey: `upload-${creds.deviceId}-${Date.now()}-${file.name}`,
  });

  // 2. Stream binary file directly to /api/transfers/:id/upload
  const uploadUrl = `${creds.serverUrl.replace(/\/+$/, '')}/api/transfers/${transfer.id}/upload`;

  // Use FileSystemUploadType.BINARY_CONTENT for raw streaming
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
 * Download a file from the Windows PC server directly to local storage.
 * Streams to disk via createDownloadResumable (no memory buffering).
 */
export async function downloadFileFromPc(
  transfer: Transfer,
  onProgress?: DownloadProgressCallback
): Promise<string> {
  const creds = await getCredentials();
  if (!creds) {
    throw new Error('Device is not paired with a PC server');
  }

  const downloadUrl = `${creds.serverUrl.replace(/\/+$/, '')}/api/transfers/${transfer.id}/download`;

  // Target local destination in document / cache directory
  const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
  const sanitizedName = transfer.fileName.replace(/[/\\?%*:|"<>]/g, '_');
  const targetUri = `${baseDir}${Date.now()}_${sanitizedName}`;

  const downloadResumable = FileSystem.createDownloadResumable(
    downloadUrl,
    targetUri,
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

  return result.uri;
}

/**
 * Open native share / save dialog for downloaded file
 */
export async function shareOrSaveFile(fileUri: string, mimeType?: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Native file sharing is not available on this device');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: mimeType || undefined,
    dialogTitle: 'Save or Share DevDrop File',
  });
}

/**
 * Cancel an active transfer
 */
export async function cancelTransfer(transferId: string): Promise<void> {
  await cancelTransferRecord(transferId);
}
