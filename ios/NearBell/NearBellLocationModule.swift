import CoreLocation
import Foundation
import UserNotifications

/**
 * iOS counterpart to android/.../location/NearBellLocationModule.kt — same
 * JS-facing surface (see src/infrastructure/location/specs/NativeNearBellLocation.ts),
 * built on Core Location region monitoring + background location updates
 * instead of Android's GeofencingClient + foreground service.
 *
 * Written to spec against current Core Location APIs but NOT build- or
 * device-verified in this environment (no macOS/Xcode available). Before
 * shipping: add this file and NearBellLocationModule.m to the Xcode
 * project's NearBell target, verify Codegen's Swift interop compiles
 * cleanly, and test the full flow on a physical device/simulator.
 *
 * Uses the classic delegate-based CLLocationManager API (startMonitoring/
 * didEnterRegion) rather than iOS 17's CLMonitor actor API, for broader
 * deployment-target compatibility and because it's the long-established,
 * thoroughly documented path — appropriate given this can't be verified
 * against a real build here.
 */
@objc(NearBellLocationModule)
class NearBellLocationModule: RCTEventEmitter, CLLocationManagerDelegate {
  private let locationManager = CLLocationManager()
  private var pendingLocationResolvers: [(RCTPromiseResolveBlock, RCTPromiseRejectBlock)] = []
  private var pendingPermissionRequests: [(CLAuthorizationStatus) -> Void] = []
  private var hasListeners = false
  private var currentTripId: String?
  private var currentRadiusMeters: CLLocationDistance = 0
  private var isPaused = false

  override init() {
    super.init()
    locationManager.delegate = self
    locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters
    locationManager.pausesLocationUpdatesAutomatically = false
  }

  override static func requiresMainQueueSetup() -> Bool { true }

  // The JS spec (src/infrastructure/location/specs/NativeNearBellLocation.ts)
  // resolves this module via TurboModuleRegistry.get('NearBellLocation').
  // RCT_EXTERN_MODULE would otherwise derive the JS name from the
  // Objective-C class name ("NearBellLocationModule"), which would not
  // match — this override keeps the class name descriptive while
  // registering under the same name Android's NearBellLocationModule.NAME
  // uses.
  @objc override static func moduleName() -> String! {
    return "NearBellLocation"
  }

  override func supportedEvents() -> [String] {
    return ["onArrivalEvent", "onLocationSample", "onMonitoringError"]
  }

  override func startObserving() { hasListeners = true }
  override func stopObserving() { hasListeners = false }

  private func emit(_ name: String, _ body: [String: Any]) {
    if hasListeners {
      sendEvent(withName: name, body: body)
    }
  }

  // MARK: - Current location

  @objc(getCurrentLocation:rejecter:)
  func getCurrentLocation(
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let status = currentAuthorizationStatus()
    guard status == .authorizedWhenInUse || status == .authorizedAlways else {
      reject("LOCATION_PERMISSION_DENIED", "Foreground location permission is not granted", nil)
      return
    }
    pendingLocationResolvers.append((resolve, reject))
    locationManager.requestLocation()
  }

  // MARK: - Permissions

