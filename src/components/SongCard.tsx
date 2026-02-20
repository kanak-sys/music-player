import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Song } from '../types';
import { getBestImageUrl, getSongArtists, formatDuration } from '../services/api';
import { downloadSong, isSongDownloaded, deleteSong } from '../services/download';
import { Colors, Fonts, Spacing } from '../utils/theme';

interface Props {
  song: Song;
  isActive?: boolean;
  isPlaying?: boolean;
  onPress: () => void;
  onAddToQueue?: () => void;
  showDuration?: boolean;
}

export const SongCard: React.FC<Props> = ({
  song, isActive, isPlaying, onPress, onAddToQueue, showDuration = true,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(song.isDownloaded ?? false);

  const imageUrl = getBestImageUrl(song);
  const artists = getSongArtists(song);
  const duration = formatDuration(song.duration);

  const handleDownload = async () => {
    if (downloading) return;
    if (isDownloaded) {
      Alert.alert('Remove Download', `Delete "${song.name}" from downloads?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            await deleteSong(song.id);
            setIsDownloaded(false);
          },
        },
      ]);
      return;
    }
    setDownloading(true);
    try {
      await downloadSong(song);
      setIsDownloaded(true);
      Alert.alert('Downloaded', `"${song.name}" saved for offline listening.`);
    } catch (e) {
      Alert.alert('Error', 'Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <TouchableOpacity style={[styles.container, isActive && styles.active]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        {isActive && (
          <View style={styles.activeOverlay}>
            <Ionicons name={isPlaying ? 'musical-notes' : 'pause'} size={16} color={Colors.primary} />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, isActive && styles.activeName]} numberOfLines={1}>{song.name}</Text>
        <Text style={styles.artist} numberOfLines={1}>{artists}</Text>
      </View>

      <View style={styles.right}>
        {showDuration && <Text style={styles.duration}>{duration}</Text>}
        <View style={styles.actions}>
          {onAddToQueue && (
            <TouchableOpacity onPress={onAddToQueue} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="add-circle-outline" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleDownload} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            {downloading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons
                name={isDownloaded ? 'checkmark-circle' : 'cloud-download-outline'}
                size={22}
                color={isDownloaded ? Colors.success : Colors.textMuted}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: Spacing.md,
    borderRadius: 12, marginBottom: 4,
  },
  active: { backgroundColor: Colors.surfaceLight },
  imageContainer: { position: 'relative' },
  image: { width: 52, height: 52, borderRadius: 8, backgroundColor: Colors.surface },
  activeOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, marginLeft: Spacing.sm + 4, marginRight: Spacing.sm },
  name: { color: Colors.text, fontSize: Fonts.sizes.md, fontWeight: '500', marginBottom: 3 },
  activeName: { color: Colors.primaryLight },
  artist: { color: Colors.textSecondary, fontSize: Fonts.sizes.sm },
  right: { alignItems: 'flex-end', gap: 4 },
  duration: { color: Colors.textMuted, fontSize: Fonts.sizes.xs },
  actions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
});
