package com.nearbell.app.alarm

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log

/**
 * Owns the looping alarm sound + repeating vibration for as long as the
 * alarm is ringing. A plain object (single alarm at a time is all the
 * product needs — 05-data-model.md's Trip.alarmState is itself a single
 * IDLE/RINGING/DISMISSED value).
 */
object AlarmSoundPlayer {
    private const val TAG = "NearBellAlarmSoundPlayer"
    private val VIBRATION_PATTERN = longArrayOf(0, 800, 400, 800, 400)

    private var mediaPlayer: MediaPlayer? = null

    private fun vibrator(context: Context): Vibrator {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val manager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            manager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
    }

    fun start(context: Context, vibrationEnabled: Boolean) {
        stop(context)

        try {
            val alarmUri = RingtoneManager.getActualDefaultRingtoneUri(context, RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            val player = MediaPlayer()
            player.setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build(),
            )
            player.setDataSource(context, alarmUri)
            player.isLooping = true
            player.prepare()
            player.start()
            mediaPlayer = player
        } catch (error: Exception) {
            Log.w(TAG, "Failed to start alarm sound", error)
        }

        if (vibrationEnabled) {
            try {
                val effect = VibrationEffect.createWaveform(VIBRATION_PATTERN, 0)
                vibrator(context).vibrate(effect)
            } catch (error: Exception) {
                Log.w(TAG, "Failed to start vibration", error)
            }
        }
    }

    fun stop(context: Context) {
        mediaPlayer?.let { player ->
            try {
                if (player.isPlaying) player.stop()
            } catch (error: Exception) {
                Log.w(TAG, "Error stopping alarm sound", error)
            }
            player.release()
        }
        mediaPlayer = null

        try {
            vibrator(context).cancel()
        } catch (error: Exception) {
            Log.w(TAG, "Error cancelling vibration", error)
        }
    }
}
