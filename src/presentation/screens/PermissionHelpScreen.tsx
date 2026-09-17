import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@presentation/components/Screen';
import { PrimaryButton } from '@presentation/components/PrimaryButton';
import { useTheme } from '@presentation/theme/ThemeContext';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'Why location is needed',
    body:
      'NearBell uses your current position to help you set a destination, and to measure distance ' +
      'while a trip is active. Location is only read while you are using the app or while a trip you ' +
      'started is active — never continuously in the background.',
  },
  {
    title: 'Why background location may be needed',
    body:
      "If you lock your phone or switch apps during a trip, NearBell needs background location " +
      "access so it can still notice when you're approaching your destination and alert you.",
  },
  {
    title: 'Why notifications are needed',
    body: 'The destination alarm is delivered as a high-priority notification with sound and vibration.',
  },
  {
    title: 'Fixing a denied permission',
    body:
      'If you denied a permission, open your device Settings for NearBell and enable Location and ' +
      'Notifications. On Android, also check that battery optimization is not restricting the app.',
  },
];

export function PermissionHelpScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.textPrimary, fontSize: theme.typography.fontSizeTitle },
              ]}
            >
              {section.title}
            </Text>
            <Text
              style={[
                styles.sectionBody,
                { color: theme.colors.textSecondary, fontSize: theme.typography.fontSizeBody },
              ]}
            >
              {section.body}
            </Text>
          </View>
        ))}
        <PrimaryButton label="Open device settings" onPress={() => Linking.openSettings()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionBody: {
    lineHeight: 21,
  },
});
