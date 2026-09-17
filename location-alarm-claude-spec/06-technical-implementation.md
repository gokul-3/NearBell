# Technical Implementation

## Project bootstrap
Use a React Native TypeScript project compatible with current Android/iOS tooling. Prefer a native-capable React Native setup rather than a managed-only approach if the selected location/alarm libraries require native modules.

Before coding, pin exact dependency versions in `package.json` and lockfile.

## Required packages/categories
Select maintained libraries for:
- navigation
- state management
- storage
- map rendering
- geocoding/place search
- permissions
- local notifications
- native background location/geofencing if a maintained solution meets requirements

Do not blindly copy package names from this document. Validate each library's current maintenance status, platform support, New Architecture compatibility, licensing, and background behavior before adoption.

## Map abstraction
Create:
```ts
interface MapProvider {
  search(query: string): Promise<PlaceSearchResult[]>;
  reverseGeocode(latitude: number, longitude: number): Promise<Place>;
}
```
The UI should not directly depend on a specific map vendor.

## Location abstraction
```ts
interface LocationService {
  getCurrentLocation(): Promise<LocationSample>;
  startTripMonitoring(config: TripMonitoringConfig): Promise<void>;
  pauseTripMonitoring(): Promise<void>;
  resumeTripMonitoring(): Promise<void>;
  stopTripMonitoring(): Promise<void>;
  getPermissionStatus(): Promise<PermissionStatus>;
}
```

## Geofence abstraction
```ts
interface GeofenceService {
  registerDestination(config: DestinationGeofence): Promise<void>;
  removeDestination(id: string): Promise<void>;
  reconcile(): Promise<void>;
}
```

## Alarm abstraction
```ts
interface AlarmService {
  requestPermissions(): Promise<void>;
  testAlarm(): Promise<void>;
  triggerAlarm(payload: AlarmPayload): Promise<void>;
  stopAlarm(): Promise<void>;
}
```

## Event pipeline
```text
Native location/geofence event
        ↓
Infrastructure adapter
        ↓
Application event handler
        ↓
Domain arrival evaluator
        ↓
Trip state update
        ↓
Persist state
        ↓
AlarmService.triggerAlarm()
        ↓
UI observes state + OS notification
```

## Idempotency
Use a unique trip ID + alarm event key.
Before triggering:
- load current trip state
- if `arrivalTriggeredAt` exists, ignore
- atomically set it
- persist
- trigger alarm
- record alarm state

Design this carefully because native callbacks can arrive more than once.

## Permission UX
Never request all permissions on launch.
Request:
1. foreground location when destination setup needs current location
2. notifications before starting a trip
3. background location only when required for the active-trip experience and after explanation

If permission is denied twice or permanently denied, route to a Permission Help screen with a Settings deep-link where supported.

## Android
Implement:
- notification channel for alarm
- location permissions
- background location flow as required by target Android version
- foreground location service only when justified
- geofence receiver
- reboot/recovery reconciliation if required
- battery optimization guidance
- notification permission for supported Android versions

Do not attempt to bypass OS restrictions.

## iOS
Implement:
- location authorization flow
- notification permission
- region monitoring
- background location capability only where needed
- state restoration/reconciliation
- background activity/location APIs appropriate for the chosen iOS deployment target

## Maps
Keep API keys out of source control.
Use:
- Android manifest/secure build configuration
- iOS plist/build configuration
- separate development/staging/production keys
- provider restrictions where available

## Error taxonomy
Create stable errors:
```text
LOCATION_PERMISSION_DENIED
BACKGROUND_LOCATION_DENIED
NOTIFICATION_PERMISSION_DENIED
LOCATION_UNAVAILABLE
LOCATION_STALE
GEOFENCE_REGISTRATION_FAILED
ALARM_FAILED
STORAGE_FAILED
MAP_SEARCH_FAILED
NETWORK_UNAVAILABLE
UNSUPPORTED_PLATFORM
```

Map each to:
- developer log
- user-facing message
- recovery action

## Logging
Create structured logs with levels:
DEBUG / INFO / WARN / ERROR

Never log:
- exact user location in production analytics
- API keys
- tokens
- personal addresses unless explicitly needed for local debugging and then scrubbed.

## Analytics
Make analytics provider-agnostic:
```ts
track(eventName, properties)
```
Recommended privacy-safe events:
- app_opened
- destination_selected
- trip_started
- trip_cancelled
- trip_completed
- alarm_triggered
- alarm_dismissed
- permission_denied
- monitoring_degraded

Do not send raw latitude/longitude.
