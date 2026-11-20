import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../src/state/AppContext';
import { COLORS } from '../src/constants';

export default function IndexScreen() {
  const router = useRouter();
  const { isInitialized, isPaired } = useApp();

  useEffect(() => {
    if (isInitialized) {
      if (isPaired) {
        router.replace('/dashboard');
      } else {
        router.replace('/pairing');
      }
    }
  }, [isInitialized, isPaired, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.text}>Loading DevDrop...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 16,
    color: COLORS.textMuted,
    fontSize: 16,
  },
});

