import { handleLocationEvent } from '../../src/application/useCases/handleLocationEvent';
import { createTrip, transitionTrip } from '../../src/domain/trip/trip';
import type { Destination } from '../../src/domain/location/destination';
import type { LocationSample } from '../../src/domain/location/locationSample';

const DESTINATION: Destination = {
  id: 'dest-1',
  name: 'Central Station',
  latitude: 0,
  longitude: 0,
};
const NOW = 1_700_000_000_000;
const METERS_PER_DEGREE_LATITUDE = 111_320;

function sampleAtDistanceMeters(meters: number, overrides: Partial<LocationSample> = {}): LocationSample {
  return {
    latitude: meters / METERS_PER_DEGREE_LATITUDE,
    longitude: 0,
    accuracyMeters: 10,
    timestamp: NOW,
    source: 'gps',
    ...overrides,
  };
}

function makeActiveTrip() {
  const trip = createTrip({
    id: 'trip-1',
    destination: DESTINATION,
    alertPolicy: { radiusMeters: 500 },
    createdAt: 1_000,
  });
  return transitionTrip(trip, { type: 'START', startedAt: 2_000 });
}

describe('handleLocationEvent', () => {
  it('ignores events for a trip that is not ACTIVE', () => {
    const trip = createTrip({
      id: 'trip-1',
      destination: DESTINATION,
      alertPolicy: { radiusMeters: 500 },
      createdAt: 1_000,
    });
    const result = handleLocationEvent(trip, sampleAtDistanceMeters(100), 'location_sample', NOW);
    expect(result).toBe(trip);
  });

  it('updates lastDistanceMeters and lastKnownLocation without arriving when outside the radius', () => {
    const trip = makeActiveTrip();
    const sample = sampleAtDistanceMeters(1000);
    const result = handleLocationEvent(trip, sample, 'location_sample', NOW);

    expect(result.status).toBe('ACTIVE');
    expect(result.lastKnownLocation).toEqual(sample);
    expect(result.lastDistanceMeters).toBeGreaterThan(990);
    expect(result.lastDistanceMeters).toBeLessThan(1010);
  });

  it('transitions to ARRIVED after the required consecutive in-radius samples', () => {
    const trip = makeActiveTrip();
    const first = handleLocationEvent(trip, sampleAtDistanceMeters(100), 'location_sample', NOW);
    expect(first.status).toBe('ACTIVE');

    const second = handleLocationEvent(first, sampleAtDistanceMeters(100), 'location_sample', NOW + 1000);
    expect(second.status).toBe('ARRIVED');
    expect(second.alarmState).toBe('RINGING');
    expect(second.arrivalTriggeredAt).toBe(NOW + 1000);
  });

  it('a geofence ENTER event triggers arrival immediately', () => {
    const trip = makeActiveTrip();
    const result = handleLocationEvent(trip, sampleAtDistanceMeters(50), 'geofence_enter', NOW);

    expect(result.status).toBe('ARRIVED');
  });

  it('a duplicate/late event after arrival does not re-fire (idempotent)', () => {
    const trip = makeActiveTrip();
    const arrived = handleLocationEvent(trip, sampleAtDistanceMeters(50), 'geofence_enter', NOW);
    expect(arrived.status).toBe('ARRIVED');

    // The trip is no longer ACTIVE, so a late duplicate callback is a no-op.
    const stillArrived = handleLocationEvent(arrived, sampleAtDistanceMeters(50), 'geofence_enter', NOW + 5000);
    expect(stillArrived).toBe(arrived);
  });

  it('a stale sample does not falsely trigger arrival', () => {
    const trip = makeActiveTrip();
    const staleSample = sampleAtDistanceMeters(50, { timestamp: NOW - 10 * 60 * 1000 });
    const result = handleLocationEvent(trip, staleSample, 'location_sample', NOW);

    expect(result.status).toBe('ACTIVE');
  });
});
