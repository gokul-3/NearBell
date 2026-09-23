import { env } from '@app/config/env';
import { logger } from '@infrastructure/logging/Logger';

/**
 * 06-technical-implementation.md's recommended privacy-safe event set.
 * Keeping this a closed union (rather than `string`) is what stops a raw
 * coordinate or destination address from accidentally becoming an event
 * name or slipping into `properties` at a new call site.
 */
export type DestinationSelectedSource = 'search' | 'map_pin' | 'current_location';

export type AnalyticsEvent =
  | { name: 'app_opened' }
  | { name: 'destination_selected'; properties?: { source: DestinationSelectedSource } }
  | { name: 'trip_started'; properties?: { radiusMeters: number } }
  | { name: 'trip_cancelled' }
  | { name: 'trip_completed' }
  | { name: 'alarm_triggered'; properties?: { source: 'location_sample' | 'geofence_enter' } };

/**
 * Provider-agnostic `track()` per spec. No-op unless the user/build has
 * opted in via ANALYTICS_ENABLED — no destination name, address, or
 * coordinate ever appears in an event's properties by construction, since
 * AnalyticsEvent's properties types don't carry them.
 */
export function track(event: AnalyticsEvent): void {
  if (!env.analyticsEnabled) {
    return;
  }
  logger.debug(`analytics: ${event.name}`, 'properties' in event ? event.properties : undefined);
}
