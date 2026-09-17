import React, { useEffect } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '@presentation/components/Screen';
import { EmptyState } from '@presentation/components/EmptyState';
import { minTouchTarget } from '@presentation/theme/tokens';
import { useTheme } from '@presentation/theme/ThemeContext';
import { formatApproximateDistanceMeters } from '@presentation/utils/formatDistance';
import { useTripLifecycle } from '@application/useCases/useTripLifecycle';
import type { RootStackParamList } from '@app/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Alarm'>;

export function AlarmScreen({ navigation }: Props) {
  const theme = useTheme();
  const { activeTrip, stopAlarmAndCompleteTrip, rearmTrip } = useTripLifecycle();

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility("You're near your destination");
  }, []);

  if (!activeTrip || activeTrip.alarmState !== 'RINGING') {
    return (
      <Screen>
        <EmptyState
          title="No alarm is ringing"
          message="This screen appears automatically when a trip's destination alarm fires."
          actionLabel="Back to Home"
          onAction={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
        />
      </Screen>
    );
  }

  function handleStopAlarm() {
    stopAlarmAndCompleteTrip();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  }

  function handleNotThereYet() {
    rearmTrip();
    navigation.reset({ index: 0, routes: [{ name: 'ActiveTrip' }] });
  }

  const distanceLabel =
    activeTrip.lastDistanceMeters !== undefined
      ? formatApproximateDistanceMeters(activeTrip.lastDistanceMeters)
      : null;

  return (
    <Screen>
      <View
        style={[styles.content, { backgroundColor: theme.colors.accent }]}
        accessibilityRole="alert"
      >
        <Text
          style={[
            styles.headline,
            { color: theme.colors.accentContrast, fontSize: theme.typography.fontSizeDisplay },
          ]}
        >
          You're near your destination
        </Text>
        <Text
          style={[
            styles.destinationName,
            { color: theme.colors.accentContrast, fontSize: theme.typography.fontSizeTitle },
          ]}
        >
          {activeTrip.destination.name}
        </Text>
        {distanceLabel ? (
          <Text style={[styles.distance, { color: theme.colors.accentContrast }]}>
            {distanceLabel} away
          </Text>
        ) : null}
        <Text style={[styles.disclaimer, { color: theme.colors.accentContrast }]}>
          Timing can vary with GPS accuracy and background limits — this is approximate.
        </Text>

        <View style={styles.actions}>
          <Pressable
            onPress={handleStopAlarm}
            accessibilityRole="button"
            accessibilityLabel="Stop alarm"
            style={({ pressed }) => [
              styles.stopAlarmButton,
              { backgroundColor: theme.colors.accentContrast, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.stopAlarmLabel, { color: theme.colors.accent }]}>Stop alarm</Text>
          </Pressable>
          <Pressable
            onPress={handleNotThereYet}
            accessibilityRole="button"
            accessibilityLabel="I'm not there yet"
            style={({ pressed }) => [
              styles.notThereYetButton,
              { borderColor: theme.colors.accentContrast, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.notThereYetLabel, { color: theme.colors.accentContrast }]}>
              I'm not there yet
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headline: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  destinationName: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  distance: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  disclaimer: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.85,
    marginBottom: 32,
  },
  actions: {
    gap: 12,
  },
  stopAlarmButton: {
    minHeight: minTouchTarget,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopAlarmLabel: {
    fontWeight: '700',
    fontSize: 16,
  },
  notThereYetButton: {
    minHeight: minTouchTarget,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notThereYetLabel: {
    fontWeight: '600',
    fontSize: 16,
  },
});
