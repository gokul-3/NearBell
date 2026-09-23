import { NativeEventEmitter, type EventSubscription } from 'react-native';
import NativeNearBellLocation, { type NativeLocationSample } from './specs/NativeNearBellLocation';

export type ArrivalEventPayload = Partial<NativeLocationSample> & {
  tripId: string;
  source: 'geofence_enter' | 'location_sample';
};

export type LocationSampleEventPayload = NativeLocationSample & { tripId: string };

export type MonitoringErrorEventPayload = { tripId: string; code: string; message: string };

const emitter = NativeNearBellLocation ? new NativeEventEmitter(NativeNearBellLocation) : null;

export function subscribeArrivalEvent(
  listener: (payload: ArrivalEventPayload) => void,
): EventSubscription | null {
  return emitter?.addListener('onArrivalEvent', (payload: object) => listener(payload as ArrivalEventPayload)) ?? null;
}

export function subscribeLocationSample(
  listener: (payload: LocationSampleEventPayload) => void,
): EventSubscription | null {
  return (
    emitter?.addListener('onLocationSample', (payload: object) => listener(payload as LocationSampleEventPayload)) ??
    null
  );
}

export function subscribeMonitoringError(
  listener: (payload: MonitoringErrorEventPayload) => void,
): EventSubscription | null {
  return (
    emitter?.addListener('onMonitoringError', (payload: object) =>
      listener(payload as MonitoringErrorEventPayload),
    ) ?? null
  );
}
