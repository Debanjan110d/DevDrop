import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../../constants';
import type { ServerConnectionConfig } from '../../types';

export async function saveCredentials(config: ServerConnectionConfig): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(STORAGE_KEYS.SERVER_URL, config.serverUrl),
    SecureStore.setItemAsync(STORAGE_KEYS.DEVICE_ID, config.deviceId),
    SecureStore.setItemAsync(STORAGE_KEYS.DEVICE_TOKEN, config.deviceToken),
    SecureStore.setItemAsync(STORAGE_KEYS.DEVICE_NAME, config.deviceName),
    SecureStore.setItemAsync(STORAGE_KEYS.PAIRED_AT, config.pairedAt.toString()),
  ]);
}

export async function getCredentials(): Promise<ServerConnectionConfig | null> {
  const [serverUrl, deviceId, deviceToken, deviceName, pairedAtStr] = await Promise.all([
    SecureStore.getItemAsync(STORAGE_KEYS.SERVER_URL),
    SecureStore.getItemAsync(STORAGE_KEYS.DEVICE_ID),
    SecureStore.getItemAsync(STORAGE_KEYS.DEVICE_TOKEN),
    SecureStore.getItemAsync(STORAGE_KEYS.DEVICE_NAME),
    SecureStore.getItemAsync(STORAGE_KEYS.PAIRED_AT),
  ]);

  if (!serverUrl || !deviceId || !deviceToken) {
    return null;
  }

  return {
    serverUrl,
    deviceId,
    deviceToken,
    deviceName: deviceName || 'Android Device',
    pairedAt: pairedAtStr ? parseInt(pairedAtStr, 10) : Date.now(),
  };
}

export async function clearCredentials(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEYS.SERVER_URL),
    SecureStore.deleteItemAsync(STORAGE_KEYS.DEVICE_ID),
    SecureStore.deleteItemAsync(STORAGE_KEYS.DEVICE_TOKEN),
    SecureStore.deleteItemAsync(STORAGE_KEYS.DEVICE_NAME),
    SecureStore.deleteItemAsync(STORAGE_KEYS.PAIRED_AT),
    SecureStore.deleteItemAsync(STORAGE_KEYS.PC_NAME),
  ]);
}

