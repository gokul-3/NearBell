import type { Destination } from '@domain/location/destination';
import type { LocationSample } from '@domain/location/locationSample';
import type { AlertPolicy } from '@domain/trip/alertPolicy';
import type { PermissionStatus } from '@domain/permissions/permissionStatus';

export type TripMonitoringConfig = {
  tripId: string;
  destination: Destination;
  alertPolicy: AlertPolicy;
};

/**
 * Boundary between the application layer and platform location/background
 * execution. Implementations must register native geofences/foreground
 * services — never simulate background monitoring with a JS timer/interval.
 */
export interface LocationService {
  getCurrentLocation(): Promise<LocationSample>;
  startTripMonitoring(config: TripMonitoringConfig): Promise<void>;
  pauseTripMonitoring(): Promise<void>;
  resumeTripMonitoring(): Promise<void>;
  stopTripMonitoring(): Promise<void>;
  getPermissionStatus(): Promise<PermissionStatus>;
}
