import { createSafePersistStorage } from '../../src/infrastructure/storage/persistStorage';
import { DEFAULT_SETTINGS, createSettingsStore } from '../../src/state/settingsStore';
import { MAX_RADIUS_METERS, MIN_RADIUS_METERS } from '../../src/domain/trip/alertPolicy';
import { createFakeKeyValueStore } from '../testUtils/fakeKeyValueStore';
import type { SyncKeyValueStore } from '../../src/infrastructure/storage/persistStorage';

function makeStore(backing: SyncKeyValueStore) {
  return createSettingsStore(createSafePersistStorage(backing));
}

describe('settingsStore defaults', () => {
  it('starts with product default settings', () => {
    const store = makeStore(createFakeKeyValueStore());
    expect(store.getState()).toMatchObject(DEFAULT_SETTINGS);
  });
});

describe('settingsStore actions', () => {
  it('clamps an out-of-range radius rather than storing it verbatim', () => {
    const store = makeStore(createFakeKeyValueStore());
    store.getState().setDefaultRadiusMeters(1);
    expect(store.getState().defaultRadiusMeters).toBe(MIN_RADIUS_METERS);

    store.getState().setDefaultRadiusMeters(1_000_000);
    expect(store.getState().defaultRadiusMeters).toBe(MAX_RADIUS_METERS);
  });

  it('resetSettings restores product defaults', () => {
    const store = makeStore(createFakeKeyValueStore());
    store.getState().setTheme('dark');
    store.getState().setVibrationEnabled(false);
    store.getState().resetSettings();
    expect(store.getState()).toMatchObject(DEFAULT_SETTINGS);
  });
});

describe('settingsStore persistence across "app restart"', () => {
  it('a fresh store bound to the same backing store rehydrates prior changes', async () => {
    const backing = createFakeKeyValueStore();

    const firstLaunch = makeStore(backing);
    firstLaunch.getState().setTheme('dark');
    firstLaunch.getState().setAlarmSoundId('chime');
    firstLaunch.getState().setDefaultRadiusMeters(250);

    // Simulate the app process dying and relaunching: a brand new store
    // instance, same on-device backing storage.
    const secondLaunch = makeStore(backing);
    await secondLaunch.persist.rehydrate();

    expect(secondLaunch.getState().theme).toBe('dark');
    expect(secondLaunch.getState().alarmSoundId).toBe('chime');
    expect(secondLaunch.getState().defaultRadiusMeters).toBe(250);
  });

  it('falls back to defaults when the persisted entry is corrupted', async () => {
    const backing = createFakeKeyValueStore();
    backing.set('nearbell.settings', '{not valid json');

    const store = makeStore(backing);
    await store.persist.rehydrate();

    expect(store.getState()).toMatchObject(DEFAULT_SETTINGS);
  });

  it('migrates an older persisted shape missing newer fields', async () => {
    const backing = createFakeKeyValueStore();
    // Simulate a schema from before `alarmSoundId` existed.
    backing.set(
      'nearbell.settings',
      JSON.stringify({ state: { defaultRadiusMeters: 1000, theme: 'light' }, version: 0 }),
    );

    const store = makeStore(backing);
    await store.persist.rehydrate();

    expect(store.getState().defaultRadiusMeters).toBe(1000);
    expect(store.getState().theme).toBe('light');
    expect(store.getState().alarmSoundId).toBe(DEFAULT_SETTINGS.alarmSoundId);
    expect(store.getState().vibrationEnabled).toBe(DEFAULT_SETTINGS.vibrationEnabled);
  });
});
