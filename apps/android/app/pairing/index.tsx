import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { parseQRCode, pairWithServer } from '../../src/services/pairing/pairing.service';
import { useApp } from '../../src/state/AppContext';
import { COLORS } from '../../src/constants';

export default function PairingScreen() {
  const router = useRouter();
  const { setCredentialsAfterPairing } = useApp();
  const [permission, requestPermission] = useCameraPermissions();

  const [activeTab, setActiveTab] = useState<'qr' | 'manual'>('qr');
  const [manualUrl, setManualUrl] = useState('http://192.168.0.105:4545');
  const [manualToken, setManualToken] = useState('');
  const [deviceName, setDeviceName] = useState(Constants.deviceName || 'Android Device');
  const [isPairing, setIsPairing] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || isPairing) return;
    setScanned(true);

    const parsed = parseQRCode(data);
    if (!parsed) {
      Alert.alert(
        'Invalid QR Code',
        'The scanned QR code is not a valid DevDrop pairing code. Please scan the QR code from the PC dashboard.',
        [{ text: 'Try Again', onPress: () => setScanned(false) }]
      );
      return;
    }

    try {
      setIsPairing(true);
      setErrorMsg(null);
      const creds = await pairWithServer(parsed.url, parsed.pairingToken, deviceName);
      setCredentialsAfterPairing(creds);
      Alert.alert('Success', 'Paired successfully with your PC!', [
        { text: 'Go to Dashboard', onPress: () => router.replace('/dashboard') },
      ]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Pairing failed. Make sure PC and Phone are on the same Wi-Fi.');
      setScanned(false);
    } finally {
      setIsPairing(false);
    }
  };

  const handleManualPair = async () => {
    if (!manualUrl.trim() || !manualToken.trim()) {
      Alert.alert('Missing Info', 'Please enter both the PC Server URL and Pairing Token.');
      return;
    }

    try {
      setIsPairing(true);
      setErrorMsg(null);
      const creds = await pairWithServer(manualUrl.trim(), manualToken.trim(), deviceName);
      setCredentialsAfterPairing(creds);
      Alert.alert('Success', 'Paired successfully with your PC!', [
        { text: 'Go to Dashboard', onPress: () => router.replace('/dashboard') },
      ]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Pairing failed. Check IP address, port, and token.');
    } finally {
      setIsPairing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header bar with Back button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/dashboard');
            }
          }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)' }}
        >
          <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>Camera QR Scanner</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'qr' && styles.activeTab]}
          onPress={() => {
            setActiveTab('qr');
            setScanned(false);
            setErrorMsg(null);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'qr' && styles.activeTabText]}>
            Scan QR Code
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'manual' && styles.activeTab]}
          onPress={() => {
            setActiveTab('manual');
            setErrorMsg(null);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText]}>
            Manual Entry
          </Text>
        </TouchableOpacity>
      </View>

      {errorMsg ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {activeTab === 'qr' ? (
        <View style={styles.scannerWrapper}>
          <View style={styles.nameCard}>
            <Text style={styles.nameCardLabel}>Phone Name:</Text>
            <TextInput
              style={styles.nameCardInput}
              value={deviceName}
              onChangeText={setDeviceName}
              placeholder="e.g. My Phone"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          {!permission ? (
            <View style={styles.permissionBox}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : !permission.granted ? (
            <View style={styles.permissionBox}>
              <Text style={styles.permissionTitle}>Camera Permission Required</Text>
              <Text style={styles.permissionDesc}>
                DevDrop needs camera access to scan the pairing QR code from your PC dashboard.
              </Text>
              <TouchableOpacity style={styles.btnPrimary} onPress={requestPermission}>
                <Text style={styles.btnText}>Grant Camera Permission</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cameraBox}>
              <CameraView
                style={StyleSheet.absoluteFill}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              />
              <View style={styles.overlay}>
                <View style={styles.scanTarget} />
                <Text style={styles.scanHint}>Point camera at the QR code on PC</Text>
              </View>
            </View>
          )}

          {isPairing ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Pairing with PC...</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.manualForm}>
          <Text style={styles.label}>PC Server Address (LAN)</Text>
          <TextInput
            style={styles.input}
            value={manualUrl}
            onChangeText={setManualUrl}
            placeholder="http://192.168.0.105:4545"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Pairing Token</Text>
          <TextInput
            style={styles.input}
            value={manualToken}
            onChangeText={setManualToken}
            placeholder="Enter token from PC dashboard"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>This Device Name</Text>
          <TextInput
            style={styles.input}
            value={deviceName}
            onChangeText={setDeviceName}
            placeholder="Android Phone"
            placeholderTextColor={COLORS.textMuted}
          />

          <TouchableOpacity
            style={[styles.btnPrimary, isPairing && styles.btnDisabled]}
            onPress={handleManualPair}
            disabled={isPairing}
          >
            {isPairing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Pair with PC</Text>
            )}
          </TouchableOpacity>
        </View>
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
    padding: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  activeTabText: {
    color: '#ffffff',
  },
  nameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  nameCardLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  nameCardInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    padding: 0,
    fontWeight: 'bold',
  },
  scannerWrapper: {
    height: 380,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: '#000',
    position: 'relative',
  },
  cameraBox: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanTarget: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  scanHint: {
    color: '#fff',
    marginTop: 20,
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  permissionDesc: {
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  manualForm: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#1f2937',
    color: COLORS.text,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#374151',
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: COLORS.danger,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.text,
    marginTop: 12,
    fontSize: 16,
  },
});
