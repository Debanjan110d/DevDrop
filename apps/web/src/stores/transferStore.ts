import { create } from 'zustand';
import type { Transfer, TransferStatus } from '@devdrop/shared';

type TransferStore = {
  transfers: Transfer[];
  activeTransferId: string | null;

  setTransfers: (transfers: Transfer[]) => void;
  upsertTransfer: (transfer: Transfer) => void;
  updateTransferProgress: (
    transferId: string,
    bytesTransferred: number,
  ) => void;
  updateTransferStatus: (transferId: string, status: TransferStatus) => void;
  removeTransfer: (transferId: string) => void;
  setActiveTransfer: (id: string | null) => void;
};

export const useTransferStore = create<TransferStore>((set) => ({
  transfers: [],
  activeTransferId: null,

  setTransfers: (transfers) => set({ transfers }),

  upsertTransfer: (transfer) =>
    set((state) => {
      const idx = state.transfers.findIndex((t) => t.id === transfer.id);
      if (idx === -1) {
        return { transfers: [transfer, ...state.transfers] };
      }
      const updated = [...state.transfers];
      updated[idx] = transfer;
      return { transfers: updated };
    }),

  updateTransferProgress: (transferId, bytesTransferred) =>
    set((state) => ({
      transfers: state.transfers.map((t) =>
        t.id === transferId ? { ...t, bytesTransferred } : t,
      ),
    })),

  updateTransferStatus: (transferId, status) =>
    set((state) => ({
      transfers: state.transfers.map((t) =>
        t.id === transferId ? { ...t, status } : t,
      ),
    })),

  removeTransfer: (transferId) =>
    set((state) => ({
      transfers: state.transfers.filter((t) => t.id !== transferId),
    })),

  setActiveTransfer: (id) => set({ activeTransferId: id }),
}));
