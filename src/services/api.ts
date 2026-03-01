import axios from 'axios';
import { Song, SearchResult } from '../types';

const BASE_URL = 'https://saavn.sumit.co';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const searchSongs = async (query: string, page = 1, limit = 20, retries = 2): Promise<SearchResult> => {
  try {
    const response = await api.get('/api/search/songs', { params: { query, page, limit } });
    return response.data.data;
  } catch (err: any) {
    if (err?.response?.status === 429 && retries > 0) {
      await new Promise(res => setTimeout(res, 2000));
      return searchSongs(query, page, limit, retries - 1);
    }
    throw err;
  }
};

export const getSongById = async (id: string): Promise<Song> => {
  const response = await api.get(`/api/songs/${id}`);
  return response.data.data[0];
};

export const getSongSuggestions = async (id: string): Promise<Song[]> => {
  const response = await api.get(`/api/songs/${id}/suggestions`);
  return response.data.data;
};

let trendingCache: Song[] | null = null;

export const getTrendingSongs = async (): Promise<Song[]> => {
  if (trendingCache) return trendingCache;
  try {
    const response = await api.get('/api/search/songs', {
      params: { query: 'top hits 2024', limit: 20 },
    });
    trendingCache = response.data.data?.results || [];
    return trendingCache!;
  } catch (err: any) {
    if (err?.response?.status === 429) return trendingCache || [];
    throw err;
  }
};

export const getArtistSongs = async (artistId: string): Promise<Song[]> => {
  const response = await api.get(`/api/artists/${artistId}/songs`);
  return response.data.data?.results || [];
};

// ✅ NEW: Genre/Mood playlists — each returns 20 songs
export type PlaylistKey =
  | 'bhojpuri'
  | 'punjabi'
  | 'bollywood'
  | 'romantic'
  | 'party'
  | 'sad'
  | 'devotional'
  | 'english'
  | '90s'
  | 'lofi';

export const PLAYLISTS: Record<PlaylistKey, { label: string; emoji: string; query: string }> = {
  bhojpuri:   { label: 'Bhojpuri Hits',   emoji: '🎺', query: 'bhojpuri hit songs 2024' },
  punjabi:    { label: 'Punjabi Beats',   emoji: '🥁', query: 'punjabi hits 2024' },
  bollywood:  { label: 'Bollywood',       emoji: '🎬', query: 'bollywood top songs 2024' },
  romantic:   { label: 'Romantic',        emoji: '❤️', query: 'romantic hindi love songs' },
  party:      { label: 'Party Anthems',   emoji: '🎉', query: 'party dance songs hindi' },
  sad:        { label: 'Sad Songs',       emoji: '😢', query: 'sad hindi songs heartbreak' },
  devotional: { label: 'Devotional',      emoji: '🙏', query: 'bhajan aarti devotional hindi' },
  english:    { label: 'English Hits',    emoji: '🌍', query: 'top english hits 2024' },
  '90s':      { label: '90s Classics',   emoji: '📼', query: '90s hindi classic songs' },
  lofi:       { label: 'Lofi Chill',      emoji: '🎧', query: 'lofi hindi chill beats' },
};

const playlistCache: Partial<Record<PlaylistKey, Song[]>> = {};

export const getPlaylistSongs = async (key: PlaylistKey): Promise<Song[]> => {
  if (playlistCache[key]) return playlistCache[key]!;
  try {
    const { query } = PLAYLISTS[key];
    const response = await api.get('/api/search/songs', {
      params: { query, limit: 20 },
    });
    const results: Song[] = response.data.data?.results || [];
    playlistCache[key] = results;
    return results;
  } catch (err) {
    console.error(`Playlist fetch error for ${key}:`, err);
    return [];
  }
};

export const getBestDownloadUrl = (song: Song): string => {
  const urls = song.downloadUrl || [];
  const preferred = ['320kbps', '160kbps', '96kbps', '48kbps', '12kbps'];
  for (const quality of preferred) {
    const found = urls.find((u) => u.quality === quality);
    if (found) return found.url || found.link || '';
  }
  if (urls.length > 0) return urls[urls.length - 1].url || urls[urls.length - 1].link || '';
  return '';
};

export const getBestImageUrl = (song: Song): string => {
  const images = song.image || [];
  const preferred = ['500x500', '150x150', '50x50'];
  for (const quality of preferred) {
    const found = images.find((i) => i.quality === quality);
    if (found) return found.url || found.link || '';
  }
  if (images.length > 0) return images[images.length - 1].url || images[images.length - 1].link || '';
  return '';
};

export const getSongArtists = (song: Song): string => {
  if (song.artists?.primary && song.artists.primary.length > 0) {
    return song.artists.primary.map((a) => a.name).join(', ');
  }
  return song.primaryArtists || 'Unknown Artist';
};

export const formatDuration = (seconds: number | string): string => {
  const secs = typeof seconds === 'string' ? parseInt(seconds) : seconds;
  if (isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};
