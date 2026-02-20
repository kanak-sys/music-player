import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song, PlayerState } from '../types';

interface PlayerStore extends PlayerState {
  // Actions
  setCurrentSong: (song: Song, queue?: Song[], index?: number) => void;
  setQueue: (queue: Song[]) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  setPlaying: (playing: boolean) => void;
  setLoading: (loading: boolean) => void;
  setDuration: (duration: number) => void;
  setPosition: (position: number) => void;
  playNext: () => void;
  playPrev: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setCurrentIndex: (index: number) => void;
}

const shuffleArray = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      currentSong: null,
      queue: [],
      currentIndex: 0,
      isPlaying: false,
      isLoading: false,
      duration: 0,
      position: 0,
      shuffle: false,
      repeat: 'none',
      shuffledQueue: [],

      setCurrentSong: (song, queue, index) => {
        const state = get();
        const newQueue = queue ?? state.queue;
        const newIndex = index ?? newQueue.findIndex((s) => s.id === song.id);
        set({
          currentSong: song,
          queue: newQueue,
          currentIndex: newIndex >= 0 ? newIndex : 0,
          shuffledQueue: state.shuffle ? shuffleArray(newQueue) : [],
          position: 0,
          duration: 0,
        });
      },

      setQueue: (queue) => {
        const state = get();
        set({
          queue,
          shuffledQueue: state.shuffle ? shuffleArray(queue) : [],
        });
      },

      addToQueue: (song) => {
        const state = get();
        const exists = state.queue.find((s) => s.id === song.id);
        if (!exists) {
          const newQueue = [...state.queue, song];
          set({
            queue: newQueue,
            shuffledQueue: state.shuffle ? shuffleArray(newQueue) : [],
          });
        }
      },

      removeFromQueue: (index) => {
        const state = get();
        const newQueue = state.queue.filter((_, i) => i !== index);
        const newIndex =
          index < state.currentIndex
            ? state.currentIndex - 1
            : state.currentIndex;
        set({
          queue: newQueue,
          currentIndex: Math.max(0, Math.min(newIndex, newQueue.length - 1)),
          shuffledQueue: state.shuffle ? shuffleArray(newQueue) : [],
        });
      },

      reorderQueue: (from, to) => {
        const state = get();
        const newQueue = [...state.queue];
        const [moved] = newQueue.splice(from, 1);
        newQueue.splice(to, 0, moved);
        let newIndex = state.currentIndex;
        if (from === state.currentIndex) newIndex = to;
        else if (from < state.currentIndex && to >= state.currentIndex) newIndex--;
        else if (from > state.currentIndex && to <= state.currentIndex) newIndex++;
        set({ queue: newQueue, currentIndex: newIndex });
      },

      clearQueue: () => set({ queue: [], currentIndex: 0, shuffledQueue: [] }),

      setPlaying: (isPlaying) => set({ isPlaying }),
      setLoading: (isLoading) => set({ isLoading }),
      setDuration: (duration) => set({ duration }),
      setPosition: (position) => set({ position }),
      setCurrentIndex: (currentIndex) => set({ currentIndex }),

      playNext: () => {
        const state = get();
        const activeQueue = state.shuffle ? state.shuffledQueue : state.queue;
        if (activeQueue.length === 0) return;

        if (state.repeat === 'one') {
          // handled by audio player
          return;
        }

        const nextIndex = state.currentIndex + 1;
        if (nextIndex >= activeQueue.length) {
          if (state.repeat === 'all') {
            set({ currentIndex: 0, currentSong: activeQueue[0], position: 0 });
          }
        } else {
          set({
            currentIndex: nextIndex,
            currentSong: activeQueue[nextIndex],
            position: 0,
          });
        }
      },

      playPrev: () => {
        const state = get();
        const activeQueue = state.shuffle ? state.shuffledQueue : state.queue;
        if (activeQueue.length === 0) return;

        const prevIndex = state.currentIndex - 1;
        if (prevIndex < 0) {
          if (state.repeat === 'all') {
            const lastIndex = activeQueue.length - 1;
            set({ currentIndex: lastIndex, currentSong: activeQueue[lastIndex], position: 0 });
          }
        } else {
          set({
            currentIndex: prevIndex,
            currentSong: activeQueue[prevIndex],
            position: 0,
          });
        }
      },

      toggleShuffle: () => {
        const state = get();
        const newShuffle = !state.shuffle;
        set({
          shuffle: newShuffle,
          shuffledQueue: newShuffle ? shuffleArray(state.queue) : [],
        });
      },

      toggleRepeat: () => {
        const state = get();
        const modes: Array<'none' | 'one' | 'all'> = ['none', 'all', 'one'];
        const currentIdx = modes.indexOf(state.repeat);
        set({ repeat: modes[(currentIdx + 1) % modes.length] });
      },
    }),
    {
      name: 'player-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        queue: state.queue,
        currentIndex: state.currentIndex,
        currentSong: state.currentSong,
        shuffle: state.shuffle,
        repeat: state.repeat,
      }),
    }
  )
);
