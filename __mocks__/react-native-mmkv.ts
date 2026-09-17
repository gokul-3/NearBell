// Jest manual mock: react-native-mmkv's native module (backed by
// react-native-nitro-modules) cannot load outside a real RN runtime. Any
// module that needs an MMKV-shaped store in tests should go through
// src/infrastructure/storage/persistStorage.ts's SyncKeyValueStore
// interface with a hand-rolled fake instead of relying on this mock's
// exact shape — this exists only so importing react-native-mmkv at all
// (e.g. via src/infrastructure/storage/mmkv.ts) doesn't crash Jest.

export type Configuration = { id: string };

export function createMMKV(config: Configuration = { id: 'mmkv.default' }) {
  const storage = new Map<string, string>();
  return {
    id: config.id,
    getString: (key: string) => storage.get(key),
    set: (key: string, value: string) => {
      storage.set(key, String(value));
    },
    remove: (key: string) => storage.delete(key),
    contains: (key: string) => storage.has(key),
    getAllKeys: () => Array.from(storage.keys()),
    clearAll: () => storage.clear(),
  };
}
