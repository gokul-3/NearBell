import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '@presentation/screens/WelcomeScreen';
import { HomeScreen } from '@presentation/screens/HomeScreen';
import { DestinationPickerScreen } from '@presentation/screens/DestinationPickerScreen';
import { TripSetupScreen } from '@presentation/screens/TripSetupScreen';
import { ActiveTripScreen } from '@presentation/screens/ActiveTripScreen';
import { AlarmScreen } from '@presentation/screens/AlarmScreen';
import { HistoryScreen } from '@presentation/screens/HistoryScreen';
import { SettingsScreen } from '@presentation/screens/SettingsScreen';
import { PermissionHelpScreen } from '@presentation/screens/PermissionHelpScreen';
import { useOnboardingStore } from '@state/onboardingStore';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const hasCompletedWelcome = useOnboardingStore((state) => state.hasCompletedWelcome);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={hasCompletedWelcome ? 'Home' : 'Welcome'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="DestinationPicker"
          component={DestinationPickerScreen}
          options={{ headerShown: true, title: 'Set destination' }}
        />
        <Stack.Screen
          name="TripSetup"
          component={TripSetupScreen}
          options={{ headerShown: true, title: 'Trip setup' }}
        />
        <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} />
        <Stack.Screen name="Alarm" component={AlarmScreen} />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{ headerShown: true, title: 'History' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ headerShown: true, title: 'Settings' }}
        />
        <Stack.Screen
          name="PermissionHelp"
          component={PermissionHelpScreen}
          options={{ headerShown: true, title: 'Permission help' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
