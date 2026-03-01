import { useEffect, useRef, useCallback } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { usePlayerStore } from '../store/playerStore';
import { getBestDownloadUrl, getSongSuggestions, searchSongs } from '../services/api';
import { isSongDownloaded } from '../services/download';
import { Song } from '../types';

let soundRef: Audio.Sound | null = null;
let engineInitialized = false;
let appJustLaunched = true;
let currentSongId: string | null = null;
let isLoading = false;

// ─── Shuffle pool ─────────────────────────────────────────────────────────────
async function fetchShufflePool(songId: string, language?: string) {
  try {
    const suggestions = await getSongSuggestions(songId);
    if (suggestions?.length >= 5) { usePlayerStore.getState().setShufflePool(suggestions); return; }
    if (language) {
      const result = await searchSongs(`${language} hits`, 1, 20);
      if (result.results?.length > 0) { usePlayerStore.getState().setShufflePool(result.results); return; }
    }
    const fallback = await searchSongs('top hits 2024', 1, 20);
    usePlayerStore.getState().setShufflePool(fallback.results || []);
  } catch (_) {}
}

// ─── Pick next song ───────────────────────────────────────────────────────────
function getNextSong(): Song | null {
  const state = usePlayerStore.getState();
  if (state.queue.length > 0) {
    const idx = state.queue.findIndex(s => s.id === state.currentSong?.id);
    if (idx >= 0 && idx + 1 < state.queue.length) return state.queue[idx + 1];
  }
  if (state.shuffle && state.shufflePool.length > 0) {
    const available = state.shufflePool.filter(s => s.id !== state.currentSong?.id);
    if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
  }
  const session = state.sessionSongs;
  if (session.length === 0) return null;
  const nextIdx = state.currentIndex + 1;
  if (nextIdx < session.length) return session[nextIdx];
  if (state.repeat === 'all') return session[0];
  return null;
}

// ─── Pick prev song ───────────────────────────────────────────────────────────
function getPrevSong(): Song | null {
  const state = usePlayerStore.getState();
  const session = state.sessionSongs;
  if (session.length === 0) return null;
  const prevIdx = state.currentIndex - 1;
  if (prevIdx >= 0) return session[prevIdx];
  if (state.repeat === 'all') return session[session.length - 1];
  return null;
}

// ─── Status handler — module level, never stale ───────────────────────────────
function handlePlaybackStatus(status: AVPlaybackStatus) {
  if (!status.isLoaded) return;

  usePlayerStore.getState().setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
  usePlayerStore.getState().setPosition(status.positionMillis ? status.positionMillis / 1000 : 0);
  usePlayerStore.getState().setPlaying(status.isPlaying);

  if (status.didJustFinish) {
    const state = usePlayerStore.getState();
    if (state.repeat === 'one' && soundRef) {
      soundRef.replayAsync().catch(() => {});
      return;
    }
    const next = getNextSong();
    if (next) {
      const session = state.sessionSongs;
      const nextIdx = session.findIndex(s => s.id === next.id);
      usePlayerStore.getState().setCurrentSong(next, session, nextIdx >= 0 ? nextIdx : 0);
      loadSong(next, true);
    }
  }
}

// ─── Core load ────────────────────────────────────────────────────────────────
async function loadSong(song: Song, autoPlay: boolean) {
  if (!song) return;
  if (isLoading) return;
  if (currentSongId === song.id && soundRef) {
    if (autoPlay) {
      const status = await soundRef.getStatusAsync().catch(() => null);
      if (status?.isLoaded && !status.isPlaying) await soundRef.playAsync().catch(() => {});
    }
    return;
  }

  isLoading = true;
  currentSongId = song.id;
  usePlayerStore.getState().setLoading(true);
  usePlayerStore.getState().setPlaying(false);

  const prev = soundRef;
  soundRef = null;
  if (prev) { try { await prev.stopAsync(); await prev.unloadAsync(); } catch (_) {} }

  try {
    let uri = (await isSongDownloaded(song.id)) || '';
    if (!uri) uri = getBestDownloadUrl(song);
    if (!uri) { usePlayerStore.getState().setLoading(false); isLoading = false; return; }

    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: autoPlay, progressUpdateIntervalMillis: 1000 }
    );
    sound.setOnPlaybackStatusUpdate(handlePlaybackStatus);

    soundRef = sound;
    isLoading = false;
    usePlayerStore.getState().setLoading(false);

    if (usePlayerStore.getState().shuffle) {
      fetchShufflePool(song.id, song.language).catch(() => {});
    }
  } catch (err) {
    console.error('Load error:', err);
    isLoading = false;
    currentSongId = null;
    usePlayerStore.getState().setLoading(false);
  }
}

