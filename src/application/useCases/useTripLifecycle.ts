import { useTripStore } from '@state/tripStore';
import { generateId } from '@application/services/id';
import { AppError } from '@application/errors';
import { locationService } from '@infrastructure/location/NearBellLocationService';
import { alarmService } from '@infrastructure/alarm/NearBellAlarmService';
import { track } from '@infrastructure/analytics/Analytics';
import { createTrip, transitionTrip, type Trip } from '@domain/trip/trip';
import type { AlertPolicy } from '@domain/trip/alertPolicy';
import type { Destination } from '@domain/location/destination';

export function useTripLifecycle() {
  const activeTrip = useTripStore((state) => state.activeTrip);
  const setActiveTrip = useTripStore((state) => state.setActiveTrip);
  const updateActiveTrip = useTripStore((state) => state.updateActiveTrip);
  const finishActiveTrip = useTripStore((state) => state.finishActiveTrip);

  /**
   * Requests foreground location + notifications (required before a trip
   * can start monitoring at all), starts the trip, then requests
   * background location and starts native monitoring. Background location
   * is requested only now — after the user has already committed to
   * starting a trip and understands why — never upfront at app launch.
   */
  async function startTrip(destination: Destination, alertPolicy: AlertPolicy): Promise<Trip> {
    const foregroundStatus = await locationService.requestForegroundLocationPermission();
    if (foregroundStatus.foregroundLocation !== 'granted') {
      throw new AppError('LOCATION_PERMISSION_DENIED', 'Foreground location permission is required to start a trip');
    }
    await locationService.requestNotificationPermission();

    const trip = createTrip({
      id: generateId('trip'),
      destination,
      alertPolicy,
      createdAt: Date.now(),
    });
    const active = transitionTrip(trip, { type: 'START', startedAt: Date.now() });
    setActiveTrip(active);
    track({ name: 'trip_started', properties: { radiusMeters: alertPolicy.radiusMeters } });

    await locationService.requestBackgroundLocationPermission();

    try {
      await locationService.startTripMonitoring({ tripId: active.id, destination, alertPolicy });
    } catch {
      updateActiveTrip((current) => transitionTrip(current, { type: 'DEGRADE' }));
    }

    return active;
  }

  function pauseTrip() {
    updateActiveTrip((trip) => transitionTrip(trip, { type: 'PAUSE' }));
    locationService.pauseTripMonitoring().catch(() => {});
  }

  function resumeTrip() {
    updateActiveTrip((trip) => transitionTrip(trip, { type: 'RESUME' }));
    locationService.resumeTripMonitoring().catch(() => {});
  }

  function cancelTrip() {
    if (!activeTrip) {
      return;
    }
    finishActiveTrip(transitionTrip(activeTrip, { type: 'CANCEL' }));
    locationService.stopTripMonitoring().catch(() => {});
    alarmService.stopAlarm().catch(() => {});
    track({ name: 'trip_cancelled' });
  }

  /** "Stop alarm" — dismisses the alarm and marks the trip complete. */
  function stopAlarmAndCompleteTrip() {
    if (!activeTrip) {
      return;
    }
    const completed = transitionTrip(activeTrip, { type: 'COMPLETE', completedAt: Date.now() });
    finishActiveTrip(completed);
    locationService.stopTripMonitoring().catch(() => {});
    alarmService.stopAlarm().catch(() => {});
    track({ name: 'trip_completed' });
  }

  /** "I'm not there yet" — re-arms monitoring instead of completing. */
  function rearmTrip() {
    updateActiveTrip((trip) => transitionTrip(trip, { type: 'REARM' }));
    alarmService.stopAlarm().catch(() => {});
  }

  return {
    activeTrip,
    startTrip,
    pauseTrip,
    resumeTrip,
    cancelTrip,
    stopAlarmAndCompleteTrip,
    rearmTrip,
  };
}
