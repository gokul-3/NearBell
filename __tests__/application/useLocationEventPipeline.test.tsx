import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { useLocationEventPipeline } from '../../src/application/useCases/useLocationEventPipeline';
import { useTripStore } from '../../src/state/tripStore';
import { createTrip, transitionTrip } from '../../src/domain/trip/trip';
import type { Destination } from '../../src/domain/location/destination';

type Listener = (payload: any) => void;

let locationSampleListener: Listener | undefined;
let arrivalListener: Listener | undefined;

jest.mock('../../src/infrastructure/location/locationEvents', () => ({
  subscribeLocationSample: (listener: Listener) => {
    locationSampleListener = listener;
    return { remove: jest.fn() };
  },
  subscribeArrivalEvent: (listener: Listener) => {
    arrivalListener = listener;
    return { remove: jest.fn() };
  },
  subscribeMonitoringError: () => ({ remove: jest.fn() }),
}));

const mockTriggerAlarm = jest.fn().mockResolvedValue(undefined);

jest.mock('../../src/infrastructure/alarm/NearBellAlarmService', () => ({
  alarmService: {
    triggerAlarm: (...args: unknown[]) => mockTriggerAlarm(...args),
    stopAlarm: jest.fn().mockResolvedValue(undefined),
    requestPermissions: jest.fn().mockResolvedValue(undefined),
    testAlarm: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../src/infrastructure/location/NearBellLocationService', () => ({
  locationService: {
    startTripMonitoring: jest.fn().mockResolvedValue(undefined),
  },
  toLocationSample: (native: any) => ({
    latitude: native.latitude,
    longitude: native.longitude,
    accuracyMeters: native.hasAccuracy ? native.accuracyMeters : null,
    altitudeMeters: native.hasAltitude ? native.altitudeMeters : null,
    speedMps: native.hasSpeed ? native.speedMps : null,
    headingDegrees: native.hasHeading ? native.headingDegrees : null,
    timestamp: native.timestamp,
    source: native.source ?? 'unknown',
  }),
}));

const DESTINATION: Destination = { id: 'dest-1', name: 'Central Station', latitude: 0, longitude: 0 };
const METERS_PER_DEGREE_LATITUDE = 111_320;

function makeActiveTrip() {
  const trip = createTrip({
    id: 'trip-1',
    destination: DESTINATION,
    alertPolicy: { radiusMeters: 500 },
    createdAt: 1_000,
  });
  return transitionTrip(trip, { type: 'START', startedAt: 2_000 });
}

function nativeSampleAtDistance(tripId: string, meters: number, timestamp: number) {
  return {
    tripId,
    latitude: meters / METERS_PER_DEGREE_LATITUDE,
    longitude: 0,
    hasAccuracy: true,
    accuracyMeters: 10,
    hasAltitude: false,
    hasSpeed: false,
    hasHeading: false,
    timestamp,
    source: 'gps',
  };
}

function PipelineHost() {
  useLocationEventPipeline();
  return null;
}

describe('useLocationEventPipeline — native event to application pipeline and alarm service', () => {
  beforeEach(() => {
    mockTriggerAlarm.mockClear();
    locationSampleListener = undefined;
    arrivalListener = undefined;
    useTripStore.setState({ activeTrip: null, history: [] });
  });

  it('fires the alarm once when consecutive in-radius samples cross into ARRIVED, and suppresses a duplicate late event', async () => {
    const trip = makeActiveTrip();
    useTripStore.setState({ activeTrip: trip });

    await act(async () => {
      ReactTestRenderer.create(<PipelineHost />);
    });
    expect(locationSampleListener).toBeDefined();

    await act(async () => {
      locationSampleListener!(nativeSampleAtDistance(trip.id, 100, Date.now()));
    });
    expect(useTripStore.getState().activeTrip?.status).toBe('ACTIVE');
    expect(mockTriggerAlarm).not.toHaveBeenCalled();

    await act(async () => {
      locationSampleListener!(nativeSampleAtDistance(trip.id, 100, Date.now() + 1000));
    });
    expect(useTripStore.getState().activeTrip?.status).toBe('ARRIVED');
    expect(mockTriggerAlarm).toHaveBeenCalledTimes(1);
    expect(mockTriggerAlarm).toHaveBeenCalledWith(
      expect.objectContaining({ tripId: trip.id, destinationName: 'Central Station', vibrationEnabled: true }),
    );

    await act(async () => {
      locationSampleListener!(nativeSampleAtDistance(trip.id, 100, Date.now() + 2000));
    });
    expect(mockTriggerAlarm).toHaveBeenCalledTimes(1);
  });

  it('a geofence ENTER event triggers the alarm immediately', async () => {
    const trip = makeActiveTrip();
    useTripStore.setState({ activeTrip: trip });

    await act(async () => {
      ReactTestRenderer.create(<PipelineHost />);
    });
    expect(arrivalListener).toBeDefined();

    await act(async () => {
      arrivalListener!({ tripId: trip.id, source: 'geofence_enter' });
    });

    expect(useTripStore.getState().activeTrip?.status).toBe('ARRIVED');
    expect(mockTriggerAlarm).toHaveBeenCalledTimes(1);
  });

  it('ignores events for a trip other than the current active one', async () => {
    const trip = makeActiveTrip();
    useTripStore.setState({ activeTrip: trip });

    await act(async () => {
      ReactTestRenderer.create(<PipelineHost />);
    });

    await act(async () => {
      locationSampleListener!(nativeSampleAtDistance('some-other-trip', 50, Date.now()));
    });

    expect(useTripStore.getState().activeTrip?.status).toBe('ACTIVE');
    expect(mockTriggerAlarm).not.toHaveBeenCalled();
  });
});
