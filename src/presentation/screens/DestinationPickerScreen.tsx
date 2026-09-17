import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '@presentation/components/Screen';
import { TextField } from '@presentation/components/TextField';
import { EmptyState } from '@presentation/components/EmptyState';
import { useTheme } from '@presentation/theme/ThemeContext';
import { usePlaceSearch } from '@application/useCases/usePlaceSearch';
import type { PlaceSearchResult } from '@infrastructure/maps/types';
import type { RootStackParamList } from '@app/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DestinationPicker'>;

const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_UNAVAILABLE: "Couldn't reach the map search service. Check your connection and try again.",
  MAP_SEARCH_FAILED: 'Search is temporarily unavailable. Try again in a moment.',
};

export function DestinationPickerScreen({ navigation }: Props) {
  const theme = useTheme();
  const { query, setQuery, results, status, errorCode } = usePlaceSearch();

  function selectPlace(place: PlaceSearchResult) {
    navigation.navigate('TripSetup', {
      destination: {
        id: place.id,
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
      },
    });
  }

  function renderContent() {
    if (query.trim().length === 0) {
      return (
        <EmptyState
          title="Search for a destination"
          message="Type a place name or address to find it."
        />
      );
    }

    if (status === 'loading') {
      return <EmptyState title="Searching…" loading />;
    }

    if (status === 'error') {
      return (
        <EmptyState
          title="Search failed"
          message={(errorCode && ERROR_MESSAGES[errorCode]) ?? 'Something went wrong. Try again.'}
          tone="error"
        />
      );
    }

    if (status === 'success' && results.length === 0) {
      return <EmptyState title="No matches" message={`No places found for "${query.trim()}".`} />;
    }

    return (
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => selectPlace(item)}
            accessibilityRole="button"
            accessibilityLabel={item.name}
            accessibilityHint={item.address}
            style={[styles.resultRow, { borderColor: theme.colors.border }]}
          >
            <Text
              style={[
                styles.resultName,
                { color: theme.colors.textPrimary, fontSize: theme.typography.fontSizeBody },
              ]}
            >
              {item.name}
            </Text>
            {item.address ? (
              <Text
                style={[
                  styles.resultAddress,
                  { color: theme.colors.textSecondary, fontSize: theme.typography.fontSizeCaption },
                ]}
                numberOfLines={1}
              >
                {item.address}
              </Text>
            ) : null}
          </Pressable>
        )}
      />
    );
  }

  return (
    <Screen>
      <View style={styles.searchBar}>
        <TextField
          accessibilityLabel="Search destination"
          placeholder="Search destination"
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
        />
      </View>
      <View style={styles.results}>{renderContent()}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  results: {
    flex: 1,
    marginTop: 12,
  },
  resultRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  resultName: {
    fontWeight: '600',
  },
  resultAddress: {
    marginTop: 2,
  },
});
