import {
  MAX_RADIUS_METERS,
  MIN_RADIUS_METERS,
  clampRadiusMeters,
  isValidAlertPolicy,
  resolveRearmRadiusMeters,
  resolveRequiredConsecutiveSamples,
} from '../../src/domain/trip/alertPolicy';

describe('clampRadiusMeters', () => {
  it('leaves in-range values untouched', () => {
    expect(clampRadiusMeters(500)).toBe(500);
  });

  it('clamps below the minimum', () => {
    expect(clampRadiusMeters(1)).toBe(MIN_RADIUS_METERS);
  });

  it('clamps above the maximum', () => {
    expect(clampRadiusMeters(1_000_000)).toBe(MAX_RADIUS_METERS);
  });

  it('falls back to the minimum for NaN/Infinity', () => {
    expect(clampRadiusMeters(NaN)).toBe(MIN_RADIUS_METERS);
    expect(clampRadiusMeters(Infinity)).toBe(MIN_RADIUS_METERS);
  });
});

describe('isValidAlertPolicy', () => {
  it('accepts a minimal valid policy', () => {
    expect(isValidAlertPolicy({ radiusMeters: 500 })).toBe(true);
  });

  it('rejects a non-positive radius', () => {
    expect(isValidAlertPolicy({ radiusMeters: 0 })).toBe(false);
    expect(isValidAlertPolicy({ radiusMeters: -100 })).toBe(false);
  });

  it('rejects an invalid requireConsecutiveSamples', () => {
    expect(isValidAlertPolicy({ radiusMeters: 500, requireConsecutiveSamples: 0 })).toBe(false);
    expect(isValidAlertPolicy({ radiusMeters: 500, requireConsecutiveSamples: 1.5 })).toBe(false);
  });

  it('rejects a non-positive rearm radius', () => {
    expect(isValidAlertPolicy({ radiusMeters: 500, rearmRadiusMeters: 0 })).toBe(false);
  });
});

describe('resolveRearmRadiusMeters', () => {
  it('defaults to the alert radius when unset', () => {
    expect(resolveRearmRadiusMeters({ radiusMeters: 500 })).toBe(500);
  });

  it('uses the explicit rearm radius when set', () => {
    expect(resolveRearmRadiusMeters({ radiusMeters: 500, rearmRadiusMeters: 800 })).toBe(800);
  });
});

describe('resolveRequiredConsecutiveSamples', () => {
  it('defaults to 2', () => {
    expect(resolveRequiredConsecutiveSamples({ radiusMeters: 500 })).toBe(2);
  });

  it('uses the explicit value when set', () => {
    expect(
      resolveRequiredConsecutiveSamples({ radiusMeters: 500, requireConsecutiveSamples: 3 }),
    ).toBe(3);
  });
});
