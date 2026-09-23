import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/theme/ThemeContext';

export function MapPin({ variant = 'destination' }: { variant?: 'destination' | 'current' }) {
  const theme = useTheme();

  if (variant === 'current') {
    return (
      <View
        style={[
          styles.currentDot,
          { backgroundColor: theme.colors.accent, borderColor: theme.colors.accentContrast },
        ]}
        accessibilityLabel="Your current location"
      />
    );
  }

  return (
    <View style={styles.pinWrapper} accessibilityLabel="Selected destination">
      <View style={[styles.pinHead, { backgroundColor: theme.colors.danger }]} />
      <View style={[styles.pinTail, { borderTopColor: theme.colors.danger }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  pinWrapper: {
    alignItems: 'center',
  },
  pinHead: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  currentDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
});
