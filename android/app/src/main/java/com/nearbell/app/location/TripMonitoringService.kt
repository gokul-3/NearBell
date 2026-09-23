package com.nearbell.app.location

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority

/**
 * Foreground service providing higher-frequency location updates while a
 * trip is ACTIVE, on top of the geofence low-power baseline
 * (04-location-engine.md's hybrid strategy). Never a substitute for the
 * geofence — this exists for UX/verification (distance shown in the app)
 * and stops the moment the trip is paused/cancelled/completed.
 */
class TripMonitoringService : Service() {
    private var fusedLocationClient: FusedLocationProviderClient? = null
    private var locationCallback: LocationCallback? = null
    private var tripId: String? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val id = intent?.getStringExtra(EXTRA_TRIP_ID)
        if (id == null) {
            stopSelf()
            return START_NOT_STICKY
        }
        tripId = id

        ensureChannel()
        startForegroundCompat()
        startLocationUpdates(id)

        return START_STICKY
    }

    override fun onDestroy() {
        stopLocationUpdates()
        super.onDestroy()
    }

    private fun startLocationUpdates(id: String) {
        val client = LocationServices.getFusedLocationProviderClient(this)
        fusedLocationClient = client

        val request = LocationRequest.Builder(Priority.PRIORITY_BALANCED_POWER_ACCURACY, UPDATE_INTERVAL_MS)
            .setMinUpdateIntervalMillis(MIN_UPDATE_INTERVAL_MS)
            .build()

        val callback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                val location = result.lastLocation ?: return
                NearBellLocationModule.currentInstance()?.emitLocationSample(id, location)
            }
        }
        locationCallback = callback

        try {
            client.requestLocationUpdates(request, callback, Looper.getMainLooper())
        } catch (error: SecurityException) {
            stopSelf()
        }
    }

    private fun stopLocationUpdates() {
        locationCallback?.let { fusedLocationClient?.removeLocationUpdates(it) }
        locationCallback = null
        fusedLocationClient = null
    }

    private fun startForegroundCompat() {
        val notification = buildNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun buildNotification(): Notification {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
            ?.apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP }
        val contentIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(applicationInfo.icon)
            .setContentTitle("Monitoring your trip")
            .setContentText("NearBell will alert you when you're close.")
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(contentIntent)
            .build()
    }

    private fun ensureChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (manager.getNotificationChannel(CHANNEL_ID) != null) {
            return
        }
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Trip monitoring",
            NotificationManager.IMPORTANCE_LOW,
        )
        manager.createNotificationChannel(channel)
    }

    companion object {
        private const val CHANNEL_ID = "nearbell.trip_monitoring"
        private const val NOTIFICATION_ID = 5002
        private const val EXTRA_TRIP_ID = "tripId"
        private const val EXTRA_LAT = "lat"
        private const val EXTRA_LNG = "lng"
        private const val EXTRA_RADIUS = "radius"
        private const val UPDATE_INTERVAL_MS = 20_000L
        private const val MIN_UPDATE_INTERVAL_MS = 10_000L

        fun start(
            context: Context,
            tripId: String,
            destinationLatitude: Double,
            destinationLongitude: Double,
            radiusMeters: Double,
        ) {
            val intent = Intent(context, TripMonitoringService::class.java)
                .putExtra(EXTRA_TRIP_ID, tripId)
                .putExtra(EXTRA_LAT, destinationLatitude)
                .putExtra(EXTRA_LNG, destinationLongitude)
                .putExtra(EXTRA_RADIUS, radiusMeters)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, TripMonitoringService::class.java))
        }
    }
}
