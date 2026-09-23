import { env } from '@app/config/env';
import { logger } from './Logger';

/**
 * Provider-agnostic seam for a real crash reporting SDK (e.g. Sentry,
 * Crashlytics). No such SDK is wired up here — adding one is a product/infra
 * decision (new dependency, DSN/API key, data-processing agreement) that
 * belongs to the team, not something to bolt in silently. Until then this
 * always logs locally, and additionally calls `sink` when
 * CRASH_REPORTING_ENABLED=true so a real provider can be plugged in by
 * replacing `sink` alone.
 */
let sink: ((error: Error, context?: Record<string, unknown>) => void) | null = null;

export function setCrashReportingSink(next: typeof sink): void {
  sink = next;
}

export function recordError(error: Error, context?: Record<string, unknown>): void {
  logger.error(error.message, { name: error.name, stack: error.stack, ...context });
  if (env.crashReportingEnabled && sink) {
    sink(error, context);
  }
}
