import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Song } from '../types';
import { searchSongs, getTrendingSongs } from '../services/api';
import { SongCard } from '../components/SongCard';
import { usePlayerStore } from '../store/playerStore';
import { Colors, Fonts, Spacing } from '../utils/theme';

export const HomeScreen: React.FC = () => {
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const { currentSong, isPlaying, setCurrentSong, addToQueue } = usePlayerStore();
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadTrending = async () => {
    setLoading(true);
    try {
      const data = await getTrendingSongs();
      setSongs(data);
      setTotal(data.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrending();
  }, []);

  const doSearch = useCallback(async (q: string, pg: number = 1) => {
    if (!q.trim()) {
      setIsSearching(false);
      loadTrending();
      return;
    }
    setIsSearching(true);
    if (pg === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const result = await searchSongs(q, pg);
      if (pg === 1) setSongs(result.results || []);
      else setSongs((prev) => [...prev, ...(result.results || [])]);
      setTotal(result.total || 0);
      setPage(pg);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => doSearch(text, 1), 400);
  };

  const handleLoadMore = () => {
    if (loadingMore || !isSearching || songs.length >= total) return;
    doSearch(query, page + 1);
  };

  const handleSongPress = (song: Song) => {
    setCurrentSong(song, songs, songs.indexOf(song));
  };

  const renderItem = ({ item }: { item: Song }) => (
    <SongCard
      song={item}
      isActive={currentSong?.id === item.id}
      isPlaying={currentSong?.id === item.id && isPlaying}
      onPress={() => handleSongPress(item)}
      onAddToQueue={() => addToQueue(item)}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 140 }} />;
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>
          {isSearching ? `${total.toLocaleString()} results` : 'Trending Now'}
        </Text>
      </View>

      {/* Search Bar */}
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

      {/* Song List */}
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
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="musical-notes-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No songs found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    color: Colors.text,
    fontSize: Fonts.sizes.xxxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Fonts.sizes.sm,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: Fonts.sizes.md,
  },
  list: {
    paddingTop: 4,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 120,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 8,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.md,
  },
});
