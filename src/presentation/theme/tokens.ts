export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentContrast: string;
  danger: string;
  success: string;
  warning: string;
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  card: 16,
  control: 12,
  pill: 999,
} as const;

export const minTouchTarget = 44;

const lightColors: ThemeColors = {
  background: '#F5F6F8',
  surface: '#FFFFFF',
  surfaceAlt: '#ECEFF3',
  border: '#DCE0E6',
  textPrimary: '#12161C',
  textSecondary: '#5B6572',
  accent: '#1E6FEB',
  accentContrast: '#FFFFFF',
  danger: '#D92D20',
  success: '#12875A',
  warning: '#B54708',
};

const darkColors: ThemeColors = {
  background: '#0E1116',
  surface: '#171B22',
  surfaceAlt: '#1F242D',
  border: '#2B313B',
  textPrimary: '#F2F4F7',
  textSecondary: '#9AA4B2',
  accent: '#4C93FF',
  accentContrast: '#0E1116',
  danger: '#F97066',
  success: '#32D583',
  warning: '#FDB022',
};

export const themes: Record<ThemeMode, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};

export type Typography = {
  fontSizeDisplay: number;
  fontSizeTitle: number;
  fontSizeBody: number;
  fontSizeCaption: number;
};

export const typography: Typography = {
  fontSizeDisplay: 34,
  fontSizeTitle: 22,
  fontSizeBody: 16,
  fontSizeCaption: 13,
};
