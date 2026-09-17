import type { PersistStorage, StorageValue } from 'zustand/middleware';

/**
 * The subset of react-native-mmkv's API this app relies on. Kept as a
 * structural interface (not an import of react-native-mmkv) so this module
 * has no native dependency and can be exercised in plain Jest tests with an
 * in-memory fake that implements the same three methods.
 */
export interface SyncKeyValueStore {
  getString(key: string): string | undefined | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

function isStorageValueShape(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Wraps a synchronous key/value store into a zustand `PersistStorage`.
 *
 * Corrupted or malformed data must never crash the app or block rehydration
 * (08-security-privacy.md: "treat native events as untrusted input" applies
 * equally to anything read back off disk). Any parse failure is treated as
 * "nothing persisted" — the corrupt entry is wiped and the store falls back
 * to its in-code defaults.
 */
export function createSafePersistStorage<S>(store: SyncKeyValueStore): PersistStorage<S> {
  return {
    getItem: (name) => {
      try {
        const raw = store.getString(name);
        if (raw === undefined || raw === null) {
          return null;
        }
        const parsed = JSON.parse(raw);
        if (!isStorageValueShape(parsed) || !('state' in parsed)) {
          store.remove(name);
          return null;
        }
        return parsed as StorageValue<S>;
      } catch {
        store.remove(name);
        return null;
      }
    },
    setItem: (name, value) => {
      store.set(name, JSON.stringify(value));
    },
    removeItem: (name) => {
      store.remove(name);
    },
  };
}
