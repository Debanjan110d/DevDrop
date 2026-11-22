import React, { createContext, useContext, useEffect, useReducer, useCallback, useState } from 'react';
import { getCredentials, clearCredentials, saveCredentials } from '../services/storage/secureStore';
import { fetchTransfers, checkServerHealth } from '../services/api/client';
import { socketService, type SocketStatus } from '../services/sockets/socket.service';
import { nativeServer, type DirectFileEvent, type DirectTextEvent } from '../services/nativeServer/nativeServer.service';
import { peerDiscovery, type DiscoveredPeer } from '../services/network/peerDiscovery.service';
import type { ServerConnectionConfig, Transfer } from '../types';

interface AppState {
  isInitialized: boolean;
  isPaired: boolean;
  credentials: ServerConnectionConfig | null;
  serverOnline: boolean;
  socketStatus: SocketStatus;
  transfers: Transfer[];
  isLoadingTransfers: boolean;
  error: string | null;
  // P2P & Autonomous Network State
  localIp: string | null;
  listeningPort: number;
  isServerRunning: boolean;
  nearbyPeers: DiscoveredPeer[];
  isScanningPeers: boolean;
  latestDirectDrop: { type: 'file' | 'text'; name?: string; text?: string; sender: string; timestamp: number } | null;
}

