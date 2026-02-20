import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/HomeScreen';
import { PlayerScreen } from '../screens/PlayerScreen';
import { QueueScreen } from '../screens/QueueScreen';
import { DownloadsScreen } from '../screens/DownloadsScreen';
import { MiniPlayer } from '../components/MiniPlayer';
import { Colors, Fonts } from '../utils/theme';
import { RootStackParamList, TabParamList } from '../types';
import { View } from 'react-native';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator = () => {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: Colors.primaryLight,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarLabelStyle: {
            fontSize: Fonts.sizes.xs,
            fontWeight: '600',
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home';
            if (route.name === 'Home')
              iconName = focused ? 'home' : 'home-outline';
            else if (route.name === 'Queue')
              iconName = focused ? 'list' : 'list-outline';
            else if (route.name === 'Downloads')
              iconName = focused ? 'cloud-download' : 'cloud-download-outline';
            return <Ionicons name={iconName} size={22} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Queue" component={QueueScreen} />
        <Tab.Screen name="Downloads" component={DownloadsScreen} />
      </Tab.Navigator>
      <MiniPlayer />
    </View>
  );
};

export const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
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
};
