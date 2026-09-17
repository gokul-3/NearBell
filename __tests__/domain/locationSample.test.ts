import { isSampleStale } from '../../src/domain/location/locationSample';

const NOW = 1_700_000_000_000;

describe('isSampleStale', () => {
  it('is not stale within the default max age', () => {
    const sample = {
      latitude: 0,
      longitude: 0,
      accuracyMeters: 10,
      timestamp: NOW - 30_000,
      source: 'gps' as const,
    };
    expect(isSampleStale(sample, NOW)).toBe(false);
  });

  it('is stale beyond the default max age', () => {
    const sample = {
      latitude: 0,
      longitude: 0,
      accuracyMeters: 10,
      timestamp: NOW - 5 * 60 * 1000,
      source: 'gps' as const,
    };
    expect(isSampleStale(sample, NOW)).toBe(true);
  });

  it('respects a custom max age', () => {
    const sample = {
      latitude: 0,
      longitude: 0,
      accuracyMeters: 10,
      timestamp: NOW - 10_000,
      source: 'gps' as const,
    };
    expect(isSampleStale(sample, NOW, 5_000)).toBe(true);
  });
});
