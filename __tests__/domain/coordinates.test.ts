import {
  haversineDistanceMeters,
  isSameLocation,
  isValidCoordinates,
} from '../../src/domain/shared/coordinates';

describe('isValidCoordinates', () => {
  it('accepts valid coordinates', () => {
    expect(isValidCoordinates({ latitude: 12.9716, longitude: 77.5946 })).toBe(true);
    expect(isValidCoordinates({ latitude: -90, longitude: -180 })).toBe(true);
    expect(isValidCoordinates({ latitude: 90, longitude: 180 })).toBe(true);
  });

  it('rejects out-of-range latitude/longitude', () => {
    expect(isValidCoordinates({ latitude: 91, longitude: 0 })).toBe(false);
    expect(isValidCoordinates({ latitude: 0, longitude: 181 })).toBe(false);
  });

  it('rejects NaN and Infinity', () => {
    expect(isValidCoordinates({ latitude: NaN, longitude: 0 })).toBe(false);
    expect(isValidCoordinates({ latitude: 0, longitude: Infinity })).toBe(false);
    expect(isValidCoordinates({ latitude: -Infinity, longitude: 0 })).toBe(false);
  });
});

describe('haversineDistanceMeters', () => {
  it('returns 0 for identical points', () => {
    const point = { latitude: 12.9716, longitude: 77.5946 };
    expect(haversineDistanceMeters(point, point)).toBeCloseTo(0, 3);
  });

  it('matches a known distance (roughly London to Paris, ~343km)', () => {
    const london = { latitude: 51.5074, longitude: -0.1278 };
    const paris = { latitude: 48.8566, longitude: 2.3522 };
    const distanceKm = haversineDistanceMeters(london, paris) / 1000;
    expect(distanceKm).toBeGreaterThan(330);
    expect(distanceKm).toBeLessThan(350);
  });

  it('is symmetric', () => {
    const a = { latitude: 12.9716, longitude: 77.5946 };
    const b = { latitude: 13.0827, longitude: 80.2707 };
    expect(haversineDistanceMeters(a, b)).toBeCloseTo(haversineDistanceMeters(b, a), 6);
  });

  it('throws on invalid coordinates rather than returning a bogus distance', () => {
    const a = { latitude: 0, longitude: 0 };
    const invalid = { latitude: NaN, longitude: 0 };
    expect(() => haversineDistanceMeters(a, invalid)).toThrow(RangeError);
  });
});

describe('isSameLocation', () => {
  it('treats points within the threshold as the same location', () => {
    const a = { latitude: 12.9716, longitude: 77.5946 };
    const b = { latitude: 12.97165, longitude: 77.59465 };
    expect(isSameLocation(a, b, 50)).toBe(true);
  });

  it('treats distant points as different locations', () => {
    const a = { latitude: 12.9716, longitude: 77.5946 };
    const b = { latitude: 13.0827, longitude: 80.2707 };
    expect(isSameLocation(a, b, 50)).toBe(false);
  });
});
