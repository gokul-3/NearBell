import { evaluateArrival, type ArrivalSource } from '@domain/trip/arrivalEvaluator';
import { transitionTrip, withArrivalTracking, withLocationUpdate, type Trip } from '@domain/trip/trip';
import type { LocationSample } from '@domain/location/locationSample';

/**
 * The application-layer half of the event pipeline in
 * 06-technical-implementation.md: native adapter -> (this) -> domain
 * arrival evaluator -> trip state update. Pure and RN-free so the whole
 * decision path is unit-testable without a device.
 *
 * Ignores events for a trip that isn't ACTIVE — covers late/duplicate
 * native callbacks for a cancelled/completed/paused trip.
 */
export function handleLocationEvent(
  trip: Trip,
  sample: LocationSample,
  source: ArrivalSource,
  now: number,
): Trip {
  if (trip.status !== 'ACTIVE') {
    return trip;
  }

  const result = evaluateArrival(
    { destination: trip.destination, alertPolicy: trip.alertPolicy, sample, source, now },
    trip.arrivalTracking,
  );

  let updated = withLocationUpdate(trip, sample, result.distanceMeters);
  updated = withArrivalTracking(updated, result.nextState);

  if (result.arrived) {
    updated = transitionTrip(updated, { type: 'ARRIVE', arrivalTriggeredAt: now });
  }

  return updated;
}
