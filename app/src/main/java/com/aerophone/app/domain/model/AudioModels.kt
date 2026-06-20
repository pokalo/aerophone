package com.aerophone.app.domain.model

data class AudioSettings(
    val volume: Float = 1.0f,
    val balance: Float = 0.0f,
    val isMono: Boolean = false,
    val isLimiterEnabled: Boolean = true,
    val limiterThreshold: Float = -3f
)

data class EqualizerSettings(
    val band60Hz: Float = 0f,
    val band250Hz: Float = 0f,
    val band1kHz: Float = 0f,
    val band4kHz: Float = 0f,
    val band16kHz: Float = 0f,
    val isEnabled: Boolean = true
)

enum class Preset(val displayName: String, val equalizer: EqualizerSettings) {
    FLAT(
        "Плоский",
        EqualizerSettings(0f, 0f, 0f, 0f, 0f)
    ),
    SPEECH(
        "Речь",
        EqualizerSettings(-2f, 4f, 6f, 4f, 0f)
    ),
    OUTDOORS(
        "На улице",
        EqualizerSettings(2f, 2f, 0f, 2f, 4f)
    ),
    TV(
        "Телевизор",
        EqualizerSettings(0f, 2f, 4f, 2f, 0f)
    )
}

data class HearingAidState(
    val isRunning: Boolean = false,
    val audioSettings: AudioSettings = AudioSettings(),
    val equalizerSettings: EqualizerSettings = EqualizerSettings(),
    val currentPreset: Preset = Preset.FLAT,
    val peakLevel: Float = 0f,
    val isNoiseSuppressionEnabled: Boolean = true,
    val sleepTimerMinutes: Int = 0,
    val sleepTimerRemainingSeconds: Int = 0,
    val isFlashAlertEnabled: Boolean = false,
    val isVibrationAlertEnabled: Boolean = true,
    val flashAlertThreshold: Float = 0.8f,
    val isLoudSoundAlert: Boolean = false,
    val isHighVolumeWarning: Boolean = false,
    val isPremium: Boolean = false
)

enum class PremiumType(val displayName: String, val periodDays: Int) {
    ONETIME("Навсегда", -1),
    MONTHLY("На месяц", 30),
    YEARLY("На год", 365)
}

enum class PaymentMethod(val displayName: String) {
    RUSTORE("RuStore"),
    TELEGRAM_STARS("Telegram Stars")
}

data class PremiumPurchase(
    val type: PremiumType,
    val method: PaymentMethod,
    val priceLabel: String
)

object PremiumConfig {
    const val SKU_PREMIUM = "premium_unlock"

    const val PRICE_ONETIME = "149 ₽"
    const val PRICE_MONTHLY = "49 ₽"
    const val PRICE_YEARLY = "399 ₽"

    const val STARS_ONETIME = 149
    const val STARS_MONTHLY = 49
    const val STARS_YEARLY = 399

    const val TELEGRAM_SERVER_URL = "https://api.perforator.dpdns.org"

    val freeLimits = FreeLimits()

    class FreeLimits {
        val maxVolume = 1.0f
        val maxEqBands = 3
        val allowedPresets = listOf(Preset.FLAT, Preset.SPEECH)
        val noiseSuppressionFree = false
    }
}

enum class SleepTimerOption(val minutes: Int, val displayName: String) {
    OFF(0, "Выкл"),
    FIFTEEN(15, "15 мин"),
    THIRTY(30, "30 мин"),
    SIXTY(60, "1 час"),
    TWO_HOURS(120, "2 часа")
}
