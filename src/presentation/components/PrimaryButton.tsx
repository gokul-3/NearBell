import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { minTouchTarget } from '@presentation/theme/tokens';
import { useTheme } from '@presentation/theme/ThemeContext';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
};

export function PrimaryButton({ label, onPress, disabled, accessibilityHint }: Props) {
  const theme = useTheme();

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
          backgroundColor: disabled ? theme.colors.border : theme.colors.accent,
          opacity: pressed ? 0.85 : 1,
          borderRadius: theme.radii.control,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: disabled ? theme.colors.textSecondary : theme.colors.accentContrast,
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
  },
  label: {
    fontWeight: '600',
  },
});
