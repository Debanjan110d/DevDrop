import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { getCredentials, clearCredentials, saveCredentials } from '../services/storage/secureStore';
import { fetchTransfers, checkServerHealth } from '../services/api/client';
import { socketService, type SocketStatus } from '../services/sockets/socket.service';
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
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: AppState = {
  isInitialized: false,
  isPaired: false,
  credentials: null,
  serverOnline: false,
  socketStatus: 'disconnected',
  transfers: [],
  isLoadingTransfers: false,
  error: null,
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
    default:
      return state;
  }
}

interface AppContextValue extends AppState {
  refreshTransfers: () => Promise<void>;
  unpairDevice: () => Promise<void>;
  checkConnection: () => Promise<boolean>;
  setCredentialsAfterPairing: (creds: ServerConnectionConfig) => void;
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
    } catch (err: any) {
      // ignore in background
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
      } catch (err: any) {
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

  return (
    <AppContext.Provider
      value={{
        ...state,
        refreshTransfers,
        unpairDevice,
        checkConnection,
        setCredentialsAfterPairing,
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

