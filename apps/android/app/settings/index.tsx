import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/state/AppContext';
import { COLORS } from '../../src/constants';

export default function SettingsScreen() {
  const router = useRouter();
  const { credentials, unpairDevice } = useApp();

  const handleUnpair = () => {
    Alert.alert(
      'Reset & Disconnect',
      'Are you sure you want to disconnect from your PC? All local connection keys will be cleared.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset & Disconnect',
          style: 'destructive',
          onPress: async () => {
            await unpairDevice();
            router.replace('/pairing');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* App Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Application</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>App Name</Text>
            <Text style={styles.value}>DevDrop Native</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Version</Text>
            <Text style={styles.value}>1.0.0</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Framework</Text>
            <Text style={styles.value}>React Native + Expo SDK 58</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Platform</Text>
            <Text style={styles.value}>Android</Text>
          </View>
        </View>
      </View>

      {/* Network & Transfer Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transfer Protocol</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Transport</Text>
            <Text style={styles.value}>Raw Binary Stream (HTTP/1.1)</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Events</Text>
            <Text style={styles.value}>Socket.IO WebSocket</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Direct LAN</Text>
            <Text style={styles.value}>Enabled (No Cloud)</Text>
          </View>
        </View>
      </View>

      {/* Storage Folder Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage & Permissions</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Save Directory</Text>
            <Text style={[styles.value, { color: '#818cf8', fontWeight: 'bold' }]}>
              Downloads/DevDrop
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Access Type</Text>
            <Text style={styles.value}>Public Downloads (User Visible)</Text>
          </View>
          <TouchableOpacity
            style={[styles.dangerBtn, { backgroundColor: '#4f46e5', marginTop: 12 }]}
            onPress={async () => {
              const { requestStoragePermissions } = await import('../../src/services/permissions/storagePermission');
              const granted = await requestStoragePermissions();
              Alert.alert(
                'Storage Permission',
                granted ? 'Storage permission is granted! Files will save to Downloads/DevDrop.' : 'Storage permission was not granted.'
              );
            }}
          >
            <Text style={styles.dangerBtnText}>Check / Grant Storage Permission</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Updates Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Software Updates</Text>
        <View style={styles.card}>
          <Text style={styles.dangerNotice}>
            DevDrop can check for and download official APK updates directly over Wi-Fi or GitHub.
          </Text>
          <TouchableOpacity
            style={[styles.dangerBtn, { backgroundColor: '#059669', marginTop: 8 }]}
            onPress={async () => {
              const { updateService } = await import('../../src/services/updates/update.service');
              const info = await updateService.checkForUpdates(credentials?.serverUrl);
              if (info && info.hasUpdate) {
                Alert.alert(
                  'Update Found!',
                  `DevDrop v${info.version} is available. Do you want to download and install it now?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Install Now',
                      onPress: () => updateService.downloadAndInstallUpdate(info.downloadUrl),
                    },
                  ]
                );
              } else {
                Alert.alert('Up to Date', 'You are running the latest version of DevDrop (v1.0.0).');
              }
            }}
          >
            <Text style={styles.dangerBtnText}>Check for Updates Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Connection Reset */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <View style={styles.card}>
          <Text style={styles.dangerNotice}>
            Disconnecting will remove saved PC pairing keys from Android SecureStore.
          </Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleUnpair}>
            <Text style={styles.dangerBtnText}>Disconnect & Unpair Device</Text>
          </TouchableOpacity>
        </View>
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
  },
  value: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  dangerNotice: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  dangerBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: COLORS.danger,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerBtnText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

