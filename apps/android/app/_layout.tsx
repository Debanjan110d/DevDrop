import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../src/state/AppContext';
import { COLORS } from '../src/constants';
import { requestStoragePermissions } from '../src/services/permissions/storagePermission';

export default function RootLayout() {
  useEffect(() => {
    // Request storage / media permissions on app startup
    requestStoragePermissions().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: COLORS.background,
            },
            headerTintColor: COLORS.text,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            contentStyle: {
              backgroundColor: COLORS.background,
            },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ title: 'DevDrop', headerBackVisible: false }} />
          <Stack.Screen name="pairing/index" options={{ title: 'Pair with PC' }} />
          <Stack.Screen name="send/index" options={{ title: 'Send Files' }} />
          <Stack.Screen name="receive/index" options={{ title: 'Receive Files' }} />
          <Stack.Screen name="devices/index" options={{ title: 'Paired PC' }} />
          <Stack.Screen name="history/index" options={{ title: 'Transfer History' }} />
          <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}

