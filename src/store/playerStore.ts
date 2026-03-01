import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song, PlayerState } from '../types';

interface PlayerStore extends PlayerState {
  sessionSongs: Song[];
  shufflePool: Song[];

  setCurrentSong: (song: Song, sessionSongs?: Song[], index?: number) => void;
  setQueue: (queue: Song[]) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  setPlaying: (playing: boolean) => void;
  setLoading: (loading: boolean) => void;
  setDuration: (duration: number) => void;
  setPosition: (position: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setCurrentIndex: (index: number) => void;
  setSessionSongs: (songs: Song[], index: number) => void;
  setShufflePool: (songs: Song[]) => void;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      currentSong: null,
      queue: [],
      sessionSongs: [],
      shufflePool: [],
      currentIndex: 0,
      isPlaying: false,
      isLoading: false,
      duration: 0,
      position: 0,
      shuffle: false,
      repeat: 'none',
      shuffledQueue: [],

      setCurrentSong: (song, sessionSongs, index) => {
        const state = get();
        const sessions = sessionSongs ?? state.sessionSongs;
        const idx = index !== undefined ? index : sessions.findIndex(s => s.id === song.id);
        set({ currentSong: song, sessionSongs: sessions, currentIndex: idx >= 0 ? idx : 0, position: 0, duration: 0 });
      },

      setSessionSongs: (songs, index) => set({ sessionSongs: songs, currentIndex: index }),
      setShufflePool: (songs) => set({ shufflePool: songs }),
      setQueue: (queue) => set({ queue }),

      addToQueue: (song) => {
        const state = get();
        if (!state.queue.find(s => s.id === song.id)) set({ queue: [...state.queue, song] });
      },

      removeFromQueue: (index) => {
        set(state => ({ queue: state.queue.filter((_, i) => i !== index) }));
      },

      reorderQueue: (from, to) => {
        const q = [...get().queue];
        const [moved] = q.splice(from, 1);
        q.splice(to, 0, moved);
        set({ queue: q });
      },

      clearQueue: () => set({
        queue: [], currentIndex: 0, shuffledQueue: [],
        currentSong: null, isPlaying: false, position: 0, duration: 0,
      }),

      setPlaying: (isPlaying) => set({ isPlaying }),
      setLoading: (isLoading) => set({ isLoading }),
      setDuration: (duration) => set({ duration }),
      setPosition: (position) => set({ position }),
      setCurrentIndex: (currentIndex) => set({ currentIndex }),
      toggleShuffle: () => set(state => ({ shuffle: !state.shuffle })),

      toggleRepeat: () => {
        const modes: Array<'none' | 'one' | 'all'> = ['none', 'all', 'one'];
        const idx = modes.indexOf(get().repeat);
        set({ repeat: modes[(idx + 1) % modes.length] });
      },
    }),
    {
      name: 'player-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        queue: state.queue,
        currentSong: state.currentSong,
        shuffle: state.shuffle,
        repeat: state.repeat,
      }),
    }
  )
);
