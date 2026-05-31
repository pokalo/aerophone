package com.aerophone.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Binder
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.aerophone.app.R
import com.aerophone.app.data.audio.AudioEngine
import com.aerophone.app.domain.model.AudioSettings
import com.aerophone.app.domain.model.EqualizerSettings
import com.aerophone.app.presentation.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class HearingAidService : Service() {

    private val binder = LocalBinder()
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var audioJob: Job? = null

    private val audioEngine = AudioEngine()

    val peakLevel: StateFlow<Float> = audioEngine.peakLevel

    inner class LocalBinder : Binder() {
        fun getService(): HearingAidService = this@HearingAidService
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> startHearingAid()
            ACTION_STOP -> stopAudioProcessing()
        }
        return START_STICKY
    }

    private fun startHearingAid() {
        val notification = createNotification()
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                getString(R.string.notification_channel_name),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = getString(R.string.notification_text)
                setShowBadge(false)
            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val openPendingIntent = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val stopIntent = Intent(this, HearingAidService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this, 1, stopIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.notification_title))
            .setContentText(getString(R.string.notification_text))
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentIntent(openPendingIntent)
            .addAction(
                android.R.drawable.ic_media_pause,
                getString(R.string.stop),
                stopPendingIntent
            )
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    fun startAudioProcessing(
        audioSettings: AudioSettings,
        eqSettings: EqualizerSettings,
        noiseSuppression: Boolean
    ) {
        audioJob?.cancel()
        audioJob = serviceScope.launch {
            audioEngine.start(audioSettings, eqSettings, noiseSuppression)
        }
        startHearingAid()
    }

    fun stopAudioProcessing() {
        audioJob?.cancel()
        audioEngine.stop()
        stopForeground(STOP_FOREGROUND_REMOVE)
    }

    fun updateSettings(
        audioSettings: AudioSettings,
        eqSettings: EqualizerSettings,
        noiseSuppression: Boolean
    ) {
        audioEngine.applySettings(audioSettings, eqSettings, noiseSuppression)
    }

    fun isRunning(): Boolean = audioEngine.isActive()

    override fun onDestroy() {
        super.onDestroy()
        audioEngine.stop()
        serviceScope.cancel()
    }

    companion object {
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "hearing_aid_channel"
        const val ACTION_START = "com.aerophone.ACTION_START"
        const val ACTION_STOP = "com.aerophone.ACTION_STOP"

        fun startService(context: Context) {
            val intent = Intent(context, HearingAidService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, HearingAidService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }
}
