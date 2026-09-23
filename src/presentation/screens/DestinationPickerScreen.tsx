import React, { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Map, Camera, Marker, type CameraRef } from '@maplibre/maplibre-react-native';
import { Screen } from '@presentation/components/Screen';
import { TextField } from '@presentation/components/TextField';
import { EmptyState } from '@presentation/components/EmptyState';
import { PrimaryButton } from '@presentation/components/PrimaryButton';
import { MapPin } from '@presentation/components/MapPin';
import { minTouchTarget } from '@presentation/theme/tokens';
import { useTheme } from '@presentation/theme/ThemeContext';
import { usePlaceSearch } from '@application/useCases/usePlaceSearch';
import { useCurrentLocation } from '@application/useCases/useCurrentLocation';
import { generateId } from '@application/services/id';
import { mapProvider } from '@infrastructure/maps/provider';
import { MAP_STYLE_URL } from '@infrastructure/maps/mapStyle';
import { track, type DestinationSelectedSource } from '@infrastructure/analytics/Analytics';
import type { Place, PlaceSearchResult } from '@infrastructure/maps/types';
import type { RootStackParamList } from '@app/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DestinationPicker'>;

const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_UNAVAILABLE: "Couldn't reach the map search service. Check your connection and try again.",
  MAP_SEARCH_FAILED: 'Search is temporarily unavailable. Try again in a moment.',
  LOCATION_PERMISSION_DENIED: 'Location access was denied. You can still search or tap the map.',
  LOCATION_UNAVAILABLE: "Couldn't get your current location. You can still search or tap the map.",
};

const DEFAULT_CENTER: [number, number] = [0, 20];

export function DestinationPickerScreen({ navigation }: Props) {
  const theme = useTheme();
  const { query, setQuery, results, status, errorCode } = usePlaceSearch();
  const { getCurrentLocation, status: locationStatus, errorCode: locationErrorCode } =
    useCurrentLocation();

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectionSource, setSelectionSource] = useState<DestinationSelectedSource | null>(null);
  const [isResolvingPin, setIsResolvingPin] = useState(false);
  const [mapLoadFailed, setMapLoadFailed] = useState(false);
  const cameraRef = useRef<CameraRef>(null);

  async function resolvePinName(latitude: number, longitude: number, source: DestinationSelectedSource) {
    setSelectedPlace({ name: 'Dropped pin', latitude, longitude });
    setSelectionSource(source);
    setIsResolvingPin(true);
    try {
      const place = await mapProvider.reverseGeocode(latitude, longitude);
      setSelectedPlace(place);
    } catch {
      // Keep the "Dropped pin" placeholder — coordinates are still valid.
    } finally {
      setIsResolvingPin(false);
    }
  }

  function selectSearchResult(place: PlaceSearchResult) {
    setSelectedPlace(place);
    setSelectionSource('search');
    setQuery('');
    cameraRef.current?.flyTo({ center: [place.longitude, place.latitude], zoom: 15 });
  }

  function handleMapLongPress(event: { nativeEvent: { lngLat: [number, number] } }) {
    const [longitude, latitude] = event.nativeEvent.lngLat;
    resolvePinName(latitude, longitude, 'map_pin');
  }

  async function handleUseCurrentLocation() {
    const sample = await getCurrentLocation();
    if (!sample) {
      return;
    }
    cameraRef.current?.flyTo({ center: [sample.longitude, sample.latitude], zoom: 15 });
    resolvePinName(sample.latitude, sample.longitude, 'current_location');
  }

  function confirmDestination() {
    if (!selectedPlace) {
      return;
    }
    if (selectionSource) {
      track({ name: 'destination_selected', properties: { source: selectionSource } });
    }
    navigation.navigate('TripSetup', {
      destination: {
        id: generateId('dest'),
        name: selectedPlace.name,
        address: selectedPlace.address,
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
      },
    });
  }

  function renderSearchResults() {
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
            onPress={() => selectSearchResult(item)}
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

  const showResultsList = query.trim().length > 0;

  return (
    <Screen>
      <View style={styles.searchBar}>
        <TextField
          accessibilityLabel="Search destination"
          placeholder="Search destination"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
      </View>

      {showResultsList ? (
        <View style={styles.results}>{renderSearchResults()}</View>
      ) : (
        <View style={styles.mapArea}>
          {mapLoadFailed ? (
            <EmptyState
              title="Map unavailable"
              message="Couldn't load the map. You can still search for a destination."
              tone="error"
            />
          ) : (
            <>
              <Map
                mapStyle={MAP_STYLE_URL}
                style={styles.map}
                onLongPress={handleMapLongPress}
                onDidFailLoadingMap={() => setMapLoadFailed(true)}
                attribution
                logo={false}
              >
                <Camera ref={cameraRef} initialViewState={{ center: DEFAULT_CENTER, zoom: 1.2 }} />
                {selectedPlace ? (
                  <Marker lngLat={[selectedPlace.longitude, selectedPlace.latitude]}>
                    <MapPin variant="destination" />
                  </Marker>
                ) : null}
              </Map>

              <Pressable
                onPress={handleUseCurrentLocation}
                accessibilityRole="button"
                accessibilityLabel="Use current location"
                style={[
                  styles.currentLocationButton,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
              >
                {locationStatus === 'loading' ? (
                  <ActivityIndicator color={theme.colors.accent} />
                ) : (
                  <Text style={[styles.locationButtonGlyph, { color: theme.colors.accent }]}>⦿</Text>
                )}
              </Pressable>

              {locationStatus === 'error' && locationErrorCode ? (
                <View style={[styles.locationErrorBanner, { backgroundColor: theme.colors.surface }]}>
                  <Text style={{ color: theme.colors.danger, fontSize: theme.typography.fontSizeCaption }}>
                    {ERROR_MESSAGES[locationErrorCode]}
                  </Text>
                </View>
              ) : null}

              {selectedPlace ? (
                <View
                  style={[
                    styles.confirmSheet,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.confirmName,
                      { color: theme.colors.textPrimary, fontSize: theme.typography.fontSizeTitle },
                    ]}
                  >
                    {selectedPlace.name}
                  </Text>
                  {selectedPlace.address ? (
                    <Text
                      style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSizeCaption }}
                      numberOfLines={2}
                    >
                      {selectedPlace.address}
                    </Text>
                  ) : null}
                  <View style={styles.confirmButton}>
                    <PrimaryButton
                      label={isResolvingPin ? 'Locating address…' : 'Set destination'}
                      onPress={confirmDestination}
                      disabled={isResolvingPin}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.hintBanner}>
                  <Text
                    style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSizeCaption }}
                  >
                    Search above, tap your location, or long-press the map to drop a pin.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  locationButtonGlyph: {
    fontWeight: '700',
  },
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
  mapArea: {
    flex: 1,
    marginTop: 12,
  },
  map: {
    flex: 1,
  },
  currentLocationButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: minTouchTarget,
    height: minTouchTarget,
    borderRadius: minTouchTarget / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationErrorBanner: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 72,
    borderRadius: 10,
    padding: 10,
  },
  confirmSheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  confirmName: {
    fontWeight: '700',
    marginBottom: 4,
  },
  confirmButton: {
    marginTop: 12,
  },
  hintBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    padding: 10,
  },
});
