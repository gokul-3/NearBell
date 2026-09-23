package com.nearbell.app.location

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.google.android.gms.location.Geofence
import com.google.android.gms.location.GeofencingEvent

/**
 * Manifest-declared (not dynamically registered) so the OS can deliver a
 * geofence ENTER transition even if the app process was killed. If the JS
 * side isn't reachable when that happens, we still surface a fallback
 * native notification rather than silently dropping the event — the full
 * alarm experience only exists in JS today (Phase 7), so this is a
 * best-effort "come back to the app" nudge, not the real alarm.
 */
class GeofenceBroadcastReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val event = GeofencingEvent.fromIntent(intent) ?: return

        if (event.hasError()) {
            Log.w(TAG, "Geofencing error code: ${event.errorCode}")
            return
        }

        if (event.geofenceTransition != Geofence.GEOFENCE_TRANSITION_ENTER) {
            return
        }

        val monitoring = TripMonitoringState.load(context) ?: return
        if (monitoring.paused) {
            return
        }

        val triggeringTripId = event.triggeringGeofences
            ?.firstOrNull { it.requestId == monitoring.tripId }
            ?.requestId
            ?: return

        val module = NearBellLocationModule.currentInstance()
        if (module != null) {
            module.emitArrivalEvent(triggeringTripId, "geofence_enter", event.triggeringLocation)
        } else {
            FallbackArrivalNotifier.notify(context, triggeringTripId)
        }
    }

    companion object {
        private const val TAG = "NearBellGeofence"
    }
}
