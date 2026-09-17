/**
 * Stable error taxonomy (06-technical-implementation.md). Each code maps to
 * a developer log line, a user-facing message, and a recovery action —
 * callers should switch on `code`, never on `message`.
 */
export type AppErrorCode =
  | 'LOCATION_PERMISSION_DENIED'
  | 'BACKGROUND_LOCATION_DENIED'
  | 'NOTIFICATION_PERMISSION_DENIED'
  | 'LOCATION_UNAVAILABLE'
  | 'LOCATION_STALE'
  | 'GEOFENCE_REGISTRATION_FAILED'
  | 'ALARM_FAILED'
  | 'STORAGE_FAILED'
  | 'MAP_SEARCH_FAILED'
  | 'NETWORK_UNAVAILABLE'
  | 'UNSUPPORTED_PLATFORM';

export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = 'AppError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
