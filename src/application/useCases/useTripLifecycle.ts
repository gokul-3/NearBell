import { useTripStore } from '@state/tripStore';
import { generateId } from '@application/services/id';
import { createTrip, transitionTrip, type Trip } from '@domain/trip/trip';
import type { AlertPolicy } from '@domain/trip/alertPolicy';
import type { Destination } from '@domain/location/destination';

export function useTripLifecycle() {
  const activeTrip = useTripStore((state) => state.activeTrip);
  const setActiveTrip = useTripStore((state) => state.setActiveTrip);
  const updateActiveTrip = useTripStore((state) => state.updateActiveTrip);
  const finishActiveTrip = useTripStore((state) => state.finishActiveTrip);

  function startTrip(destination: Destination, alertPolicy: AlertPolicy): Trip {
    const trip = createTrip({
      id: generateId('trip'),
      destination,
      alertPolicy,
      createdAt: Date.now(),
    });
    const active = transitionTrip(trip, { type: 'START', startedAt: Date.now() });
    setActiveTrip(active);
    return active;
  }

  function pauseTrip() {
    updateActiveTrip((trip) => transitionTrip(trip, { type: 'PAUSE' }));
  }

  function resumeTrip() {
    updateActiveTrip((trip) => transitionTrip(trip, { type: 'RESUME' }));
  }

  function cancelTrip() {
    if (!activeTrip) {
      return;
    }
    finishActiveTrip(transitionTrip(activeTrip, { type: 'CANCEL' }));
  }

  /** "Stop alarm" — dismisses the alarm and marks the trip complete. */
  function stopAlarmAndCompleteTrip() {
    if (!activeTrip) {
      return;
    }
    const completed = transitionTrip(activeTrip, { type: 'COMPLETE', completedAt: Date.now() });
    finishActiveTrip(completed);
  }

  /** "I'm not there yet" — re-arms monitoring instead of completing. */
  function rearmTrip() {
    updateActiveTrip((trip) => transitionTrip(trip, { type: 'REARM' }));
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
