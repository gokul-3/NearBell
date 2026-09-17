# Location & Alarm Engine

## Goal
Deliver the alert reliably while minimizing battery usage and respecting Android/iOS background restrictions.

## Critical principle
The alarm condition is a domain decision, while actual background execution is platform infrastructure.

## Location model
```ts
type LocationSample = {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  altitudeMeters?: number | null;
  speedMps?: number | null;
  headingDegrees?: number | null;
  timestamp: number;
  source: 'gps' | 'network' | 'fused' | 'unknown';
}
```

## Destination
```ts
type Destination = {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
}
```

## Alert policy
```ts
type AlertPolicy = {
  radiusMeters: number;
  minimumAccuracyMeters?: number;
  requireConsecutiveSamples?: number;
  rearmRadiusMeters?: number;
}
```

## Arrival decision
Do not trigger solely on `distance <= radius` with one noisy sample.

Recommended MVP algorithm:
1. Ignore obviously invalid coordinates.
2. Compute straight-line distance using the Haversine formula.
3. Compare GPS accuracy to the selected radius.
4. If distance <= radius, consider a candidate arrival.
5. Require one of:
   - geofence ENTER event, or
   - two sufficiently recent location samples inside the radius, depending on platform behavior.
6. Apply hysteresis:
   - trigger at configured radius
   - after user says "not there", require leaving the re-arm radius before another trigger.
7. Make trigger idempotent.

The system should never repeatedly fire because multiple callbacks represent the same transition.

## Geofencing
### Android
Use Android Geofencing APIs for the destination boundary. Android documents a 100-geofence-per-app-per-device-user limit. Background geofence delivery can have latency, especially under background location limits; the product must treat the alert as approximate rather than exact. citeturn0search12

For an active trip that needs more visible/continuous tracking, Android foreground services can run user-visible work and show a persistent notification. A location foreground service requires appropriate location permission and has additional platform restrictions. citeturn0search13turn0search14

### iOS
Use Core Location region/condition monitoring for the destination. iOS can monitor geographic regions and wake/relaunch the app when a monitored condition is satisfied, subject to platform conditions. citeturn0search1turn0search9

For more continuous background updates, configure the required background location capability and use the appropriate Core Location background session/update mechanism. Apple explicitly recommends only using background location when the feature requires it. citeturn0search0turn0search3

iOS region monitoring has a platform limit of 20 monitored conditions, so MVP should keep only the active destination registered. citeturn0search1

## Battery strategy
- No permanent location tracking.
- Start monitoring only for an active trip.
- Use geofence as the low-power baseline.
- Use higher-frequency updates only during active trip UX or when approaching.
- Stop services immediately after completion/cancellation.
- Request the lowest useful accuracy.
- Increase accuracy only when necessary.

Apple recommends choosing the most power-efficient location service and adjusting desired accuracy/distance filters to reduce energy use. citeturn0search4turn0search5

## Alarm execution
The alarm layer must be local.
Do not require network access to trigger the core alarm.

Implement:
- local notification
- alarm audio
- vibration
- high-priority notification channel on Android
- appropriate iOS notification configuration
- alarm state persistence
- duplicate-event suppression
- test alarm

The alarm UI must explain that exact timing can vary with device location accuracy and OS background behavior.

## Failure handling
If location is unavailable:
- show status
- keep geofence if valid
- retry through platform APIs
- do not spin a JS polling loop
- offer a notification explaining the issue if user action is required

If permissions are revoked during an active trip:
- persist degraded state
- stop unsupported operations
- notify user with actionable instructions

If the app process is killed:
- rely on native registered geofence/background mechanisms
- restore persisted trip state on next launch
- reconcile native registration with local state

If device reboots:
- register for boot/relaunch recovery where platform policy permits
- reconcile active trip state
- if impossible, mark trip as needing restart rather than falsely claiming monitoring is active.

## Distance
Use a well-tested Haversine implementation in the domain layer.

Important: straight-line distance is not route distance. MVP should label the value as approximate distance/proximity. Route-aware distance is post-MVP.
