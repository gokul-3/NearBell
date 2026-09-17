import type { Coordinates } from '@domain/shared/coordinates';
import { haversineDistanceMeters, isValidCoordinates } from '@domain/shared/coordinates';
import type { LocationSample } from '@domain/location/locationSample';
import { DEFAULT_MAX_SAMPLE_AGE_MS, isSampleStale } from '@domain/location/locationSample';
import type { AlertPolicy } from '@domain/trip/alertPolicy';
import { resolveRearmRadiusMeters, resolveRequiredConsecutiveSamples } from '@domain/trip/alertPolicy';

export type ArrivalSource = 'geofence_enter' | 'location_sample';

export type ArrivalTrackingState = {
  /** Consecutive recent samples seen inside the alert radius while armed. */
  consecutiveInsideSamples: number;
  /** False once an arrival has fired, until the user leaves the re-arm radius. */
  armed: boolean;
};

export const initialArrivalTrackingState: ArrivalTrackingState = {
  consecutiveInsideSamples: 0,
  armed: true,
};

export type ArrivalEvaluationReason =
  | 'invalid_sample'
  | 'stale_sample'
  | 'insufficient_accuracy'
  | 'not_armed'
  | 'geofence_enter'
  | 'consecutive_samples'
  | 'not_arrived';

export type ArrivalEvaluationInput = {
  destination: Coordinates;
  alertPolicy: AlertPolicy;
  sample: LocationSample;
  source: ArrivalSource;
  now: number;
  maxSampleAgeMs?: number;
};

export type ArrivalEvaluationResult = {
  arrived: boolean;
  reason: ArrivalEvaluationReason;
  distanceMeters: number | null;
  nextState: ArrivalTrackingState;
};

function isAccuracyAcceptable(sample: LocationSample, alertPolicy: AlertPolicy): boolean {
  if (sample.accuracyMeters === null) {
    return true;
  }
  if (sample.accuracyMeters > alertPolicy.radiusMeters) {
    return false;
  }
  if (
    alertPolicy.minimumAccuracyMeters !== undefined &&
    sample.accuracyMeters > alertPolicy.minimumAccuracyMeters
  ) {
    return false;
  }
  return true;
}

function disarmed(): ArrivalTrackingState {
  return { consecutiveInsideSamples: 0, armed: false };
}

/**
 * Pure evaluator for "has the trip arrived at its destination".
 *
 * Never trusts a single noisy sample: a plain location sample only counts
 * once `requireConsecutiveSamples` recent in-radius samples have been seen
 * while armed. A geofence ENTER event is treated as sufficient on its own
 * (it is the platform's own boundary-crossing signal). After an arrival
 * fires, the tracker disarms and only re-arms once the caller feeds in a
 * sample outside the re-arm radius — this is the hysteresis the product
 * spec requires for "I'm not there yet".
 */
export function evaluateArrival(
  input: ArrivalEvaluationInput,
  state: ArrivalTrackingState = initialArrivalTrackingState,
): ArrivalEvaluationResult {
  const { destination, alertPolicy, sample, source, now } = input;
  const maxSampleAgeMs = input.maxSampleAgeMs ?? DEFAULT_MAX_SAMPLE_AGE_MS;

  if (!isValidCoordinates(sample)) {
    return { arrived: false, reason: 'invalid_sample', distanceMeters: null, nextState: state };
  }

  const distanceMeters = haversineDistanceMeters(destination, sample);

  // Staleness only disqualifies plain location samples. A geofence ENTER is
  // the platform's own boundary-crossing signal — it's authoritative even if
  // the location fix attached to it (for display purposes) is older.
  if (source === 'location_sample' && isSampleStale(sample, now, maxSampleAgeMs)) {
    return { arrived: false, reason: 'stale_sample', distanceMeters, nextState: state };
  }

  if (!state.armed) {
    const rearmRadiusMeters = resolveRearmRadiusMeters(alertPolicy);
    if (distanceMeters > rearmRadiusMeters) {
      return {
        arrived: false,
        reason: 'not_armed',
        distanceMeters,
        nextState: { consecutiveInsideSamples: 0, armed: true },
      };
    }
    return {
      arrived: false,
      reason: 'not_armed',
      distanceMeters,
      nextState: { consecutiveInsideSamples: 0, armed: false },
    };
  }

  if (source === 'geofence_enter') {
    return {
      arrived: true,
      reason: 'geofence_enter',
      distanceMeters,
      nextState: disarmed(),
    };
  }

  const inside = distanceMeters <= alertPolicy.radiusMeters;
  const accuracyAcceptable = isAccuracyAcceptable(sample, alertPolicy);

  if (!inside || !accuracyAcceptable) {
    return {
      arrived: false,
      reason: accuracyAcceptable ? 'not_arrived' : 'insufficient_accuracy',
      distanceMeters,
      nextState: { consecutiveInsideSamples: 0, armed: true },
    };
  }

  const consecutiveInsideSamples = state.consecutiveInsideSamples + 1;
  const requiredConsecutiveSamples = resolveRequiredConsecutiveSamples(alertPolicy);

  if (consecutiveInsideSamples >= requiredConsecutiveSamples) {
    return {
      arrived: true,
      reason: 'consecutive_samples',
      distanceMeters,
      nextState: disarmed(),
    };
  }

  return {
    arrived: false,
    reason: 'not_arrived',
    distanceMeters,
    nextState: { consecutiveInsideSamples, armed: true },
  };
}
