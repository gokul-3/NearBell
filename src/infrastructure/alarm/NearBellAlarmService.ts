import { AppError } from '@application/errors';
import NativeNearBellAlarm from './specs/NativeNearBellAlarm';
import type { AlarmPayload, AlarmService } from './AlarmService';

export class NearBellAlarmService implements AlarmService {
  private requireModule() {
    if (!NativeNearBellAlarm) {
      throw new AppError('UNSUPPORTED_PLATFORM', 'Native alarm module is unavailable on this platform');
    }
    return NativeNearBellAlarm;
  }

  async requestPermissions(): Promise<void> {
    try {
      await this.requireModule().requestPermissions();
    } catch (error) {
      throw error instanceof AppError
        ? error
        : new AppError('NOTIFICATION_PERMISSION_DENIED', error instanceof Error ? error.message : String(error));
    }
  }

  async testAlarm(): Promise<void> {
    try {
      await this.requireModule().testAlarm(true);
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('ALARM_FAILED', String(error));
    }
  }

  async triggerAlarm(payload: AlarmPayload): Promise<void> {
    try {
      await this.requireModule().triggerAlarm(payload.tripId, payload.destinationName, payload.vibrationEnabled);
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('ALARM_FAILED', String(error));
    }
  }

  async stopAlarm(): Promise<void> {
    try {
      await this.requireModule().stopAlarm();
    } catch (error) {
      throw error instanceof AppError ? error : new AppError('ALARM_FAILED', String(error));
    }
  }
}

export const alarmService = new NearBellAlarmService();
