import type { Destination } from '@domain/location/destination';
import type { LocationSample } from '@domain/location/locationSample';
import type { AlertPolicy } from '@domain/trip/alertPolicy';

export type TripStatus =
  | 'READY'
  | 'ACTIVE'
  | 'PAUSED'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DEGRADED';

export type AlarmState = 'IDLE' | 'RINGING' | 'DISMISSED';

export type Trip = {
  id: string;
  destination: Destination;
  alertPolicy: AlertPolicy;
  status: TripStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  arrivalTriggeredAt?: number;
  lastKnownLocation?: LocationSample;
  lastDistanceMeters?: number;
  alarmState: AlarmState;
};

export function createTrip(params: {
  id: string;
  destination: Destination;
  alertPolicy: AlertPolicy;
  createdAt: number;
}): Trip {
  return {
    id: params.id,
    destination: params.destination,
    alertPolicy: params.alertPolicy,
    status: 'READY',
    createdAt: params.createdAt,
    alarmState: 'IDLE',
  };
}

export type TripEvent =
  | { type: 'START'; startedAt: number }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'CANCEL' }
  | { type: 'ARRIVE'; arrivalTriggeredAt: number }
  | { type: 'COMPLETE'; completedAt: number }
  | { type: 'DEGRADE' }
  | { type: 'RECOVER' };

export class InvalidTripTransitionError extends Error {
  constructor(status: TripStatus, event: TripEvent['type']) {
    super(`Cannot apply event "${event}" to trip in status "${status}"`);
    this.name = 'InvalidTripTransitionError';
  }
}

const ALLOWED_TRANSITIONS: Record<TripEvent['type'], TripStatus[]> = {
  START: ['READY'],
  PAUSE: ['ACTIVE'],
  RESUME: ['PAUSED'],
  CANCEL: ['READY', 'ACTIVE', 'PAUSED', 'DEGRADED'],
  ARRIVE: ['ACTIVE'],
  COMPLETE: ['ARRIVED'],
  DEGRADE: ['ACTIVE', 'PAUSED'],
  RECOVER: ['DEGRADED'],
};

function nextStatus(event: TripEvent): TripStatus {
  switch (event.type) {
    case 'START':
      return 'ACTIVE';
    case 'PAUSE':
      return 'PAUSED';
    case 'RESUME':
      return 'ACTIVE';
    case 'CANCEL':
      return 'CANCELLED';
    case 'ARRIVE':
      return 'ARRIVED';
    case 'COMPLETE':
      return 'COMPLETED';
    case 'DEGRADE':
      return 'DEGRADED';
    case 'RECOVER':
      return 'ACTIVE';
  }
}

/**
 * Applies a single event to a trip, enforcing the state machine in
 * 02-architecture.md. Throws rather than silently no-op-ing, because an
 * illegal transition attempt means the calling use case has a bug (e.g.
 * trying to ARRIVE a trip that isn't ACTIVE).
 */
export function transitionTrip(trip: Trip, event: TripEvent): Trip {
  const allowedFrom = ALLOWED_TRANSITIONS[event.type];
  if (!allowedFrom.includes(trip.status)) {
    throw new InvalidTripTransitionError(trip.status, event.type);
  }

  const status = nextStatus(event);

  switch (event.type) {
    case 'START':
      return { ...trip, status, startedAt: event.startedAt };
    case 'ARRIVE':
      if (trip.arrivalTriggeredAt !== undefined) {
        // Idempotency guard: a duplicate native callback for an
        // already-triggered arrival must never re-fire.
        return trip;
      }
      return { ...trip, status, arrivalTriggeredAt: event.arrivalTriggeredAt };
    case 'COMPLETE':
      return { ...trip, status, completedAt: event.completedAt, alarmState: 'DISMISSED' };
    default:
      return { ...trip, status };
  }
}

export function withLocationUpdate(
  trip: Trip,
  sample: LocationSample,
  distanceMeters: number,
): Trip {
  return { ...trip, lastKnownLocation: sample, lastDistanceMeters: distanceMeters };
}
