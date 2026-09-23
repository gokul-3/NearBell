import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type NativeLocationSample = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  hasAccuracy: boolean;
  altitudeMeters: number;
  hasAltitude: boolean;
  speedMps: number;
  hasSpeed: boolean;
  headingDegrees: number;
  hasHeading: boolean;
  timestamp: number;
  source: string;
};

export type NativePermissionStatus = {
  foregroundLocation: string;
  backgroundLocation: string;
  notifications: string;
};

export interface Spec extends TurboModule {
  getCurrentLocation(): Promise<NativeLocationSample>;

  getPermissionStatus(): Promise<NativePermissionStatus>;
  requestForegroundLocationPermission(): Promise<NativePermissionStatus>;
  requestBackgroundLocationPermission(): Promise<NativePermissionStatus>;
  requestNotificationPermission(): Promise<NativePermissionStatus>;

  startTripMonitoring(
    tripId: string,
    destinationLatitude: number,
    destinationLongitude: number,
    radiusMeters: number,
  ): Promise<void>;
  pauseTripMonitoring(): Promise<void>;
  resumeTripMonitoring(): Promise<void>;
  stopTripMonitoring(): Promise<void>;

  // Events: onArrivalEvent ({ tripId, source, latitude, longitude,
  // accuracyMeters, hasAccuracy, timestamp }), onLocationSample
  // (NativeLocationSample & { tripId }), onMonitoringError ({ tripId,
  // code, message }).
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.get<Spec>('NearBellLocation');
