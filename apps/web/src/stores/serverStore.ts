import { create } from 'zustand';
import type { ServerStatus } from '../types';

type ServerStore = {
  status: ServerStatus | null;
  isConnected: boolean;
  lastChecked: Date | null;

  setStatus: (status: ServerStatus) => void;
  setConnected: (connected: boolean) => void;
  setLastChecked: (date: Date) => void;
};

export const useServerStore = create<ServerStore>((set) => ({
  status: null,
  isConnected: false,
  lastChecked: null,

  setStatus: (status) => set({ status, isConnected: status.running }),
  setConnected: (isConnected) => set({ isConnected }),
  setLastChecked: (lastChecked) => set({ lastChecked }),
}));