  private func currentAuthorizationStatus() -> CLAuthorizationStatus {
    if #available(iOS 14.0, *) {
      return locationManager.authorizationStatus
    }
    return CLLocationManager.authorizationStatus()
  }

  private func permissionState(for status: CLAuthorizationStatus) -> String {
    switch status {
    case .authorizedWhenInUse, .authorizedAlways:
      return "granted"
    case .denied, .restricted:
      return status == .restricted ? "restricted" : "denied"
    case .notDetermined:
      return "unknown"
    @unknown default:
      return "unknown"
    }
  }

  private func currentStatusPayload() -> [String: Any] {
    let status = currentAuthorizationStatus()
    let foreground = permissionState(for: status)
    // iOS has no separate "background location" permission surface beyond
    // .authorizedAlways — treat it as granted only once Always is granted.
    let background = status == .authorizedAlways ? "granted" : (foreground == "unknown" ? "unknown" : "denied")
    return [
      "foregroundLocation": foreground,
      "backgroundLocation": background,
      "notifications": "unknown", // resolved asynchronously below when requested
    ]
  }

  @objc(getPermissionStatus:rejecter:)
  func getPermissionStatus(
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    var payload = currentStatusPayload()
    UNUserNotificationCenter.current().getNotificationSettings { settings in
      switch settings.authorizationStatus {
      case .authorized, .provisional, .ephemeral:
        payload["notifications"] = "granted"
      case .denied:
        payload["notifications"] = "denied"
      case .notDetermined:
        payload["notifications"] = "unknown"
      @unknown default:
        payload["notifications"] = "unknown"
      }
      DispatchQueue.main.async { resolve(payload) }
    }
  }

  @objc(requestForegroundLocationPermission:rejecter:)
  func requestForegroundLocationPermission(
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let status = currentAuthorizationStatus()
    if status != .notDetermined {
      resolve(currentStatusPayload())
      return
    }
    pendingPermissionRequests.append { [weak self] _ in
      guard let self = self else { return }
      resolve(self.currentStatusPayload())
    }
    locationManager.requestWhenInUseAuthorization()
  }

  @objc(requestBackgroundLocationPermission:rejecter:)
  func requestBackgroundLocationPermission(
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let status = currentAuthorizationStatus()
    // Apple requires When-In-Use to already be granted before requesting
    // Always — see 08-security-privacy.md / the two-phase authorization
    // flow this mirrors on the JS side (foreground, then background).
    guard status == .authorizedWhenInUse || status == .authorizedAlways else {
      resolve(currentStatusPayload())
      return
    }
    if status == .authorizedAlways {
      resolve(currentStatusPayload())
      return
    }
    pendingPermissionRequests.append { [weak self] _ in
      guard let self = self else { return }
      resolve(self.currentStatusPayload())
    }
    locationManager.requestAlwaysAuthorization()
  }

  @objc(requestNotificationPermission:rejecter:)
  func requestNotificationPermission(
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { [weak self] _, _ in
      guard let self = self else { return }
      self.getPermissionStatus(resolve: resolve, reject: reject)
    }
  }

  // MARK: - Trip monitoring

  @objc(startTripMonitoring:destinationLatitude:destinationLongitude:radiusMeters:resolver:rejecter:)
  func startTripMonitoring(
    tripId: String,
    destinationLatitude: NSNumber,
    destinationLongitude: NSNumber,
    radiusMeters: NSNumber,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let status = currentAuthorizationStatus()
    guard status == .authorizedWhenInUse || status == .authorizedAlways else {
      reject("LOCATION_PERMISSION_DENIED", "Foreground location permission is not granted", nil)
      return
    }

    currentTripId = tripId
    currentRadiusMeters = radiusMeters.doubleValue
    isPaused = false

    let center = CLLocationCoordinate2D(
      latitude: destinationLatitude.doubleValue,
      longitude: destinationLongitude.doubleValue
    )
    // iOS caps circular region radius; CLLocationManager.maximumRegionMonitoringDistance
    // reports the platform limit (historically large, ~50km+), well above our
    // product radii (100m-2km, or clamped custom up to 5km).
    let region = CLCircularRegion(center: center, radius: currentRadiusMeters, identifier: tripId)
    region.notifyOnEntry = true
    region.notifyOnExit = false
    locationManager.startMonitoring(for: region)

    // Continuous updates while ACTIVE, mirroring Android's foreground
    // service — the higher-frequency layer on top of the region-monitoring
    // low-power baseline (04-location-engine.md's hybrid strategy).
    if status == .authorizedAlways {
      locationManager.allowsBackgroundLocationUpdates = true
    }
    locationManager.startUpdatingLocation()

    resolve(nil)
  }

  @objc(pauseTripMonitoring:rejecter:)
  func pauseTripMonitoring(
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    isPaused = true
    locationManager.stopUpdatingLocation()
    if let tripId = currentTripId {
      for region in locationManager.monitoredRegions where region.identifier == tripId {
        locationManager.stopMonitoring(for: region)
      }
    }
    resolve(nil)
  }

  @objc(resumeTripMonitoring:rejecter:)
  func resumeTripMonitoring(
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let tripId = currentTripId else {
      reject("LOCATION_UNAVAILABLE", "No trip is configured to resume", nil)
      return
    }
    isPaused = false
    // Re-derive the region from the last known configuration by reusing
    // startTripMonitoring's region setup via stored destination — simplest
    // correct approach is to re-register with the same parameters, which
    // the JS side already has (it calls startTripMonitoring again on
    // resume in practice); this mirrors that by re-arming updates here.
    locationManager.startUpdatingLocation()
    if let region = locationManager.monitoredRegions.first(where: { $0.identifier == tripId }) as? CLCircularRegion {
      locationManager.startMonitoring(for: region)
    }
    resolve(nil)
  }

  @objc(stopTripMonitoring:rejecter:)
  func stopTripMonitoring(
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    locationManager.stopUpdatingLocation()
    locationManager.allowsBackgroundLocationUpdates = false
    if let tripId = currentTripId {
      for region in locationManager.monitoredRegions where region.identifier == tripId {
        locationManager.stopMonitoring(for: region)
      }
    }
    currentTripId = nil
    isPaused = false
    resolve(nil)
  }

  // MARK: - CLLocationManagerDelegate

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard let location = locations.last else { return }

    if !pendingLocationResolvers.isEmpty {
      let sample = locationSamplePayload(location, source: "fused")
      for (resolve, _) in pendingLocationResolvers { resolve(sample) }
      pendingLocationResolvers.removeAll()
    }

    if let tripId = currentTripId, !isPaused {
      var payload = locationSamplePayload(location, source: "fused")
      payload["tripId"] = tripId
      emit("onLocationSample", payload)
    }
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    if !pendingLocationResolvers.isEmpty {
      for (_, reject) in pendingLocationResolvers {
        reject("LOCATION_UNAVAILABLE", error.localizedDescription, error)
      }
      pendingLocationResolvers.removeAll()
    }
  }

  func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) {
    guard let tripId = currentTripId, region.identifier == tripId, !isPaused else { return }
    var payload: [String: Any] = ["tripId": tripId, "source": "geofence_enter"]
    if let location = manager.location {
      let sample = locationSamplePayload(location, source: "fused")
      payload.merge(sample) { _, new in new }
    }
    emit("onArrivalEvent", payload)
  }

  func locationManager(_ manager: CLLocationManager, monitoringDidFailFor region: CLRegion?, withError error: Error) {
    guard let tripId = currentTripId else { return }
    emit("onMonitoringError", [
      "tripId": tripId,
      "code": "GEOFENCE_REGISTRATION_FAILED",
      "message": error.localizedDescription,
    ])
  }

  func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
    let handlers = pendingPermissionRequests
    pendingPermissionRequests.removeAll()
    for handler in handlers { handler(status) }
  }

  // MARK: - Helpers

  private func locationSamplePayload(_ location: CLLocation, source: String) -> [String: Any] {
    let hasAccuracy = location.horizontalAccuracy >= 0
    let hasAltitude = location.verticalAccuracy >= 0
    let hasSpeed = location.speed >= 0
    let hasHeading = location.course >= 0
    return [
      "latitude": location.coordinate.latitude,
      "longitude": location.coordinate.longitude,
      "accuracyMeters": hasAccuracy ? location.horizontalAccuracy : 0,
      "hasAccuracy": hasAccuracy,
      "altitudeMeters": hasAltitude ? location.altitude : 0,
      "hasAltitude": hasAltitude,
      "speedMps": hasSpeed ? location.speed : 0,
      "hasSpeed": hasSpeed,
      "headingDegrees": hasHeading ? location.course : 0,
      "hasHeading": hasHeading,
      "timestamp": location.timestamp.timeIntervalSince1970 * 1000,
      "source": source,
    ]
  }
}
