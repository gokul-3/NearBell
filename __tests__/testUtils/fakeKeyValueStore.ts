import type { SyncKeyValueStore } from '../../src/infrastructure/storage/persistStorage';

/**
 * An in-memory stand-in for the on-device key/value store, used to simulate
 * "the app was restarted" in tests: create a store bound to this backing
 * object, mutate it, then create a *new* store instance bound to the same
 * backing object and assert it rehydrates the same state.
 */
export function createFakeKeyValueStore(): SyncKeyValueStore {
  const backing = new Map<string, string>();
  return {
    getString: (key) => backing.get(key),
    set: (key, value) => backing.set(key, value),
    remove: (key) => backing.delete(key),
  };
}
