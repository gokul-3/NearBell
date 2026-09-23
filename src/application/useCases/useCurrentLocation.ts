import { useCallback, useState } from 'react';
import { LocationManager, type GeolocationPosition } from '@maplibre/maplibre-react-native';
import type { AppErrorCode } from '@application/errors';
import type { LocationSample } from '@domain/location/locationSample';

export type CurrentLocationStatus = 'idle' | 'loading' | 'success' | 'error';

function toLocationSample(position: GeolocationPosition): LocationSample {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracyMeters: position.coords.accuracy,
    altitudeMeters: position.coords.altitude,
    speedMps: position.coords.speed,
    headingDegrees: position.coords.heading,
    timestamp: position.timestamp,
    source: 'fused',
  };
}

/**
 * One-shot "where am I right now" for the destination picker's current-
 * location button. This is deliberately separate from the background
 * trip-monitoring location pipeline (Phase 6) — it only needs a single
 * fix, requested in the foreground, with no geofencing involved.
 */
export function useCurrentLocation() {
  const [status, setStatus] = useState<CurrentLocationStatus>('idle');
  const [errorCode, setErrorCode] = useState<AppErrorCode | null>(null);

  const getCurrentLocation = useCallback(async (): Promise<LocationSample | null> => {
    setStatus('loading');
    setErrorCode(null);

    try {
      const granted = await LocationManager.requestPermissions();
      if (!granted) {
        setStatus('error');
        setErrorCode('LOCATION_PERMISSION_DENIED');
        return null;
      }

      const position = await LocationManager.getCurrentPosition();
      if (!position) {
        setStatus('error');
        setErrorCode('LOCATION_UNAVAILABLE');
        return null;
      }

      setStatus('success');
      return toLocationSample(position);
    } catch {
      setStatus('error');
      setErrorCode('LOCATION_UNAVAILABLE');
      return null;
    }
  }, []);

  return { getCurrentLocation, status, errorCode };
}
