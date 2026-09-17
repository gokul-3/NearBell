import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '@presentation/components/Screen';
import { PrimaryButton } from '@presentation/components/PrimaryButton';
import { useTheme } from '@presentation/theme/ThemeContext';
import { useOnboardingStore } from '@state/onboardingStore';
import type { RootStackParamList } from '@app/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const completeWelcome = useOnboardingStore((state) => state.completeWelcome);

  function handleContinue() {
    completeWelcome();
    navigation.replace('Home');
  }

  return (
    <Screen>
      <View style={styles.content}>
        <View>
          <Text
            style={[
              styles.title,
              { color: theme.colors.textPrimary, fontSize: theme.typography.fontSizeDisplay },
            ]}
          >
            NearBell
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: theme.colors.textSecondary, fontSize: theme.typography.fontSizeBody },
            ]}
          >
            Set a destination and NearBell alerts you when you're getting close — so you can relax
            instead of watching the map.
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: theme.colors.textSecondary, fontSize: theme.typography.fontSizeCaption },
            ]}
          >
            NearBell uses your location to track trips you start, and only while a trip is active.
            You'll be asked for background location access separately when you start your first
            trip, with an explanation of why it's needed.
          </Text>
        </View>
        <PrimaryButton label="Continue" onPress={handleContinue} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 64,
    paddingBottom: 32,
  },
  title: {
    fontWeight: '800',
    marginBottom: 16,
  },
  subtitle: {
    marginBottom: 16,
    lineHeight: 22,
  },
});
