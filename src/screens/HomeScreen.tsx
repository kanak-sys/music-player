import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Song } from '../types';
import {
  searchSongs, getTrendingSongs, getBestImageUrl, getSongArtists,
  getPlaylistSongs, PLAYLISTS, PlaylistKey,
} from '../services/api';
import { SongCard } from '../components/SongCard';
import { usePlayerStore } from '../store/playerStore';
import { Colors, Fonts, Spacing } from '../utils/theme';

const RECENT_QUERIES = ['new hindi 2024', 'latest bollywood 2024', 'new songs december 2024'];

const PlaylistPill = memo(({
  playlistKey, isActive, isLoading, onPress,
}: {
  playlistKey: PlaylistKey;
  isActive: boolean;
  isLoading: boolean;
  onPress: (key: PlaylistKey) => void;
}) => {
  const pl = PLAYLISTS[playlistKey];
  return (
    <TouchableOpacity
      style={[pl_styles.pill, isActive && pl_styles.pillActive]}
      onPress={() => onPress(playlistKey)}
      activeOpacity={0.7}
      disabled={isLoading}
    >
      {isLoading && isActive
        ? <ActivityIndicator size={12} color={Colors.text} />
        : <Text style={pl_styles.pillEmoji}>{pl.emoji}</Text>
      }
      <Text style={[pl_styles.pillLabel, isActive && pl_styles.pillLabelActive]}>
        {pl.label}
      </Text>
    </TouchableOpacity>
  );
});

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [recentReleases, setRecentReleases] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistKey | null>(null);
  const [loadingPlaylist, setLoadingPlaylist] = useState(false);

  const { currentSong, isPlaying, setCurrentSong, addToQueue } = usePlayerStore();
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadTrending = async () => {
    setLoading(true);
    try {
      const data = await getTrendingSongs();
      setSongs(data);
      setTotal(data.length);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadRecentReleases = async () => {
    setLoadingRecent(true);
    try {
      const q = RECENT_QUERIES[Math.floor(Math.random() * RECENT_QUERIES.length)];
      const result = await searchSongs(q, 1, 10);
      setRecentReleases(result.results || []);
    } catch (err) { console.error(err); }
    finally { setLoadingRecent(false); }
  };

  useEffect(() => {
    loadTrending();
    loadRecentReleases();
  }, []);

  const handlePlaylistSelect = useCallback(async (key: PlaylistKey) => {
    if (loadingPlaylist) return;
    if (selectedPlaylist === key) {
      setSelectedPlaylist(null);
      setIsSearching(false);
      loadTrending();
      return;
    }
    setSelectedPlaylist(key);
    setIsSearching(false);
    setQuery('');
    setLoadingPlaylist(true);
    try {
      const data = await getPlaylistSongs(key);
      setSongs(data);
      setTotal(data.length);
    } catch (err) { console.error(err); }
    finally { setLoadingPlaylist(false); }
  }, [selectedPlaylist, loadingPlaylist]);

  const doSearch = useCallback(async (q: string, pg: number = 1) => {
    if (!q.trim()) {
      setIsSearching(false);
      setSelectedPlaylist(null);
      loadTrending();
      return;
    }
    setIsSearching(true);
    setSelectedPlaylist(null);
    if (pg === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const result = await searchSongs(q, pg);
      if (pg === 1) setSongs(result.results || []);
      else setSongs(prev => [...prev, ...(result.results || [])]);
      setTotal(result.total || 0);
      setPage(pg);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setLoadingMore(false); }
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => doSearch(text, 1), 800);
  };

  const handleLoadMore = () => {
    if (loadingMore || !isSearching || songs.length >= total) return;
    doSearch(query, page + 1);
  };

  // ✅ KEY FIX: Pass the current visible list as sessionSongs (for autoplay)
  // This does NOT modify the user's queue — queue screen stays clean
  const handleSongPress = useCallback((song: Song, list: Song[]) => {
    const idx = list.findIndex(s => s.id === song.id);
    setCurrentSong(song, list, idx >= 0 ? idx : 0);
  }, [setCurrentSong]);

  const getSectionTitle = () => {
    if (isSearching) return 'Search Results';
    if (selectedPlaylist) return PLAYLISTS[selectedPlaylist].label;
    return 'Trending Now';
  };

  const ListHeader = useCallback(() => (
    <View>
      {!isSearching && !selectedPlaylist && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Recent Releases</Text>
            </View>
            <Text style={styles.sectionSub}>Fresh drops</Text>
          </View>
          {loadingRecent ? (
            <View style={styles.recentLoader}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentList}>
              {recentReleases.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={rc.card}
                  onPress={() => handleSongPress(item, recentReleases)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: getBestImageUrl(item) }} style={rc.image} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={rc.gradient} />
                  {currentSong?.id === item.id && (
                    <View style={rc.playingBadge}>
                      <Ionicons name="musical-notes" size={10} color={Colors.text} />
                    </View>
                  )}
                  <View style={rc.info}>
                    <Text style={rc.name} numberOfLines={2}>{item.name}</Text>
                    <Text style={rc.artist} numberOfLines={1}>{getSongArtists(item)}</Text>
                  </View>
                  <TouchableOpacity style={rc.addBtn} onPress={() => addToQueue(item)}>
                    <Ionicons name="add-circle" size={26} color={Colors.primaryLight} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {!isSearching && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionDot, { backgroundColor: Colors.accent }]} />
              <Text style={styles.sectionTitle}>Playlists</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={pl_styles.pillRow}>
            {(Object.keys(PLAYLISTS) as PlaylistKey[]).map((key) => (
              <PlaylistPill
                key={key}
                playlistKey={key}
                isActive={selectedPlaylist === key}
                isLoading={loadingPlaylist}
                onPress={handlePlaylistSelect}
              />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.sectionTitle}>{getSectionTitle()}</Text>
        </View>
        {isSearching && <Text style={styles.sectionSub}>{total.toLocaleString()} songs</Text>}
        {selectedPlaylist && !loadingPlaylist && (
          <TouchableOpacity onPress={() => handlePlaylistSelect(selectedPlaylist)}>
            <Text style={styles.sectionSub}>✕ Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {loadingPlaylist && (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      )}
    </View>
  ), [isSearching, selectedPlaylist, loadingPlaylist, loadingRecent, recentReleases, currentSong?.id, total]);

  const renderItem = useCallback(({ item }: { item: Song }) => (
    <SongCard
      song={item}
      isActive={currentSong?.id === item.id}
      isPlaying={currentSong?.id === item.id && isPlaying}
      onPress={() => handleSongPress(item, songs)}
      onAddToQueue={() => addToQueue(item)}
    />
  ), [currentSong?.id, isPlaying, songs]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuBtn}>
          <Ionicons name="menu" size={26} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>What do you want to hear?</Text>
        </View>
        <View style={styles.logoMini}>
          <Text style={styles.logoText}>K</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs, artists, albums..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={handleQueryChange}
          returnKeyType="search"
          onSubmitEditing={() => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
            doSearch(query, 1);
          }}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); doSearch(''); }}>
            <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item, idx) => `${item.id}-${idx}`}
          renderItem={renderItem}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={() => (
            <View style={styles.footer}>
              {loadingMore && <ActivityIndicator color={Colors.primary} />}
              <Text style={styles.signature}>made with ♪ by Kanak</Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            !loadingPlaylist ? (
              <View style={styles.center}>
                <Ionicons name="musical-notes-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No songs found</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const pl_styles = StyleSheet.create({
  pillRow: { paddingHorizontal: Spacing.md, paddingBottom: 8, gap: 8, flexDirection: 'row' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillEmoji: { fontSize: 14 },
  pillLabel: { color: Colors.textSecondary, fontSize: Fonts.sizes.sm, fontWeight: '600' },
  pillLabelActive: { color: Colors.text },
});

const rc = StyleSheet.create({
  card: { width: 148, height: 190, borderRadius: 16, marginRight: 12, overflow: 'hidden', backgroundColor: Colors.surface },
  image: { width: '100%', height: '100%', position: 'absolute' },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 110 },
  playingBadge: {
    position: 'absolute', top: 8, right: 8, backgroundColor: Colors.primary,
    borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
  },
  info: { position: 'absolute', bottom: 30, left: 10, right: 10 },
  name: { color: Colors.text, fontSize: Fonts.sizes.sm, fontWeight: '700', marginBottom: 2 },
  artist: { color: Colors.textSecondary, fontSize: Fonts.sizes.xs },
  addBtn: { position: 'absolute', bottom: 4, right: 6 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: 8, paddingBottom: 12 },
  menuBtn: { padding: 4, marginRight: 12 },
  headerCenter: { flex: 1 },
  title: { color: Colors.text, fontSize: Fonts.sizes.xxl, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: Colors.textSecondary, fontSize: Fonts.sizes.xs, marginTop: 1 },
  logoMini: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: Colors.text, fontSize: Fonts.sizes.md, fontWeight: '900' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 14, marginHorizontal: Spacing.md, marginBottom: Spacing.md,
    paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: Colors.text, fontSize: Fonts.sizes.md },
  section: { marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, marginBottom: 12, marginTop: 4 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionDot: { width: 4, height: 18, borderRadius: 2, backgroundColor: Colors.primary },
  sectionTitle: { color: Colors.text, fontSize: Fonts.sizes.lg, fontWeight: '700' },
  sectionSub: { color: Colors.textMuted, fontSize: Fonts.sizes.xs },
  recentList: { paddingHorizontal: Spacing.md, paddingBottom: 4 },
  recentLoader: { height: 190, alignItems: 'center', justifyContent: 'center' },
  list: { paddingTop: 4 },
  footer: { alignItems: 'center', paddingVertical: 24, marginBottom: 120, gap: 8 },
  signature: { color: Colors.textMuted, fontSize: Fonts.sizes.xs, fontStyle: 'italic', letterSpacing: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  loadingText: { color: Colors.textSecondary, marginTop: 8 },
  emptyText: { color: Colors.textMuted, fontSize: Fonts.sizes.md },
});
