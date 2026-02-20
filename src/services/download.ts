import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../types';
import { getBestDownloadUrl } from './api';

const DOWNLOADS_DIR = FileSystem.documentDirectory + 'downloads/';
const DOWNLOADS_KEY = 'downloaded_songs';

export const ensureDownloadsDir = async () => {
  const dirInfo = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
  }
};

export const downloadSong = async (
  song: Song,
  onProgress?: (progress: number) => void
): Promise<string> => {
  await ensureDownloadsDir();
  const url = getBestDownloadUrl(song);
  if (!url) throw new Error('No download URL available');

  const filename = `${song.id}.mp4`;
  const localUri = DOWNLOADS_DIR + filename;

  const downloadResumable = FileSystem.createDownloadResumable(
    url,
    localUri,
    {},
    (downloadProgress) => {
      const progress =
        downloadProgress.totalBytesWritten /
        downloadProgress.totalBytesExpectedToWrite;
      onProgress?.(progress);
    }
  );

  const result = await downloadResumable.downloadAsync();
  if (!result?.uri) throw new Error('Download failed');

  // Save metadata
  const downloads = await getDownloadedSongs();
  const updatedSong: Song = { ...song, isDownloaded: true, localUri: result.uri };
  const existing = downloads.findIndex((s) => s.id === song.id);
  if (existing >= 0) downloads[existing] = updatedSong;
  else downloads.push(updatedSong);
  await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));

  return result.uri;
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
  const downloads = await getDownloadedSongs();
  const song = downloads.find((s) => s.id === songId);
  if (song?.localUri) {
    const info = await FileSystem.getInfoAsync(song.localUri);
    if (info.exists) await FileSystem.deleteAsync(song.localUri);
  }
  const updated = downloads.filter((s) => s.id !== songId);
  await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(updated));
};

export const isSongDownloaded = async (songId: string): Promise<string | null> => {
  const downloads = await getDownloadedSongs();
  const song = downloads.find((s) => s.id === songId);
  return song?.localUri || null;
};
