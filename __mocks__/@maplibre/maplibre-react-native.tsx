// Jest manual mock: MapLibre's native modules can't load outside a real RN
// runtime. This provides just enough surface for components that import
// @maplibre/maplibre-react-native to render in tests without touching the
// native map itself.
import React from 'react';
import { View } from 'react-native';

export function Map({ children, ...props }: any) {
  return <View {...props}>{children}</View>;
}

export function Camera(_props: any) {
  return null;
}

export function Marker({ children }: any) {
  return <View>{children}</View>;
}

export const LocationManager = {
  requestPermissions: jest.fn().mockResolvedValue(true),
  getCurrentPosition: jest.fn().mockResolvedValue(undefined),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  setMinDisplacement: jest.fn(),
};

export function useCurrentPosition() {
  return undefined;
}
