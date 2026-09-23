package com.nearbell.app.alarm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat

/**
 * Builds and posts the alarm notification. Full-screen intent delivery on
 * API 34+ is restricted to apps the system has approved for alarm/call use
 * (source.android.com/docs/core/permissions/fsi-limits) — canUseFullScreenIntent()
 * lets us check that rather than assume it, and fall back to a normal
 * heads-up notification (still high-priority, still sounds/vibrates, just
 * doesn't auto-launch the Alarm screen) when it isn't granted.
 */
object AlarmNotifications {
    const val NOTIFICATION_ID = 6001
    private const val CHANNEL_ID = "nearbell.alarm"
    private const val ACTION_STOP = "com.nearbell.app.alarm.STOP"

    fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (manager.getNotificationChannel(CHANNEL_ID) != null) {
            return
        }
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Destination alarm",
            NotificationManager.IMPORTANCE_HIGH,
        )
        channel.description = "Sounds when you're near your destination"
        channel.enableVibration(false) // vibration is driven explicitly by AlarmSoundPlayer
        channel.setSound(null, null) // sound is driven explicitly by AlarmSoundPlayer (looping)
        manager.createNotificationChannel(channel)
    }

    private fun canUseFullScreenIntent(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < 34) {
            return true
        }
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        return manager.canUseFullScreenIntent()
    }

    fun post(context: Context, title: String, text: String) {
        ensureChannel(context)

        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            ?.apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP }
        val contentIntent = PendingIntent.getActivity(
            context,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val stopIntent = Intent(context, AlarmStopReceiver::class.java).setAction(ACTION_STOP)
        val stopPendingIntent = PendingIntent.getBroadcast(
            context,
            0,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(context.applicationInfo.icon)
            .setContentTitle(title)
            .setContentText(text)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setContentIntent(contentIntent)
            .addAction(0, "Stop alarm", stopPendingIntent)

        if (canUseFullScreenIntent(context)) {
            builder.setFullScreenIntent(contentIntent, true)
        }

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, builder.build())
    }

    fun cancel(context: Context) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.cancel(NOTIFICATION_ID)
    }
}
