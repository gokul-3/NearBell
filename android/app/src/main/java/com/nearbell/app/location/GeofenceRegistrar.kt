package com.nearbell.app.location

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.location.Geofence
import com.google.android.gms.location.GeofenceStatusCodes
import com.google.android.gms.location.GeofencingClient
import com.google.android.gms.location.GeofencingRequest
import com.google.android.gms.location.LocationServices

/**
 * Thin wrapper over Android's GeofencingClient — the low-power baseline for
 * destination-arrival detection (04-location-engine.md). One geofence per
 * app is all NearBell ever needs at a time, well under the platform's
 * 100-geofence-per-app limit.
 */
object GeofenceRegistrar {
    private const val TAG = "NearBellGeofenceRegistrar"
    private const val GEOFENCE_EXPIRATION_MS = Geofence.NEVER_EXPIRE
    private const val MAX_ATTEMPTS = 4
    private const val RETRY_DELAY_MS = 4_000L

    private fun client(context: Context): GeofencingClient =
        LocationServices.getGeofencingClient(context)

    private fun pendingIntent(context: Context): PendingIntent {
        val intent = Intent(context, GeofenceBroadcastReceiver::class.java)
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
        return PendingIntent.getBroadcast(context, 0, intent, flags)
    }

    /**
     * GEOFENCE_NOT_AVAILABLE (status 1000) is a known-transient condition —
     * it fires when the device's fused location backend isn't ready yet
     * (e.g. right after boot, or before any app has an active location
     * session). Per 04-location-engine.md ("retry through platform APIs,
     * do not spin a JS polling loop"), this retries with backoff on the
     * main looper rather than failing the trip immediately.
     */
    fun register(
        context: Context,
        tripId: String,
        latitude: Double,
        longitude: Double,
        radiusMeters: Double,
        onComplete: (Exception?) -> Unit,
    ) {
        registerAttempt(context, tripId, latitude, longitude, radiusMeters, attempt = 1, onComplete)
    }

    private fun registerAttempt(
        context: Context,
        tripId: String,
        latitude: Double,
        longitude: Double,
        radiusMeters: Double,
        attempt: Int,
        onComplete: (Exception?) -> Unit,
    ) {
        val geofence = Geofence.Builder()
            .setRequestId(tripId)
            .setCircularRegion(latitude, longitude, radiusMeters.toFloat())
            .setExpirationDuration(GEOFENCE_EXPIRATION_MS)
            .setTransitionTypes(Geofence.GEOFENCE_TRANSITION_ENTER)
            .build()

        val request = GeofencingRequest.Builder()
            .setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER)
            .addGeofence(geofence)
            .build()

        try {
            client(context).addGeofences(request, pendingIntent(context))
                .addOnSuccessListener {
                    Log.d(TAG, "addGeofences succeeded for tripId=$tripId (attempt $attempt)")
                    onComplete(null)
                }
                .addOnFailureListener { error ->
                    val isRetryableUnavailability =
                        error is ApiException && error.statusCode == GeofenceStatusCodes.GEOFENCE_NOT_AVAILABLE
                    if (isRetryableUnavailability && attempt < MAX_ATTEMPTS) {
                        Log.w(TAG, "addGeofences unavailable for tripId=$tripId, retrying (attempt $attempt)")
                        Handler(Looper.getMainLooper()).postDelayed({
                            registerAttempt(context, tripId, latitude, longitude, radiusMeters, attempt + 1, onComplete)
                        }, RETRY_DELAY_MS)
                    } else {
                        Log.w(TAG, "addGeofences FAILED for tripId=$tripId: ${error.message}", error)
                        onComplete(error)
                    }
                }
        } catch (error: SecurityException) {
            Log.w(TAG, "addGeofences threw SecurityException for tripId=$tripId", error)
            onComplete(error)
        }
    }

    fun remove(context: Context, tripId: String) {
        client(context).removeGeofences(listOf(tripId))
    }
}
