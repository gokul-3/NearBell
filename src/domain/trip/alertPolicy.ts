export type AlertPolicy = {
  radiusMeters: number;
  minimumAccuracyMeters?: number;
  requireConsecutiveSamples?: number;
  rearmRadiusMeters?: number;
};

/** Product-defined safe bounds for a custom alert radius. */
export const MIN_RADIUS_METERS = 50;
export const MAX_RADIUS_METERS = 5000;

export const DEFAULT_REQUIRE_CONSECUTIVE_SAMPLES = 2;

function isFiniteNumber(value: number): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

export function clampRadiusMeters(radiusMeters: number): number {
  if (!isFiniteNumber(radiusMeters)) {
    return MIN_RADIUS_METERS;
  }
  return Math.min(Math.max(radiusMeters, MIN_RADIUS_METERS), MAX_RADIUS_METERS);
}

export function isValidAlertPolicy(policy: AlertPolicy): boolean {
  if (!isFiniteNumber(policy.radiusMeters) || policy.radiusMeters <= 0) {
    return false;
  }
  if (
    policy.minimumAccuracyMeters !== undefined &&
    (!isFiniteNumber(policy.minimumAccuracyMeters) || policy.minimumAccuracyMeters <= 0)
  ) {
    return false;
  }
  if (
    policy.requireConsecutiveSamples !== undefined &&
    (!Number.isInteger(policy.requireConsecutiveSamples) || policy.requireConsecutiveSamples < 1)
  ) {
    return false;
  }
  if (
    policy.rearmRadiusMeters !== undefined &&
    (!isFiniteNumber(policy.rearmRadiusMeters) || policy.rearmRadiusMeters <= 0)
  ) {
    return false;
  }
  return true;
}

export function resolveRearmRadiusMeters(policy: AlertPolicy): number {
  return policy.rearmRadiusMeters ?? policy.radiusMeters;
}

export function resolveRequiredConsecutiveSamples(policy: AlertPolicy): number {
  return policy.requireConsecutiveSamples ?? DEFAULT_REQUIRE_CONSECUTIVE_SAMPLES;
}
