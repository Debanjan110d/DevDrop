import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getServerStatus } from '../services/api';
import { useServerStore } from '../stores/serverStore';
import type { ServerStatus } from '../types';

const POLL_INTERVAL = 5_000; // 5 seconds

export function useServerStatus() {
  const setStatus = useServerStore((s) => s.setStatus);
  const setConnected = useServerStore((s) => s.setConnected);
  const setLastChecked = useServerStore((s) => s.setLastChecked);

  const storeStatus = useServerStore((s) => s.status);
  const isConnected = useServerStore((s) => s.isConnected);

  const { data, isLoading, isError, error } = useQuery<ServerStatus>({
    queryKey: ['serverStatus'],
    queryFn: getServerStatus,
    refetchInterval: POLL_INTERVAL,
    retry: 3,
  });

  const prevConnected = useRef<boolean | null>(null);

  useEffect(() => {
    if (data) {
      setStatus(data);
      setConnected(true);
      setLastChecked(new Date());
      if (prevConnected.current !== true) {
        prevConnected.current = true;
      }
    }
  }, [data, setStatus, setConnected, setLastChecked]);

  useEffect(() => {
    if (isError) {
      setConnected(false);
      prevConnected.current = false;
    }
  }, [isError, setConnected]);

  return {
    status: storeStatus,
    isConnected,
    isLoading,
    isError,
    error,
  };
}
