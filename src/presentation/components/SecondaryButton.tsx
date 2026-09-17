import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { minTouchTarget } from '@presentation/theme/tokens';
import { useTheme } from '@presentation/theme/ThemeContext';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'neutral' | 'danger';
  accessibilityHint?: string;
};

export function SecondaryButton({ label, onPress, disabled, tone = 'neutral', accessibilityHint }: Props) {
  const theme = useTheme();
  const contentColor = tone === 'danger' ? theme.colors.danger : theme.colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(disabled) }}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: disabled ? theme.colors.border : contentColor,
          borderRadius: theme.radii.control,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: disabled ? theme.colors.textSecondary : contentColor,
            fontSize: theme.typography.fontSizeBody,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: minTouchTarget,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  label: {
    fontWeight: '600',
  },
});
