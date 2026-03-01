import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Animated, Dimensions,
} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { HomeScreen } from '../screens/HomeScreen';
import { PlayerScreen } from '../screens/PlayerScreen';
import { QueueScreen } from '../screens/QueueScreen';
import { DownloadsScreen } from '../screens/DownloadsScreen';
import { MiniPlayer } from '../components/MiniPlayer';
import { Colors, Fonts, Spacing } from '../utils/theme';
import { RootStackParamList } from '../types';
import { usePlayerStore } from '../store/playerStore';
import { getBestImageUrl, getSongArtists } from '../services/api';

const Stack = createStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

// Custom Drawer Content
const CustomDrawerContent = (props: any) => {
  const { currentSong, isPlaying, queue } = usePlayerStore();

  const menuItems = [
    { name: 'Home', icon: 'home', label: 'Home' },
    { name: 'Queue', icon: 'list', label: 'Queue' },
    { name: 'Downloads', icon: 'cloud-download', label: 'Downloads' },
  ];

  return (
    <View style={drawer.container}>
      <LinearGradient colors={['#2d0a5e', '#1a0a2e', Colors.background]} style={StyleSheet.absoluteFill} />

      {/* Kanak Branding Header */}
      <View style={drawer.brandHeader}>
        <View style={drawer.logoCircle}>
          <Ionicons name="musical-notes" size={28} color={Colors.text} />
        </View>
        <View>
          <Text style={drawer.appName}>Kanak Music</Text>
          <Text style={drawer.tagline}>made with ♪ by Kanak</Text>
        </View>
      </View>

      {/* Now Playing mini card */}
      {currentSong && (
        <TouchableOpacity
          style={drawer.nowPlaying}
          onPress={() => {
            props.navigation.closeDrawer();
            props.navigation.navigate('Player');
          }}
        >
          <Image source={{ uri: getBestImageUrl(currentSong) }} style={drawer.npImage} />
          <View style={drawer.npInfo}>
            <Text style={drawer.npLabel}>Now Playing</Text>
            <Text style={drawer.npName} numberOfLines={1}>{currentSong.name}</Text>
            <Text style={drawer.npArtist} numberOfLines={1}>{getSongArtists(currentSong)}</Text>
          </View>
          <Ionicons name={isPlaying ? 'musical-notes' : 'pause'} size={16} color={Colors.primaryLight} />
        </TouchableOpacity>
      )}

      <View style={drawer.divider} />

      {/* Menu Items */}
      <DrawerContentScrollView {...props} scrollEnabled={false}>
        {menuItems.map((item) => {
          const isActive = props.state.routeNames[props.state.index] === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[drawer.menuItem, isActive && drawer.menuItemActive]}
              onPress={() => props.navigation.navigate(item.name)}
            >
              <View style={[drawer.iconBg, isActive && drawer.iconBgActive]}>
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={isActive ? Colors.text : Colors.textSecondary}
                />
              </View>
              <Text style={[drawer.menuLabel, isActive && drawer.menuLabelActive]}>
                {item.label}
              </Text>
              {item.name === 'Queue' && queue.length > 0 && (
                <View style={drawer.badge}>
                  <Text style={drawer.badgeText}>{queue.length}</Text>
                </View>
              )}
              {isActive && <View style={drawer.activeBar} />}
            </TouchableOpacity>
          );
        })}
      </DrawerContentScrollView>

      {/* Footer Signature */}
      <View style={drawer.footer}>
        <Text style={drawer.footerText}>Kanak Music Player</Text>
        <Text style={drawer.footerSub}>© 2026 Kanak Mishra • JH04</Text>
      </View>
    </View>
  );
};

// Header with hamburger menu
const ScreenHeader = ({ title }: { title: string }) => {
  const navigation = useNavigation<any>();
  return (
    <View style={header.container}>
      <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={header.menuBtn}>
        <Ionicons name="menu" size={26} color={Colors.text} />
      </TouchableOpacity>
      <Text style={header.title}>{title}</Text>
      <View style={header.logoMini}>
        <Text style={header.logoText}>K</Text>
      </View>
    </View>
  );
};

const DrawerNavigator = () => (
  <View style={{ flex: 1 }}>
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { width: '78%', backgroundColor: 'transparent' },
        drawerType: 'slide',
        overlayColor: 'rgba(0,0,0,0.6)',
        swipeEdgeWidth: 60,
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Queue" component={QueueScreen} />
      <Drawer.Screen name="Downloads" component={DownloadsScreen} />
    </Drawer.Navigator>
    <MiniPlayer />
  </View>
);

export const AppNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={DrawerNavigator} />
    <Stack.Screen
      name="Player"
      component={PlayerScreen}
      options={{
        presentation: 'modal',
        cardStyle: { backgroundColor: Colors.background },
        gestureEnabled: true,
        gestureResponseDistance: 200,
      }}
    />
  </Stack.Navigator>
);

const drawer = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  brandHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingBottom: 20,
  },
  logoCircle: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 8,
  },
  appName: { color: Colors.text, fontSize: Fonts.sizes.xl, fontWeight: '800' },
  tagline: { color: Colors.primaryLight, fontSize: Fonts.sizes.xs, marginTop: 2, fontStyle: 'italic' },
  nowPlaying: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  npImage: { width: 40, height: 40, borderRadius: 8, backgroundColor: Colors.surface },
  npInfo: { flex: 1 },
  npLabel: { color: Colors.primaryLight, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  npName: { color: Colors.text, fontSize: Fonts.sizes.sm, fontWeight: '600', marginTop: 1 },
  npArtist: { color: Colors.textSecondary, fontSize: Fonts.sizes.xs, marginTop: 1 },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16, marginBottom: 8 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    marginHorizontal: 8, borderRadius: 14, marginBottom: 4,
    position: 'relative',
  },
  menuItemActive: { backgroundColor: 'rgba(124,58,237,0.15)' },
  iconBg: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBgActive: { backgroundColor: Colors.primary },
  menuLabel: { color: Colors.textSecondary, fontSize: Fonts.sizes.md, fontWeight: '500', flex: 1 },
  menuLabelActive: { color: Colors.text, fontWeight: '700' },
  badge: {
    backgroundColor: Colors.primary, borderRadius: 10,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  badgeText: { color: Colors.text, fontSize: 10, fontWeight: '800' },
  activeBar: {
    position: 'absolute', right: 0, top: 10, bottom: 10,
    width: 3, backgroundColor: Colors.primary, borderRadius: 2,
  },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: Colors.border },
  footerText: { color: Colors.textSecondary, fontSize: Fonts.sizes.sm, fontWeight: '600' },
  footerSub: { color: Colors.textMuted, fontSize: Fonts.sizes.xs, marginTop: 4 },
});

const header = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingTop: 50, paddingBottom: 12,
    backgroundColor: Colors.background,
  },
  menuBtn: { padding: 4, marginRight: 12 },
  title: { flex: 1, color: Colors.text, fontSize: Fonts.sizes.xl, fontWeight: '700' },
  logoMini: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: Colors.text, fontSize: Fonts.sizes.md, fontWeight: '900' },
});
