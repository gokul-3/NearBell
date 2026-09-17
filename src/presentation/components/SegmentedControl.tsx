import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { minTouchTarget } from '@presentation/theme/tokens';
import { useTheme } from '@presentation/theme/ThemeContext';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: Props<T>) {
  const theme = useTheme();

  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            style={[
              styles.segment,
              {
                backgroundColor: selected ? theme.colors.accent : theme.colors.surfaceAlt,
                borderRadius: theme.radii.control,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: selected ? theme.colors.accentContrast : theme.colors.textPrimary,
                  fontSize: theme.typography.fontSizeBody,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segment: {
    minHeight: minTouchTarget,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
  },
});
