import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { DevDropServerModule } = NativeModules;

export interface DirectFileEvent {
  fileName: string;
  filePath: string;
  fileSize: number;
  senderName: string;
  timestamp: number;
}

export interface DirectTextEvent {
  text: string;
  senderName: string;
  timestamp: number;
}

export interface DirectProgressEvent {
  bytesRead: number;
  totalBytes: number;
  percentage: number;
}

class NativeServerService {
  private emitter: NativeEventEmitter | null = null;
  private isAvailable: boolean = false;

  constructor() {
    if (Platform.OS === 'android' && DevDropServerModule) {
      this.isAvailable = true;
      this.emitter = new NativeEventEmitter(DevDropServerModule);
    }
  }

  async startServer(
    port: number = 4545,
    deviceName: string = 'Android Device'
  ): Promise<{ success: boolean; port: number; isRunning: boolean }> {
    if (!this.isAvailable || !DevDropServerModule) {
      return { success: false, port: 0, isRunning: false };
    }
    return await DevDropServerModule.startServer(port, deviceName);
  }

  async stopServer(): Promise<{ success: boolean; isRunning: boolean }> {
    if (!this.isAvailable || !DevDropServerModule) {
      return { success: false, isRunning: false };
    }
    return await DevDropServerModule.stopServer();
  }

  async getStatus(): Promise<{ isRunning: boolean; port: number }> {
    if (!this.isAvailable || !DevDropServerModule) {
      return { isRunning: false, port: 0 };
    }
    return await DevDropServerModule.getStatus();
  }

  async installApk(apkPath: string): Promise<boolean> {
    if (!this.isAvailable || !DevDropServerModule) return false;
    return await DevDropServerModule.installApk(apkPath);
  }

  onFileReceived(callback: (event: DirectFileEvent) => void) {
    if (!this.emitter) return () => {};
    const sub = this.emitter.addListener('onDirectFileReceived', (evt: any) => callback(evt as DirectFileEvent));
    return () => sub.remove();
  }

  onTextReceived(callback: (event: DirectTextEvent) => void) {
    if (!this.emitter) return () => {};
    const sub = this.emitter.addListener('onDirectTextReceived', (evt: any) => callback(evt as DirectTextEvent));
    return () => sub.remove();
  }

  onProgress(callback: (event: DirectProgressEvent) => void) {
    if (!this.emitter) return () => {};
    const sub = this.emitter.addListener('onDirectTransferProgress', (evt: any) => callback(evt as DirectProgressEvent));
    return () => sub.remove();
  }
}

export const nativeServer = new NativeServerService();