type AppAction =
  | { type: 'INIT_START' }
  | { type: 'INIT_SUCCESS'; payload: ServerConnectionConfig | null }
  | { type: 'SET_SERVER_STATUS'; payload: boolean }
  | { type: 'SET_SOCKET_STATUS'; payload: SocketStatus }
  | { type: 'SET_TRANSFERS'; payload: Transfer[] }
  | { type: 'UPDATE_TRANSFER'; payload: Transfer }
  | { type: 'TRANSFER_PROGRESS'; payload: { transferId: string; bytesTransferred: number; percentage: number } }
  | { type: 'UNPAIR' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_P2P_INFO'; payload: { localIp: string | null; port: number; isRunning: boolean } }
  | { type: 'SET_NEARBY_PEERS'; payload: DiscoveredPeer[] }
  | { type: 'SET_SCANNING_PEERS'; payload: boolean }
  | { type: 'SET_LATEST_DIRECT_DROP'; payload: AppState['latestDirectDrop'] };

const initialState: AppState = {
  isInitialized: false,
  isPaired: false,
  credentials: null,
  serverOnline: false,
  socketStatus: 'disconnected',
  transfers: [],
  isLoadingTransfers: false,
  error: null,
  localIp: null,
  listeningPort: 4545,
  isServerRunning: false,
  nearbyPeers: [],
  isScanningPeers: false,
  latestDirectDrop: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'INIT_START':
      return { ...state, isInitialized: false };
    case 'INIT_SUCCESS':
      return {
        ...state,
        isInitialized: true,
        isPaired: !!action.payload,
        credentials: action.payload,
      };
    case 'SET_SERVER_STATUS':
      return { ...state, serverOnline: action.payload };
    case 'SET_SOCKET_STATUS':
      return { ...state, socketStatus: action.payload };
    case 'SET_TRANSFERS':
      return { ...state, transfers: action.payload, isLoadingTransfers: false };
    case 'UPDATE_TRANSFER': {
      const exists = state.transfers.some((t) => t.id === action.payload.id);
      const updated = exists
        ? state.transfers.map((t) => (t.id === action.payload.id ? action.payload : t))
        : [action.payload, ...state.transfers];
      return { ...state, transfers: updated };
    }
    case 'TRANSFER_PROGRESS': {
      const updated = state.transfers.map((t) => {
        if (t.id === action.payload.transferId) {
          return {
            ...t,
            bytesTransferred: action.payload.bytesTransferred,
          };
        }
        return t;
      });
      return { ...state, transfers: updated };
    }
    case 'UNPAIR':
      return {
        ...state,
        isPaired: false,
        credentials: null,
        serverOnline: false,
        socketStatus: 'disconnected',
        transfers: [],
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_P2P_INFO':
      return {
        ...state,
        localIp: action.payload.localIp,
        listeningPort: action.payload.port,
        isServerRunning: action.payload.isRunning,
      };
    case 'SET_NEARBY_PEERS':
      return { ...state, nearbyPeers: action.payload };
    case 'SET_SCANNING_PEERS':
      return { ...state, isScanningPeers: action.payload };
    case 'SET_LATEST_DIRECT_DROP':
      return { ...state, latestDirectDrop: action.payload };
    default:
      return state;
  }
}

interface AppContextValue extends AppState {
  refreshTransfers: () => Promise<void>;
  unpairDevice: () => Promise<void>;
  checkConnection: () => Promise<boolean>;
  setCredentialsAfterPairing: (creds: ServerConnectionConfig) => void;
  scanNearbyPeers: () => Promise<void>;
  startMobileHost: () => Promise<number>;
  stopMobileHost: () => Promise<void>;
  clearLatestDirectDrop: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!state.credentials?.serverUrl) return false;
    try {
      await checkServerHealth(state.credentials.serverUrl);
      dispatch({ type: 'SET_SERVER_STATUS', payload: true });
      return true;
    } catch {
      dispatch({ type: 'SET_SERVER_STATUS', payload: false });
      return false;
    }
  }, [state.credentials?.serverUrl]);

  const refreshTransfers = useCallback(async () => {
    if (!state.isPaired) return;
    try {
      const list = await fetchTransfers();
      dispatch({ type: 'SET_TRANSFERS', payload: list });
    } catch {
      // ignore
    }
  }, [state.isPaired]);

  const unpairDevice = useCallback(async () => {
    socketService.disconnect();
    await clearCredentials();
    dispatch({ type: 'UNPAIR' });
  }, []);

  const setCredentialsAfterPairing = useCallback((creds: ServerConnectionConfig) => {
    dispatch({ type: 'INIT_SUCCESS', payload: creds });
    socketService.connect(creds.serverUrl, creds.deviceToken);
  }, []);

  const scanNearbyPeers = useCallback(async () => {
    dispatch({ type: 'SET_SCANNING_PEERS', payload: true });
    try {
      const peers = await peerDiscovery.scanSubnet(4545, (peer) => {
        dispatch({
          type: 'SET_NEARBY_PEERS',
          payload: peerDiscovery.getCachedPeers(),
        });
      });
      dispatch({ type: 'SET_NEARBY_PEERS', payload: peers });
    } finally {
      dispatch({ type: 'SET_SCANNING_PEERS', payload: false });
    }
  }, []);

  const startMobileHost = useCallback(async (): Promise<number> => {
    const res = await nativeServer.startServer(
      4545,
      state.credentials?.deviceName || 'Android Device'
    );
    const ip = await peerDiscovery.getLocalIp();
    dispatch({
      type: 'SET_P2P_INFO',
      payload: { localIp: ip, port: res.port, isRunning: res.isRunning },
    });
    return res.port;
  }, [state.credentials?.deviceName]);

  const stopMobileHost = useCallback(async () => {
    const res = await nativeServer.stopServer();
    dispatch({
      type: 'SET_P2P_INFO',
      payload: { localIp: state.localIp, port: state.listeningPort, isRunning: res.isRunning },
    });
  }, [state.localIp, state.listeningPort]);

  const clearLatestDirectDrop = useCallback(() => {
    dispatch({ type: 'SET_LATEST_DIRECT_DROP', payload: null });
  }, []);

  // Initialize native micro-server & local Wi-Fi state on startup
  useEffect(() => {
    (async () => {
      try {
        const ip = await peerDiscovery.getLocalIp();
        const serverStatus = await nativeServer.startServer(4545, 'Android Device');
        dispatch({
          type: 'SET_P2P_INFO',
          payload: {
            localIp: ip,
            port: serverStatus.port || 4545,
            isRunning: serverStatus.isRunning,
          },
        });
      } catch (err) {
        console.warn('Native server auto-start note:', err);
      }
    })();

    // Listen for direct drops from other mobile devices on the Wi-Fi
    const unsubFile = nativeServer.onFileReceived((evt: DirectFileEvent) => {
      // Create a completed transfer entry in local history
      const directTransfer: Transfer = {
        id: `direct-file-${Date.now()}`,
        fileName: evt.fileName,
        fileSize: evt.fileSize,
        mimeType: 'application/octet-stream',
        direction: 'mobile-to-pc', // received
        status: 'completed',
        bytesTransferred: evt.fileSize,
        createdAt: new Date(evt.timestamp).toISOString(),
        completedAt: new Date(evt.timestamp).toISOString(),
        sourceDeviceId: evt.senderName,
        destinationDeviceId: 'me',
      };
      dispatch({ type: 'UPDATE_TRANSFER', payload: directTransfer });
      dispatch({
        type: 'SET_LATEST_DIRECT_DROP',
        payload: {
          type: 'file',
          name: evt.fileName,
          sender: evt.senderName,
          timestamp: evt.timestamp,
        },
      });
    });

    const unsubText = nativeServer.onTextReceived((evt: DirectTextEvent) => {
      dispatch({
        type: 'SET_LATEST_DIRECT_DROP',
        payload: {
          type: 'text',
          text: evt.text,
          sender: evt.senderName,
          timestamp: evt.timestamp,
        },
      });
    });

    return () => {
      unsubFile();
      unsubText();
    };
  }, []);

  // Initialize from SecureStore
  useEffect(() => {
    (async () => {
      try {
        const creds = await getCredentials();
        dispatch({ type: 'INIT_SUCCESS', payload: creds });
        if (creds) {
          socketService.connect(creds.serverUrl, creds.deviceToken);
          try {
            await checkServerHealth(creds.serverUrl);
            dispatch({ type: 'SET_SERVER_STATUS', payload: true });
          } catch {
            dispatch({ type: 'SET_SERVER_STATUS', payload: false });
          }
        }
      } catch {
        dispatch({ type: 'INIT_SUCCESS', payload: null });
      }
    })();

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Socket event subscriptions
  useEffect(() => {
    socketService.setCallbacks({
      onStatusChange: (status) => {
        dispatch({ type: 'SET_SOCKET_STATUS', payload: status });
        if (status === 'connected') {
          dispatch({ type: 'SET_SERVER_STATUS', payload: true });
        }
      },
      onTransferCreated: (transfer) => dispatch({ type: 'UPDATE_TRANSFER', payload: transfer }),
      onTransferAvailable: (transfer) => dispatch({ type: 'UPDATE_TRANSFER', payload: transfer }),
      onTransferCompleted: (transfer) => dispatch({ type: 'UPDATE_TRANSFER', payload: transfer }),
      onTransferProgress: (progress) => dispatch({ type: 'TRANSFER_PROGRESS', payload: progress }),
    });
  }, []);

  // Periodically refresh transfers and check connection health
  useEffect(() => {
    if (state.isPaired) {
      refreshTransfers();
      checkConnection();
      const interval = setInterval(() => {
        refreshTransfers();
        checkConnection();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [state.isPaired, refreshTransfers, checkConnection]);

  // Periodic peer scan
  useEffect(() => {
    scanNearbyPeers();
    const interval = setInterval(scanNearbyPeers, 15000);
    return () => clearInterval(interval);
  }, [scanNearbyPeers]);

  return (
    <AppContext.Provider
      value={{
        ...state,
        refreshTransfers,
        unpairDevice,
        checkConnection,
        setCredentialsAfterPairing,
        scanNearbyPeers,
        startMobileHost,
        stopMobileHost,
        clearLatestDirectDrop,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
