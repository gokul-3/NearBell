import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';
import type { Trip } from '@domain/trip/trip';
import { appStorage } from '@infrastructure/storage/mmkv';
import { createSafePersistStorage } from '@infrastructure/storage/persistStorage';

export const MAX_HISTORY_ENTRIES = 50;
export const TRIP_SCHEMA_VERSION = 1;

export type TripPersistedState = {
  activeTrip: Trip | null;
  history: Trip[];
};

export type TripStoreState = TripPersistedState & {
  setActiveTrip: (trip: Trip | null) => void;
  updateActiveTrip: (updater: (trip: Trip) => Trip) => void;
  /** Moves a COMPLETED/CANCELLED trip out of "active" and into history. */
  finishActiveTrip: (trip: Trip) => void;
  deleteHistoryEntry: (id: string) => void;
  clearHistory: () => void;
};

const TERMINAL_STATUSES: Trip['status'][] = ['COMPLETED', 'CANCELLED'];

export function createTripStore(storage: PersistStorage<TripPersistedState>) {
  return create<TripStoreState>()(
    persist(
      (set, get) => ({
        activeTrip: null,
        history: [],
        setActiveTrip: (trip) => set({ activeTrip: trip }),
        updateActiveTrip: (updater) => {
          const current = get().activeTrip;
          if (!current) {
            return;
          }
          set({ activeTrip: updater(current) });
        },
        finishActiveTrip: (trip) => {
          if (!TERMINAL_STATUSES.includes(trip.status)) {
            throw new Error(
              `finishActiveTrip requires a COMPLETED or CANCELLED trip, got "${trip.status}"`,
            );
          }
          set((state) => ({
            activeTrip: null,
            history: [trip, ...state.history].slice(0, MAX_HISTORY_ENTRIES),
          }));
        },
        deleteHistoryEntry: (id) =>
          set((state) => ({ history: state.history.filter((entry) => entry.id !== id) })),
        clearHistory: () => set({ history: [] }),
      }),
      {
        name: 'nearbell.trip',
        version: TRIP_SCHEMA_VERSION,
        storage,
        partialize: (state) => ({ activeTrip: state.activeTrip, history: state.history }),
        // Backfill missing fields from an older persisted shape rather than
        // discarding it — required for every persisted schema change.
        migrate: (persistedState) => {
          const partial = (persistedState ?? {}) as Partial<TripPersistedState>;
          return {
            activeTrip: partial.activeTrip ?? null,
            history: Array.isArray(partial.history) ? partial.history.slice(0, MAX_HISTORY_ENTRIES) : [],
          };
        },
      },
    ),
  );
}

export const useTripStore = createTripStore(createSafePersistStorage(appStorage));
