package com.aerophone.app.data.repository

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.floatPreferencesKey
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.aerophone.app.domain.model.AudioSettings
import com.aerophone.app.domain.model.EqualizerSettings
import com.aerophone.app.domain.model.HearingAidState
import com.aerophone.app.domain.model.PremiumType
import com.aerophone.app.domain.model.Preset
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

class SettingsRepository(private val context: Context) {

    companion object {
        private val KEY_VOLUME = floatPreferencesKey("volume")
        private val KEY_BALANCE = floatPreferencesKey("balance")
        private val KEY_IS_MONO = booleanPreferencesKey("is_mono")
        private val KEY_LIMITER_ENABLED = booleanPreferencesKey("limiter_enabled")
        private val KEY_NOISE_SUPPRESSION = booleanPreferencesKey("noise_suppression")
        private val KEY_EQ_ENABLED = booleanPreferencesKey("eq_enabled")
        private val KEY_EQ_60HZ = floatPreferencesKey("eq_60hz")
        private val KEY_EQ_250HZ = floatPreferencesKey("eq_250hz")
        private val KEY_EQ_1KHZ = floatPreferencesKey("eq_1khz")
        private val KEY_EQ_4KHZ = floatPreferencesKey("eq_4khz")
        private val KEY_EQ_16KHZ = floatPreferencesKey("eq_16khz")
        private val KEY_PRESET = intPreferencesKey("preset")
        private val KEY_SLEEP_TIMER = intPreferencesKey("sleep_timer")
        private val KEY_FLASH_ALERT = booleanPreferencesKey("flash_alert")
        private val KEY_VIBRATION_ALERT = booleanPreferencesKey("vibration_alert")
        private val KEY_FLASH_THRESHOLD = floatPreferencesKey("flash_threshold")
        private val KEY_IS_PREMIUM = booleanPreferencesKey("is_premium")
        private val KEY_PREMIUM_TYPE = stringPreferencesKey("premium_type")
        private val KEY_PREMIUM_EXPIRY = longPreferencesKey("premium_expiry")
        private val KEY_PENDING_PURCHASE_ID = stringPreferencesKey("pending_purchase_id")
        private val KEY_PENDING_PURCHASE_TYPE = stringPreferencesKey("pending_purchase_type")
    }

    val settingsFlow: Flow<HearingAidState> = context.dataStore.data.map { preferences ->
        HearingAidState(
            audioSettings = AudioSettings(
                volume = preferences[KEY_VOLUME] ?: 1.0f,
                balance = preferences[KEY_BALANCE] ?: 0.0f,
                isMono = preferences[KEY_IS_MONO] ?: false,
                isLimiterEnabled = preferences[KEY_LIMITER_ENABLED] ?: true
            ),
            equalizerSettings = EqualizerSettings(
                band60Hz = preferences[KEY_EQ_60HZ] ?: 0f,
                band250Hz = preferences[KEY_EQ_250HZ] ?: 0f,
                band1kHz = preferences[KEY_EQ_1KHZ] ?: 0f,
                band4kHz = preferences[KEY_EQ_4KHZ] ?: 0f,
                band16kHz = preferences[KEY_EQ_16KHZ] ?: 0f,
                isEnabled = preferences[KEY_EQ_ENABLED] ?: true
            ),
            currentPreset = Preset.entries.getOrElse(preferences[KEY_PRESET] ?: 0) { Preset.FLAT },
            isNoiseSuppressionEnabled = preferences[KEY_NOISE_SUPPRESSION] ?: true,
            sleepTimerMinutes = preferences[KEY_SLEEP_TIMER] ?: 0,
            isFlashAlertEnabled = preferences[KEY_FLASH_ALERT] ?: false,
            isVibrationAlertEnabled = preferences[KEY_VIBRATION_ALERT] ?: true,
            flashAlertThreshold = preferences[KEY_FLASH_THRESHOLD] ?: 0.8f,
            isPremium = false  // Загружается из BillingService
        )
    }

    suspend fun saveVolume(volume: Float) {
        context.dataStore.edit { it[KEY_VOLUME] = volume }
    }

    suspend fun saveBalance(balance: Float) {
        context.dataStore.edit { it[KEY_BALANCE] = balance }
    }

    suspend fun saveIsMono(isMono: Boolean) {
        context.dataStore.edit { it[KEY_IS_MONO] = isMono }
    }

    suspend fun saveLimiterEnabled(enabled: Boolean) {
        context.dataStore.edit { it[KEY_LIMITER_ENABLED] = enabled }
    }

    suspend fun saveNoiseSuppression(enabled: Boolean) {
        context.dataStore.edit { it[KEY_NOISE_SUPPRESSION] = enabled }
    }

