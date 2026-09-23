package com.nearbell.app.alarm

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Handles the notification's own "Stop" action button, so the alarm can be
 * silenced natively even if the user dismisses it from the notification
 * shade without opening the app (JS may not be running to handle this).
 */
class AlarmStopReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        AlarmSoundPlayer.stop(context)
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.cancel(AlarmNotifications.NOTIFICATION_ID)
    }
}
