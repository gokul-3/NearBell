package com.nearbell.app.location

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import com.google.android.gms.location.CurrentLocationRequest
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import java.lang.ref.WeakReference

class NearBellLocationModule(reactContext: ReactApplicationContext) :
    NativeNearBellLocationSpec(reactContext) {

    private var listenerCount = 0

    init {
        instance = WeakReference(this)
    }

    override fun getCurrentLocation(promise: Promise) {
        val context = reactApplicationContext
        if (PermissionUtils.foregroundLocationState(context) != PermissionState.GRANTED) {
            promise.reject("LOCATION_PERMISSION_DENIED", "Foreground location permission is not granted")
            return
        }

        val client = LocationServices.getFusedLocationProviderClient(context)
        val cancellationSource = CancellationTokenSource()
        val request = CurrentLocationRequest.Builder()
            .setPriority(Priority.PRIORITY_BALANCED_POWER_ACCURACY)
            .build()

        client.getCurrentLocation(request, cancellationSource.token)
            .addOnSuccessListener { location ->
                if (location == null) {
                    promise.reject("LOCATION_UNAVAILABLE", "No location fix available")
                } else {
                    promise.resolve(location.toWritableMap())
                }
            }
            .addOnFailureListener { error ->
                promise.reject("LOCATION_UNAVAILABLE", error.message, error)
            }
    }

    override fun getPermissionStatus(promise: Promise) {
        promise.resolve(PermissionUtils.currentStatus(reactApplicationContext))
    }

    override fun requestForegroundLocationPermission(promise: Promise) {
        requestPermissions(
            arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION),
            promise,
        )
    }

    @RequiresApi(Build.VERSION_CODES.Q)
    override fun requestBackgroundLocationPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            promise.resolve(PermissionUtils.currentStatus(reactApplicationContext))
            return
        }
        requestPermissions(arrayOf(Manifest.permission.ACCESS_BACKGROUND_LOCATION), promise)
    }

    override fun requestNotificationPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            promise.resolve(PermissionUtils.currentStatus(reactApplicationContext))
            return
        }
        requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), promise)
    }

    private fun requestPermissions(permissions: Array<String>, promise: Promise) {
        val context = reactApplicationContext

        // Requesting a permission that's already granted is not guaranteed
        // to invoke onRequestPermissionsResult on every Android version —
        // it can silently no-op, hanging the promise forever. Skip the
        // native request entirely when nothing is actually missing.
        val alreadyGranted = permissions.all {
            ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
        }
        if (alreadyGranted) {
            promise.resolve(PermissionUtils.currentStatus(context))
            return
        }

        val activity = getCurrentActivity() as? PermissionAwareActivity
        if (activity == null) {
            promise.reject("UNSUPPORTED_PLATFORM", "No activity available to request permissions")
            return
        }
        activity.requestPermissions(
            permissions,
            nextRequestCode(),
            PermissionListener { _, _, grantResults ->
                promise.resolve(PermissionUtils.currentStatus(context))
                grantResults.isNotEmpty()
            },
        )
    }

    override fun startTripMonitoring(
        tripId: String,
        destinationLatitude: Double,
        destinationLongitude: Double,
        radiusMeters: Double,
        promise: Promise,
    ) {
        val context = reactApplicationContext
        if (PermissionUtils.foregroundLocationState(context) != PermissionState.GRANTED) {
            promise.reject("LOCATION_PERMISSION_DENIED", "Foreground location permission is not granted")
            return
        }

        TripMonitoringState.save(
            context,
            ActiveMonitoring(tripId, destinationLatitude, destinationLongitude, radiusMeters, paused = false),
        )
        GeofenceRegistrar.register(context, tripId, destinationLatitude, destinationLongitude, radiusMeters) { error ->
            if (error != null) {
                emitMonitoringError(tripId, "GEOFENCE_REGISTRATION_FAILED", error.message ?: "Unknown error")
            }
        }
        TripMonitoringService.start(context, tripId, destinationLatitude, destinationLongitude, radiusMeters)
        promise.resolve(null)
    }

    override fun pauseTripMonitoring(promise: Promise) {
        val context = reactApplicationContext
        TripMonitoringState.setPaused(context, true)
        val monitoring = TripMonitoringState.load(context)
        if (monitoring != null) {
            GeofenceRegistrar.remove(context, monitoring.tripId)
        }
        TripMonitoringService.stop(context)
        promise.resolve(null)
    }

    override fun resumeTripMonitoring(promise: Promise) {
        val context = reactApplicationContext
        val monitoring = TripMonitoringState.load(context)
        if (monitoring == null) {
            promise.reject("LOCATION_UNAVAILABLE", "No trip is configured to resume")
            return
        }
        TripMonitoringState.setPaused(context, false)
        GeofenceRegistrar.register(
            context,
            monitoring.tripId,
            monitoring.destinationLatitude,
            monitoring.destinationLongitude,
            monitoring.radiusMeters,
        ) { error ->
            if (error != null) {
                emitMonitoringError(monitoring.tripId, "GEOFENCE_REGISTRATION_FAILED", error.message ?: "Unknown error")
            }
        }
        TripMonitoringService.start(
            context,
            monitoring.tripId,
            monitoring.destinationLatitude,
            monitoring.destinationLongitude,
            monitoring.radiusMeters,
        )
        promise.resolve(null)
    }

    override fun stopTripMonitoring(promise: Promise) {
        val context = reactApplicationContext
        val monitoring = TripMonitoringState.load(context)
        if (monitoring != null) {
            GeofenceRegistrar.remove(context, monitoring.tripId)
        }
        TripMonitoringService.stop(context)
        TripMonitoringState.clear(context)
        promise.resolve(null)
    }

    override fun addListener(eventName: String) {
        listenerCount += 1
    }

    override fun removeListeners(count: Double) {
        listenerCount = (listenerCount - count.toInt()).coerceAtLeast(0)
    }

    private fun emitEvent(eventName: String, payload: WritableMap) {
        reactApplicationContext
            .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, payload)
    }

    fun emitArrivalEvent(tripId: String, source: String, location: android.location.Location?) {
        val payload = location?.toWritableMap(source) ?: Arguments.createMap()
        payload.putString("tripId", tripId)
        payload.putString("source", source)
        emitEvent("onArrivalEvent", payload)
    }

    fun emitLocationSample(tripId: String, location: android.location.Location) {
        val payload = location.toWritableMap()
        payload.putString("tripId", tripId)
        emitEvent("onLocationSample", payload)
    }

    private fun emitMonitoringError(tripId: String, code: String, message: String) {
        val payload = Arguments.createMap()
        payload.putString("tripId", tripId)
        payload.putString("code", code)
        payload.putString("message", message)
        emitEvent("onMonitoringError", payload)
    }

    companion object {
        const val NAME = "NearBellLocation"

        @Volatile
        private var instance: WeakReference<NearBellLocationModule>? = null

        fun currentInstance(): NearBellLocationModule? = instance?.get()

        private var requestCodeCounter = 9000
        private fun nextRequestCode(): Int {
            requestCodeCounter += 1
            return requestCodeCounter
        }
    }
}
