# Product Requirements

## 1. Problem
People travelling by bus, train, cab, or car may fall asleep, get distracted, or miss a destination. The app provides a location-triggered alarm.

## 2. Primary user journey
1. Open app.
2. App obtains current location when needed.
3. Search for or select destination on a map.
4. Choose alert distance: 100 m, 250 m, 500 m, 1 km, 2 km, or custom.
5. Optionally choose sound/vibration behavior.
6. Tap Start Trip.
7. App enters active-trip mode.
8. App monitors location in the background.
9. When the destination alert condition is met, play a loud local alarm and show a full-screen/high-priority alert where platform rules allow.
10. User taps Stop Alarm.
11. Trip is marked completed.
12. App stops active location monitoring.

## 3. MVP features
### Destination
- Search destination by place/address.
- Pick a point by moving map or long press.
- Show destination name, coordinates, and selected radius.
- Optional "Use current location" for destination.
- Validate that destination is not obviously identical to current location.

### Trip
- One active trip at a time.
- Start, pause, resume, cancel.
- Active trip screen shows:
  - destination
  - distance remaining
  - selected alert radius
  - current location accuracy
  - trip status
  - cancel button
- Persist active trip so the app can recover after process death/relaunch where platform APIs permit.

### Alarm
- Local notification.
- Sound + vibration.
- Alarm sound is user-selectable from bundled sounds.
- Snooze is optional; default behavior should stop the alarm and complete the trip.
- Prevent duplicate firing with an idempotency guard.
- Provide "Test alarm" in settings.

### History
- Recent completed/cancelled trips.
- Destination, date, alert distance, result.
- Delete history.

### Settings
- Default alert distance.
- Alarm volume behavior/instructions.
- Vibration on/off.
- Default alarm sound.
- Theme: system/light/dark.
- Privacy page.
- Permissions/status page.
- Test alarm.
- App version.

## 4. Post-MVP
- Saved places.
- Recurring trips.
- Public-transport-aware route alerts.
- Route-aware "before stop" alert rather than straight-line radius.
- Multiple simultaneous destination alerts.
- Widgets/quick actions.
- Wearable support.
- Optional account/cloud sync.

## 5. Explicit non-goals for MVP
- Turn-by-turn navigation.
- Continuous route recording.
- Social location sharing.
- User accounts.
- Advertising SDKs.
- Server-side location storage.
- AI features.

## 6. Product principles
- The app should be useful in under 15 seconds.
- Never request permissions before explaining why.
- Never hide that location is being used in the background.
- Every active-trip state must be recoverable or clearly terminated.
- Do not collect location history unless the user explicitly enables a future feature that needs it.
