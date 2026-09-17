import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Screen } from '@presentation/components/Screen';
import { useTheme } from '@presentation/theme/ThemeContext';

export function HomeScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <Text
        style={[
          styles.hero,
          { color: theme.colors.textPrimary, fontSize: theme.typography.fontSizeDisplay },
        ]}
      >
        Where are you going?
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    fontWeight: '700',
    marginTop: 32,
    marginHorizontal: 24,
  },
});
