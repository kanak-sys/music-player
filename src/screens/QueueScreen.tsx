import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  PanResponder,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../store/playerStore';
import { SongCard } from '../components/SongCard';
import { Colors, Fonts, Spacing } from '../utils/theme';
import { Song } from '../types';

const ITEM_HEIGHT = 72;

export const QueueScreen: React.FC = () => {
  const {
    queue,
    currentSong,
    isPlaying,
    setCurrentSong,
    removeFromQueue,
    clearQueue,
    reorderQueue,
  } = usePlayerStore();

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;
  const dragStartY = useRef(0);
  const dragStartIndex = useRef(0);

  const createPanResponder = (index: number) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        dragStartY.current = e.nativeEvent.pageY;
        dragStartIndex.current = index;
        dragY.setValue(0);
        setDraggingIndex(index);
        setHoverIndex(index);
      },
      onPanResponderMove: (e) => {
        const dy = e.nativeEvent.pageY - dragStartY.current;
        dragY.setValue(dy);
        const newIndex = Math.max(
          0,
          Math.min(queue.length - 1, Math.round(index + dy / ITEM_HEIGHT))
        );
        setHoverIndex(newIndex);
      },
      onPanResponderRelease: () => {
        if (hoverIndex !== null && hoverIndex !== dragStartIndex.current) {
          reorderQueue(dragStartIndex.current, hoverIndex);
        }
        setDraggingIndex(null);
        setHoverIndex(null);
        dragY.setValue(0);
      },
    });

  if (queue.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Queue</Text>
        </View>
        <View style={styles.empty}>
          <Ionicons name="list-outline" size={56} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Queue is empty</Text>
          <Text style={styles.emptySubtitle}>Search for songs and add them to your queue</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item, index }: { item: Song; index: number }) => {
    const isDragging = draggingIndex === index;
    const isHover = hoverIndex === index && draggingIndex !== null && draggingIndex !== index;
    return (
      <Animated.View
        style={[
          styles.queueItem,
          isDragging && styles.draggingItem,
          isHover && styles.hoverItem,
          isDragging && { transform: [{ translateY: dragY }], zIndex: 999 },
        ]}
      >
        <View {...createPanResponder(index).panHandlers} style={styles.dragHandle}>
          <Ionicons name="reorder-three-outline" size={24} color={Colors.textSecondary} />
        </View>
        <View style={styles.cardWrapper}>
          <SongCard
            song={item}
            isActive={currentSong?.id === item.id}
            isPlaying={currentSong?.id === item.id && isPlaying}
            onPress={() => setCurrentSong(item, queue, index)}
            showDuration={false}
          />
        </View>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => removeFromQueue(index)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle" size={22} color={Colors.textMuted} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Queue</Text>
          <Text style={styles.subtitle}>{queue.length} songs</Text>
        </View>
        <TouchableOpacity style={styles.clearBtn} onPress={() =>
          Alert.alert('Clear Queue', 'Remove all songs from queue?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: clearQueue },
          ])
        }>
          <Ionicons name="trash-outline" size={18} color={Colors.error} />
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {currentSong && (
        <View style={styles.nowPlayingBar}>
          <Ionicons name="musical-notes" size={14} color={Colors.primaryLight} />
          <Text style={styles.nowPlayingText}>Now Playing: {currentSong.name}</Text>
        </View>
      )}

      <View style={styles.hint}>
        <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.hintText}>Hold the handle to drag and reorder</Text>
      </View>

      <FlatList
        data={queue}
        keyExtractor={(item, idx) => `${item.id}-${idx}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        scrollEnabled={draggingIndex === null}
        ListFooterComponent={<View style={{ height: 140 }} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  title: { color: Colors.text, fontSize: Fonts.sizes.xxxl, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: Colors.textSecondary, fontSize: Fonts.sizes.sm, marginTop: 2 },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
  },
  clearBtnText: { color: Colors.error, fontSize: Fonts.sizes.sm, fontWeight: '600' },
  nowPlayingBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: Spacing.md, marginBottom: 4,
    backgroundColor: Colors.surfaceLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  nowPlayingText: { color: Colors.primaryLight, fontSize: Fonts.sizes.xs, fontWeight: '500', flex: 1 },
  hint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: Spacing.md, marginBottom: 8, marginTop: 4,
  },
  hintText: { color: Colors.textMuted, fontSize: Fonts.sizes.xs },
  list: { paddingTop: 4 },
  queueItem: {
    flexDirection: 'row', alignItems: 'center', paddingRight: 12,
    height: ITEM_HEIGHT, backgroundColor: Colors.background,
  },
  draggingItem: {
    backgroundColor: Colors.surfaceLight, borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 12, opacity: 0.95,
  },
  hoverItem: { borderTopWidth: 2, borderTopColor: Colors.primary },
  dragHandle: { paddingLeft: 12, paddingRight: 8, height: '100%', justifyContent: 'center' },
  cardWrapper: { flex: 1 },
  removeBtn: { padding: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyTitle: { color: Colors.text, fontSize: Fonts.sizes.xl, fontWeight: '700' },
  emptySubtitle: { color: Colors.textMuted, fontSize: Fonts.sizes.md, textAlign: 'center', lineHeight: 22 },
});
