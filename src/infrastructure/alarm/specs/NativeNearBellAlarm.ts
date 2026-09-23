import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  requestPermissions(): Promise<void>;
  testAlarm(vibrationEnabled: boolean): Promise<void>;
  triggerAlarm(tripId: string, destinationName: string, vibrationEnabled: boolean): Promise<void>;
  stopAlarm(): Promise<void>;
}

export default TurboModuleRegistry.get<Spec>('NearBellAlarm');
