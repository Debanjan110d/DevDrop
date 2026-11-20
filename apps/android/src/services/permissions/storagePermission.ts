import { PermissionsAndroid, Platform } from 'react-native';

export async function requestStoragePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const androidVersion = typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10);

    if (androidVersion >= 33) {
      const statuses = await PermissionsAndroid.requestMultiple([
        'android.permission.READ_MEDIA_IMAGES' as any,
        'android.permission.READ_MEDIA_VIDEO' as any,
        'android.permission.READ_MEDIA_AUDIO' as any,
      ]);

      const imagesGranted = statuses['android.permission.READ_MEDIA_IMAGES'] === PermissionsAndroid.RESULTS.GRANTED;
      const videoGranted = statuses['android.permission.READ_MEDIA_VIDEO'] === PermissionsAndroid.RESULTS.GRANTED;
      return imagesGranted || videoGranted;
    } else {
      const statuses = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ]);

      return (
        statuses[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED ||
        statuses[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED
      );
    }
  } catch (err) {
    console.warn('Failed to request storage permissions:', err);
    return false;
  }
}

