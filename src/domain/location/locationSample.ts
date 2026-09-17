import type { Coordinates } from '@domain/shared/coordinates';

export type LocationSource = 'gps' | 'network' | 'fused' | 'unknown';

export type LocationSample = Coordinates & {
  accuracyMeters: number | null;
  altitudeMeters?: number | null;
  speedMps?: number | null;
  headingDegrees?: number | null;
  timestamp: number;
  source: LocationSource;
};

export const DEFAULT_MAX_SAMPLE_AGE_MS = 2 * 60 * 1000;

export function isSampleStale(
  sample: LocationSample,
  now: number,
  maxAgeMs: number = DEFAULT_MAX_SAMPLE_AGE_MS,
): boolean {
  return now - sample.timestamp > maxAgeMs;
}
