import type { Coordinates } from '../../src/domain/shared/coordinates';
import type { LocationSample } from '../../src/domain/location/locationSample';
import {
  evaluateArrival,
  initialArrivalTrackingState,
  type ArrivalTrackingState,
} from '../../src/domain/trip/arrivalEvaluator';

const DESTINATION: Coordinates = { latitude: 0, longitude: 0 };
const METERS_PER_DEGREE_LATITUDE = 111_320;
const NOW = 1_700_000_000_000;

function sampleAtDistanceMeters(
  meters: number,
  overrides: Partial<LocationSample> = {},
): LocationSample {
  return {
    latitude: meters / METERS_PER_DEGREE_LATITUDE,
    longitude: 0,
    accuracyMeters: 10,
    timestamp: NOW,
    source: 'gps',
    ...overrides,
  };
}

describe('evaluateArrival — candidate arrival threshold', () => {
  it('499m with a 500m radius becomes a candidate, then arrives on the 2nd consecutive sample', () => {
    const alertPolicy = { radiusMeters: 500 };
    const first = evaluateArrival({
      destination: DESTINATION,
      alertPolicy,
      sample: sampleAtDistanceMeters(499),
      source: 'location_sample',
      now: NOW,
    });
    expect(first.arrived).toBe(false);
    expect(first.reason).toBe('not_arrived');

    const second = evaluateArrival(
      {
        destination: DESTINATION,
        alertPolicy,
        sample: sampleAtDistanceMeters(499),
        source: 'location_sample',
        now: NOW,
      },
      first.nextState,
    );
    expect(second.arrived).toBe(true);
    expect(second.reason).toBe('consecutive_samples');
  });

  it('501m with a 500m radius never arrives, even after repeated samples', () => {
    const alertPolicy = { radiusMeters: 500 };
    let state: ArrivalTrackingState = initialArrivalTrackingState;
    for (let i = 0; i < 5; i += 1) {
      const result = evaluateArrival(
        {
          destination: DESTINATION,
          alertPolicy,
          sample: sampleAtDistanceMeters(501),
          source: 'location_sample',
          now: NOW,
        },
        state,
      );
      expect(result.arrived).toBe(false);
      state = result.nextState;
    }
  });
});

describe('evaluateArrival — staleness', () => {
  it('a stale sample inside the radius never triggers a false arrival', () => {
    const alertPolicy = { radiusMeters: 500 };
    const staleSample = sampleAtDistanceMeters(100, { timestamp: NOW - 10 * 60 * 1000 });

    const result = evaluateArrival({
      destination: DESTINATION,
      alertPolicy,
      sample: staleSample,
      source: 'location_sample',
      now: NOW,
    });

    expect(result.arrived).toBe(false);
    expect(result.reason).toBe('stale_sample');
  });
});

describe('evaluateArrival — accuracy', () => {
  it('accuracy worse than the radius is treated conservatively (no arrival)', () => {
    const alertPolicy = { radiusMeters: 100 };
    const poorAccuracySample = sampleAtDistanceMeters(50, { accuracyMeters: 150 });

    const result = evaluateArrival({
      destination: DESTINATION,
      alertPolicy,
      sample: poorAccuracySample,
      source: 'location_sample',
      now: NOW,
    });

    expect(result.arrived).toBe(false);
    expect(result.reason).toBe('insufficient_accuracy');
  });
});

describe('evaluateArrival — invalid input', () => {
  it('rejects an invalid sample without throwing', () => {
    const alertPolicy = { radiusMeters: 500 };
    const invalidSample = sampleAtDistanceMeters(100, { latitude: NaN });

    const result = evaluateArrival({
      destination: DESTINATION,
      alertPolicy,
      sample: invalidSample,
      source: 'location_sample',
      now: NOW,
    });

    expect(result.arrived).toBe(false);
    expect(result.reason).toBe('invalid_sample');
    expect(result.distanceMeters).toBeNull();
  });
});

describe('evaluateArrival — geofence enter', () => {
  it('a geofence ENTER event triggers arrival immediately while armed', () => {
    const alertPolicy = { radiusMeters: 500 };

    const result = evaluateArrival({
      destination: DESTINATION,
      alertPolicy,
      sample: sampleAtDistanceMeters(100),
      source: 'geofence_enter',
      now: NOW,
    });

    expect(result.arrived).toBe(true);
    expect(result.reason).toBe('geofence_enter');
    expect(result.nextState.armed).toBe(false);
  });

  it('a duplicate geofence ENTER while disarmed does not re-arrive', () => {
    const alertPolicy = { radiusMeters: 500 };
    const first = evaluateArrival({
      destination: DESTINATION,
      alertPolicy,
      sample: sampleAtDistanceMeters(100),
      source: 'geofence_enter',
      now: NOW,
    });

    const second = evaluateArrival(
      {
        destination: DESTINATION,
        alertPolicy,
        sample: sampleAtDistanceMeters(100),
        source: 'geofence_enter',
        now: NOW,
      },
      first.nextState,
    );

    expect(second.arrived).toBe(false);
    expect(second.reason).toBe('not_armed');
  });
});

describe('evaluateArrival — hysteresis / re-arm', () => {
  it('only re-arms once the user leaves the re-arm radius', () => {
    const alertPolicy = { radiusMeters: 500, rearmRadiusMeters: 800 };

    const arrived = evaluateArrival({
      destination: DESTINATION,
      alertPolicy,
      sample: sampleAtDistanceMeters(100),
      source: 'geofence_enter',
      now: NOW,
    });
    expect(arrived.nextState.armed).toBe(false);

    const stillClose = evaluateArrival(
      {
        destination: DESTINATION,
        alertPolicy,
        sample: sampleAtDistanceMeters(600),
        source: 'location_sample',
        now: NOW,
      },
      arrived.nextState,
    );
    expect(stillClose.arrived).toBe(false);
    expect(stillClose.reason).toBe('not_armed');
    expect(stillClose.nextState.armed).toBe(false);

    const leftRearmRadius = evaluateArrival(
      {
        destination: DESTINATION,
        alertPolicy,
        sample: sampleAtDistanceMeters(900),
        source: 'location_sample',
        now: NOW,
      },
      stillClose.nextState,
    );
    expect(leftRearmRadius.nextState.armed).toBe(true);

    const rearmedAndBack = evaluateArrival(
      {
        destination: DESTINATION,
        alertPolicy,
        sample: sampleAtDistanceMeters(100),
        source: 'geofence_enter',
        now: NOW,
      },
      leftRearmRadius.nextState,
    );
    expect(rearmedAndBack.arrived).toBe(true);
  });
});
