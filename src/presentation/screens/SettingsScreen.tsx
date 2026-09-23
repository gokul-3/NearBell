import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '@presentation/components/Screen';
import { Card } from '@presentation/components/Card';
import { SecondaryButton } from '@presentation/components/SecondaryButton';
import { SegmentedControl, type SegmentOption } from '@presentation/components/SegmentedControl';
import { useTheme } from '@presentation/theme/ThemeContext';
import { useSettingsStore, type ThemePreference } from '@state/settingsStore';
import { useTripStore } from '@state/tripStore';
import { appVersion } from '@app/config/appInfo';
import { alarmService } from '@infrastructure/alarm/NearBellAlarmService';
import type { RootStackParamList } from '@app/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const RADIUS_OPTIONS: SegmentOption<string>[] = [
  { value: '100', label: '100 m' },
  { value: '250', label: '250 m' },
  { value: '500', label: '500 m' },
  { value: '1000', label: '1 km' },
  { value: '2000', label: '2 km' },
];

const THEME_OPTIONS: SegmentOption<ThemePreference>[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function SettingsScreen({ navigation }: Props) {
  const theme = useTheme();
  const settings = useSettingsStore();
  const clearHistory = useTripStore((state) => state.clearHistory);
  const activeTrip = useTripStore((state) => state.activeTrip);
  const setActiveTrip = useTripStore((state) => state.setActiveTrip);
  const [testAlarmState, setTestAlarmState] = useState<'idle' | 'starting' | 'playing'>('idle');

  async function handleTestAlarm() {
    if (testAlarmState === 'playing') {
      await alarmService.stopAlarm().catch(() => {});
      setTestAlarmState('idle');
      return;
    }
    setTestAlarmState('starting');
    try {
      await alarmService.requestPermissions();
      await alarmService.testAlarm();
      setTestAlarmState('playing');
    } catch {
      Alert.alert('Test alarm failed', "Couldn't play the alarm on this device.");
      setTestAlarmState('idle');
    }
  }

  function confirmClearAllData() {
    Alert.alert(
      'Clear all local data?',
      'This resets settings and deletes trip history. An active trip will be cancelled locally. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear everything',
          style: 'destructive',
          onPress: () => {
            settings.resetSettings();
            clearHistory();
            setActiveTrip(null);
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionTitle>Default alert distance</SectionTitle>
        <SegmentedControl
          options={RADIUS_OPTIONS}
          value={String(settings.defaultRadiusMeters)}
          onChange={(value) => settings.setDefaultRadiusMeters(Number(value))}
          accessibilityLabel="Default alert distance"
        />

        <SectionTitle>Vibration</SectionTitle>
        <Card style={styles.row}>
          <Text style={{ color: theme.colors.textPrimary, fontSize: theme.typography.fontSizeBody }}>
            Vibrate when the alarm fires
          </Text>
          <Switch
            value={settings.vibrationEnabled}
            onValueChange={settings.setVibrationEnabled}
            accessibilityLabel="Vibrate when the alarm fires"
          />
        </Card>

        <SectionTitle>Theme</SectionTitle>
        <SegmentedControl
          options={THEME_OPTIONS}
          value={settings.theme}
          onChange={settings.setTheme}
          accessibilityLabel="Theme"
        />

        <SectionTitle>Alarm</SectionTitle>
        <SecondaryButton
          label={
            testAlarmState === 'starting'
              ? 'Starting…'
              : testAlarmState === 'playing'
                ? 'Stop test alarm'
                : 'Test alarm'
          }
          tone={testAlarmState === 'playing' ? 'danger' : 'neutral'}
          onPress={handleTestAlarm}
          disabled={testAlarmState === 'starting'}
        />

        <SectionTitle>Permissions</SectionTitle>
        <SecondaryButton
          label="Permission & status help"
          onPress={() => navigation.navigate('PermissionHelp')}
        />

        <SectionTitle>Privacy &amp; data</SectionTitle>
        <Card>
          <Text
            style={[
              styles.privacyText,
              { color: theme.colors.textSecondary, fontSize: theme.typography.fontSizeBody },
            ]}
          >
            NearBell stores your destination, trip history, and settings only on this device.
            Location is never uploaded to a server, and no continuous location history is kept.
          </Text>
          <View style={styles.clearDataButton}>
            <SecondaryButton
              label="Clear all local data"
              tone="danger"
              onPress={confirmClearAllData}
            />
          </View>
        </Card>

        <Text
          style={[
            styles.version,
            { color: theme.colors.textSecondary, fontSize: theme.typography.fontSizeCaption },
          ]}
        >
          NearBell v{appVersion}
          {activeTrip ? ' · a trip is currently active' : ''}
        </Text>
      </ScrollView>
    </Screen>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]} accessibilityRole="header">
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginTop: 24,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  privacyText: {
    lineHeight: 20,
  },
  clearDataButton: {
    marginTop: 14,
    alignItems: 'flex-start',
  },
  version: {
    marginTop: 32,
    textAlign: 'center',
  },
});
