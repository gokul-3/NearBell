# Architecture

## 1. Architecture choice
Use React Native + TypeScript with native modules for platform-critical location/alarm behavior.

Recommended:
- React Native (latest stable compatible with project requirements)
- TypeScript strict mode
- React Navigation
- Zustand for app/session state
- TanStack Query only if/when remote APIs are introduced
- React Native MMKV or AsyncStorage for small persisted settings; prefer MMKV for trip/session state if compatible with the chosen RN version
- Native location/geofence layer rather than trying to simulate background execution in JavaScript
- Native local notifications/alarm capabilities
- Map provider behind an abstraction

Do not build the core alarm around a web-only map or JS timer.

## 2. Layering
`Presentation → Application → Domain → Infrastructure`

### Presentation
Screens, components, navigation, accessibility, theme.

### Application
Use cases:
- SearchDestination
- SelectDestination
- ConfigureTrip
- StartTrip
- PauseTrip
- ResumeTrip
- CancelTrip
- HandleLocationEvent
- TriggerDestinationAlarm
- CompleteTrip
- RecoverActiveTrip
- UpdatePermissions

### Domain
Pure TypeScript:
- Trip
- Destination
- AlertPolicy
- LocationSample
- TripStatus
- AlarmState
- PermissionState
- Distance calculations
- Arrival decision rules

Domain code must be unit-testable without React Native.

### Infrastructure
- LocationAdapter
- GeofenceAdapter
- NotificationAdapter
- AlarmAudioAdapter
- StorageAdapter
- MapAdapter
- PermissionAdapter
- AppLifecycleAdapter

## 3. Dependency rule
Domain must not import React Native, Expo, map SDKs, notification SDKs, or platform APIs.

Application layer depends on domain interfaces.

Infrastructure implements interfaces.

Presentation calls application services/hooks, not native APIs directly.

## 4. Suggested directory
```text
src/
  app/
    App.tsx
    navigation/
    providers/
  domain/
    trip/
    location/
    alarm/
    permissions/
    shared/
  application/
    useCases/
    services/
  infrastructure/
    location/
    geofence/
    notifications/
    alarm/
    storage/
    maps/
    permissions/
  presentation/
    screens/
    components/
    hooks/
    theme/
    assets/
  state/
    tripStore.ts
    settingsStore.ts
  utils/
  types/
__tests__/
e2e/
android/
ios/
docs/
```

## 5. Core state machine
Trip states:
`IDLE → CONFIGURING → READY → ACTIVE → ARRIVED → COMPLETED`

Alternative terminal:
`ACTIVE → CANCELLED`

Temporary:
`ACTIVE → PAUSED → ACTIVE`

Error/recovery:
`ACTIVE → DEGRADED`

Rules:
- Only READY can transition to ACTIVE.
- Only ACTIVE can trigger ARRIVED.
- Alarm firing must atomically mark `arrivalTriggered=true`.
- Completion must stop location monitoring.
- Cancel must remove geofence/background tracking.
- Relaunch must inspect persisted state and platform monitoring registrations.

## 6. Location strategy
Use a hybrid strategy:
1. Register a destination geofence for low-power proximity detection.
2. While the trip is active, use higher-frequency location updates when needed for better UX and verification.
3. Increase precision/frequency when the user is approaching the destination.
4. Stop continuous updates after completion/cancellation.
5. Never depend solely on a JS interval while the app is backgrounded.

Android supports geofencing with circular latitude/longitude/radius regions; background delivery has latency limitations, so the product must tolerate late alerts. Android also has foreground-service support for user-visible location work. See `04-location-engine.md`.
iOS supports region monitoring and background location sessions; the OS can wake/relaunch the app for monitored region events. See `04-location-engine.md`.
