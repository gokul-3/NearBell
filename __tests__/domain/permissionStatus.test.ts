import { canStartTrip, unknownPermissionStatus } from '../../src/domain/permissions/permissionStatus';

describe('canStartTrip', () => {
  it('is false when permissions are unknown', () => {
    expect(canStartTrip(unknownPermissionStatus)).toBe(false);
  });

  it('is true once foreground location and notifications are granted', () => {
    expect(
      canStartTrip({
        foregroundLocation: 'granted',
        backgroundLocation: 'unknown',
        notifications: 'granted',
      }),
    ).toBe(true);
  });

  it('is false when notifications are denied', () => {
    expect(
      canStartTrip({
        foregroundLocation: 'granted',
        backgroundLocation: 'granted',
        notifications: 'denied',
      }),
    ).toBe(false);
  });
});
