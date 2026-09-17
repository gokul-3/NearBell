import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { radii, spacing, themes, typography } from './tokens';
import type { ThemeColors, ThemeMode } from './tokens';

export type ThemePreference = 'system' | ThemeMode;

export type Theme = {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
};

const ThemeContext = createContext<Theme | null>(null);

function resolveMode(preference: ThemePreference, systemScheme: ThemeMode | null): ThemeMode {
  if (preference === 'system') {
    return systemScheme ?? 'light';
  }
  return preference;
}

export function ThemeProvider({
  preference = 'system',
  children,
}: {
  preference?: ThemePreference;
  children: React.ReactNode;
}) {
  const systemScheme = useColorScheme();
  const mode = resolveMode(preference, systemScheme === 'dark' ? 'dark' : 'light');

  const theme = useMemo<Theme>(
    () => ({
      mode,
      colors: themes[mode],
      spacing,
      radii,
      typography,
    }),
    [mode],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
}
