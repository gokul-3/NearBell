import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '@presentation/components/Screen';
import { Card } from '@presentation/components/Card';
import { PrimaryButton } from '@presentation/components/PrimaryButton';
import { SecondaryButton } from '@presentation/components/SecondaryButton';
import { SegmentedControl, type SegmentOption } from '@presentation/components/SegmentedControl';
import { TextField } from '@presentation/components/TextField';
import { useTheme } from '@presentation/theme/ThemeContext';
import { useSettingsStore } from '@state/settingsStore';
import { useTripLifecycle } from '@application/useCases/useTripLifecycle';
import { isAppError } from '@application/errors';
import { locationService } from '@infrastructure/location/NearBellLocationService';
import { clampRadiusMeters } from '@domain/trip/alertPolicy';
import { unknownPermissionStatus, type PermissionStatus } from '@domain/permissions/permissionStatus';
import type { RootStackParamList } from '@app/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TripSetup'>;

const RADIUS_PRESETS: SegmentOption<string>[] = [
  { value: '100', label: '100 m' },
  { value: '250', label: '250 m' },
  { value: '500', label: '500 m' },
  { value: '1000', label: '1 km' },
  { value: '2000', label: '2 km' },
  { value: 'custom', label: 'Custom' },
];

function presetForRadius(radiusMeters: number): string {
  const match = RADIUS_PRESETS.find((option) => Number(option.value) === radiusMeters);
  return match ? match.value : 'custom';
}

export function TripSetupScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { destination } = route.params;
  const defaultRadiusMeters = useSettingsStore((state) => state.defaultRadiusMeters);
  const vibrationEnabled = useSettingsStore((state) => state.vibrationEnabled);
  const { startTrip } = useTripLifecycle();

  const [selectedPreset, setSelectedPreset] = useState(presetForRadius(defaultRadiusMeters));
  const [customRadiusText, setCustomRadiusText] = useState(String(defaultRadiusMeters));
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>(unknownPermissionStatus);
  const [isStarting, setIsStarting] = useState(false);

  const refreshPermissionStatus = useCallback(() => {
    locationService
      .getPermissionStatus()
      .then(setPermissionStatus)
      .catch(() => setPermissionStatus(unknownPermissionStatus));
  }, []);

  useFocusEffect(refreshPermissionStatus);

  const radiusMeters =
    selectedPreset === 'custom'
      ? clampRadiusMeters(Number(customRadiusText) || defaultRadiusMeters)
      : Number(selectedPreset);

  async function handleFixLocation() {
    await locationService.requestForegroundLocationPermission();
    refreshPermissionStatus();
  }

  async function handleFixNotifications() {
    await locationService.requestNotificationPermission();
    refreshPermissionStatus();
  }

  async function handleStartTrip() {
    setIsStarting(true);
    try {
      await startTrip(destination, { radiusMeters });
      navigation.reset({ index: 0, routes: [{ name: 'ActiveTrip' }] });
    } catch (error) {
      const message = isAppError(error) && error.code === 'LOCATION_PERMISSION_DENIED'
        ? 'NearBell needs location access to monitor your trip. Grant it above, then try again.'
        : "Couldn't start the trip. Try again.";
      Alert.alert('Unable to start trip', message);
      refreshPermissionStatus();
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text
          style={[
            styles.destinationLabel,
            { color: theme.colors.textSecondary, fontSize: theme.typography.fontSizeCaption },
          ]}
        >
          DESTINATION
        </Text>
        <Text
          style={[
            styles.destinationName,
            { color: theme.colors.textPrimary, fontSize: theme.typography.fontSizeTitle },
          ]}
        >
          {destination.name}
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Alert distance</Text>
        <SegmentedControl
          options={RADIUS_PRESETS}
          value={selectedPreset}
          onChange={setSelectedPreset}
          accessibilityLabel="Alert distance"
        />

        {selectedPreset === 'custom' ? (
          <View style={styles.customRow}>
            <TextField
              accessibilityLabel="Custom alert distance in meters"
              placeholder="Meters"
              keyboardType="numeric"
              value={customRadiusText}
              onChangeText={setCustomRadiusText}
            />
          </View>
        ) : null}

        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Before you start
        </Text>
        <Card>
          <ChecklistRow
            label="Location access"
            ready={permissionStatus.foregroundLocation === 'granted'}
            onFixPress={handleFixLocation}
          />
          <ChecklistRow
            label="Notifications"
            ready={permissionStatus.notifications === 'granted'}
            onFixPress={handleFixNotifications}
          />
          <Text
            style={[
              styles.vibrationNote,
              { color: theme.colors.textSecondary, fontSize: theme.typography.fontSizeCaption },
            ]}
          >
            Vibration on alarm: {vibrationEnabled ? 'on' : 'off'} (change in Settings)
          </Text>
        </Card>

        <View style={styles.startButton}>
          <PrimaryButton
            label={isStarting ? 'Starting…' : 'Start trip'}
            onPress={handleStartTrip}
            disabled={isStarting}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function ChecklistRow({
  label,
  ready,
  onFixPress,
}: {
  label: string;
  ready: boolean;
  onFixPress: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.checklistRow}>
      <Text
        style={{ color: theme.colors.textPrimary, fontSize: theme.typography.fontSizeBody }}
        accessibilityLabel={`${label}: ${ready ? 'ready' : 'needs attention'}`}
      >
        {label}
      </Text>
      {ready ? (
        <Text style={[styles.readyLabel, { color: theme.colors.success }]}>Ready</Text>
      ) : (
        <SecondaryButton label="Fix" onPress={onFixPress} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
  },
  destinationLabel: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  readyLabel: {
    fontWeight: '600',
  },
  destinationName: {
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 4,
  },
  customRow: {
    marginTop: 12,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  vibrationNote: {
    marginTop: 8,
  },
  startButton: {
    marginTop: 28,
  },
});
