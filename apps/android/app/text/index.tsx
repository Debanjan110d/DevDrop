import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/state/AppContext';
import { fetchDevices } from '../../src/services/api/client';
import { socketService } from '../../src/services/sockets/socket.service';
import { sendDirectText } from '../../src/services/network/directTransfer.service';
import { nativeServer } from '../../src/services/nativeServer/nativeServer.service';
import { COLORS } from '../../src/constants';
import type { Device } from '../../src/types';

interface TextSnippet {
  id: string;
  text: string;
  senderName: string;
  createdAt: number;
}

export default function TextScreen() {
  const router = useRouter();
  const { credentials, nearbyPeers } = useApp();
  const [textInput, setTextInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [snippets, setSnippets] = useState<TextSnippet[]>([]);
  const [loadingSnippets, setLoadingSnippets] = useState(false);

  // Device destination state
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('pc-host');

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchDevices();
        const others = list.filter((d) => d.id !== credentials?.deviceId && d.platform !== 'server');
        setDevices(others);
      } catch {
        // PC is default
      }
    })();
  }, [credentials?.deviceId]);

  // Load initial snippets from server
  const loadSnippets = async () => {
    if (!credentials?.serverUrl) return;
    try {
      setLoadingSnippets(true);
      const res = await fetch(`${credentials.serverUrl}/api/text`, {
        headers: {
          Authorization: `Bearer ${credentials.deviceToken}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSnippets(json.data);
        }
      }
    } catch {
      // Ignore
    } finally {
      setLoadingSnippets(false);
    }
  };

  useEffect(() => {
    loadSnippets();

    const socket = socketService.getRawSocket();
    if (!socket) return;

    const handleTextReceived = (data: any) => {
      if (data?.text) {
        setSnippets((prev) => [
          {
            id: data.id || String(Date.now()),
            text: data.text,
            senderName: data.senderName || 'PC',
            createdAt: data.timestamp || Date.now(),
          },
          ...prev,
        ]);
      }
    };

    socket.on('text:received', handleTextReceived);
    return () => {
      socket.off('text:received', handleTextReceived);
    };
  }, [credentials?.serverUrl]);

  const handleShareOrCopy = async (text: string) => {
    try {
      await Share.share({
        message: text,
      });
    } catch (err: any) {
      Alert.alert('Copy/Share', text);
    }
  };

  const handleSendText = async () => {
    if (!textInput.trim()) return;

    setIsSending(true);
    try {
      if (selectedTargetId.startsWith('peer:')) {
        const parts = selectedTargetId.split(':');
        const peerIp = parts[1];
        const peerPort = parseInt(parts[2], 10) || 4545;
        await sendDirectText(
          peerIp,
          peerPort,
          textInput.trim(),
          credentials?.deviceName || 'Android Device'
        );
        setSnippets((prev) => [
          {
            id: `sent-${Date.now()}`,
            text: textInput.trim(),
            senderName: 'You (Direct)',
            createdAt: Date.now(),
          },
          ...prev,
        ]);
        setTextInput('');
        Alert.alert('Sent', 'Text sent directly to ' + getTargetName());
      } else {
        if (!credentials?.serverUrl) {
          Alert.alert('Offline', 'PC Server is not connected. Select a nearby Wi-Fi device instead.');
          return;
        }

        const res = await fetch(`${credentials.serverUrl}/api/text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${credentials.deviceToken}`,
          },
          body: JSON.stringify({
            text: textInput.trim(),
            destinationDeviceId: selectedTargetId,
          }),
        });

        if (res.ok) {
          setTextInput('');
          loadSnippets();
          Alert.alert('Sent', 'Text has been sent to ' + getTargetName());
        } else {
          const errJson = await res.json().catch(() => ({}));
          Alert.alert('Error', errJson.error?.message || 'Failed to send text');
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Network error');
    } finally {
      setIsSending(false);
    }
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Target device picker */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Send Text to</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deviceRow}>
          <TouchableOpacity
            style={[
              styles.deviceChip,
              selectedTargetId === 'pc-host' && styles.deviceChipSelected,
            ]}
            onPress={() => setSelectedTargetId('pc-host')}
          >
            <Text style={styles.chipIcon}>💻</Text>
            <Text
              style={[
                styles.chipName,
                selectedTargetId === 'pc-host' && styles.chipNameSelected,
              ]}
            >
              Host PC
            </Text>
          </TouchableOpacity>

          {/* Nearby Wi-Fi Peers */}
          {nearbyPeers.map((peer) => {
            const peerId = `peer:${peer.ip}:${peer.port}`;
            const isSelected = selectedTargetId === peerId;
            return (
              <TouchableOpacity
                key={peer.id}
                style={[
                  styles.deviceChip,
                  isSelected && styles.deviceChipSelected,
                  { borderColor: isSelected ? COLORS.primary : 'rgba(99, 102, 241, 0.4)' },
                ]}
                onPress={() => setSelectedTargetId(peerId)}
              >
                <Text style={styles.chipIcon}>
                  {peer.nodeType === 'android-peer' ? '📱' : '💻'}
                </Text>
                <Text
                  style={[
                    styles.chipName,
                    isSelected && styles.chipNameSelected,
                  ]}
                  numberOfLines={1}
                >
                  {peer.name}
                </Text>
              </TouchableOpacity>
            );
          })}

          {devices.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={[
                styles.deviceChip,
                selectedTargetId === d.id && styles.deviceChipSelected,
              ]}
              onPress={() => setSelectedTargetId(d.id)}
            >
              <Text style={styles.chipIcon}>📱</Text>
              <Text
                style={[
                  styles.chipName,
                  selectedTargetId === d.id && styles.chipNameSelected,
                ]}
              >
                {d.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Text Input Card */}
      <View style={[styles.card, { marginTop: 14 }]}>
        <Text style={styles.sectionTitle}>Quick Text & Clipboard</Text>
        <Text style={styles.subtitle}>
          Paste links, code snippets, notes, or messages to push instantly.
        </Text>

        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={5}
          value={textInput}
          onChangeText={setTextInput}
          placeholder="Type or paste text here..."
          placeholderTextColor="#64748b"
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.sendBtn, (!textInput.trim() || isSending) && styles.sendBtnDisabled]}
          disabled={!textInput.trim() || isSending}
          onPress={handleSendText}
        >
          {isSending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendBtnText}>Send to {getTargetName()} ➔</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Received / Shared History */}
      <View style={[styles.card, { marginTop: 14 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Shared Snippets ({snippets.length})</Text>
          <TouchableOpacity onPress={loadSnippets}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {loadingSnippets ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
        ) : snippets.length === 0 ? (
          <Text style={styles.emptyText}>No text snippets yet.</Text>
        ) : (
          <View style={styles.snippetsList}>
            {snippets.map((snip) => (
              <View key={snip.id} style={styles.snippetCard}>
                <View style={styles.snippetHeader}>
                  <Text style={styles.snippetSender}>{snip.senderName || 'PC'}</Text>
                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={() => handleShareOrCopy(snip.text)}
                  >
                    <Text style={styles.copyBtnText}>📋 Copy / Share</Text>
                  </TouchableOpacity>
                </View>
                <Text selectable={true} style={styles.snippetText}>
                  {snip.text}
                </Text>
              </View>
            ))}
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
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  refreshText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '600',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12,
  },
  deviceRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  deviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  deviceChipSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderColor: COLORS.primary,
  },
  chipIcon: {
    fontSize: 16,
  },
  chipName: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  chipNameSelected: {
    color: '#818cf8',
  },
  textInput: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: '#f8fafc',
    fontSize: 14,
    minHeight: 110,
    fontFamily: 'monospace',
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 16,
  },
  snippetsList: {
    gap: 10,
  },
  snippetCard: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  snippetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  snippetSender: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  copyBtn: {
    backgroundColor: '#1e293b',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  copyBtnText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
  },
  snippetText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});
