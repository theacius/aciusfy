import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OfflineState {
  downloadedIds: string[];
  addDownloaded: (id: string) => void;
  removeDownloaded: (id: string) => void;
  isDownloaded: (id: string) => boolean;
  setDownloadedIds: (ids: string[]) => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      downloadedIds: [],
      addDownloaded: (id) =>
        set((s) =>
          s.downloadedIds.includes(id) ? s : { downloadedIds: [...s.downloadedIds, id] }
        ),
      removeDownloaded: (id) =>
        set((s) => ({
          downloadedIds: s.downloadedIds.filter((x) => x !== id),
        })),
      isDownloaded: (id) => get().downloadedIds.includes(id),
      setDownloadedIds: (ids) => set({ downloadedIds: ids }),
    }),
    { name: "aciusfy-offline-ids" }
  )
);
