import type { Destination } from '../../src/domain/location/destination';
import {
  InvalidTripTransitionError,
  createTrip,
  transitionTrip,
} from '../../src/domain/trip/trip';

const DESTINATION: Destination = {
  id: 'dest-1',
  name: 'Central Station',
  latitude: 12.9716,
  longitude: 77.5946,
};

function makeReadyTrip() {
  return createTrip({
    id: 'trip-1',
    destination: DESTINATION,
    alertPolicy: { radiusMeters: 500 },
    createdAt: 1_000,
  });
}

describe('createTrip', () => {
  it('starts in READY with an IDLE alarm', () => {
    const trip = makeReadyTrip();
    expect(trip.status).toBe('READY');
    expect(trip.alarmState).toBe('IDLE');
    expect(trip.arrivalTriggeredAt).toBeUndefined();
  });
});

describe('transitionTrip — valid transitions', () => {
  it('READY -> ACTIVE via START', () => {
    const trip = transitionTrip(makeReadyTrip(), { type: 'START', startedAt: 2_000 });
    expect(trip.status).toBe('ACTIVE');
    expect(trip.startedAt).toBe(2_000);
  });

  it('ACTIVE -> PAUSED -> ACTIVE', () => {
    const active = transitionTrip(makeReadyTrip(), { type: 'START', startedAt: 2_000 });
    const paused = transitionTrip(active, { type: 'PAUSE' });
    expect(paused.status).toBe('PAUSED');
    const resumed = transitionTrip(paused, { type: 'RESUME' });
    expect(resumed.status).toBe('ACTIVE');
  });

  it('ACTIVE -> ARRIVED -> COMPLETED', () => {
    const active = transitionTrip(makeReadyTrip(), { type: 'START', startedAt: 2_000 });
    const arrived = transitionTrip(active, { type: 'ARRIVE', arrivalTriggeredAt: 3_000 });
    expect(arrived.status).toBe('ARRIVED');
    expect(arrived.arrivalTriggeredAt).toBe(3_000);
    expect(arrived.alarmState).toBe('RINGING');

    const completed = transitionTrip(arrived, { type: 'COMPLETE', completedAt: 4_000 });
    expect(completed.status).toBe('COMPLETED');
    expect(completed.completedAt).toBe(4_000);
    expect(completed.alarmState).toBe('DISMISSED');
  });

  it('ARRIVED -> ACTIVE via REARM ("I\'m not there yet")', () => {
    const active = transitionTrip(makeReadyTrip(), { type: 'START', startedAt: 2_000 });
    const arrived = transitionTrip(active, { type: 'ARRIVE', arrivalTriggeredAt: 3_000 });

    const rearmed = transitionTrip(arrived, { type: 'REARM' });
    expect(rearmed.status).toBe('ACTIVE');
    expect(rearmed.alarmState).toBe('IDLE');
    expect(rearmed.arrivalTriggeredAt).toBeUndefined();
  });

  it('ACTIVE -> CANCELLED', () => {
    const active = transitionTrip(makeReadyTrip(), { type: 'START', startedAt: 2_000 });
    const cancelled = transitionTrip(active, { type: 'CANCEL' });
    expect(cancelled.status).toBe('CANCELLED');
  });

  it('ACTIVE -> DEGRADED -> ACTIVE via RECOVER', () => {
    const active = transitionTrip(makeReadyTrip(), { type: 'START', startedAt: 2_000 });
    const degraded = transitionTrip(active, { type: 'DEGRADE' });
    expect(degraded.status).toBe('DEGRADED');
    const recovered = transitionTrip(degraded, { type: 'RECOVER' });
    expect(recovered.status).toBe('ACTIVE');
  });
});

describe('transitionTrip — invalid transitions', () => {
  it('rejects ARRIVE on a trip that is not ACTIVE', () => {
    const trip = makeReadyTrip();
    expect(() => transitionTrip(trip, { type: 'ARRIVE', arrivalTriggeredAt: 3_000 })).toThrow(
      InvalidTripTransitionError,
    );
  });

  it('rejects ARRIVE on a CANCELLED trip (late event after cancel)', () => {
    const active = transitionTrip(makeReadyTrip(), { type: 'START', startedAt: 2_000 });
    const cancelled = transitionTrip(active, { type: 'CANCEL' });
    expect(() => transitionTrip(cancelled, { type: 'ARRIVE', arrivalTriggeredAt: 3_000 })).toThrow(
      InvalidTripTransitionError,
    );
  });

  it('rejects ARRIVE on a COMPLETED trip (late event after completion)', () => {
    const active = transitionTrip(makeReadyTrip(), { type: 'START', startedAt: 2_000 });
    const arrived = transitionTrip(active, { type: 'ARRIVE', arrivalTriggeredAt: 3_000 });
    const completed = transitionTrip(arrived, { type: 'COMPLETE', completedAt: 4_000 });
    expect(() => transitionTrip(completed, { type: 'ARRIVE', arrivalTriggeredAt: 5_000 })).toThrow(
      InvalidTripTransitionError,
    );
  });

  it('rejects START on a trip that already started', () => {
    const active = transitionTrip(makeReadyTrip(), { type: 'START', startedAt: 2_000 });
    expect(() => transitionTrip(active, { type: 'START', startedAt: 9_000 })).toThrow(
      InvalidTripTransitionError,
    );
  });
});

describe('transitionTrip — idempotent arrival', () => {
  it('a duplicate ARRIVE event on an already-arrived trip does not re-fire', () => {
    const active = transitionTrip(makeReadyTrip(), { type: 'START', startedAt: 2_000 });
    const arrived = transitionTrip(active, { type: 'ARRIVE', arrivalTriggeredAt: 3_000 });

    // The state machine only allows ARRIVE from ACTIVE, so a duplicate
    // native callback arriving after the first ARRIVE (trip now ARRIVED)
    // is rejected by the transition table itself.
    expect(() => transitionTrip(arrived, { type: 'ARRIVE', arrivalTriggeredAt: 3_100 })).toThrow(
      InvalidTripTransitionError,
    );
    expect(arrived.arrivalTriggeredAt).toBe(3_000);
  });
});
