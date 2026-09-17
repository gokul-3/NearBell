import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@presentation/theme/ThemeContext';
import { PrimaryButton } from '@presentation/components/PrimaryButton';

type Props = {
  title: string;
  message?: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'error';
};

export function EmptyState({ title, message, loading, actionLabel, onAction, tone = 'neutral' }: Props) {
  const theme = useTheme();
  const titleColor = tone === 'error' ? theme.colors.danger : theme.colors.textPrimary;

  return (
    <View style={styles.container} accessibilityRole={tone === 'error' ? 'alert' : undefined}>
      {loading ? (
        <ActivityIndicator color={theme.colors.accent} style={styles.spinner} />
      ) : null}
      <Text style={[styles.title, { color: titleColor, fontSize: theme.typography.fontSizeTitle }]}>
        {title}
      </Text>
      {message ? (
        <Text
          style={[
            styles.message,
            { color: theme.colors.textSecondary, fontSize: theme.typography.fontSizeBody },
          ]}
        >
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <PrimaryButton label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
  },
  spinner: {
    marginBottom: 12,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    textAlign: 'center',
  },
  action: {
    marginTop: 16,
    alignSelf: 'stretch',
  },
});
