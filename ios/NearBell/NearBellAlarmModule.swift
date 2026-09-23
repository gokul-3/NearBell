import AVFoundation
import Foundation
import UserNotifications

/**
 * iOS counterpart to android/.../alarm/NearBellAlarmModule.kt — same
 * JS-facing surface (src/infrastructure/alarm/specs/NativeNearBellAlarm.ts).
 *
 * No `com.apple.developer.usernotifications.critical-alerts` entitlement is
 * assumed (Apple grants it only on individual request, audience
 * significantly restricted) — this uses a regular high-priority local
 * notification with the system default sound, which still respects the
 * user's silent switch/volume. Looping playback while the app is in the
 * foreground uses AVAudioPlayer with the system alert sound; when
 * backgrounded/locked, the notification's own sound is what the user
 * actually hears (iOS does not allow apps to play arbitrary looping audio
 * in the background outside of the `audio` background mode, which this
 * app does not declare, since its purpose is location, not audio).
 *
 * Written to spec against current APIs but NOT build- or device-verified
 * in this environment (no macOS/Xcode available). Before shipping: add
 * this file and NearBellAlarmModule.m to the Xcode project's NearBell
 * target and test the full flow on a physical device/simulator.
 */
@objc(NearBellAlarmModule)
class NearBellAlarmModule: NSObject {
  private var audioPlayer: AVAudioPlayer?
  private let notificationIdentifier = "nearbell.alarm"

  @objc static func requiresMainQueueSetup() -> Bool { true }

  @objc override static func moduleName() -> String! {
    return "NearBellAlarm"
  }

  @objc(requestPermissions:rejecter:)
  func requestPermissions(
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in
      resolve(nil)
    }
  }

  @objc(testAlarm:resolver:rejecter:)
  func testAlarm(
    vibrationEnabled: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    postNotification(title: "Test alarm", body: "This is what your destination alarm sounds like.")
    startForegroundSound()
    resolve(nil)
  }

  @objc(triggerAlarm:destinationName:vibrationEnabled:resolver:rejecter:)
  func triggerAlarm(
    tripId: String,
    destinationName: String,
    vibrationEnabled: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    postNotification(title: "You're near your destination", body: destinationName)
    startForegroundSound()
    resolve(nil)
  }

  @objc(stopAlarm:rejecter:)
  func stopAlarm(
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    audioPlayer?.stop()
    audioPlayer = nil
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: [notificationIdentifier])
    resolve(nil)
  }

  // MARK: - Helpers

  private func postNotification(title: String, body: String) {
    let content = UNMutableNotificationContent()
    content.title = title
    content.body = body
    content.sound = .default
    content.categoryIdentifier = "NEARBELL_ALARM"

    let request = UNNotificationRequest(identifier: notificationIdentifier, content: content, trigger: nil)
    UNUserNotificationCenter.current().add(request)
  }

  /// Loops the system alert sound while the app is in the foreground, so
  /// the alarm is audible even if the one-shot notification sound has
  /// already finished playing.
  private func startForegroundSound() {
    audioPlayer?.stop()
    try? AVAudioSession.sharedInstance().setCategory(.playback, options: [.mixWithOthers])
    try? AVAudioSession.sharedInstance().setActive(true)

    guard let soundUrl = Bundle.main.url(forResource: "alarm_sound", withExtension: "caf") else {
      // No bundled alarm sound asset — the delivered notification's
      // default sound is the fallback in that case.
      return
    }
    do {
      let player = try AVAudioPlayer(contentsOf: soundUrl)
      player.numberOfLoops = -1
      player.play()
      audioPlayer = player
    } catch {
      audioPlayer = nil
    }
  }
}
