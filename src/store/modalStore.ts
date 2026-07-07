import { create } from "zustand";
import { SongType } from "@/types";

interface ModalState {
  selectedSong: SongType | null;
  isModalOpen: boolean;
  addToPlaylistSong: SongType | null;
  isAddToPlaylistOpen: boolean;

  openSongModal: (song: SongType) => void;
  closeSongModal: () => void;
  openAddToPlaylistModal: (song: SongType) => void;
  closeAddToPlaylistModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  selectedSong: null,
  isModalOpen: false,
  addToPlaylistSong: null,
  isAddToPlaylistOpen: false,

  openSongModal: (song) => set({ selectedSong: song, isModalOpen: true }),
  closeSongModal: () => set({ selectedSong: null, isModalOpen: false }),
  openAddToPlaylistModal: (song) => set({ addToPlaylistSong: song, isAddToPlaylistOpen: true }),
  closeAddToPlaylistModal: () => set({ addToPlaylistSong: null, isAddToPlaylistOpen: false }),
}));
