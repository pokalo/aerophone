package com.aerophone.app.presentation

import android.app.Application
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.media.AudioManager
import android.net.Uri
import android.os.CountDownTimer
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.aerophone.app.billing.BillingResult
import com.aerophone.app.billing.BillingService
import com.aerophone.app.data.repository.SettingsRepository
import com.aerophone.app.domain.model.HearingAidState
import com.aerophone.app.domain.model.PremiumConfig
import com.aerophone.app.domain.model.PremiumType
import com.aerophone.app.domain.model.Preset
import com.aerophone.app.domain.model.SleepTimerOption
import com.aerophone.app.service.HearingAidService
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class MainViewModel(
    application: Application,
    private val settingsRepository: SettingsRepository,
    private val billingService: BillingService
) : AndroidViewModel(application) {

    private val appContext: Context
        get() = getApplication()

    private val _state = MutableStateFlow(HearingAidState())
    val state: StateFlow<HearingAidState> = _state.asStateFlow()

    private val _purchaseResult = MutableStateFlow<BillingResult?>(null)
    val purchaseResult: StateFlow<BillingResult?> = _purchaseResult.asStateFlow()

    private val _openTelegramInvoice = MutableSharedFlow<String>()
    val openTelegramInvoice: SharedFlow<String> = _openTelegramInvoice.asSharedFlow()

    private var hearingAidService: HearingAidService? = null
    private var isBound = false
    private var sleepTimer: CountDownTimer? = null
    private var flashJob: Job? = null
    private var lastAlertTime = 0L
    private var isInitialLoadDone = false

    private val vibrator: Vibrator by lazy {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            val vibratorManager = appContext.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            appContext.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
    }

    private val audioManager = appContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as HearingAidService.LocalBinder
            hearingAidService = binder.getService()
            isBound = true
            observePeakLevel()
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            hearingAidService = null
            isBound = false
        }
    }

    init {
        initBilling()
        loadSettings()
        bindService()
        registerAudioStateListener()
        viewModelScope.launch { checkPendingPurchase() }
    }

    private fun initBilling() {
        viewModelScope.launch {
            billingService.initialize()

            billingService.isPremium.collect { isPremium ->
                if (isPremium != _state.value.isPremium) {
                    _state.update { it.copy(isPremium = isPremium) }
                    settingsRepository.savePremiumStatus(isPremium)
                }
            }
        }
    }

    // --- RuStore покупка ---

    fun purchaseRuStore(activity: android.app.Activity, type: PremiumType) {
        viewModelScope.launch {
            val result = billingService.purchaseRuStore(activity, type)
            _purchaseResult.value = result

            if (result is BillingResult.Success) {
                activatePremium(type)
            }
        }
    }

    // --- Telegram Stars покупка ---

    fun purchaseTelegramStars(type: PremiumType) {
        viewModelScope.launch {
            try {
                val result = billingService.createTelegramInvoice(type)
                if (result.isSuccess) {
                    val purchaseId = billingService.getCurrentPurchaseId()
                    val link = result.getOrThrow()

                    // Сохраняем purchaseId, чтобы пережить пересоздание Activity
                    settingsRepository.savePendingPurchase(purchaseId, type)

                    _openTelegramInvoice.emit(link)

                    pollTelegramPayment(type)
                } else {
                    _purchaseResult.value = BillingResult.Error(
                        result.exceptionOrNull()?.message ?: "Ошибка создания счёта"
                    )
                }
            } catch (e: Exception) {
                _purchaseResult.value = BillingResult.Error(e.message ?: "Ошибка")
            }
        }
    }

    private suspend fun pollTelegramPayment(type: PremiumType) {
        var attempts = 0
        while (attempts < 60) {
            delay(2000)
            if (billingService.checkTelegramPayment()) {
                activatePremium(type)
                settingsRepository.clearPendingPurchase()
                _purchaseResult.value = BillingResult.Success
                return
            }
        attempts++
    }
        _purchaseResult.value = BillingResult.Error("Время ожидания истекло")
    }

    // Проверка незавершённого платежа при пересоздании ViewModel
    private suspend fun checkPendingPurchase() {
        val pendingId = settingsRepository.getPendingPurchaseId()
        if (pendingId.isNullOrBlank()) return

        val pendingTypeName = settingsRepository.getPendingPurchaseType() ?: return
        val pendingType = try { PremiumType.valueOf(pendingTypeName) } catch (e: Exception) { return }

        billingService.setPurchaseId(pendingId)

        if (billingService.checkTelegramPayment()) {
            activatePremium(pendingType)
            settingsRepository.clearPendingPurchase()
        } else {
            // Продолжаем polling
            viewModelScope.launch {
                pollTelegramPayment(pendingType)
            }
        }
    }

    private suspend fun activatePremium(type: PremiumType) {
        val expiry = if (type.periodDays > 0) {
            System.currentTimeMillis() + type.periodDays * 24L * 60 * 60 * 1000
        } else 0L

        billingService.activatePremium()
        _state.update { it.copy(isPremium = true) }
        settingsRepository.savePremiumSubscription(type, expiry)
    }

    fun clearPurchaseResult() {
        _purchaseResult.value = null
    }

    private fun loadSettings() {
        viewModelScope.launch {
            val savedState = settingsRepository.settingsFlow.first()
            _state.value = savedState
            isInitialLoadDone = true
        }
    }

    private fun saveSettings() {
        if (!isInitialLoadDone) return
        viewModelScope.launch {
            settingsRepository.saveAllSettings(_state.value)
        }
    }

    private fun bindService() {
        val intent = Intent(getApplication(), HearingAidService::class.java)
        getApplication<Application>().bindService(
            intent,
            serviceConnection,
            Context.BIND_AUTO_CREATE
        )
    }

    private fun observePeakLevel() {
        viewModelScope.launch {
            hearingAidService?.peakLevel?.collect { level ->
                _state.update { it.copy(peakLevel = level) }
                checkForLoudSound(level)
            }
        }
    }

    private fun checkForLoudSound(level: Float) {
        if (!_state.value.isRunning) return

        val threshold = _state.value.flashAlertThreshold
        val currentTime = System.currentTimeMillis()

        if (level >= threshold && currentTime - lastAlertTime > 2000) {
            lastAlertTime = currentTime

            if (_state.value.isVibrationAlertEnabled) {
                triggerVibration()
            }

            if (_state.value.isFlashAlertEnabled) {
                triggerFlashAlert()
            }

            viewModelScope.launch {
                _state.update { it.copy(isLoudSoundAlert = true) }
                delay(500)
                _state.update { it.copy(isLoudSoundAlert = false) }
            }
        }
    }

    private fun triggerVibration() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            vibrator.vibrate(
                VibrationEffect.createOneShot(200, VibrationEffect.DEFAULT_AMPLITUDE)
            )
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(200)
        }
    }

    private fun triggerFlashAlert() {
        flashJob?.cancel()
        flashJob = viewModelScope.launch {
            repeat(3) {
                triggerScreenFlash()
                delay(150)
            }
        }
    }

    private fun triggerScreenFlash() {
        flashCallback?.invoke()
    }

    fun registerFlashCallback(callback: (() -> Unit)?) {
        flashCallback = callback
    }

    private var flashCallback: (() -> Unit)? = null

    fun setFlashAlertEnabled(enabled: Boolean) {
        _state.update { it.copy(isFlashAlertEnabled = enabled) }
        viewModelScope.launch { settingsRepository.saveFlashAlert(enabled) }
    }

    fun setVibrationAlertEnabled(enabled: Boolean) {
        _state.update { it.copy(isVibrationAlertEnabled = enabled) }
        viewModelScope.launch { settingsRepository.saveVibrationAlert(enabled) }
    }

    fun setFlashThreshold(threshold: Float) {
        _state.update { it.copy(flashAlertThreshold = threshold) }
        viewModelScope.launch { settingsRepository.saveFlashThreshold(threshold) }
    }

    private fun registerAudioStateListener() {
        val listener = AudioManager.OnAudioFocusChangeListener { focusChange ->
            when (focusChange) {
                AudioManager.AUDIOFOCUS_LOSS,
                AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
                    if (_state.value.isRunning) {
                        stopHearingAid()
                    }
                }
            }
        }
        audioManager.requestAudioFocus(
            listener,
            AudioManager.STREAM_MUSIC,
            AudioManager.AUDIOFOCUS_GAIN
        )
    }

    fun toggleHearingAid() {
        if (_state.value.isRunning) {
            stopHearingAid()
        } else {
            startHearingAid()
        }
    }

    private fun startHearingAid() {
        HearingAidService.startService(appContext)

        viewModelScope.launch {
            hearingAidService?.startAudioProcessing(
                _state.value.audioSettings,
                _state.value.equalizerSettings,
                _state.value.isNoiseSuppressionEnabled
            )
            _state.update { it.copy(isRunning = true) }
        }

        startSleepTimerIfNeeded()
    }

    private fun stopHearingAid() {
        hearingAidService?.stopAudioProcessing()
        HearingAidService.stopService(appContext)
        _state.update { it.copy(isRunning = false) }
        cancelSleepTimer()
    }

    private fun startSleepTimerIfNeeded() {
        cancelSleepTimer()

        val minutes = _state.value.sleepTimerMinutes
        if (minutes > 0) {
            val millisInFuture = minutes * 60 * 1000L
            sleepTimer = object : CountDownTimer(millisInFuture, 1000) {
                override fun onTick(millisUntilFinished: Long) {
                    _state.update {
                        it.copy(sleepTimerRemainingSeconds = (millisUntilFinished / 1000).toInt())
                    }
                }

                override fun onFinish() {
                    _state.update {
                        it.copy(
                            isRunning = false,
                            sleepTimerRemainingSeconds = 0
                        )
                    }
                    stopHearingAid()
                }
            }.start()
        }
    }

    private fun cancelSleepTimer() {
        sleepTimer?.cancel()
        sleepTimer = null
    }

    fun setSleepTimer(option: SleepTimerOption) {
        _state.update {
            it.copy(
                sleepTimerMinutes = option.minutes,
                sleepTimerRemainingSeconds = 0
            )
        }
        viewModelScope.launch { settingsRepository.saveSleepTimer(option.minutes) }

        if (_state.value.isRunning && option.minutes > 0) {
            startSleepTimerIfNeeded()
        }
    }

    fun setVolume(volume: Float) {
        val clamped = if (_state.value.isPremium) volume else volume.coerceAtMost(PremiumConfig.freeLimits.maxVolume)
        _state.update {
            it.copy(audioSettings = it.audioSettings.copy(volume = clamped))
        }
        viewModelScope.launch { settingsRepository.saveVolume(clamped) }
        checkHighVolumeWarning()
        updateServiceSettings()
    }

    fun setBalance(balance: Float) {
        _state.update {
            it.copy(audioSettings = it.audioSettings.copy(balance = balance))
        }
        viewModelScope.launch { settingsRepository.saveBalance(balance) }
        updateServiceSettings()
    }

    fun setEqualizerBand(band: Int, gain: Float) {
        val isPremium = _state.value.isPremium
        val maxBand = if (isPremium) 4 else PremiumConfig.freeLimits.maxEqBands - 1
        if (band > maxBand) return
        val newEq = when (band) {
            0 -> _state.value.equalizerSettings.copy(band60Hz = gain)
            1 -> _state.value.equalizerSettings.copy(band250Hz = gain)
            2 -> _state.value.equalizerSettings.copy(band1kHz = gain)
            3 -> _state.value.equalizerSettings.copy(band4kHz = gain)
            4 -> _state.value.equalizerSettings.copy(band16kHz = gain)
            else -> _state.value.equalizerSettings
        }
        _state.update {
            it.copy(
                equalizerSettings = newEq,
                currentPreset = Preset.FLAT
            )
        }
        saveEqSettings()
        updateServiceSettings()
    }

    fun applyPreset(preset: Preset) {
        val allowed = if (_state.value.isPremium) Preset.entries else PremiumConfig.freeLimits.allowedPresets
        if (preset !in allowed) return
        _state.update {
            it.copy(
                equalizerSettings = preset.equalizer,
                currentPreset = preset
            )
        }
        viewModelScope.launch { settingsRepository.savePreset(preset) }
        saveEqSettings()
        updateServiceSettings()
    }

    fun toggleNoiseSuppression() {
        if (!_state.value.isPremium) return
        val newValue = !_state.value.isNoiseSuppressionEnabled
        _state.update { it.copy(isNoiseSuppressionEnabled = newValue) }
        viewModelScope.launch { settingsRepository.saveNoiseSuppression(newValue) }
        updateServiceSettings()
    }

    fun toggleLimiter() {
        val newValue = !_state.value.audioSettings.isLimiterEnabled
        _state.update {
            it.copy(
                audioSettings = it.audioSettings.copy(isLimiterEnabled = newValue)
            )
        }
        viewModelScope.launch { settingsRepository.saveLimiterEnabled(newValue) }
        updateServiceSettings()
    }

    fun toggleEqualizer() {
        val newValue = !_state.value.equalizerSettings.isEnabled
        _state.update {
            it.copy(
                equalizerSettings = it.equalizerSettings.copy(isEnabled = newValue)
            )
        }
        viewModelScope.launch { settingsRepository.saveEqEnabled(newValue) }
        updateServiceSettings()
    }

    fun toggleMono() {
        val newValue = !_state.value.audioSettings.isMono
        _state.update {
            it.copy(
                audioSettings = it.audioSettings.copy(isMono = newValue)
            )
        }
        viewModelScope.launch { settingsRepository.saveIsMono(newValue) }
        updateServiceSettings()
    }

    private fun checkHighVolumeWarning() {
        val volume = _state.value.audioSettings.volume
        val isHighVolume = volume > 1.0f
        if (_state.value.isHighVolumeWarning != isHighVolume) {
            _state.update { it.copy(isHighVolumeWarning = isHighVolume) }
        }
    }

    private fun saveEqSettings() {
        val eq = _state.value.equalizerSettings
        viewModelScope.launch {
            settingsRepository.saveEqBand60Hz(eq.band60Hz)
            settingsRepository.saveEqBand250Hz(eq.band250Hz)
            settingsRepository.saveEqBand1kHz(eq.band1kHz)
            settingsRepository.saveEqBand4kHz(eq.band4kHz)
            settingsRepository.saveEqBand16kHz(eq.band16kHz)
        }
    }

    private fun updateServiceSettings() {
        hearingAidService?.updateSettings(
            _state.value.audioSettings,
            _state.value.equalizerSettings,
            _state.value.isNoiseSuppressionEnabled
        )
    }

    override fun onCleared() {
        super.onCleared()
        cancelSleepTimer()
        flashJob?.cancel()
        billingService.dispose()
        if (isBound) {
            appContext.unbindService(serviceConnection)
            isBound = false
        }
    }
}
