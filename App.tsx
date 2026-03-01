import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAudioPlayer, initAudioEngine } from './src/hooks/useAudioPlayer';

// ✅ Init at module level
initAudioEngine();

const AudioInitializer = () => {
  useAudioPlayer();
  return null;
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <NavigationContainer>
        <StatusBar style="light" />
        <AudioInitializer />
        <AppNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
