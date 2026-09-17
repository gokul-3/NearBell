import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';
import { appStorage } from '@infrastructure/storage/mmkv';
import { createSafePersistStorage } from '@infrastructure/storage/persistStorage';

export type OnboardingPersistedState = {
  hasCompletedWelcome: boolean;
};

export type OnboardingStoreState = OnboardingPersistedState & {
  completeWelcome: () => void;
};

export const ONBOARDING_SCHEMA_VERSION = 1;

export function createOnboardingStore(storage: PersistStorage<OnboardingPersistedState>) {
  return create<OnboardingStoreState>()(
    persist(
      (set) => ({
        hasCompletedWelcome: false,
        completeWelcome: () => set({ hasCompletedWelcome: true }),
      }),
      {
        name: 'nearbell.onboarding',
        version: ONBOARDING_SCHEMA_VERSION,
        storage,
        partialize: (state) => ({ hasCompletedWelcome: state.hasCompletedWelcome }),
        migrate: (persistedState) => {
          const partial = (persistedState ?? {}) as Partial<OnboardingPersistedState>;
          return { hasCompletedWelcome: partial.hasCompletedWelcome ?? false };
        },
      },
    ),
  );
}

export const useOnboardingStore = createOnboardingStore(createSafePersistStorage(appStorage));
