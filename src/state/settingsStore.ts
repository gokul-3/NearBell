import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';
import { clampRadiusMeters } from '@domain/trip/alertPolicy';
import { appStorage } from '@infrastructure/storage/mmkv';
import { createSafePersistStorage } from '@infrastructure/storage/persistStorage';

export type ThemePreference = 'system' | 'light' | 'dark';

export type Settings = {
  defaultRadiusMeters: number;
  vibrationEnabled: boolean;
  alarmSoundId: string;
  theme: ThemePreference;
};

export const DEFAULT_SETTINGS: Settings = {
  defaultRadiusMeters: 500,
  vibrationEnabled: true,
  alarmSoundId: 'default',
  theme: 'system',
};

export const SETTINGS_SCHEMA_VERSION = 1;

export type SettingsStoreState = Settings & {
  setDefaultRadiusMeters: (meters: number) => void;
  setVibrationEnabled: (enabled: boolean) => void;
  setAlarmSoundId: (alarmSoundId: string) => void;
  setTheme: (theme: ThemePreference) => void;
  resetSettings: () => void;
};

export function createSettingsStore(storage: PersistStorage<Settings>) {
  return create<SettingsStoreState>()(
    persist(
      (set) => ({
        ...DEFAULT_SETTINGS,
        setDefaultRadiusMeters: (meters) =>
          set({ defaultRadiusMeters: clampRadiusMeters(meters) }),
        setVibrationEnabled: (enabled) => set({ vibrationEnabled: enabled }),
        setAlarmSoundId: (alarmSoundId) => set({ alarmSoundId }),
        setTheme: (theme) => set({ theme }),
        resetSettings: () => set(DEFAULT_SETTINGS),
      }),
      {
        name: 'nearbell.settings',
        version: SETTINGS_SCHEMA_VERSION,
        storage,
        partialize: (state) => ({
          defaultRadiusMeters: state.defaultRadiusMeters,
          vibrationEnabled: state.vibrationEnabled,
          alarmSoundId: state.alarmSoundId,
          theme: state.theme,
        }),
        // Any older/partial persisted shape is backfilled with current
        // defaults field-by-field, rather than discarded wholesale — this
        // is the migration path required for every persisted schema change.
        migrate: (persistedState) => {
          const partial = (persistedState ?? {}) as Partial<Settings>;
          return {
            defaultRadiusMeters: clampRadiusMeters(
              partial.defaultRadiusMeters ?? DEFAULT_SETTINGS.defaultRadiusMeters,
            ),
            vibrationEnabled: partial.vibrationEnabled ?? DEFAULT_SETTINGS.vibrationEnabled,
            alarmSoundId: partial.alarmSoundId ?? DEFAULT_SETTINGS.alarmSoundId,
            theme: partial.theme ?? DEFAULT_SETTINGS.theme,
          };
        },
      },
    ),
  );
}

export const useSettingsStore = createSettingsStore(createSafePersistStorage(appStorage));
