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

export type ErrorTaxonomyEntry = {
  /** Shown to the user — never a raw error message or stack. */
  userMessage: string;
  /** What the user can do about it, surfaced alongside userMessage. */
  recovery: string;
};

/**
 * 06-technical-implementation.md: each code maps to a developer log (the
 * AppError itself, handled by the logger), a user-facing message, and a
 * recovery action. Centralized here so screens don't each invent their own
 * copy for the same code.
 */
export const ERROR_TAXONOMY: Record<AppErrorCode, ErrorTaxonomyEntry> = {
  LOCATION_PERMISSION_DENIED: {
    userMessage: 'NearBell needs location access to monitor your trip.',
    recovery: 'Grant location access, then try again.',
  },
  BACKGROUND_LOCATION_DENIED: {
    userMessage: "NearBell can't monitor your trip while the app is closed without background location access.",
    recovery: 'Allow "all the time" location access in system settings.',
  },
  NOTIFICATION_PERMISSION_DENIED: {
    userMessage: "NearBell can't alert you without notification permission.",
    recovery: 'Enable notifications for NearBell in system settings.',
  },
  LOCATION_UNAVAILABLE: {
    userMessage: "Couldn't get your current location.",
    recovery: 'Check that location services are on, then try again.',
  },
  LOCATION_STALE: {
    userMessage: 'Your last known location is out of date.',
    recovery: 'Move somewhere with a clearer GPS signal, or try again.',
  },
  GEOFENCE_REGISTRATION_FAILED: {
    userMessage: "Couldn't set up destination monitoring on this device.",
    recovery: 'Try starting the trip again. If it keeps failing, restart the app.',
  },
  ALARM_FAILED: {
    userMessage: "Couldn't play the alarm on this device.",
    recovery: 'Check media volume and try the test alarm in Settings.',
  },
  STORAGE_FAILED: {
    userMessage: "Couldn't save your data on this device.",
    recovery: 'Free up device storage and try again.',
  },
  MAP_SEARCH_FAILED: {
    userMessage: "Couldn't search for that place.",
    recovery: 'Check your connection and try again.',
  },
  NETWORK_UNAVAILABLE: {
    userMessage: "You're offline.",
    recovery: 'Reconnect and try again. The alarm itself still works offline.',
  },
  UNSUPPORTED_PLATFORM: {
    userMessage: 'This feature is not available on this device.',
    recovery: 'No action available.',
  },
};

export function describeError(error: unknown): ErrorTaxonomyEntry {
  if (isAppError(error)) {
    return ERROR_TAXONOMY[error.code];
  }
  return { userMessage: 'Something went wrong.', recovery: 'Try again.' };
}
