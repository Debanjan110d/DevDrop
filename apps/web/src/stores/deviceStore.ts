import { create } from 'zustand';
import type { Device } from '@devdrop/shared';

type DeviceStore = {
  devices: Device[];
  selectedDeviceId: string | null;

  setDevices: (devices: Device[]) => void;
  upsertDevice: (device: Device) => void;
  updateDeviceStatus: (deviceId: string, status: 'online' | 'offline') => void;
  removeDevice: (deviceId: string) => void;
  setSelectedDevice: (id: string | null) => void;
};

export const useDeviceStore = create<DeviceStore>((set) => ({
  devices: [],
  selectedDeviceId: null,

  setDevices: (devices) => set({ devices }),

  upsertDevice: (device) =>
    set((state) => {
      const idx = state.devices.findIndex((d) => d.id === device.id);
      if (idx === -1) {
        return { devices: [...state.devices, device] };
      }
      const updated = [...state.devices];
      updated[idx] = device;
      return { devices: updated };
    }),

  updateDeviceStatus: (deviceId, status) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId ? { ...d, status } : d,
      ),
    })),

  removeDevice: (deviceId) =>
    set((state) => ({
      devices: state.devices.filter((d) => d.id !== deviceId),
    })),

  setSelectedDevice: (id) => set({ selectedDeviceId: id }),
}));
