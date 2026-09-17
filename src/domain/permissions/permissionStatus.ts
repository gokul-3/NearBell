export type PermissionState = 'unknown' | 'granted' | 'denied' | 'restricted';

export type PermissionStatus = {
  foregroundLocation: PermissionState;
  backgroundLocation: PermissionState;
  notifications: PermissionState;
};

export const unknownPermissionStatus: PermissionStatus = {
  foregroundLocation: 'unknown',
  backgroundLocation: 'unknown',
  notifications: 'unknown',
};

export function canStartTrip(status: PermissionStatus): boolean {
  return status.foregroundLocation === 'granted' && status.notifications === 'granted';
}
