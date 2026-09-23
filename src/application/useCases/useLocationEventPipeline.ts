import { useEffect } from 'react';
import { useTripStore } from '@state/tripStore';
import { useSettingsStore } from '@state/settingsStore';
import { transitionTrip, type Trip } from '@domain/trip/trip';
import type { ArrivalSource } from '@domain/trip/arrivalEvaluator';
import type { LocationSample } from '@domain/location/locationSample';
import {
  subscribeArrivalEvent,
  subscribeLocationSample,
  subscribeMonitoringError,
} from '@infrastructure/location/locationEvents';
import { locationService, toLocationSample } from '@infrastructure/location/NearBellLocationService';
import { alarmService } from '@infrastructure/alarm/NearBellAlarmService';
import { logger } from '@infrastructure/logging/Logger';
import { recordError } from '@infrastructure/logging/CrashReporter';
import { track } from '@infrastructure/analytics/Analytics';
import { handleLocationEvent } from './handleLocationEvent';

function applyLocationEvent(trip: Trip, sample: LocationSample, source: ArrivalSource): void {
  const updated = handleLocationEvent(trip, sample, source, Date.now());
  useTripStore.getState().setActiveTrip(updated);

  const justArrived = trip.status === 'ACTIVE' && updated.status === 'ARRIVED';
  if (justArrived) {
    track({ name: 'alarm_triggered', properties: { source } });
    alarmService
      .triggerAlarm({
        tripId: updated.id,
        destinationName: updated.destination.name,
        vibrationEnabled: useSettingsStore.getState().vibrationEnabled,
      })
      .catch((error) => {
        recordError(error instanceof Error ? error : new Error(String(error)), { where: 'triggerAlarm' });
      });
  }
}

/**
 * Mounted once at the app root. Subscribes to native location/geofence
 * events for the lifetime of the app and feeds them through the
 * application/domain pipeline, and reconciles native monitoring on launch
 * if a trip was already ACTIVE when the process (re)started — the native
 * foreground service/geofence registration doesn't survive process death,
 * so this re-establishes them from the persisted trip.
 */
function reconcileNativeMonitoring(): void {
  const activeTrip = useTripStore.getState().activeTrip;
  if (!activeTrip || activeTrip.status !== 'ACTIVE') {
    return;
  }
  locationService
    .startTripMonitoring({
      tripId: activeTrip.id,
      destination: activeTrip.destination,
      alertPolicy: activeTrip.alertPolicy,
    })
    .catch((error) => {
      logger.warn('reconcileNativeMonitoring: startTripMonitoring rejected', { error: String(error) });
      const current = useTripStore.getState().activeTrip;
      if (current && current.id === activeTrip.id && current.status === 'ACTIVE') {
        useTripStore.getState().setActiveTrip(transitionTrip(current, { type: 'DEGRADE' }));
      }
    });
}

export function useLocationEventPipeline(): void {
  useEffect(() => {
    // zustand's persist rehydration is asynchronous even for synchronous
    // storage — reading the store synchronously here can race ahead of it
    // and see the pre-hydration default (activeTrip: null), silently
    // skipping reconciliation. Wait for hydration to actually finish.
    if (useTripStore.persist.hasHydrated()) {
      reconcileNativeMonitoring();
    } else {
      const unsubscribe = useTripStore.persist.onFinishHydration(() => {
        unsubscribe();
        reconcileNativeMonitoring();
      });
    }

    const locationSub = subscribeLocationSample((payload) => {
      const trip = useTripStore.getState().activeTrip;
      if (!trip || trip.id !== payload.tripId) {
        return;
      }
      applyLocationEvent(trip, toLocationSample(payload), 'location_sample');
    });

    const arrivalSub = subscribeArrivalEvent((payload) => {
      const trip = useTripStore.getState().activeTrip;
      if (!trip || trip.id !== payload.tripId) {
        return;
      }

      const sample: LocationSample =
        payload.latitude !== undefined && payload.longitude !== undefined
          ? {
              latitude: payload.latitude,
              longitude: payload.longitude,
              accuracyMeters: payload.hasAccuracy ? (payload.accuracyMeters ?? null) : null,
              altitudeMeters: payload.hasAltitude ? (payload.altitudeMeters ?? null) : null,
              speedMps: payload.hasSpeed ? (payload.speedMps ?? null) : null,
              headingDegrees: payload.hasHeading ? (payload.headingDegrees ?? null) : null,
              timestamp: payload.timestamp ?? Date.now(),
              source: 'fused',
            }
          : {
              // No location attached to this geofence transition on this
              // device. The destination's own coordinates are a safe
              // proxy — a geofence ENTER inherently means "at/inside the
              // radius", which this represents (distance ~0).
              latitude: trip.destination.latitude,
              longitude: trip.destination.longitude,
              accuracyMeters: null,
              timestamp: Date.now(),
              source: 'unknown',
            };

      applyLocationEvent(trip, sample, 'geofence_enter');
    });

    const errorSub = subscribeMonitoringError((payload) => {
      logger.warn('onMonitoringError', { tripId: payload.tripId, code: payload.code });
      const trip = useTripStore.getState().activeTrip;
      if (!trip || trip.id !== payload.tripId) {
        return;
      }
      if (trip.status === 'ACTIVE' || trip.status === 'PAUSED') {
        useTripStore.getState().setActiveTrip(transitionTrip(trip, { type: 'DEGRADE' }));
      }
    });

    return () => {
      locationSub?.remove();
      arrivalSub?.remove();
      errorSub?.remove();
    };
  }, []);
}
