import React from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { minTouchTarget } from '@presentation/theme/tokens';
import { useTheme } from '@presentation/theme/ThemeContext';

type Props = TextInputProps & {
  accessibilityLabel: string;
};

export function TextField({ style, accessibilityLabel, ...props }: Props) {
  const theme = useTheme();

  return (
    <TextInput
      accessibilityLabel={accessibilityLabel}
      placeholderTextColor={theme.colors.textSecondary}
      style={[
        styles.input,
        {
          backgroundColor: theme.colors.surfaceAlt,
          color: theme.colors.textPrimary,
          borderRadius: theme.radii.control,
          fontSize: theme.typography.fontSizeBody,
        },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: minTouchTarget,
    paddingHorizontal: 14,
  },
});
