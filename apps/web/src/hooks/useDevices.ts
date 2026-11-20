import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDevices, updateDevice, revokeDevice } from '../services/api';
import { useDeviceStore } from '../stores/deviceStore';
import type { Device } from '@devdrop/shared';

export function useDevices() {
  const setDevices = useDeviceStore((s) => s.setDevices);
  const removeDevice = useDeviceStore((s) => s.removeDevice);
  const devices = useDeviceStore((s) => s.devices);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery<Device[]>({
    queryKey: ['devices'],
    queryFn: getDevices,
    refetchInterval: 15_000,
  });

  useEffect(() => {
    if (data) {
      setDevices(data);
    }
  }, [data, setDevices]);

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateDevice(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeDevice(id),
    onSuccess: (_data, id) => {
      removeDevice(id);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  return {
    devices: devices.length > 0 ? devices : (data ?? []),
    isLoading,
    isError,
    error,
    refetch,
    renameDevice: renameMutation.mutate,
    isRenaming: renameMutation.isPending,
    revokeDevice: revokeMutation.mutate,
    isRevoking: revokeMutation.isPending,
  };
}
