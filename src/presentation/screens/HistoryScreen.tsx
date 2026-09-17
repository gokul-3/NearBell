import React from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '@presentation/components/Screen';
import { EmptyState } from '@presentation/components/EmptyState';
import { SecondaryButton } from '@presentation/components/SecondaryButton';
import { useTheme } from '@presentation/theme/ThemeContext';
import { useTripStore } from '@state/tripStore';
import type { Trip } from '@domain/trip/trip';
import type { RootStackParamList } from '@app/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

const RESULT_LABEL: Record<Trip['status'], string> = {
  READY: 'Not started',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  ARRIVED: 'Arrived',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DEGRADED: 'Degraded',
};

export function HistoryScreen(_props: Props) {
  const theme = useTheme();
  const history = useTripStore((state) => state.history);
  const deleteHistoryEntry = useTripStore((state) => state.deleteHistoryEntry);
  const clearHistory = useTripStore((state) => state.clearHistory);

  function confirmClearHistory() {
    Alert.alert('Delete all history?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete all', style: 'destructive', onPress: clearHistory },
    ]);
  }

  if (history.length === 0) {
    return (
      <Screen>
        <EmptyState title="No trips yet" message="Completed and cancelled trips will show up here." />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <SecondaryButton label="Delete all" tone="danger" onPress={confirmClearHistory} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.row, { borderColor: theme.colors.border }]}>
            <View style={styles.rowMain}>
              <Text style={[styles.destinationName, { color: theme.colors.textPrimary }]}>
                {item.destination.name}
              </Text>
              <Text style={[styles.meta, { color: theme.colors.textSecondary, fontSize: theme.typography.fontSizeCaption }]}>
                {new Date(item.createdAt).toLocaleString()} · {item.alertPolicy.radiusMeters} m ·{' '}
                {RESULT_LABEL[item.status]}
              </Text>
            </View>
            <Pressable
              onPress={() => deleteHistoryEntry(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.destination.name} from history`}
              style={styles.deleteButton}
            >
              <Text style={[styles.deleteLabel, { color: theme.colors.danger }]}>Delete</Text>
            </Pressable>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  header: {
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowMain: {
    flex: 1,
    marginRight: 12,
  },
  destinationName: {
    fontWeight: '600',
  },
  meta: {
    marginTop: 2,
  },
  deleteLabel: {
    fontWeight: '600',
  },
  deleteButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
