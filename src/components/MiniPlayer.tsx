import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { usePlayerStore } from '../store/playerStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { getBestImageUrl, getSongArtists } from '../services/api';
import { Colors, Fonts, Spacing } from '../utils/theme';
import { RootStackParamList } from '../types';

type Nav = StackNavigationProp<RootStackParamList>;

export const MiniPlayer: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { currentSong, isPlaying, isLoading, playNext } = usePlayerStore();
  const { togglePlayPause } = useAudioPlayer();

  if (!currentSong) return null;

  const imageUrl = getBestImageUrl(currentSong);
  const artists = getSongArtists(currentSong);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('Player')}
      activeOpacity={0.95}
    >
      <View style={styles.inner}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {currentSong.name}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {artists}
          </Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={togglePlayPause}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={26}
                color={Colors.text}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={playNext}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="play-skip-forward" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60,
    left: 8,
    right: 8,
    backgroundColor: Colors.miniPlayer,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  image: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  name: {
    color: Colors.text,
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  artist: {
    color: Colors.textSecondary,
    fontSize: Fonts.sizes.sm,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
});
