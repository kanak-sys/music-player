import { useEffect, useRef, useCallback } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { usePlayerStore } from '../store/playerStore';
import { getBestDownloadUrl } from '../services/api';
import { isSongDownloaded } from '../services/download';

// Global singleton — only one Sound instance ever exists
let soundRef: Audio.Sound | null = null;
let isLoadingGlobal = false;

export const useAudioPlayer = () => {
  const {
    currentSong,
    isPlaying,
    repeat,
    setPlaying,
    setLoading,
    setDuration,
    setPosition,
    playNext,
  } = usePlayerStore();

  const lastSongId = useRef<string | null>(null);
  const repeatRef = useRef(repeat);
  repeatRef.current = repeat;

  useEffect(() => {
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
  }, []);

  const loadAndPlay = useCallback(async (song: typeof currentSong) => {
    if (!song) return;
    if (isLoadingGlobal) return; // prevent double-load

    try {
      isLoadingGlobal = true;
      setLoading(true);
      setPlaying(false);

      // Stop and unload previous sound completely
      if (soundRef) {
        try {
          await soundRef.stopAsync();
          await soundRef.unloadAsync();
        } catch (_) {}
        soundRef = null;
      }

      // Get URI — local download takes priority
      let uri = (await isSongDownloaded(song.id)) || '';
      if (!uri) uri = getBestDownloadUrl(song);
      if (!uri) {
        setLoading(false);
        isLoadingGlobal = false;
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, progressUpdateIntervalMillis: 500 },
        (status: AVPlaybackStatus) => {
          if (!status.isLoaded) return;
          setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
          setPosition(status.positionMillis ? status.positionMillis / 1000 : 0);
          setPlaying(status.isPlaying);

          if (status.didJustFinish) {
            if (repeatRef.current === 'one') {
              sound.replayAsync();
            } else {
              playNext();
            }
          }
        }
      );

      soundRef = sound;
      isLoadingGlobal = false;
      setLoading(false);
    } catch (err) {
      console.error('Audio load error:', err);
      isLoadingGlobal = false;
      setLoading(false);
    }
  }, [setLoading, setDuration, setPosition, setPlaying, playNext]);

  // Only reload when song ID actually changes
  useEffect(() => {
    if (!currentSong) return;
    if (currentSong.id === lastSongId.current) return;
    lastSongId.current = currentSong.id;
    loadAndPlay(currentSong);
  }, [currentSong?.id]);

  const play = useCallback(async () => {
    if (!soundRef) return;
    try {
      const status = await soundRef.getStatusAsync();
      if (status.isLoaded && !status.isPlaying) {
        await soundRef.playAsync();
      }
    } catch (err) {
      console.error('Play error:', err);
    }
  }, []);

  const pause = useCallback(async () => {
    if (!soundRef) return;
    try {
      const status = await soundRef.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await soundRef.pauseAsync();
      }
    } catch (err) {
      console.error('Pause error:', err);
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (!soundRef) return;
    try {
      const status = await soundRef.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        await soundRef.pauseAsync();
      } else {
        await soundRef.playAsync();
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  }, []);

  const seekTo = useCallback(async (seconds: number) => {
    if (!soundRef) return;
    try {
      await soundRef.setPositionAsync(seconds * 1000);
    } catch (err) {
      console.error('Seek error:', err);
    }
  }, []);

  return { play, pause, togglePlayPause, seekTo };
};

export const getSound = () => soundRef;
