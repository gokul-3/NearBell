import { createSafePersistStorage } from '../../src/infrastructure/storage/persistStorage';
import { MAX_HISTORY_ENTRIES, createTripStore } from '../../src/state/tripStore';
import { createTrip, transitionTrip, type Trip } from '../../src/domain/trip/trip';
import type { Destination } from '../../src/domain/location/destination';
import { createFakeKeyValueStore } from '../testUtils/fakeKeyValueStore';
import type { SyncKeyValueStore } from '../../src/infrastructure/storage/persistStorage';

function makeStore(backing: SyncKeyValueStore) {
  return createTripStore(createSafePersistStorage(backing));
}

const DESTINATION: Destination = {
  id: 'dest-1',
  name: 'Central Station',
  latitude: 12.9716,
  longitude: 77.5946,
};

function makeActiveTrip(id: string): Trip {
  const trip = createTrip({
    id,
    destination: DESTINATION,
    alertPolicy: { radiusMeters: 500 },
    createdAt: 1_000,
  });
  return transitionTrip(trip, { type: 'START', startedAt: 2_000 });
}

describe('tripStore defaults', () => {
  it('starts with no active trip and empty history', () => {
    const store = makeStore(createFakeKeyValueStore());
    expect(store.getState().activeTrip).toBeNull();
    expect(store.getState().history).toEqual([]);
  });
});

describe('tripStore — active trip survives an app restart', () => {
  it('a fresh store bound to the same backing storage recovers the active trip', async () => {
    const backing = createFakeKeyValueStore();
    const firstLaunch = makeStore(backing);
    const trip = makeActiveTrip('trip-1');
    firstLaunch.getState().setActiveTrip(trip);

    const secondLaunch = makeStore(backing);
    await secondLaunch.persist.rehydrate();

    expect(secondLaunch.getState().activeTrip).toEqual(trip);
  });

  it('updateActiveTrip persists across a simulated restart', async () => {
    const backing = createFakeKeyValueStore();
    const firstLaunch = makeStore(backing);
    firstLaunch.getState().setActiveTrip(makeActiveTrip('trip-1'));
    firstLaunch.getState().updateActiveTrip((trip) => ({ ...trip, lastDistanceMeters: 120 }));

    const secondLaunch = makeStore(backing);
    await secondLaunch.persist.rehydrate();

    expect(secondLaunch.getState().activeTrip?.lastDistanceMeters).toBe(120);
  });
});

describe('tripStore — schema migration', () => {
  it('backfills arrivalTracking on a trip persisted before that field existed', async () => {
    const backing = createFakeKeyValueStore();
    const legacyTripWithoutArrivalTracking: Partial<Trip> = { ...makeActiveTrip('trip-1') };
    delete legacyTripWithoutArrivalTracking.arrivalTracking;
    backing.set(
      'nearbell.trip',
      JSON.stringify({
        state: { activeTrip: legacyTripWithoutArrivalTracking, history: [] },
        version: 1,
      }),
    );

    const store = makeStore(backing);
    await store.persist.rehydrate();

    expect(store.getState().activeTrip?.arrivalTracking).toEqual({
      consecutiveInsideSamples: 0,
      armed: true,
    });
  });
});

describe('tripStore — corrupted data falls back safely', () => {
  it('does not throw and falls back to empty state', async () => {
    const backing = createFakeKeyValueStore();
    backing.set('nearbell.trip', 'this is not json {{{');

    const store = makeStore(backing);
    await store.persist.rehydrate();

    expect(store.getState().activeTrip).toBeNull();
    expect(store.getState().history).toEqual([]);
  });
});

describe('tripStore — history', () => {
  it('finishActiveTrip requires a terminal trip status', () => {
    const store = makeStore(createFakeKeyValueStore());
    const active = makeActiveTrip('trip-1');
    store.getState().setActiveTrip(active);

    expect(() => store.getState().finishActiveTrip(active)).toThrow();
  });

  it('finishActiveTrip clears the active trip and prepends it to history', () => {
    const store = makeStore(createFakeKeyValueStore());
    const active = makeActiveTrip('trip-1');
    store.getState().setActiveTrip(active);
    const cancelled = transitionTrip(active, { type: 'CANCEL' });

    store.getState().finishActiveTrip(cancelled);

    expect(store.getState().activeTrip).toBeNull();
    expect(store.getState().history[0]).toEqual(cancelled);
  });

  it('caps history at MAX_HISTORY_ENTRIES, keeping the most recent', () => {
    const store = makeStore(createFakeKeyValueStore());

    for (let i = 0; i < MAX_HISTORY_ENTRIES + 5; i += 1) {
      const active = makeActiveTrip(`trip-${i}`);
      store.getState().setActiveTrip(active);
      store.getState().finishActiveTrip(transitionTrip(active, { type: 'CANCEL' }));
    }

    expect(store.getState().history).toHaveLength(MAX_HISTORY_ENTRIES);
    expect(store.getState().history[0].id).toBe(`trip-${MAX_HISTORY_ENTRIES + 4}`);
  });

  it('deleteHistoryEntry removes a single entry', () => {
    const store = makeStore(createFakeKeyValueStore());
    const a = makeActiveTrip('trip-a');
    store.getState().setActiveTrip(a);
    store.getState().finishActiveTrip(transitionTrip(a, { type: 'CANCEL' }));

    const b = makeActiveTrip('trip-b');
    store.getState().setActiveTrip(b);
    store.getState().finishActiveTrip(transitionTrip(b, { type: 'CANCEL' }));

    store.getState().deleteHistoryEntry('trip-a');

    expect(store.getState().history.map((entry) => entry.id)).toEqual(['trip-b']);
  });

  it('clearHistory empties history', () => {
    const store = makeStore(createFakeKeyValueStore());
    const a = makeActiveTrip('trip-a');
    store.getState().setActiveTrip(a);
    store.getState().finishActiveTrip(transitionTrip(a, { type: 'CANCEL' }));

    store.getState().clearHistory();

    expect(store.getState().history).toEqual([]);
  });
});
