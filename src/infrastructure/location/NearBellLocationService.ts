import { AppError, type AppErrorCode } from '@application/errors';
import type { LocationSample, LocationSource } from '@domain/location/locationSample';
import type { PermissionState, PermissionStatus } from '@domain/permissions/permissionStatus';
import NativeNearBellLocation, {
  type NativeLocationSample,
  type NativePermissionStatus,
} from './specs/NativeNearBellLocation';
import type { LocationService, TripMonitoringConfig } from './LocationService';

const KNOWN_ERROR_CODES: AppErrorCode[] = [
  'LOCATION_PERMISSION_DENIED',
  'BACKGROUND_LOCATION_DENIED',
  'NOTIFICATION_PERMISSION_DENIED',
  'LOCATION_UNAVAILABLE',
  'LOCATION_STALE',
  'GEOFENCE_REGISTRATION_FAILED',
  'ALARM_FAILED',
  'STORAGE_FAILED',
  'MAP_SEARCH_FAILED',
  'NETWORK_UNAVAILABLE',
  'UNSUPPORTED_PLATFORM',
];

const KNOWN_SOURCES: LocationSource[] = ['gps', 'network', 'fused', 'unknown'];

export function toLocationSample(native: NativeLocationSample): LocationSample {
  return {
    latitude: native.latitude,
    longitude: native.longitude,
    accuracyMeters: native.hasAccuracy ? native.accuracyMeters : null,
    altitudeMeters: native.hasAltitude ? native.altitudeMeters : null,
    speedMps: native.hasSpeed ? native.speedMps : null,
    headingDegrees: native.hasHeading ? native.headingDegrees : null,
    timestamp: native.timestamp,
    source: KNOWN_SOURCES.includes(native.source as LocationSource)
      ? (native.source as LocationSource)
      : 'unknown',
  };
}

function toPermissionState(value: string): PermissionState {
  return value === 'granted' || value === 'denied' || value === 'restricted' ? value : 'unknown';
}

export function toPermissionStatus(native: NativePermissionStatus): PermissionStatus {
  return {
    foregroundLocation: toPermissionState(native.foregroundLocation),
    backgroundLocation: toPermissionState(native.backgroundLocation),
    notifications: toPermissionState(native.notifications),
  };
}

function mapNativeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  const code = (error as { code?: string } | null)?.code;
  if (code && KNOWN_ERROR_CODES.includes(code as AppErrorCode)) {
    return new AppError(code as AppErrorCode, (error as Error).message);
  }
  return new AppError('LOCATION_UNAVAILABLE', error instanceof Error ? error.message : String(error));
}

export class NearBellLocationService implements LocationService {
  private requireModule() {
    if (!NativeNearBellLocation) {
      throw new AppError('UNSUPPORTED_PLATFORM', 'Native location module is unavailable on this platform');
    }
    return NativeNearBellLocation;
  }

  async getCurrentLocation(): Promise<LocationSample> {
    try {
      return toLocationSample(await this.requireModule().getCurrentLocation());
    } catch (error) {
      throw mapNativeError(error);
    }
  }

  async getPermissionStatus(): Promise<PermissionStatus> {
    try {
      return toPermissionStatus(await this.requireModule().getPermissionStatus());
    } catch (error) {
      throw mapNativeError(error);
    }
  }

  async requestForegroundLocationPermission(): Promise<PermissionStatus> {
    try {
      return toPermissionStatus(await this.requireModule().requestForegroundLocationPermission());
    } catch (error) {
      throw mapNativeError(error);
    }
  }

  async requestBackgroundLocationPermission(): Promise<PermissionStatus> {
    try {
      return toPermissionStatus(await this.requireModule().requestBackgroundLocationPermission());
    } catch (error) {
      throw mapNativeError(error);
    }
  }

  async requestNotificationPermission(): Promise<PermissionStatus> {
    try {
      return toPermissionStatus(await this.requireModule().requestNotificationPermission());
    } catch (error) {
      throw mapNativeError(error);
    }
  }

  async startTripMonitoring(config: TripMonitoringConfig): Promise<void> {
    try {
      await this.requireModule().startTripMonitoring(
        config.tripId,
        config.destination.latitude,
        config.destination.longitude,
        config.alertPolicy.radiusMeters,
      );
    } catch (error) {
      throw mapNativeError(error);
    }
  }

  async pauseTripMonitoring(): Promise<void> {
    try {
      await this.requireModule().pauseTripMonitoring();
    } catch (error) {
      throw mapNativeError(error);
    }
  }

  async resumeTripMonitoring(): Promise<void> {
    try {
      await this.requireModule().resumeTripMonitoring();
    } catch (error) {
      throw mapNativeError(error);
    }
  }

  async stopTripMonitoring(): Promise<void> {
    try {
      await this.requireModule().stopTripMonitoring();
    } catch (error) {
      throw mapNativeError(error);
    }
  }
}

export const locationService = new NearBellLocationService();
