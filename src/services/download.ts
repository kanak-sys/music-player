import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../types';
import { getBestDownloadUrl } from './api';

// expo-file-system v19 compatible
const getDownloadsDir = (): string => {
  const base = FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '';
  return base + 'downloads/';
};

const DOWNLOADS_KEY = 'downloaded_songs';

export const ensureDownloadsDir = async (): Promise<void> => {
  const dir = getDownloadsDir();
  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  } catch (e) {
    // Directory might already exist
  }
};

export const downloadSong = async (
  song: Song,
  onProgress?: (progress: number) => void
): Promise<string> => {
  await ensureDownloadsDir();

  const url = getBestDownloadUrl(song);
  if (!url) throw new Error('No download URL available');

  const localUri = getDownloadsDir() + `${song.id}.mp4`;

  // Delete existing file if present
  try {
    const existing = await FileSystem.getInfoAsync(localUri);
    if (existing.exists) await FileSystem.deleteAsync(localUri);
  } catch (_) {}

  // Download using fetch + writeAsStringAsync for v19 compatibility
  try {
    const callback = onProgress
      ? (p: FileSystem.DownloadProgressData) => {
          if (p.totalBytesExpectedToWrite > 0) {
            onProgress(p.totalBytesWritten / p.totalBytesExpectedToWrite);
          }
        }
      : undefined;

    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      localUri,
      {},
      callback
    );

    const result = await downloadResumable.downloadAsync();
    console.log('Download result:', result?.uri); // 👈 check if download worked

    if (!result?.uri) throw new Error('Download failed — no URI returned');

    // Persist metadata
    const downloads = await getDownloadedSongs();
    const updatedSong: Song = { ...song, isDownloaded: true, localUri: result.uri };
    const existing = downloads.findIndex((s) => s.id === song.id);
    if (existing >= 0) downloads[existing] = updatedSong;
    else downloads.push(updatedSong);
    await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));

    const saved = await AsyncStorage.getItem(DOWNLOADS_KEY); // 👈 verify it saved
    console.log('AsyncStorage after save:', saved);

    return result.uri;
  } catch (err) {
    console.error('Download error:', err);
    throw err;
  }
};

export const getDownloadedSongs = async (): Promise<Song[]> => {
  try {
    const data = await AsyncStorage.getItem(DOWNLOADS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const deleteSong = async (songId: string): Promise<void> => {
  try {
    const downloads = await getDownloadedSongs();
    const song = downloads.find((s) => s.id === songId);
    if (song?.localUri) {
      const info = await FileSystem.getInfoAsync(song.localUri);
      if (info.exists) await FileSystem.deleteAsync(song.localUri, { idempotent: true });
    }
    const updated = downloads.filter((s) => s.id !== songId);
    await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Delete error:', err);
  }
};

export const isSongDownloaded = async (songId: string): Promise<string | null> => {
  try {
    const downloads = await getDownloadedSongs();
    const song = downloads.find((s) => s.id === songId);
    if (!song?.localUri) return null;
    // Verify file still exists on device
    const info = await FileSystem.getInfoAsync(song.localUri);
    return info.exists ? song.localUri : null;
  } catch {
    return null;
  }
};
