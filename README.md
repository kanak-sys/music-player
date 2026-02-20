# 🎵 Music Player — React Native Intern Assignment

A music streaming app built with React Native (Expo) using the JioSaavn API.

---

## 📱 Features

| Feature | Status |
|---|---|
| Song search with pagination | ✅ |
| Trending songs on home | ✅ |
| Full-screen player with seek bar | ✅ |
| Background playback | ✅ |
| Mini Player (persistent, synced) | ✅ |
| Queue — add / remove / reorder | ✅ |
| Queue persistence via AsyncStorage | ✅ |
| Shuffle mode | ✅ |
| Repeat (none / all / one) | ✅ |
| Song download (offline playback) | ✅ |
| Downloads management screen | ✅ |

---

## 🚀 Setup

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI (for builds): `npm install -g eas-cli`

### Run locally

```bash
git clone <repo-url>
cd music-player
npm install
npx expo start
```

Scan the QR code with **Expo Go** on Android/iOS, or press `a` for Android emulator.

### Build APK

```bash
eas build --platform android --profile preview
```

---

## 🏗 Architecture

```
src/
├── types/          # TypeScript interfaces (Song, Player state, Nav params)
├── services/
│   ├── api.ts      # All JioSaavn API calls + URL helpers
│   └── download.ts # File download + local metadata via AsyncStorage
├── store/
│   └── playerStore.ts  # Zustand store with AsyncStorage persistence
├── hooks/
│   └── useAudioPlayer.ts  # expo-av audio engine (singleton Sound ref)
├── navigation/
│   └── AppNavigator.tsx   # Stack (root) + Tab (Home/Queue/Downloads)
├── screens/
│   ├── HomeScreen.tsx     # Search + trending + paginated list
│   ├── PlayerScreen.tsx   # Full player with controls
│   ├── QueueScreen.tsx    # Queue management
│   └── DownloadsScreen.tsx
└── components/
    ├── SongCard.tsx   # Reusable song row
    └── MiniPlayer.tsx # Persistent bottom bar
```

### State Management — Zustand

- Single `playerStore` owns all playback state: `currentSong`, `queue`, `isPlaying`, `position`, `duration`, `shuffle`, `repeat`
- Persisted slice (queue, currentSong, shuffle, repeat) saved to AsyncStorage via `zustand/middleware`
- Both MiniPlayer and PlayerScreen read from the same store → always in sync

### Audio Engine — expo-av

- A module-level `soundRef` holds the single `Audio.Sound` instance
- `useAudioPlayer` hook is mounted once at the App root (`AudioInitializer`) so it stays alive during navigation
- `staysActiveInBackground: true` enables background playback on both iOS and Android
- Playback status callback drives position/duration updates and triggers `playNext` on song end

---

## ⚖️ Trade-offs

| Decision | Reasoning |
|---|---|
| **expo-av** over react-native-track-player | Easier Expo managed workflow; RNTP gives better lock-screen controls but requires ejecting or bare workflow |
| **AsyncStorage** over MMKV | No native module setup needed in Expo managed; MMKV is faster but requires bare workflow or a dev client |
| **Module-level soundRef** | Avoids re-creating Sound on re-renders; a singleton pattern works well for a single-track player |
| **No DraggableFlatList for queue** | Kept simple; drag-to-reorder UI is a bonus enhancement |
| **No lock-screen media controls** | Requires expo-notifications or bare workflow; background audio works but no system UI controls |

---

## 🔌 API

Base URL: `https://saavn.sumit.co/`  
No API key required.

Key endpoints used:
- `GET /api/search/songs?query=&page=&limit=` — search with pagination
- `GET /api/songs/{id}` — song details
- `GET /api/songs/{id}/suggestions` — related songs

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `expo-av` | Audio playback + background mode |
| `zustand` | State management |
| `@react-native-async-storage/async-storage` | Queue + download persistence |
| `@react-navigation/stack` + `bottom-tabs` | Navigation |
| `expo-file-system` | Downloading songs to device |
| `expo-linear-gradient` | Player screen gradient |
| `@react-native-community/slider` | Seek bar |
| `@expo/vector-icons` | Ionicons |
