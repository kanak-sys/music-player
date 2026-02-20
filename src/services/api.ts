import axios from 'axios';
import { Song, SearchResult } from '../types';

const BASE_URL = 'https://saavn.sumit.co';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const searchSongs = async (
  query: string,
  page: number = 1,
  limit: number = 20
): Promise<SearchResult> => {
  const response = await api.get('/api/search/songs', {
    params: { query, page, limit },
  });
  return response.data.data;
};

export const getSongById = async (id: string): Promise<Song> => {
  const response = await api.get(`/api/songs/${id}`);
  return response.data.data[0];
};

export const getSongSuggestions = async (id: string): Promise<Song[]> => {
  const response = await api.get(`/api/songs/${id}/suggestions`);
  return response.data.data;
};

export const getTrendingSongs = async (): Promise<Song[]> => {
  const response = await api.get('/api/search/songs', {
    params: { query: 'top hits 2024', limit: 20 },
  });
  return response.data.data?.results || [];
};

export const getArtistSongs = async (artistId: string): Promise<Song[]> => {
  const response = await api.get(`/api/artists/${artistId}/songs`);
  return response.data.data?.results || [];
};

export const getBestDownloadUrl = (song: Song): string => {
  const urls = song.downloadUrl || [];
  // Prefer 320kbps, fallback to highest available
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
