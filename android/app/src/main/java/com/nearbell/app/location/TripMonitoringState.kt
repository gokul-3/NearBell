package com.nearbell.app.location

import android.content.Context

/**
 * Minimal native-side record of what's currently being monitored, so the
 * foreground service and the geofence broadcast receiver — both of which
 * can be woken up by the OS independently of the JS side being alive — know
 * what trip/destination they're acting on, and so state can be reconciled
 * after process death.
 */
data class ActiveMonitoring(
    val tripId: String,
    val destinationLatitude: Double,
    val destinationLongitude: Double,
    val radiusMeters: Double,
    val paused: Boolean,
)

object TripMonitoringState {
    private const val PREFS_NAME = "com.nearbell.app.location.state"
    private const val KEY_TRIP_ID = "tripId"
    private const val KEY_LAT = "lat"
    private const val KEY_LNG = "lng"
    private const val KEY_RADIUS = "radius"
    private const val KEY_PAUSED = "paused"

    fun save(context: Context, monitoring: ActiveMonitoring) {
        prefs(context).edit()
            .putString(KEY_TRIP_ID, monitoring.tripId)
            .putFloat(KEY_LAT, monitoring.destinationLatitude.toFloat())
            .putFloat(KEY_LNG, monitoring.destinationLongitude.toFloat())
            .putFloat(KEY_RADIUS, monitoring.radiusMeters.toFloat())
            .putBoolean(KEY_PAUSED, monitoring.paused)
            .apply()
    }

    fun setPaused(context: Context, paused: Boolean) {
        prefs(context).edit().putBoolean(KEY_PAUSED, paused).apply()
    }

    fun load(context: Context): ActiveMonitoring? {
        val p = prefs(context)
        val tripId = p.getString(KEY_TRIP_ID, null) ?: return null
        return ActiveMonitoring(
            tripId = tripId,
            destinationLatitude = p.getFloat(KEY_LAT, 0f).toDouble(),
            destinationLongitude = p.getFloat(KEY_LNG, 0f).toDouble(),
            radiusMeters = p.getFloat(KEY_RADIUS, 0f).toDouble(),
            paused = p.getBoolean(KEY_PAUSED, false),
        )
    }

    fun clear(context: Context) {
        prefs(context).edit().clear().apply()
    }

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
}
