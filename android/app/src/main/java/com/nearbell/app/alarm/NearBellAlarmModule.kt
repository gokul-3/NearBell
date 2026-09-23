package com.nearbell.app.alarm

import android.Manifest
import android.os.Build
import androidx.core.content.ContextCompat
import android.content.pm.PackageManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import com.nearbell.app.specs.NativeNearBellAlarmSpec

class NearBellAlarmModule(reactContext: ReactApplicationContext) :
    NativeNearBellAlarmSpec(reactContext) {

    override fun requestPermissions(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            promise.resolve(null)
            return
        }
        val context = reactApplicationContext
        val granted = ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED
        if (granted) {
            promise.resolve(null)
            return
        }
        val activity = getCurrentActivity() as? PermissionAwareActivity
        if (activity == null) {
            promise.resolve(null)
            return
        }
        activity.requestPermissions(
            arrayOf(Manifest.permission.POST_NOTIFICATIONS),
            REQUEST_CODE,
            PermissionListener { _, _, grantResults ->
                promise.resolve(null)
                grantResults.isNotEmpty()
            },
        )
    }

    override fun testAlarm(vibrationEnabled: Boolean, promise: Promise) {
        val context = reactApplicationContext
        AlarmNotifications.post(context, "Test alarm", "This is what your destination alarm sounds like.")
        AlarmSoundPlayer.start(context, vibrationEnabled)
        promise.resolve(null)
    }

    override fun triggerAlarm(tripId: String, destinationName: String, vibrationEnabled: Boolean, promise: Promise) {
        val context = reactApplicationContext
        AlarmNotifications.post(context, "You're near your destination", destinationName)
        AlarmSoundPlayer.start(context, vibrationEnabled)
        promise.resolve(null)
    }

    override fun stopAlarm(promise: Promise) {
        val context = reactApplicationContext
        AlarmSoundPlayer.stop(context)
        AlarmNotifications.cancel(context)
        promise.resolve(null)
    }

    companion object {
        const val NAME = "NearBellAlarm"
        private const val REQUEST_CODE = 9500
    }
}
