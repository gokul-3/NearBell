# Testing Strategy

Production-ready means testing platform behavior, not only React components.

## Unit tests
Cover:
- Haversine distance
- arrival threshold
- GPS accuracy filtering
- hysteresis
- state machine transitions
- duplicate event suppression
- persistence migrations
- settings validation

Example cases:
- 499 m from destination with 500 m radius → candidate arrival
- 501 m → no arrival
- stale location → no false arrival
- poor accuracy larger than radius → conservative behavior
- duplicate native event → one alarm
- cancelled trip + late event → no alarm
- completed trip + late event → no alarm
- re-arm only after leaving rearm radius

## Integration tests
Test:
- destination selection
- permission flow
- start trip
- persistence
- native event → application event pipeline
- alarm service

## E2E
Use Detox or an equivalent maintained mobile E2E framework.

Critical flows:
1. First launch.
2. Set destination.
3. Start trip.
4. Background app.
5. Simulate/drive location across geofence.
6. Verify alarm.
7. Stop alarm.
8. Verify trip completed.
9. Kill/relaunch app and recover active trip.
10. Deny permissions and recover.
11. Device reboot recovery where supported.
12. Dark mode and large text.
13. Offline map/search failure behavior.

## Device matrix
At minimum test:
- one current Pixel/Android reference device
- one Samsung Android device
- one current iPhone
- one older supported iPhone
- Android with battery saver
- iOS with Low Power Mode
- poor GPS/network
- notification permission denied
- background location denied
- app force-stopped if relevant to platform behavior

## Location simulation
Build a development-only `MockLocationProvider`.
Never ship mock location controls in production.

Support deterministic scenarios:
- stationary
- moving toward destination
- moving away
- noisy GPS
- GPS unavailable
- geofence enter
- geofence duplicate enter
- stale location

## Performance
Measure:
- app launch
- destination search latency
- memory during active trip
- battery impact over a 2-hour simulated trip
- alarm trigger latency
- JS thread responsiveness

## Release gate
No release if:
- active trip can silently disappear
- duplicate alarms occur
- permissions are misleading
- background monitoring is falsely shown as active
- alarm cannot be stopped
- crash occurs on permission transitions