// ─── Engine init ──────────────────────────────────────────────────────────────
export function initAudioEngine() {
  if (engineInitialized) return;
  engineInitialized = true;

  Audio.setAudioModeAsync({
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
  }).catch(() => {});

  let lastSongId: string | null = null;

  usePlayerStore.subscribe((state) => {
    const song = state.currentSong;
    if (!song) return;
    if (song.id === lastSongId) return;
    lastSongId = song.id;

    if (appJustLaunched) {
      appJustLaunched = false;
      loadSong(song, false);
      return;
    }

    if (song.id === currentSongId) return;
    loadSong(song, true);
  });
}

// ─── Audio controls ───────────────────────────────────────────────────────────
export const audioControls = {
  async togglePlayPause() {
    if (!soundRef) {
      const song = usePlayerStore.getState().currentSong;
      if (song) { loadSong(song, true); return; }
      return;
    }
    try {
      const status = await soundRef.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) await soundRef.pauseAsync();
      else await soundRef.playAsync();
    } catch (err) { console.error('Toggle error:', err); }
  },

  skipNext() {
    const state = usePlayerStore.getState();
    if (state.repeat === 'one' && soundRef) {
      soundRef.replayAsync().catch(() => {});
      return;
    }
    const next = getNextSong();
    if (next) {
      const session = state.sessionSongs;
      const nextIdx = session.findIndex(s => s.id === next.id);
      usePlayerStore.getState().setCurrentSong(next, session, nextIdx >= 0 ? nextIdx : 0);
      loadSong(next, true);
    }
  },

  skipPrev() {
    const state = usePlayerStore.getState();
    // If more than 3 seconds in — restart current song
    if (state.position > 3 && soundRef) {
      soundRef.setPositionAsync(0).catch(() => {});
      return;
    }
    const prev = getPrevSong();
    if (prev) {
      const session = state.sessionSongs;
      const prevIdx = session.findIndex(s => s.id === prev.id);
      usePlayerStore.getState().setCurrentSong(prev, session, prevIdx >= 0 ? prevIdx : 0);
      loadSong(prev, true);
    }
  },

  async seekTo(seconds: number) {
    if (!soundRef) return;
    try { await soundRef.setPositionAsync(seconds * 1000); }
    catch (err) { console.error('Seek error:', err); }
  },
};

// ─── React hook ───────────────────────────────────────────────────────────────
export const useAudioPlayer = () => {
  useEffect(() => { initAudioEngine(); }, []);

  const shuffle = usePlayerStore(s => s.shuffle);
  const currentSong = usePlayerStore(s => s.currentSong);
  const prevShuffle = useRef(shuffle);

  useEffect(() => {
    if (shuffle && !prevShuffle.current && currentSong?.id) {
      fetchShufflePool(currentSong.id, currentSong.language).catch(() => {});
    }
    prevShuffle.current = shuffle;
  }, [shuffle, currentSong?.id]);

  const togglePlayPause = useCallback(() => audioControls.togglePlayPause(), []);
  const seekTo = useCallback((s: number) => audioControls.seekTo(s), []);
  const skipNext = useCallback(() => audioControls.skipNext(), []);
  const skipPrev = useCallback(() => audioControls.skipPrev(), []);

  return { togglePlayPause, seekTo, skipNext, skipPrev };
};

export const getSound = () => soundRef;
