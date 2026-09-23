import React, { useEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Map, Camera, Marker } from '@maplibre/maplibre-react-native';
import { Screen } from '@presentation/components/Screen';
import { Card } from '@presentation/components/Card';
import { EmptyState } from '@presentation/components/EmptyState';
import { SecondaryButton } from '@presentation/components/SecondaryButton';
import { MapPin } from '@presentation/components/MapPin';
import { useTheme } from '@presentation/theme/ThemeContext';
import { formatApproximateDistanceMeters } from '@presentation/utils/formatDistance';
import { useTripLifecycle } from '@application/useCases/useTripLifecycle';
import { MAP_STYLE_URL } from '@infrastructure/maps/mapStyle';
import type { RootStackParamList } from '@app/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveTrip'>;

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Monitoring your trip',
  PAUSED: 'Monitoring paused',
  DEGRADED: 'Location issue — see Permission Help',
  ARRIVED: 'Arrived',
};

export function ActiveTripScreen({ navigation }: Props) {
  const theme = useTheme();
  const { activeTrip, pauseTrip, resumeTrip, cancelTrip } = useTripLifecycle();

  useEffect(() => {
    if (activeTrip?.alarmState === 'RINGING') {
      navigation.replace('Alarm');
    }
  }, [activeTrip?.alarmState, navigation]);

  if (!activeTrip) {
    return (
      <Screen>
        <EmptyState
          title="No active trip"
          message="Set a destination to start monitoring a trip."
          actionLabel="Set destination"
          onAction={() => navigation.navigate('Home')}
        />
      </Screen>
    );
  }

  function handleCancel() {
    Alert.alert('Cancel trip?', 'This stops monitoring and ends the current trip.', [
      { text: 'Keep monitoring', style: 'cancel' },
      {
        text: 'Cancel trip',
        style: 'destructive',
        onPress: () => {
          cancelTrip();
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        },
      },
    ]);
  }

  const distanceLabel =
    activeTrip.lastDistanceMeters !== undefined
      ? `${formatApproximateDistanceMeters(activeTrip.lastDistanceMeters)} away`
      : 'Waiting for location…';

  return (
    <Screen>
      <View style={styles.content}>
        <Text
          style={[
            styles.destinationName,
            { color: theme.colors.textPrimary, fontSize: theme.typography.fontSizeTitle },
          ]}
        >
          {activeTrip.destination.name}
        </Text>
        <Text
          style={[
            styles.distance,
            { color: theme.colors.textPrimary, fontSize: theme.typography.fontSizeDisplay },
          ]}
        >
          {distanceLabel}
        </Text>
        <Text
          style={[
            styles.status,
            { color: theme.colors.textSecondary, fontSize: theme.typography.fontSizeBody },
          ]}
          accessibilityLiveRegion="polite"
        >
          {STATUS_LABEL[activeTrip.status] ?? activeTrip.status}
        </Text>

        <View style={[styles.mapPreview, { borderColor: theme.colors.border }]}>
          <Map
            mapStyle={MAP_STYLE_URL}
            style={styles.map}
            dragPan={false}
            touchZoom={false}
            touchRotate={false}
            attribution={false}
            logo={false}
          >
            <Camera
              initialViewState={
                activeTrip.lastKnownLocation
                  ? {
                      bounds: [
                        Math.min(activeTrip.destination.longitude, activeTrip.lastKnownLocation.longitude),
                        Math.min(activeTrip.destination.latitude, activeTrip.lastKnownLocation.latitude),
                        Math.max(activeTrip.destination.longitude, activeTrip.lastKnownLocation.longitude),
                        Math.max(activeTrip.destination.latitude, activeTrip.lastKnownLocation.latitude),
                      ],
                      padding: { top: 40, bottom: 40, left: 40, right: 40 },
                    }
                  : { center: [activeTrip.destination.longitude, activeTrip.destination.latitude], zoom: 13 }
              }
            />
            <Marker lngLat={[activeTrip.destination.longitude, activeTrip.destination.latitude]}>
              <MapPin variant="destination" />
            </Marker>
            {activeTrip.lastKnownLocation ? (
              <Marker
                lngLat={[activeTrip.lastKnownLocation.longitude, activeTrip.lastKnownLocation.latitude]}
              >
                <MapPin variant="current" />
              </Marker>
            ) : null}
          </Map>
        </View>

        <Card style={styles.detailsCard}>
          <DetailRow label="Alert at" value={`${activeTrip.alertPolicy.radiusMeters} m`} />
          <DetailRow
            label="GPS accuracy"
            value={
              activeTrip.lastKnownLocation?.accuracyMeters != null
                ? `${Math.round(activeTrip.lastKnownLocation.accuracyMeters)} m`
                : 'Unknown'
            }
          />
        </Card>

        <View style={styles.actions}>
          {activeTrip.status === 'PAUSED' ? (
            <SecondaryButton label="Resume" onPress={resumeTrip} />
          ) : (
            <SecondaryButton label="Pause" onPress={pauseTrip} />
          )}
          <SecondaryButton label="Cancel trip" tone="danger" onPress={handleCancel} />
        </View>
      </View>
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.detailRow}>
      <Text style={{ color: theme.colors.textSecondary }}>{label}</Text>
      <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 24,
  },
  destinationName: {
    fontWeight: '600',
  },
  detailValue: {
    fontWeight: '600',
  },
  distance: {
    fontWeight: '800',
    marginTop: 8,
  },
  mapPreview: {
    height: 180,
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  status: {
    marginTop: 8,
  },
  detailsCard: {
    marginTop: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  actions: {
    marginTop: 32,
    gap: 12,
  },
});
