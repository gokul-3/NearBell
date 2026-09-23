export type AlarmPayload = {
  tripId: string;
  destinationName: string;
  vibrationEnabled: boolean;
};

/**
 * Boundary to the platform's local alarm mechanism — a high-priority
 * notification with looping sound + vibration, playable in the
 * foreground, background, or locked-screen. Must work with no network
 * (04-location-engine.md: "The alarm layer must be local").
 */
export interface AlarmService {
  requestPermissions(): Promise<void>;
  testAlarm(): Promise<void>;
  triggerAlarm(payload: AlarmPayload): Promise<void>;
  stopAlarm(): Promise<void>;
}
