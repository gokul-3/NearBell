# Data Model

## Storage philosophy
Core alarm must work offline. Do not store raw continuous location history.

## Entities

### Trip
```ts
type Trip = {
  id: string;
  destination: Destination;
  alertPolicy: AlertPolicy;
  status: 'READY' | 'ACTIVE' | 'PAUSED' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED' | 'DEGRADED';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  arrivalTriggeredAt?: number;
  lastKnownLocation?: LocationSample;
  lastDistanceMeters?: number;
  alarmState: 'IDLE' | 'RINGING' | 'DISMISSED';
}
```

### Settings
```ts
type Settings = {
  defaultRadiusMeters: number;
  vibrationEnabled: boolean;
  alarmSoundId: string;
  theme: 'system' | 'light' | 'dark';
}
```

### Permission status
Keep this as runtime state, not sensitive permanent history:
```ts
type PermissionStatus = {
  foregroundLocation: 'unknown' | 'granted' | 'denied' | 'restricted';
  backgroundLocation: 'unknown' | 'granted' | 'denied' | 'restricted';
  notifications: 'unknown' | 'granted' | 'denied' | 'restricted';
}
```

## Persistence
Persist:
- settings
- current active trip
- minimal trip history
- alarm state

Do not persist:
- continuous location samples
- address-book-like user data
- unnecessary device identifiers

## Schema versioning
Store:
```ts
{ schemaVersion: number, data: ... }
```
Every persisted model change must have a migration.

## Data retention
Default history retention can be configurable. MVP can retain the most recent 50 trips. Allow user to delete history.