    suspend fun saveEqEnabled(enabled: Boolean) {
        context.dataStore.edit { it[KEY_EQ_ENABLED] = enabled }
    }

    suspend fun saveEqBand60Hz(value: Float) {
        context.dataStore.edit { it[KEY_EQ_60HZ] = value }
    }

    suspend fun saveEqBand250Hz(value: Float) {
        context.dataStore.edit { it[KEY_EQ_250HZ] = value }
    }

    suspend fun saveEqBand1kHz(value: Float) {
        context.dataStore.edit { it[KEY_EQ_1KHZ] = value }
    }

    suspend fun saveEqBand4kHz(value: Float) {
        context.dataStore.edit { it[KEY_EQ_4KHZ] = value }
    }

    suspend fun saveEqBand16kHz(value: Float) {
        context.dataStore.edit { it[KEY_EQ_16KHZ] = value }
    }

    suspend fun savePreset(preset: Preset) {
        context.dataStore.edit { it[KEY_PRESET] = preset.ordinal }
    }

    suspend fun saveSleepTimer(minutes: Int) {
        context.dataStore.edit { it[KEY_SLEEP_TIMER] = minutes }
    }

    suspend fun saveFlashAlert(enabled: Boolean) {
        context.dataStore.edit { it[KEY_FLASH_ALERT] = enabled }
    }

    suspend fun saveVibrationAlert(enabled: Boolean) {
        context.dataStore.edit { it[KEY_VIBRATION_ALERT] = enabled }
    }

    suspend fun saveFlashThreshold(threshold: Float) {
        context.dataStore.edit { it[KEY_FLASH_THRESHOLD] = threshold }
    }

    suspend fun saveAllSettings(state: HearingAidState) {
        context.dataStore.edit { preferences ->
            preferences[KEY_VOLUME] = state.audioSettings.volume
            preferences[KEY_BALANCE] = state.audioSettings.balance
            preferences[KEY_IS_MONO] = state.audioSettings.isMono
            preferences[KEY_LIMITER_ENABLED] = state.audioSettings.isLimiterEnabled
            preferences[KEY_NOISE_SUPPRESSION] = state.isNoiseSuppressionEnabled
            preferences[KEY_EQ_ENABLED] = state.equalizerSettings.isEnabled
            preferences[KEY_EQ_60HZ] = state.equalizerSettings.band60Hz
            preferences[KEY_EQ_250HZ] = state.equalizerSettings.band250Hz
            preferences[KEY_EQ_1KHZ] = state.equalizerSettings.band1kHz
            preferences[KEY_EQ_4KHZ] = state.equalizerSettings.band4kHz
            preferences[KEY_EQ_16KHZ] = state.equalizerSettings.band16kHz
            preferences[KEY_PRESET] = state.currentPreset.ordinal
            preferences[KEY_SLEEP_TIMER] = state.sleepTimerMinutes
            preferences[KEY_FLASH_ALERT] = state.isFlashAlertEnabled
            preferences[KEY_VIBRATION_ALERT] = state.isVibrationAlertEnabled
            preferences[KEY_FLASH_THRESHOLD] = state.flashAlertThreshold
            preferences[KEY_IS_PREMIUM] = state.isPremium
        }
    }

    suspend fun savePremiumStatus(isPremium: Boolean) {
        context.dataStore.edit { it[KEY_IS_PREMIUM] = isPremium }
    }

    suspend fun savePremiumSubscription(type: PremiumType, expiryTimestamp: Long = 0) {
        context.dataStore.edit {
            it[KEY_IS_PREMIUM] = true
            it[KEY_PREMIUM_TYPE] = type.name
            it[KEY_PREMIUM_EXPIRY] = expiryTimestamp
        }
    }

    suspend fun clearPremiumSubscription() {
        context.dataStore.edit {
            it[KEY_IS_PREMIUM] = false
            it[KEY_PREMIUM_TYPE] = ""
            it[KEY_PREMIUM_EXPIRY] = 0
        }
    }

    // Pending purchase persistence (survives process death)

    suspend fun getPendingPurchaseId(): String? {
        return context.dataStore.data.map { it[KEY_PENDING_PURCHASE_ID] }.first()
    }

    suspend fun getPendingPurchaseType(): String? {
        return context.dataStore.data.map { it[KEY_PENDING_PURCHASE_TYPE] }.first()
    }

    suspend fun savePendingPurchase(purchaseId: String, type: PremiumType) {
        context.dataStore.edit {
            it[KEY_PENDING_PURCHASE_ID] = purchaseId
            it[KEY_PENDING_PURCHASE_TYPE] = type.name
        }
    }

    suspend fun clearPendingPurchase() {
        context.dataStore.edit {
            it[KEY_PENDING_PURCHASE_ID] = ""
            it[KEY_PENDING_PURCHASE_TYPE] = ""
        }
    }
}
