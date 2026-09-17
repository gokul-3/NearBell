# Production Release Checklist

## Product
- [ ] Core journey completes in under a minute.
- [ ] Destination search works.
- [ ] Map selection works.
- [ ] Alert distance is understandable.
- [ ] Active trip clearly indicates monitoring.
- [ ] Alarm can always be dismissed.
- [ ] Cancellation works.
- [ ] History works.
- [ ] Settings work.

## Android
- [ ] Current target SDK requirements satisfied.
- [ ] Location permissions correctly declared.
- [ ] Background location flow is compliant.
- [ ] Foreground service type/permission requirements satisfied if used.
- [ ] Notification permission/channel configured.
- [ ] Geofence receiver tested.
- [ ] Battery optimization behavior documented.
- [ ] Doze/background limits tested.
- [ ] Force-stop behavior documented and handled honestly.
- [ ] Play Console background-location declaration prepared if required.

## iOS
- [ ] Deployment target pinned.
- [ ] Location usage descriptions are accurate.
- [ ] Background capabilities configured only as needed.
- [ ] Region monitoring tested.
- [ ] Notification permissions configured.
- [ ] Low Power Mode tested.
- [ ] App termination/relaunch behavior tested.
- [ ] App Store privacy details prepared.
- [ ] Background-location justification prepared if requested by review.

## Reliability
- [ ] Duplicate callbacks do not duplicate alarms.
- [ ] Stale GPS does not falsely trigger.
- [ ] Poor GPS accuracy handled.
- [ ] Offline core alarm path works.
- [ ] App restart recovery works where supported.
- [ ] Device reboot behavior is tested.
- [ ] Alarm sound/vibration works on physical devices.

## UX/accessibility
- [ ] Screen reader labels.
- [ ] Large text.
- [ ] Dark mode.
- [ ] Reduced motion.
- [ ] Touch target sizes.
- [ ] Error recovery.
- [ ] Permission education.
- [ ] No misleading claims about exact arrival.

## Security/privacy
- [ ] No secrets in repo.
- [ ] No raw location in analytics.
- [ ] Privacy policy published.
- [ ] Data deletion works.
- [ ] Production logging scrubbed.

## Build/release
- [ ] Debug logging disabled/reduced.
- [ ] Crash reporting configured.
- [ ] Source maps uploaded securely if used.
- [ ] Android signed release tested.
- [ ] iOS archive/TestFlight tested.
- [ ] Versioning configured.
- [ ] CI passes.
- [ ] Release notes prepared.
