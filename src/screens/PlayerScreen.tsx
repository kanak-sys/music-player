import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePlayerStore } from '../store/playerStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { getBestImageUrl, getSongArtists, formatDuration } from '../services/api';
import { Colors, Fonts, Spacing } from '../utils/theme';

const { width } = Dimensions.get('window');

export const PlayerScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    currentSong,
    isPlaying,
    isLoading,
    duration,
    position,
    shuffle,
    repeat,
    playNext,
    playPrev,
    toggleShuffle,
    toggleRepeat,
    addToQueue,
  } = usePlayerStore();

  const { togglePlayPause, seekTo } = useAudioPlayer();

  if (!currentSong) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Ionicons name="musical-notes-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No song selected</Text>
        </View>
      </SafeAreaView>
    );
  }

  const imageUrl = getBestImageUrl(currentSong);
  const artists = getSongArtists(currentSong);
  const progress = duration > 0 ? position / duration : 0;

  const repeatIcon = repeat === "one" ? "repeat" : repeat === "all" ? "repeat" : "repeat-outline";
  const repeatColor =
    repeat === 'none' ? Colors.textMuted : Colors.primaryLight;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a0a2e', Colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-down" size={28} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Now Playing</Text>
            <Text style={styles.headerSub}>{currentSong.album?.name || ''}</Text>
          </View>
          <TouchableOpacity
            onPress={() => addToQueue(currentSong)}
            style={styles.backBtn}
          >
            <Ionicons name="add" size={26} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Artwork */}
        <View style={styles.artworkContainer}>
          <Image source={{ uri: imageUrl }} style={styles.artwork} />
        </View>

        {/* Info */}
        <View style={styles.songInfo}>
          <View style={styles.songInfoText}>
            <Text style={styles.songName} numberOfLines={1}>
              {currentSong.name}
            </Text>
            <Text style={styles.songArtist} numberOfLines={1}>
              {artists}
            </Text>
          </View>
          {currentSong.hasLyrics === 'true' && (
            <View style={styles.lyricsBadge}>
              <Text style={styles.lyricsBadgeText}>Lyrics</Text>
            </View>
          )}
        </View>

        {/* Seek Bar */}
        <View style={styles.seekContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={progress}
            onSlidingComplete={(val) => seekTo(val * duration)}
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor={Colors.border}
            thumbTintColor={Colors.primaryLight}
          />
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatDuration(position)}</Text>
            <Text style={styles.timeText}>{formatDuration(duration)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Shuffle */}
          <TouchableOpacity onPress={toggleShuffle}>
            <Ionicons
              name="shuffle"
              size={24}
              color={shuffle ? Colors.primaryLight : Colors.textMuted}
            />
          </TouchableOpacity>

          {/* Prev */}
          <TouchableOpacity onPress={playPrev} style={styles.controlBtn}>
            <Ionicons name="play-skip-back" size={32} color={Colors.text} />
          </TouchableOpacity>

          {/* Play/Pause */}
          <TouchableOpacity style={styles.playBtn} onPress={togglePlayPause}>
            {isLoading ? (
              <ActivityIndicator color={Colors.text} size="small" />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={36}
                color={Colors.text}
              />
            )}
          </TouchableOpacity>

          {/* Next */}
          <TouchableOpacity onPress={playNext} style={styles.controlBtn}>
            <Ionicons name="play-skip-forward" size={32} color={Colors.text} />
          </TouchableOpacity>

          {/* Repeat */}
          <TouchableOpacity onPress={toggleRepeat}>
            <View>
              <Ionicons name={repeatIcon} size={24} color={repeatColor} />
              {repeat === 'one' && (
                <View style={styles.repeatOneBadge}>
                  <Text style={styles.repeatOneBadgeText}>1</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Extra info */}
        <View style={styles.extraInfo}>
          {currentSong.language && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{currentSong.language.toUpperCase()}</Text>
            </View>
          )}
          {currentSong.year && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{currentSong.year}</Text>
            </View>
          )}
          {currentSong.playCount && (
            <Text style={styles.playCount}>
              {parseInt(currentSong.playCount).toLocaleString()} plays
            </Text>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    padding: 8,
    width: 44,
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: Fonts.sizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerSub: {
    color: Colors.textSecondary,
    fontSize: Fonts.sizes.xs,
    marginTop: 2,
  },
  artworkContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  artwork: {
    width: width - 80,
    height: width - 80,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  songInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  songInfoText: {
    flex: 1,
  },
  songName: {
    color: Colors.text,
    fontSize: Fonts.sizes.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  songArtist: {
    color: Colors.textSecondary,
    fontSize: Fonts.sizes.md,
  },
  lyricsBadge: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  lyricsBadgeText: {
    color: Colors.primaryLight,
    fontSize: Fonts.sizes.xs,
    fontWeight: '600',
  },
  seekContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  timeText: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.xs,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  controlBtn: {
    padding: 8,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  repeatOneBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatOneBadgeText: {
    color: Colors.text,
    fontSize: 8,
    fontWeight: '700',
  },
  extraInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    color: Colors.textSecondary,
    fontSize: Fonts.sizes.xs,
    fontWeight: '600',
  },
  playCount: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.xs,
  },
});
