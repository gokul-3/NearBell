package com.nearbell.app.location

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

private fun hasPermission(context: Context, permission: String): Boolean {
    return ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
}

object PermissionUtils {
    fun foregroundLocationState(context: Context): String {
        val granted = hasPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) ||
            hasPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION)
        return if (granted) PermissionState.GRANTED else PermissionState.DENIED
    }

    fun backgroundLocationState(context: Context): String {
        // ACCESS_BACKGROUND_LOCATION only exists/matters from API 29 (Q).
        // Below that, foreground location access already covers background
        // delivery for a foreground-service-backed app.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            return foregroundLocationState(context)
        }
        return if (hasPermission(context, Manifest.permission.ACCESS_BACKGROUND_LOCATION)) {
            PermissionState.GRANTED
        } else {
            PermissionState.DENIED
        }
    }

    fun notificationsState(context: Context): String {
        // POST_NOTIFICATIONS only exists from API 33 (Tiramisu).
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            return PermissionState.GRANTED
        }
        return if (hasPermission(context, Manifest.permission.POST_NOTIFICATIONS)) {
            PermissionState.GRANTED
        } else {
            PermissionState.DENIED
        }
    }

    fun currentStatus(context: Context): WritableMap {
        val map = Arguments.createMap()
        map.putString("foregroundLocation", foregroundLocationState(context))
        map.putString("backgroundLocation", backgroundLocationState(context))
        map.putString("notifications", notificationsState(context))
        return map
    }
}
