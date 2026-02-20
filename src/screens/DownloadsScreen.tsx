import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Song } from '../types';
import { getDownloadedSongs, deleteSong } from '../services/download';
import { SongCard } from '../components/SongCard';
import { usePlayerStore } from '../store/playerStore';
import { Colors, Fonts, Spacing } from '../utils/theme';

export const DownloadsScreen: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentSong, isPlaying, setCurrentSong } = usePlayerStore();

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getDownloadedSongs();
    setSongs(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const handleDelete = (song: Song) => {
    Alert.alert(
      'Delete Download',
      `Remove "${song.name}" from downloads?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteSong(song.id);
            setSongs((prev) => prev.filter((s) => s.id !== song.id));
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Song }) => (
    <View style={styles.itemRow}>
      <View style={styles.cardWrapper}>
        <SongCard
          song={item}
          isActive={currentSong?.id === item.id}
          isPlaying={currentSong?.id === item.id && isPlaying}
          onPress={() => setCurrentSong(item, songs, songs.indexOf(item))}
        />
      </View>
      <TouchableOpacity
        onPress={() => handleDelete(item)}
        style={styles.deleteBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={20} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Downloads</Text>
        <Text style={styles.subtitle}>{songs.length} songs offline</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : songs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cloud-download-outline" size={56} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No downloads yet</Text>
          <Text style={styles.emptySubtitle}>
            Long press any song on the home screen to download it
          </Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListFooterComponent={<View style={{ height: 140 }} />}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  cardWrapper: {
    flex: 1,
  },
  deleteBtn: {
    padding: 8,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: Fonts.sizes.xl,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.md,
    textAlign: 'center',
    lineHeight: 22,
  },
});
