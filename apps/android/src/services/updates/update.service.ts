import * as FileSystem from 'expo-file-system/legacy';
import { nativeServer } from '../nativeServer/nativeServer.service';

export interface UpdateInfo {
  version: string;
  hasUpdate: boolean;
  downloadUrl: string;
  releaseNotes?: string;
}

export class UpdateService {
  private currentVersion = '1.0.0';

  /**
   * Check if a new version of DevDrop is available from the PC server or online repo.
   */
  async checkForUpdates(serverUrl?: string): Promise<UpdateInfo | null> {
    try {
      // 1. First check the local PC server if available
      if (serverUrl) {
        const infoRes = await fetch(`${serverUrl.replace(/\/+$/, '')}/api/server/info`, {
          headers: { Accept: 'application/json' },
        }).catch(() => null);

        if (infoRes && infoRes.ok) {
          const data = await infoRes.json().catch(() => null);
          const serverVersion = data?.data?.version || data?.version;
          if (serverVersion && serverVersion !== this.currentVersion) {
            return {
              version: serverVersion,
              hasUpdate: true,
              downloadUrl: `${serverUrl.replace(/\/+$/, '')}/devdrop.apk`,
              releaseNotes: 'Direct update from PC server',
            };
          }
        }
      }

      // 2. Online GitHub check fallback
      const ghRes = await fetch(
        'https://raw.githubusercontent.com/Debanjan110d/DevDrop/main/package.json'
      ).catch(() => null);

      if (ghRes && ghRes.ok) {
        const pkg = await ghRes.json().catch(() => null);
        if (pkg?.version && pkg.version !== this.currentVersion) {
          return {
            version: pkg.version,
            hasUpdate: true,
            downloadUrl: 'https://raw.githubusercontent.com/Debanjan110d/DevDrop/main/apps/web/public/devdrop.apk',
            releaseNotes: 'Official DevDrop GitHub release update',
          };
        }
      }
    } catch (err) {
      console.warn('Update check note:', err);
    }
    return null;
  }

  /**
   * Download and trigger direct installation of APK
   */
  async downloadAndInstallUpdate(
    downloadUrl: string,
    onProgress?: (progress: { bytesReceived: number; totalBytes: number; percentage: number }) => void
  ): Promise<boolean> {
    const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    const targetFile = `${baseDir}devdrop_update_${Date.now()}.apk`;

    const downloadTask = FileSystem.createDownloadResumable(
      downloadUrl,
      targetFile,
      {},
      (data) => {
        const bytesReceived = data.totalBytesWritten;
        const totalBytes = data.totalBytesExpectedToWrite || 0;
        const percentage = totalBytes > 0 ? Math.round((bytesReceived / totalBytes) * 100) : 0;
        onProgress?.({ bytesReceived, totalBytes, percentage });
      }
    );

    const result = await downloadTask.downloadAsync();
    if (!result?.uri) {
      throw new Error('Failed to download update APK');
    }

    // Trigger Android package installer
    return await nativeServer.installApk(result.uri);
  }
}

export const updateService = new UpdateService();

