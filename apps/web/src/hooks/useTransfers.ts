import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTransfers, cancelTransfer } from '../services/api';
import { useTransferStore } from '../stores/transferStore';
import type { Transfer } from '@devdrop/shared';

export function useTransfers(params?: { status?: string; limit?: number; offset?: number }) {
  const setTransfers = useTransferStore((s) => s.setTransfers);
  const transfers = useTransferStore((s) => s.transfers);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery<Transfer[]>({
    queryKey: ['transfers', params],
    queryFn: () => getTransfers(params),
    refetchInterval: 10_000,
  });

  useEffect(() => {
    if (data) {
      setTransfers(data);
    }
  }, [data, setTransfers]);

  const cancelMutation = useMutation({
    mutationFn: cancelTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
  });

  return {
    transfers: transfers.length > 0 ? transfers : (data ?? []),
    isLoading,
    isError,
    error,
    refetch,
    cancelTransfer: cancelMutation.mutate,
    isCancelling: cancelMutation.isPending,
  };
}
