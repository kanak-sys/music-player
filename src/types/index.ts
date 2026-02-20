export interface SongImage {
  quality: string;
  url?: string;
  link?: string;
}

export interface DownloadUrl {
  quality: string;
  url?: string;
  link?: string;
}

export interface Artist {
  id: string;
  name: string;
  url?: string;
  image?: SongImage[];
  type?: string;
}

export interface Album {
  id: string;
  name: string;
  url?: string;
}

export interface Song {
  id: string;
  name: string;
  duration: number | string;
  language?: string;
  year?: string;
  album?: Album;
  artists?: {
    primary?: Artist[];
    featured?: Artist[];
    all?: Artist[];
  };
  primaryArtists?: string;
  image: SongImage[];
  downloadUrl: DownloadUrl[];
  url?: string;
  hasLyrics?: string | boolean;
  playCount?: string;
  isDownloaded?: boolean;
  localUri?: string;
}

export interface SearchResult {
  results: Song[];
  total: number;
  start: number;
}

export interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  currentIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  position: number;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  shuffledQueue: Song[];
}

export type RootStackParamList = {
  MainTabs: undefined;
  Player: undefined;
};

export type TabParamList = {
  Home: undefined;
  Queue: undefined;
  Downloads: undefined;
};
