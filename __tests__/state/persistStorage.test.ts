import { createSafePersistStorage } from '../../src/infrastructure/storage/persistStorage';
import { createFakeKeyValueStore } from '../testUtils/fakeKeyValueStore';

describe('createSafePersistStorage', () => {
  it('round-trips a value written with setItem', () => {
    const backing = createFakeKeyValueStore();
    const storage = createSafePersistStorage<{ count: number }>(backing);

    storage.setItem('key', { state: { count: 1 }, version: 1 });
    expect(storage.getItem('key')).toEqual({ state: { count: 1 }, version: 1 });
  });

  it('returns null for a key that was never written', () => {
    const backing = createFakeKeyValueStore();
    const storage = createSafePersistStorage<{ count: number }>(backing);
    expect(storage.getItem('missing')).toBeNull();
  });

  it('treats malformed JSON as absent and wipes the corrupt entry', () => {
    const backing = createFakeKeyValueStore();
    backing.set('key', '{not valid json');
    const storage = createSafePersistStorage<{ count: number }>(backing);

    expect(storage.getItem('key')).toBeNull();
    expect(backing.getString('key')).toBeUndefined();
  });

  it('treats a valid-JSON-but-wrong-shape value as absent', () => {
    const backing = createFakeKeyValueStore();
    backing.set('key', JSON.stringify([1, 2, 3]));
    const storage = createSafePersistStorage<{ count: number }>(backing);

    expect(storage.getItem('key')).toBeNull();
  });

  it('removeItem deletes the underlying key', () => {
    const backing = createFakeKeyValueStore();
    const storage = createSafePersistStorage<{ count: number }>(backing);
    storage.setItem('key', { state: { count: 1 }, version: 1 });
    storage.removeItem('key');
    expect(storage.getItem('key')).toBeNull();
  });
});
